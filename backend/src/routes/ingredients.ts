import { Router } from "express";
import { pool } from '../db';

const router = Router();

router.post("/", async (req, res) => {
    const {
        name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
        serving_size_g, serving_description,
        kcal_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving
    } = req.body;

    const { rows } = await pool.query(
        `INSERT INTO ingredients 
     (name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
      serving_size_g, serving_description,
      kcal_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
        [name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
            serving_size_g, serving_description,
            kcal_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving]
    );
    res.status(201).json(rows[0]);
});

router.get("/", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM ingredients ORDER BY name");
    res.json(rows);
});

router.get("/:id", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM ingredients WHERE id=$1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
});

router.put("/:id", async (req, res) => {
    const keys = Object.keys(req.body);
    const set = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
    const values = Object.values(req.body);

    const { rows } = await pool.query(
        `UPDATE ingredients SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM ingredients WHERE id=$1", [req.params.id]);
    res.status(204).end();
});

export default router;
