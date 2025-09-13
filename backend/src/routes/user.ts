import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.put('/:id', async (req, res) => {
try {
    const { id } = req.params;
    const {
      name,
      email,
      birth_date,
      sex,
      height_cm,
      weight_goal_kg,
      hr_max,
      hr_rest,
      hr_min,
      vo2max,
    } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           birth_date = COALESCE($3, birth_date),
           sex = COALESCE($4, sex),
           height_cm = COALESCE($5, height_cm),
           weight_goal_kg = COALESCE($6, weight_goal_kg),
           hr_max = COALESCE($7, hr_max),
           hr_rest = COALESCE($8, hr_rest),
           hr_min = COALESCE($9, hr_min),
           vo2max = COALESCE($10, vo2max),
           updated_at = NOW()
       WHERE id = $11
       RETURNING id, name, email, birth_date, sex, height_cm, weight_goal_kg,
                 hr_max, hr_rest, hr_min, vo2max, created_at, updated_at`,
      [
        name,
        email,
        birth_date,
        sex,
        height_cm,
        weight_goal_kg,
        hr_max,
        hr_rest,
        hr_min,
        vo2max,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
})

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`SELECT id, name, email, birth_date, sex, height_cm, weight_goal_kg, 
              hr_max, hr_rest, hr_min, vo2max, created_at, updated_at
       FROM users WHERE id = $1`, [id]);
        res.json(result.rows[0]);
        console.log(result.rows[0]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

