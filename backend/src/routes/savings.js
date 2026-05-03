const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');
const { validateInput } = require('../middleware/validateInput');
const { rateLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();
router.use(authenticate);

const goalSchema = z.object({
  name:          z.string().min(1).max(200),
  emoji:         z.string().max(10).optional(),
  target_amount: z.number().positive(),
  saved_amount:  z.number().min(0).optional(),
  deadline:      z.string().nullable().optional(),
});

const depositSchema = z.object({
  amount: z.number().positive(),
});

// GET /savings — list all goals
router.get('/', async (req, res) => {
  const uid = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, name, emoji, target_amount, saved_amount, deadline, is_complete, created_at
       FROM savings_goals
       WHERE user_id=$1
       ORDER BY is_complete ASC, created_at DESC`,
      [uid]
    );
    res.json({ goals: result.rows });
  } catch (err) {
    console.error('Savings list error:', err);
    res.status(500).json({ error: 'Failed to load savings goals' });
  }
});

// POST /savings — create a new goal
router.post(
  '/',
  rateLimiter(50, 900, 'savings_create'),
  validateInput(goalSchema),
  auditLog('savings_goal_create', 'savings_goals'),
  async (req, res) => {
    const uid = req.user.id;
    const { name, emoji, target_amount, saved_amount, deadline } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO savings_goals (user_id, name, emoji, target_amount, saved_amount, deadline)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, name, emoji, target_amount, saved_amount, deadline, is_complete, created_at`,
        [uid, name, emoji || '🎯', target_amount, saved_amount ?? 0, deadline || null]
      );
      res.status(201).json({ goal: result.rows[0] });
    } catch (err) {
      console.error('Savings create error:', err);
      res.status(500).json({ error: 'Failed to create goal' });
    }
  }
);

// PUT /savings/:id — update goal details
router.put(
  '/:id',
  validateInput(goalSchema.partial()),
  auditLog('savings_goal_update', 'savings_goals'),
  async (req, res) => {
    const uid = req.user.id;
    const { name, emoji, target_amount, saved_amount, deadline } = req.body;
    try {
      const fields = [];
      const values = [];
      let i = 1;

      if (name          !== undefined) { fields.push(`name=$${i++}`);          values.push(name); }
      if (emoji         !== undefined) { fields.push(`emoji=$${i++}`);         values.push(emoji); }
      if (target_amount !== undefined) { fields.push(`target_amount=$${i++}`); values.push(target_amount); }
      if (saved_amount  !== undefined) { fields.push(`saved_amount=$${i++}`);  values.push(saved_amount); }
      if (deadline      !== undefined) { fields.push(`deadline=$${i++}`);      values.push(deadline || null); }

      if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });

      fields.push(`updated_at=NOW()`);
      values.push(req.params.id, uid);

      const result = await pool.query(
        `UPDATE savings_goals SET ${fields.join(',')}
         WHERE id=$${i++} AND user_id=$${i}
         RETURNING id, name, emoji, target_amount, saved_amount, deadline, is_complete, created_at`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
      res.json({ goal: result.rows[0] });
    } catch (err) {
      console.error('Savings update error:', err);
      res.status(500).json({ error: 'Failed to update goal' });
    }
  }
);

// POST /savings/:id/deposit — add money to a goal
router.post(
  '/:id/deposit',
  validateInput(depositSchema),
  auditLog('savings_deposit', 'savings_goals'),
  async (req, res) => {
    const uid = req.user.id;
    const { amount } = req.body;
    try {
      const result = await pool.query(
        `UPDATE savings_goals
         SET saved_amount = saved_amount + $1,
             is_complete  = CASE WHEN saved_amount + $1 >= target_amount THEN true ELSE is_complete END,
             updated_at   = NOW()
         WHERE id=$2 AND user_id=$3
         RETURNING id, name, emoji, target_amount, saved_amount, deadline, is_complete`,
        [amount, req.params.id, uid]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
      res.json({ goal: result.rows[0] });
    } catch (err) {
      console.error('Savings deposit error:', err);
      res.status(500).json({ error: 'Failed to update saved amount' });
    }
  }
);

// DELETE /savings/:id
router.delete('/:id', auditLog('savings_goal_delete', 'savings_goals'), async (req, res) => {
  const uid = req.user.id;
  try {
    const result = await pool.query(
      `DELETE FROM savings_goals WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, uid]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    console.error('Savings delete error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
