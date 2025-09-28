import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.post('/', async (req, res) => {
  const { log_date, weight_kg } = req.body;
  try {
    await pool.query(
      'INSERT INTO weight (log_date, weight_kg) VALUES ($1, $2)',
      [log_date, weight_kg]
    );
    res.status(201).json({ message: 'Weight entry created' });
  } catch (err) {
    console.error('Error inserting weight:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/latest', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT weight_kg FROM weight ORDER BY log_date DESC LIMIT 1`);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching latest weight:', err);
    res.status(500).json({ error: 'Failed to fetch weight' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM weight ORDER BY log_date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching weights:', err);
    res.status(500).json({ error: 'Failed to fetch weights' });
  }
});

router.get('/:log_date', async (req, res) => {
  const { log_date } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM weight WHERE log_date = $1',
      [log_date]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching weight by date:', err);
    res.status(500).json({ error: 'Failed to fetch weight' });
  }
});

router.put('/:log_date', async (req, res) => {
  const { log_date } = req.params;
  const { weight_kg } = req.body;
  try {
    const result = await pool.query(
      'UPDATE weight SET weight_kg = $1 WHERE log_date = $2 RETURNING *',
      [weight_kg, log_date]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ message: 'Weight entry updated', entry: result.rows[0] });
  } catch (err) {
    console.error('Error updating weight:', err);
    res.status(500).json({ error: 'Failed to update weight' });
  }
});

router.delete('/:log_date', async (req, res) => {
  const { log_date } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM weight WHERE log_date = $1 RETURNING *',
      [log_date]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ message: 'Weight entry deleted' });
  } catch (err) {
    console.error('Error deleting weight:', err);
    res.status(500).json({ error: 'Failed to delete weight' });
  }
});

export default router;
