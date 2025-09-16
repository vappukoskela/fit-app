#!/usr/bin/env python3
"""
Produces a CSV (and optionally inserts rows into a PostgreSQL 'ingredients' table)
from THL's component_value.csv + foodname_EN.csv.

Key behavior:
- Reads only the FIRST 3 columns of component_value.csv (FOODID, EUFDNAME, BESTLOC).
- Keeps only nutrients: ENERC (kJ -> converted to kcal), FAT, CHOAVL (carbs), PROT.
- Drops rows with missing values for any of the four nutrients.
- Joins FOODID -> name from foodname_EN.csv (parses fragments before 'EN').
- Converts names from ALL CAPS -> Capitalised form.
- Drops non-vegan items (unless "WITHOUT MILK/EGG(S)").
- Optionally upserts into PostgreSQL ingredients table using id=FOODID.
"""

import argparse
import os
import re
import pandas as pd

try:
    import psycopg2
    import psycopg2.extras
except Exception:
    psycopg2 = None

KEEP = ["ENERC", "FAT", "CHOAVL", "PROT"]
KJ_TO_KCAL = 1.0 / 4.184

def detect_delimiter(path, sample_bytes=4096):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        sample = f.read(sample_bytes)
    candidates = ["\t", ",", ";", "|"]
    counts = {d: sample.count(d) for d in candidates}
    best = max(counts.items(), key=lambda x: x[1])[0]
    return best if counts[best] > 0 else ","


def read_first_three_columns(path):
    print(path)
    df = pd.read_csv(
        path,
        sep=";",           
        decimal=",",    
        usecols=[0, 1, 2], 
        engine="python",
        dtype=str
    )
    df.columns = ["FOODID", "EUFDNAME", "BESTLOC"]
    return df


def read_foodnames(path):
    """
    Parse foodname_EN.csv into {id, name}, capitalised, vegan-only.
    """
    df = pd.read_csv(path, header=0, sep=";", engine="python", encoding="latin1")

    df = df.rename(columns={"FOODID": "id"})
    df = df.dropna(subset=["id"])
    df["id"] = df["id"].astype(int)


    def join_name_parts(row):
        parts = [str(x).strip() for x in row[1:] if pd.notna(x) and str(x).strip()]
        if "EN" in parts:
            parts = parts[:parts.index("EN")]
        return " ".join(parts)

    df["name_raw"] = df.apply(join_name_parts, axis=1)

    def to_capitalised(s: str) -> str:
        s = s.title()
        s = re.sub(r"\b%Vol\b", "% vol", s, flags=re.IGNORECASE)
        return s.strip()

    df["name"] = df["name_raw"].apply(to_capitalised)

    def is_vegan(name: str) -> bool:
        n = name.upper()
        if "WITHOUT MILK" in n or "WITHOUT EGG" in n or "WITHOUT EGGS" in n:
            return True
        banned = [
            "MILK",
            "CHEESE",
            "CREAM",
            "YOGURT",
            "BUTTER",
            "EGG",
            "EGGS",
            "MEAT",
            "BEEF",
            "PORK",
            "CHICKEN",
            "FISH",
            "SALMON",
            "TUNA",
            "HAM",
            "LAMB",
            "TURKEY",
            "DUCK",
            "GOOSE",
            "SEAFOOD",
            "SHRIMP",
        ]
        return not any(b in n for b in banned)

    df = df[df["name"].apply(is_vegan)]

    return df[["id", "name"]]


def transform(values_df):
    values_df["EUFDNAME"] = values_df["EUFDNAME"].str.upper().str.strip()
    values_df["FOODID"] = values_df["FOODID"].str.strip()

    filt = values_df[values_df["EUFDNAME"].isin(KEEP)].copy()
    filt["BESTLOC_NUM"] = pd.to_numeric(
        filt["BESTLOC"].str.replace(",", "."), errors="coerce"
    )

    pivot = (
        filt.pivot_table(
            index="FOODID", columns="EUFDNAME", values="BESTLOC_NUM", aggfunc="first"
        )
        .reset_index()
    )

    for k in KEEP:
        if k not in pivot.columns:
            pivot[k] = pd.NA

    pivot = pivot.dropna(subset=KEEP)

    pivot["kcal_per_100g"] = (pivot["ENERC"].astype(float) * KJ_TO_KCAL).round(2)
    pivot["fat_per_100g"] = pivot["FAT"].astype(float).round(2)
    pivot["carbs_per_100g"] = pivot["CHOAVL"].astype(float).round(2)
    pivot["protein_per_100g"] = pivot["PROT"].astype(float).round(2)

    out = pivot[
        ["FOODID", "kcal_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"]
    ].copy()
    out["id"] = out["FOODID"].astype(int)
    return out.drop(columns=["FOODID"])

def upsert_to_db(df, dsn):
    if psycopg2 is None:
        raise RuntimeError("psycopg2 not available.")
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    rows = []
    for _, r in df.iterrows():
        rows.append(
            (
                int(r["id"]),
                r["name"],
                float(r["kcal_per_100g"]),
                float(r["protein_per_100g"]),
                float(r["carbs_per_100g"]),
                float(r["fat_per_100g"]),
                None,
                None,
                None,
                None,
                None,
                None,
            )
        )
    insert_sql = """
    INSERT INTO public.ingredients
      (id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
       serving_size_g, serving_description, kcal_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving)
    VALUES %s
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          kcal_per_100g = EXCLUDED.kcal_per_100g,
          protein_per_100g = EXCLUDED.protein_per_100g,
          carbs_per_100g = EXCLUDED.carbs_per_100g,
          fat_per_100g = EXCLUDED.fat_per_100g
    """
    psycopg2.extras.execute_values(cur, insert_sql, rows, template=None, page_size=100)
    conn.commit()
    cur.close()
    conn.close()

def main():
    p = argparse.ArgumentParser(description="Convert THL CSVs -> vegan ingredients")
    p.add_argument("--values", required=True, help="Path to component_value.csv")
    p.add_argument("--foodnames", required=True, help="Path to foodname_EN.csv")
    p.add_argument("--out", default="output_ingredients.csv", help="Output CSV path")
    p.add_argument("--db-insert", action="store_true")
    p.add_argument("--db-url", default=None)
    args = p.parse_args()

    print(args)
    values_df = read_first_three_columns(args.values)
    nutrients = transform(values_df)
    foodnames = read_foodnames(args.foodnames)

    merged = nutrients.merge(foodnames, on="id", how="inner")

    out_df = merged[
        ["id", "name", "kcal_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"]
    ].copy()
    for c in ["kcal_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"]:
        out_df[c] = out_df[c].astype(float).round(2)

    out_df.to_csv(args.out, index=False)
    print(f"Wrote {len(out_df)} rows to {args.out}")

    if args.db_insert:
        dsn = args.db_url or os.environ.get("DATABASE_URL")
        if not dsn:
            raise RuntimeError("No DATABASE_URL or --db-url provided.")
        upsert_to_db(out_df, dsn)
        print("DB upsert complete.")


if __name__ == "__main__":
    main()
