import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.post('/', async (req, res) => {
    const {
        user_id,
        log_date,
        description,
        kcal,
        protein,
        carbs,
        fat,
        meal,
        recipe_id = null
    } = req.body;

    try {
        await pool.query(
            `INSERT INTO food_diary (user_id, log_date, description, kcal, protein, carbs, fat, meal, recipe_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [user_id, log_date, description, kcal, protein, carbs, fat, meal, recipe_id]
        );
        res.status(201).json({ message: 'OK' });
    } catch (err) {
        console.error('Error inserting food entry:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM food_diary
       ORDER BY log_date DESC, id ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching food diary:', err);
        res.status(500).json({ error: 'Failed to fetch food diary' });
    }
});

router.get('/today/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM food_diary
       WHERE log_date = CURRENT_DATE AND user_id = $1
       ORDER BY id ASC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching today\'s food diary:', err);
        res.status(500).json({ error: 'Failed to fetch today\'s food diary' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        description,
        kcal,
        protein,
        carbs,
        fat,
        meal,
        log_date,
        recipe_id = null
    } = req.body;

    try {
        await pool.query(
            `UPDATE food_diary
       SET description=$1, kcal=$2, protein=$3, carbs=$4, fat=$5, meal=$6, log_date=$7, recipe_id=$8
       WHERE id=$9`,
            [description, kcal, protein, carbs, fat, meal, log_date, recipe_id, id]
        );
        res.json({ message: 'OK' });
    } catch (err) {
        console.error('Error updating food entry:', err);
        res.status(500).json({ error: 'Failed to update food entry' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM food_diary WHERE id=$1', [id]);
        res.json({ message: 'OK' });
    } catch (err) {
        console.error('Error deleting food entry:', err);
        res.status(500).json({ error: 'Failed to delete food entry' });
    }
});

export default router;
