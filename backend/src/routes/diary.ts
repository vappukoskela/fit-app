import { Router } from 'express'
import { pool } from '../db'

const router = Router()

router.post('/', async (req, res) => {
  const { entry } = req.body
  try {
    await pool.query('INSERT INTO diary (entry) VALUES ($1)', [entry])
    res.status(201).json({ message: 'OK' })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM diary ORDER BY id DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

export default router