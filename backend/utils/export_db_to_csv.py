import csv
import psycopg2
import argparse

def export_to_csv(dbname, user, password, host, port, table, output):
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port
    )
    cursor = conn.cursor()

    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    col_names = [desc[0] for desc in cursor.description]

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(col_names)
        writer.writerows(rows)

    cursor.close()
    conn.close()
    print(f"Exported {len(rows)} rows from '{table}' to {output}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export a PostgreSQL table to CSV.")
    parser.add_argument("--dbname", required=True, help="Database name")
    parser.add_argument("--user", required=True, help="Database user")
    parser.add_argument("--password", required=True, help="Database password")
    parser.add_argument("--host", default="localhost", help="Database host (default: localhost)")
    parser.add_argument("--port", default="5432", help="Database port (default: 5432)")
    parser.add_argument("--table", required=True, help="Table name to export")
    parser.add_argument("--output", required=True, help="Output CSV file path")

    args = parser.parse_args()

    export_to_csv(
        dbname=args.dbname,
        user=args.user,
        password=args.password,
        host=args.host,
        port=args.port,
        table=args.table,
        output=args.output
    )
