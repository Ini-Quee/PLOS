/**
 * users.js — user profile and settings endpoints
 * GET  /api/users/settings   — fetch current settings
 * PUT  /api/users/settings   — merge-update settings (shallow merge)
 * PUT  /api/users/profile    — update display name
 */
const express  = require('express');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

// GET /api/users/settings
router.get('/settings', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT settings FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ settings: rows[0]?.settings || {} });
  } catch {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/users/settings  — shallow merge into existing JSONB
router.put('/settings', async (req, res) => {
  try {
    const patch = req.body;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return res.status(400).json({ error: 'Settings must be a JSON object' });
    }
    const { rows } = await pool.query(
      `UPDATE users
       SET settings = settings || $2::jsonb
       WHERE id = $1
       RETURNING settings`,
      [req.user.id, JSON.stringify(patch)]
    );
    res.json({ settings: rows[0]?.settings || {} });
  } catch {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// PUT /api/users/profile  — update display name
router.put('/profile', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await pool.query(
      'UPDATE users SET name = $2 WHERE id = $1 RETURNING id, name, email',
      [req.user.id, name.trim()]
    );
    res.json({ user: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
