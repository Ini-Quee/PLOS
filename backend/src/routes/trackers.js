const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { pool } = require('../db/connection');

router.use(authenticate);

function calcStreak(markDates) {
  if (!markDates || markDates.length === 0) return 0;
  const set = new Set(markDates.map(d =>
    typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  ));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (set.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

// List trackers with marks + streak
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*,
        (SELECT json_agg(mark_date ORDER BY mark_date DESC)
         FROM tracker_marks m WHERE m.tracker_id = t.id
         AND m.mark_date >= CURRENT_DATE - 364) AS marks
       FROM trackers t
       WHERE t.user_id = $1 AND t.is_active = true AND t.archived_at IS NULL
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    const trackers = rows.map(t => ({
      ...t,
      marks: t.marks || [],
      streak: calcStreak(t.marks || []),
    }));
    res.json({ trackers });
  } catch (e) {
    console.error('[trackers] list:', e.message);
    res.status(500).json({ error: 'Failed to load trackers' });
  }
});

// Create a tracker
router.post('/', async (req, res) => {
  try {
    const {
      title, type = 'chain', target_days = null,
      target_count = null, emoji = '✅', color = '#C8955C',
      target_dow = null,
    } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO trackers
       (user_id, title, type, target_days, target_count, emoji, color, target_dow)
       VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8,'{0,1,2,3,4,5,6}'))
       RETURNING *`,
      [req.user.id, title.trim(), type, target_days, target_count, emoji, color, target_dow]
    );
    res.json({ tracker: { ...rows[0], marks: [], streak: 0 } });
  } catch (e) {
    console.error('[trackers] create:', e.message);
    res.status(500).json({ error: 'Failed to create tracker' });
  }
});

// Mark a date (default: today)
router.post('/:id/mark', async (req, res) => {
  try {
    const date = req.body.date || null;
    await pool.query(
      `INSERT INTO tracker_marks (tracker_id, user_id, mark_date)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE))
       ON CONFLICT (tracker_id, mark_date) DO NOTHING`,
      [req.params.id, req.user.id, date]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] mark:', e.message);
    res.status(500).json({ error: 'Failed to mark' });
  }
});

// Unmark a date (default: today). Uses query param — DELETE body is unreliable.
router.delete('/:id/mark', async (req, res) => {
  try {
    const date = req.query.date || null;
    await pool.query(
      `DELETE FROM tracker_marks
       WHERE tracker_id = $1 AND user_id = $2
       AND mark_date = COALESCE($3::date, CURRENT_DATE)`,
      [req.params.id, req.user.id, date]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] unmark:', e.message);
    res.status(500).json({ error: 'Failed to unmark' });
  }
});

// Revival: protect a missed day. Defaults to yesterday.
router.post('/:id/revive', async (req, res) => {
  try {
    const t = await pool.query(
      `SELECT revival_tokens FROM trackers WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!t.rows.length) return res.status(404).json({ error: 'Tracker not found' });
    if ((t.rows[0].revival_tokens || 0) <= 0) {
      return res.status(400).json({ error: 'No revivals left' });
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = req.body.date || yesterday.toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO tracker_marks (tracker_id, user_id, mark_date, note)
       VALUES ($1, $2, $3, 'revived')
       ON CONFLICT (tracker_id, mark_date) DO NOTHING`,
      [req.params.id, req.user.id, date]
    );
    await pool.query(
      `UPDATE trackers SET revival_tokens = revival_tokens - 1
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] revive:', e.message);
    res.status(500).json({ error: 'Failed to revive' });
  }
});

// Archive a tracker
router.patch('/:id', async (req, res) => {
  try {
    const { archived } = req.body;
    if (archived) {
      await pool.query(
        `UPDATE trackers SET archived_at = NOW(), is_active = false
         WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );
    }
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] patch:', e.message);
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;
