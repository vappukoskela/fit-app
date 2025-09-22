import { Router } from "express";
import { pool } from "../db";

const router = Router();

async function calculateRecipeNutrition(recipeId: number) {
    const { rows } = await pool.query(
        `SELECT SUM(ri.amount_g * i.kcal_per_100g / 100) AS total_kcal,
                SUM(ri.amount_g * i.protein_per_100g / 100) AS total_protein,
                SUM(ri.amount_g * i.carbs_per_100g / 100) AS total_carbs,
                SUM(ri.amount_g * i.fat_per_100g / 100) AS total_fat,
                r.servings
         FROM recipe_ingredients ri
         JOIN ingredients i ON ri.ingredient_id = i.id
         JOIN recipes r ON r.id = ri.recipe_id
         WHERE ri.recipe_id = $1
         GROUP BY r.servings`,
        [recipeId]
    );

    if (!rows[0]) return null;

    const { total_kcal, total_protein, total_carbs, total_fat, servings } = rows[0];
    const perPortion = {
        kcal_per_portion: total_kcal / servings,
        protein_per_portion: total_protein / servings,
        carbs_per_portion: total_carbs / servings,
        fat_per_portion: total_fat / servings,
    };

    return { total_kcal, total_protein, total_carbs, total_fat, ...perPortion };
}

router.get("/favorites/", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id FROM recipes WHERE favourite = true");
        res.json(rows.map(r => r.id));
    } catch (err) {
        console.error("Error fetching recipe favorites:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/:id/favorite", async (req, res) => {
    try {
        await pool.query("UPDATE recipes SET favourite = true WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error("Error setting recipe favorite:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id/favorite", async (req, res) => {
    try {
        await pool.query("UPDATE recipes SET favourite = false WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error("Error removing recipe favorite:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req, res) => {
    const { rows } = await pool.query(
        "SELECT * FROM recipes ORDER BY favourite DESC, last_used_at DESC NULLS LAST, name ASC"
    );
    res.json(rows);
});

router.get("/:id", async (req, res) => {
    const recipeRes = await pool.query("SELECT * FROM recipes WHERE id=$1", [req.params.id]);
    if (recipeRes.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const ingredientsRes = await pool.query(
        `SELECT ri.id, ri.amount_g, ri.note,
            i.id as ingredient_id, i.name, i.kcal_per_100g, i.protein_per_100g,
            i.carbs_per_100g, i.fat_per_100g,
            i.serving_size_g, i.serving_description,
            i.kcal_per_serving, i.protein_per_serving, i.carbs_per_serving, i.fat_per_serving
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

            const nutrition = await calculateRecipeNutrition(recipe.id);
            if (nutrition) {
                await client.query(
                    `UPDATE recipes
                     SET total_kcal=$1, total_protein=$2, total_carbs=$3, total_fat=$4,
                         kcal_per_portion=$5, protein_per_portion=$6, carbs_per_portion=$7, fat_per_portion=$8
                     WHERE id=$9`,
                    [
                        nutrition.total_kcal, nutrition.total_protein, nutrition.total_carbs, nutrition.total_fat,
                        nutrition.kcal_per_portion, nutrition.protein_per_portion, nutrition.carbs_per_portion, nutrition.fat_per_portion,
                        recipe.id
                    ]
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
    const recipeId = parseInt(req.params.id, 10);

    const { rows } = await pool.query(
        `UPDATE recipes SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    if (req.body.servings) {
        const nutrition = await calculateRecipeNutrition(recipeId);
        if (nutrition) {
            await pool.query(
                `UPDATE recipes
                 SET total_kcal=$1, total_protein=$2, total_carbs=$3, total_fat=$4,
                     kcal_per_portion=$5, protein_per_portion=$6, carbs_per_portion=$7, fat_per_portion=$8
                 WHERE id=$9`,
                [
                    nutrition.total_kcal, nutrition.total_protein, nutrition.total_carbs, nutrition.total_fat,
                    nutrition.kcal_per_portion, nutrition.protein_per_portion, nutrition.carbs_per_portion, nutrition.fat_per_portion,
                    req.params.id
                ]
            );
        }
    }

    res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM recipes WHERE id=$1", [req.params.id]);
    res.status(204).end();
});

router.get("/:id/ingredients", async (req, res) => {
    const recipeId = parseInt(req.params.id, 10);
    try {
        const recipeCheck = await pool.query("SELECT id FROM recipes WHERE id = $1", [recipeId]);
        if (recipeCheck.rows.length === 0) return res.status(404).json({ error: "Recipe not found" });

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
    
    const nutrition = await calculateRecipeNutrition(parseInt(recipe_id, 10));
    if (nutrition) {
        await pool.query(
            `UPDATE recipes
             SET total_kcal=$1, total_protein=$2, total_carbs=$3, total_fat=$4,
                 kcal_per_portion=$5, protein_per_portion=$6, carbs_per_portion=$7, fat_per_portion=$8
             WHERE id=$9`,
            [
                nutrition.total_kcal, nutrition.total_protein, nutrition.total_carbs, nutrition.total_fat,
                nutrition.kcal_per_portion, nutrition.protein_per_portion, nutrition.carbs_per_portion, nutrition.fat_per_portion,
                recipe_id
            ]
        );
    }

    res.status(201).json(rows[0]);
});

router.get("/:recipe_id/ingredients/:recipe_ingredient_id", async (req, res) => {
    const { recipe_id, recipe_ingredient_id } = req.params;
    const { rows } = await pool.query(
        `SELECT * FROM recipe_ingredients WHERE recipe_id=$1 AND id=$2`,
        [recipe_id, recipe_ingredient_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
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

    const nutrition = await calculateRecipeNutrition(parseInt(recipe_id, 10));
    if (nutrition) {
        await pool.query(
            `UPDATE recipes
             SET total_kcal=$1, total_protein=$2, total_carbs=$3, total_fat=$4,
                 kcal_per_portion=$5, protein_per_portion=$6, carbs_per_portion=$7, fat_per_portion=$8
             WHERE id=$9`,
            [
                nutrition.total_kcal, nutrition.total_protein, nutrition.total_carbs, nutrition.total_fat,
                nutrition.kcal_per_portion, nutrition.protein_per_portion, nutrition.carbs_per_portion, nutrition.fat_per_portion,
                recipe_id
            ]
        );
    }

    res.json(rows[0]);
});

router.delete("/:recipe_id/ingredients/:recipe_ingredient_id", async (req, res) => {
    const { recipe_id, recipe_ingredient_id } = req.params;
    await pool.query(
        "DELETE FROM recipe_ingredients WHERE recipe_id=$1 AND id=$2",
        [recipe_id, recipe_ingredient_id]
    );

    const nutrition = await calculateRecipeNutrition(parseInt(recipe_id, 10));
    if (nutrition) {
        await pool.query(
            `UPDATE recipes
             SET total_kcal=$1, total_protein=$2, total_carbs=$3, total_fat=$4,
                 kcal_per_portion=$5, protein_per_portion=$6, carbs_per_portion=$7, fat_per_portion=$8
             WHERE id=$9`,
            [
                nutrition.total_kcal, nutrition.total_protein, nutrition.total_carbs, nutrition.total_fat,
                nutrition.kcal_per_portion, nutrition.protein_per_portion, nutrition.carbs_per_portion, nutrition.fat_per_portion,
                recipe_id
            ]
        );
    }

    res.status(204).end();
});

router.delete("/:recipe_id/ingredients", async (req, res) => {
    const { recipe_id } = req.params;
    await pool.query("DELETE FROM recipe_ingredients WHERE recipe_id=$1", [recipe_id]);

    const nutrition = await calculateRecipeNutrition(parseInt(recipe_id, 10));
    if (nutrition) {
        await pool.query(
            `UPDATE recipes
             SET total_kcal=$1, total_protein=$2, total_carbs=$3, total_fat=$4,
                 kcal_per_portion=$5, protein_per_portion=$6, carbs_per_portion=$7, fat_per_portion=$8
             WHERE id=$9`,
            [
                nutrition.total_kcal, nutrition.total_protein, nutrition.total_carbs, nutrition.total_fat,
                nutrition.kcal_per_portion, nutrition.protein_per_portion, nutrition.carbs_per_portion, nutrition.fat_per_portion,
                recipe_id
            ]
        );
    }

    res.status(204).end();
});

export default router;