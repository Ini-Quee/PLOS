const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { pool } = require('../db/connection');

router.use(authenticate);

function calcStreak(completions) {
  if (!completions?.length) return 0;
  const dates = new Set(completions.map(d =>
    typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  ));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (dates.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }
  return streak;
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.*,
        CASE WHEN hc_today.id IS NOT NULL THEN true ELSE false END AS completed_today,
        COALESCE(
          (SELECT json_agg(completion_date ORDER BY completion_date DESC)
           FROM habit_completions
           WHERE habit_id = h.id AND completion_date >= CURRENT_DATE - 89),
          '[]'::json
        ) AS recent_completions,
        CASE WHEN EXISTS (
          SELECT 1 FROM habit_commitments hcom WHERE hcom.habit_id = h.id
        ) THEN true ELSE false END AS has_partner
      FROM habits h
      LEFT JOIN habit_completions hc_today
        ON hc_today.habit_id = h.id AND hc_today.completion_date = CURRENT_DATE
      WHERE h.user_id = $1 AND h.is_active = true
      ORDER BY h.created_at ASC`,
      [req.user.id]
    );

    // Reset revival tokens each calendar month
    const thisMonth = new Date().toISOString().slice(0, 7);
    const habits = await Promise.all(rows.map(async h => {
      let tokens = h.revival_tokens ?? 2;
      if ((h.revival_month || '') !== thisMonth) {
        await pool.query(
          `UPDATE habits SET revival_tokens = 2, revival_month = $1 WHERE id = $2`,
          [thisMonth, h.id]
        );
        tokens = 2;
      }
      return { ...h, streak: calcStreak(h.recent_completions), revival_tokens: tokens };
    }));

    res.json({ habits });
  } catch (err) {
    console.error('GET /habits error:', err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

router.post('/', async (req, res) => {
  const { title, emoji, category, target_days, identity_label } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO habits (user_id, title, emoji, category, target_days, identity_label)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        title.trim(),
        emoji || '✅',
        category || 'personal',
        target_days || [0, 1, 2, 3, 4, 5, 6],
        identity_label || '',
      ]
    );
    res.status(201).json({ habit: rows[0] });
  } catch (err) {
    console.error('POST /habits error:', err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE habits SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Habit not found' });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    console.error('DELETE /habits/:id error:', err);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

router.post('/:id/complete', async (req, res) => {
  const { identity_score } = req.body;
  try {
    await pool.query(
      `INSERT INTO habit_completions (habit_id, user_id, completion_date, identity_score)
       VALUES ($1, $2, CURRENT_DATE, $3)
       ON CONFLICT (habit_id, completion_date) DO UPDATE SET identity_score = EXCLUDED.identity_score`,
      [req.params.id, req.user.id, identity_score ?? null]
    );
    res.json({ completed: true, date: new Date().toISOString().slice(0, 10) });
  } catch (err) {
    console.error('POST /habits/:id/complete error:', err);
    res.status(500).json({ error: 'Failed to mark habit complete' });
  }
});

router.delete('/:id/complete', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM habit_completions
       WHERE habit_id = $1 AND user_id = $2 AND completion_date = CURRENT_DATE`,
      [req.params.id, req.user.id]
    );
    res.json({ completed: false });
  } catch (err) {
    console.error('DELETE /habits/:id/complete error:', err);
    res.status(500).json({ error: 'Failed to unmark habit completion' });
  }
});

// Use a revival token to protect the current streak
router.post('/:id/revive', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT revival_tokens FROM habits WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Habit not found' });
    if (rows[0].revival_tokens < 1) return res.status(400).json({ error: 'No revival tokens left' });

    await pool.query(
      `UPDATE habits SET revival_tokens = revival_tokens - 1 WHERE id = $1`,
      [req.params.id]
    );
    // Insert a completion for yesterday to keep the chain alive
    await pool.query(
      `INSERT INTO habit_completions (habit_id, user_id, completion_date)
       VALUES ($1, $2, CURRENT_DATE - 1)
       ON CONFLICT (habit_id, completion_date) DO NOTHING`,
      [req.params.id, req.user.id]
    );
    res.json({ revived: true, tokens_remaining: rows[0].revival_tokens - 1 });
  } catch (err) {
    console.error('POST /habits/:id/revive error:', err);
    res.status(500).json({ error: 'Failed to use revival token' });
  }
});

// Aggregate identity votes for a habit
router.get('/:id/identity', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE identity_score IS NOT NULL) AS total_votes,
         ROUND(AVG(identity_score), 1) AS avg_score,
         COUNT(*) FILTER (WHERE identity_score >= 7) AS strong_votes,
         COUNT(*) FILTER (WHERE identity_score <= 3) AS weak_votes
       FROM habit_completions
       WHERE habit_id = $1 AND user_id = $2
         AND completion_date >= CURRENT_DATE - 29`,
      [req.params.id, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /habits/:id/identity error:', err);
    res.status(500).json({ error: 'Failed to fetch identity data' });
  }
});

// 30-day daily identity score trend for sparkline
router.get('/:id/identity/trend', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         gs.day::date AS date,
         ROUND(AVG(hc.identity_score), 1) AS avg_score
       FROM generate_series(
         CURRENT_DATE - 29, CURRENT_DATE, '1 day'::interval
       ) AS gs(day)
       LEFT JOIN habit_completions hc
         ON hc.habit_id = $1
         AND hc.user_id = $2
         AND hc.completion_date = gs.day::date
         AND hc.identity_score IS NOT NULL
       GROUP BY gs.day
       ORDER BY gs.day ASC`,
      [req.params.id, req.user.id]
    );
    res.json({ trend: rows });
  } catch (err) {
    console.error('GET /habits/:id/identity/trend error:', err);
    res.status(500).json({ error: 'Failed to fetch identity trend' });
  }
});

// ─── Accountability partner endpoints ─────────────────────────────────────────

router.post('/:id/partner', async (req, res) => {
  const { partner_email, stake_description = '' } = req.body;
  if (!partner_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner_email)) {
    return res.status(400).json({ error: 'Valid partner email is required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO habit_commitments (habit_id, user_id, partner_email, stake_description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (habit_id, partner_email) DO UPDATE SET stake_description = $4
       RETURNING *`,
      [req.params.id, req.user.id, partner_email.toLowerCase().trim(), stake_description]
    );
    res.status(201).json({ commitment: rows[0] });
  } catch (err) {
    console.error('POST /habits/:id/partner error:', err);
    res.status(500).json({ error: 'Failed to add partner' });
  }
});

router.get('/:id/partners', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, partner_email, stake_description, created_at, last_notified_at
       FROM habit_commitments WHERE habit_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ partners: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

router.delete('/:id/partner', async (req, res) => {
  const { partner_email } = req.body;
  if (!partner_email) return res.status(400).json({ error: 'partner_email required' });
  try {
    await pool.query(
      `DELETE FROM habit_commitments WHERE habit_id = $1 AND user_id = $2 AND partner_email = $3`,
      [req.params.id, req.user.id, partner_email.toLowerCase().trim()]
    );
    res.json({ removed: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove partner' });
  }
});

// ─── Weekly partner email sender (called by cron + test endpoint) ──────────────

async function sendWeeklyPartnerEmails(userId) {
  let nodemailer;
  try { nodemailer = require('nodemailer'); } catch { return; }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  // Get user name
  const userRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [userId]);
  const userName = userRes.rows[0]?.name || 'Your friend';

  // Get all active habits with commitments for this user
  const { rows: commitments } = await pool.query(
    `SELECT hc.id AS commitment_id, hc.partner_email, hc.stake_description,
            h.title, h.emoji, h.category
     FROM habit_commitments hc
     JOIN habits h ON h.id = hc.habit_id
     WHERE hc.user_id = $1 AND h.is_active = true`,
    [userId]
  );

  for (const c of commitments) {
    try {
      // Get streak + last 7 days completions
      const streakRes = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE completion_date >= CURRENT_DATE - 6) AS week_count,
           (SELECT COUNT(*) FROM (
             SELECT completion_date FROM habit_completions
             WHERE habit_id = (SELECT id FROM habits WHERE title = $2 AND user_id = $1 LIMIT 1)
             ORDER BY completion_date DESC
           ) sub) AS total
         FROM habit_completions
         WHERE user_id = $1 AND completion_date >= CURRENT_DATE - 6`,
        [userId, c.title]
      );
      const weekCount = Number(streakRes.rows[0]?.week_count || 0);

      // Get streak from the habits query
      const habitRes = await pool.query(
        `SELECT title, emoji,
           COALESCE(
             (SELECT json_agg(completion_date ORDER BY completion_date DESC)
              FROM habit_completions
              WHERE habit_id = h.id AND completion_date >= CURRENT_DATE - 29),
             '[]'::json
           ) AS recent_completions
         FROM habits h WHERE user_id = $1 AND title = $2 AND is_active = true LIMIT 1`,
        [userId, c.title]
      );
      const habit = habitRes.rows[0];
      const streak = habit ? calcStreak(habit.recent_completions) : 0;

      const stakeNote = c.stake_description
        ? `\nTheir commitment: "${c.stake_description}"\n` : '';

      const emailBody = `Hi there,

${userName} added you as an accountability partner for their habit:
${c.emoji} ${c.title}

This week's update:
  Current streak: ${streak} day${streak !== 1 ? 's' : ''} 🔥
  This week: ${weekCount}/7 days completed
${stakeNote}
Keep ${userName} accountable — a quick message of encouragement goes a long way.

---
Sent by PLOS — the personal life operating system.
To stop receiving these updates, ask ${userName} to remove you as a partner.`;

      await transporter.sendMail({
        from: `"PLOS" <${process.env.GMAIL_USER}>`,
        to: c.partner_email,
        subject: `${userName}'s habit update: ${c.emoji} ${c.title} — 🔥 ${streak}-day streak`,
        text: emailBody,
      });

      await pool.query(
        `UPDATE habit_commitments SET last_notified_at = NOW() WHERE id = $1`,
        [c.commitment_id]
      );
    } catch (err) {
      console.error('[Partner email] failed for', c.partner_email, err.message);
    }
  }
}

// Test endpoint — triggers emails for the logged-in user immediately
router.post('/send-partner-emails', async (req, res) => {
  try {
    await sendWeeklyPartnerEmails(req.user.id);
    res.json({ success: true, message: 'Partner emails sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send partner emails' });
  }
});

module.exports = { router, sendWeeklyPartnerEmails };
