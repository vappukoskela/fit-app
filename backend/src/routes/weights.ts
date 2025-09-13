import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.post('/', async (req, res) => {
  const { entry } = req.body
  try {
    await pool.query('INSERT INTO weight (entry) VALUES ($1)', [entry])
    res.status(201).json({ message: 'OK' })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weight ORDER BY log_date DESC');
    res.json(result.rows);
    console.log(result.rows);  
  } catch (err) {
    console.error('Error fetching weights:', err);
    res.status(500).json({ error: 'Failed to fetch weights' });
  }
});

export default router;

