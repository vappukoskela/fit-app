import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM recipes ORDER BY name");
    res.json(rows);
});

router.get("/:id", async (req, res) => {
    const recipeRes = await pool.query("SELECT * FROM recipes WHERE id=$1", [req.params.id]);
    if (recipeRes.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const ingredientsRes = await pool.query(
        `SELECT ri.id, ri.amount_g, ri.note,
            i.id as ingredient_id, i.name, i.kcal_per_100g, i.protein_per_100g,
            i.carbs_per_100g, i.fat_per_100g
     FROM recipe_ingredients ri
     JOIN ingredients i ON ri.ingredient_id = i.id
     WHERE ri.recipe_id=$1`,
        [req.params.id]
    );

    res.json({ ...recipeRes.rows[0], ingredients: ingredientsRes.rows });
});

router.post("/", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const { name, description, servings, ingredients } = req.body;

        const recipeRes = await client.query(
            `INSERT INTO recipes (name, description, servings)
       VALUES ($1,$2,$3) RETURNING *`,
            [name, description, servings || 1]
        );
        const recipe = recipeRes.rows[0];

        if (ingredients && ingredients.length > 0) {
            for (const ing of ingredients) {
                await client.query(
                    `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_g, note)
           VALUES ($1,$2,$3,$4)`,
                    [recipe.id, ing.ingredient_id, ing.amount_g, ing.note || null]
                );
            }
        }

        await client.query("COMMIT");
        res.status(201).json(recipe);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: "Failed to create recipe" });
    } finally {
        client.release();
    }
});

router.put("/:id", async (req, res) => {
    const keys = Object.keys(req.body);
    const set = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
    const values = Object.values(req.body);

    const { rows } = await pool.query(
        `UPDATE recipes SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM recipes WHERE id=$1", [req.params.id]);
    res.status(204).end();
});

// Recipe Ingredients
router.get("/:id/ingredients", async (req, res) => {
    const recipeId = parseInt(req.params.id, 10);
    console.log("Fetching ingredients for recipe ID:", recipeId);

    try {
        const recipeCheck = await pool.query(
            "SELECT id FROM recipes WHERE id = $1",
            [recipeId]
        );

        if (recipeCheck.rows.length === 0) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        const result = await pool.query(
            `SELECT ri.id, ri.amount_g, ri.note,
              i.id as ingredient_id, i.name, i.kcal_per_100g, i.protein_per_100g,
              i.carbs_per_100g, i.fat_per_100g,
              i.serving_size_g, i.serving_description,
              i.kcal_per_serving, i.protein_per_serving, i.carbs_per_serving, i.fat_per_serving
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = $1`,
            [recipeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching recipe ingredients:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.post("/:recipe_id/ingredients", async (req, res) => {
    const { ingredient_id, amount_g, note } = req.body;
    const { recipe_id } = req.params;

    const { rows } = await pool.query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount_g, note)
     VALUES ($1,$2,$3,$4) RETURNING *`,
        [recipe_id, ingredient_id, amount_g, note || null]
    );

    res.status(201).json(rows[0]);
});

router.get("/:recipe_id/ingredients/:recipe_ingredient_id", async (req, res) => {
    const { recipe_id, recipe_ingredient_id } = req.params;
    const { rows } = await pool.query(
        `SELECT * FROM recipe_ingredients WHERE recipe_id=$1 AND id=$2`,
        [recipe_id, recipe_ingredient_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    console.log(rows[0]);
    res.json(rows[0]);
});

router.put("/:recipe_id/ingredients/:recipe_ingredient_id", async (req, res) => {
    const keys = Object.keys(req.body);
    const set = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
    const values = Object.values(req.body);
    const { recipe_id, recipe_ingredient_id } = req.params;

    const { rows } = await pool.query(
        `UPDATE recipe_ingredients SET ${set}
     WHERE recipe_id=$${keys.length + 1} AND id=$${keys.length + 2}
     RETURNING *`,
        [...values, recipe_id, recipe_ingredient_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
});

router.delete("/:recipe_id/ingredients/:recipe_ingredient_id", async (req, res) => {
    const { recipe_id, recipe_ingredient_id } = req.params;
    await pool.query(
        "DELETE FROM recipe_ingredients WHERE recipe_id=$1 AND id=$2",
        [recipe_id, recipe_ingredient_id]
    );
    res.status(204).end();
});

router.delete("/:recipe_id/ingredients", async (req, res) => {
    await pool.query("DELETE FROM recipe_ingredients WHERE recipe_id=$1", [req.params.recipe_id]);
    res.status(204).end();
});

export default router;
