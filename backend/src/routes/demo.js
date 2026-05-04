/**
 * demo.js — Investor demo mode
 * POST /api/demo/login  — logs in as the demo account (creates it if needed)
 * POST /api/demo/reset  — resets demo data to seed state (demo account only)
 */
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const DEMO_EMAIL    = 'demo@plos.app';
const DEMO_PASSWORD = 'PLOSdemo2025!';
const DEMO_NAME     = 'Alex (Demo)';

async function getOrCreateDemo() {
  const existing = await pool.query(
    `SELECT id FROM users WHERE email = $1`, [DEMO_EMAIL]
  );
  if (existing.rows.length) return existing.rows[0].id;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, is_demo)
     VALUES ($1, $2, $3, true) RETURNING id`,
    [DEMO_NAME, DEMO_EMAIL, hash]
  );
  return rows[0].id;
}

// POST /api/demo/login — no auth required
router.post('/login', async (req, res) => {
  try {
    const userId = await getOrCreateDemo();
    const token  = jwt.sign({ id: userId, email: DEMO_EMAIL }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({ user: { id: userId, name: DEMO_NAME, email: DEMO_EMAIL, is_demo: true }, token });
  } catch (err) {
    console.error('[Demo] login error:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// POST /api/demo/reset — resets demo data, requires auth (must be demo user)
router.post('/reset', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT is_demo FROM users WHERE id = $1`, [req.user.id]);
    if (!rows.length || !rows[0].is_demo) {
      return res.status(403).json({ error: 'Only the demo account can be reset' });
    }

    const uid = req.user.id;

    // Clear all demo data
    await pool.query(`DELETE FROM habit_completions WHERE user_id = $1`, [uid]);
    await pool.query(`DELETE FROM habits          WHERE user_id = $1`, [uid]);
    await pool.query(`DELETE FROM schedule_completions WHERE user_id = $1`, [uid]);
    await pool.query(`DELETE FROM schedules        WHERE user_id = $1`, [uid]);
    await pool.query(`DELETE FROM journal_page_entries WHERE user_id = $1`, [uid]);
    await pool.query(`DELETE FROM budget_entries   WHERE user_id = $1`, [uid]);
    await pool.query(`DELETE FROM savings_goals    WHERE user_id = $1`, [uid]).catch(() => {});

    // Seed habits
    const habits = [
      { title: 'Morning Run', emoji: '🏃', category: 'health', identity_label: 'being an athlete' },
      { title: 'No Phone Before 10am', emoji: '📵', category: 'focus', identity_label: 'being focused' },
      { title: 'Bible Study', emoji: '✝️', category: 'mindset', identity_label: 'being faithful' },
      { title: 'Save ₦500/day', emoji: '💰', category: 'finance', identity_label: 'being financially free' },
    ];
    const today = new Date().toISOString().slice(0, 10);
    for (const h of habits) {
      const { rows: [habit] } = await pool.query(
        `INSERT INTO habits (user_id, title, emoji, category, identity_label)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [uid, h.title, h.emoji, h.category, h.identity_label]
      );
      // Seed 10 days of completions ending yesterday
      for (let i = 1; i <= 10; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        await pool.query(
          `INSERT INTO habit_completions (habit_id, user_id, completion_date, identity_score)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [habit.id, uid, ds, 7 + Math.floor(Math.random() * 3)]
        ).catch(() => {});
      }
    }

    // Seed today's schedule
    const schedule = [
      { title: 'Morning Run', start_time: '06:30', duration_minutes: 45, category: 'wellness', repeat_pattern: 'daily' },
      { title: 'Deep Work — PLOS Build', start_time: '09:00', duration_minutes: 120, category: 'work', repeat_pattern: 'weekdays' },
      { title: 'Bible Study', start_time: '07:30', duration_minutes: 30, category: 'personal', repeat_pattern: 'daily' },
      { title: 'Lunch + Walk', start_time: '13:00', duration_minutes: 60, category: 'wellness', repeat_pattern: 'daily' },
      { title: 'Investor Outreach', start_time: '15:00', duration_minutes: 90, category: 'work', repeat_pattern: 'weekdays' },
      { title: 'Evening Journaling', start_time: '21:00', duration_minutes: 20, category: 'personal', repeat_pattern: 'daily' },
    ];
    for (const s of schedule) {
      await pool.query(
        `INSERT INTO schedules (user_id, title, start_time, duration_minutes, category, repeat_pattern, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,true)`,
        [uid, s.title, s.start_time, s.duration_minutes, s.category, s.repeat_pattern]
      ).catch(() => {});
    }

    // Seed savings goal
    await pool.query(
      `INSERT INTO savings_goals (user_id, title, target_amount, current_amount, currency, target_date)
       VALUES ($1,'Emergency Fund',500000,87000,'₦', NOW() + INTERVAL '6 months')
       ON CONFLICT DO NOTHING`,
      [uid]
    ).catch(() => {});

    res.json({ success: true, message: 'Demo data reset to seed state' });
  } catch (err) {
    console.error('[Demo] reset error:', err);
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

module.exports = router;
