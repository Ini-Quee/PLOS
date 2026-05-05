/**
 * demo.js — Investor demo mode
 * POST /api/demo/login  — auto-login as demo account (creates if needed)
 * POST /api/demo/reset  — resets all demo data to rich seed state in <2s
 */
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const DEMO_EMAIL    = process.env.DEMO_EMAIL    || 'demo@plos.app';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'PLOSdemo2025!';
const DEMO_NAME     = 'Alex (Demo)';

async function getOrCreateDemo() {
  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [DEMO_EMAIL]);
  if (existing.rows.length) return existing.rows[0].id;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, is_demo, subscription_tier)
     VALUES ($1, $2, $3, true, 'pro') RETURNING id`,
    [DEMO_NAME, DEMO_EMAIL, hash]
  );
  return rows[0].id;
}

// POST /api/demo/login — no auth required
router.post('/login', async (req, res) => {
  try {
    const userId = await getOrCreateDemo();

    // Ensure demo user is always Pro
    await pool.query(
      `UPDATE users SET subscription_tier = 'pro' WHERE id = $1`,
      [userId]
    );

    const token = jwt.sign(
      { sub: userId, email: DEMO_EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: { id: userId, name: DEMO_NAME, email: DEMO_EMAIL, is_demo: true, subscription_tier: 'pro' },
      token,
      accessToken: token,
    });
  } catch (err) {
    console.error('[Demo] login error:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// POST /api/demo/reset — resets demo data, requires auth (demo account only)
router.post('/reset', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT is_demo FROM users WHERE id = $1`, [req.user.id]);
    if (!rows.length || !rows[0].is_demo) {
      return res.status(403).json({ error: 'Only the demo account can be reset' });
    }

    const uid = req.user.id;

    // ── Wipe existing demo data ──────────────────────────────────────────────
    await Promise.all([
      pool.query(`DELETE FROM lumi_memories          WHERE user_id = $1`, [uid]),
      pool.query(`DELETE FROM habit_completions      WHERE user_id = $1`, [uid]),
      pool.query(`DELETE FROM habits                 WHERE user_id = $1`, [uid]),
      pool.query(`DELETE FROM schedule_completions   WHERE user_id = $1`, [uid]),
      pool.query(`DELETE FROM schedules              WHERE user_id = $1`, [uid]),
      pool.query(`DELETE FROM journal_page_entries   WHERE user_id = $1`, [uid]),
      pool.query(`DELETE FROM lumi_conversations     WHERE user_id = $1`, [uid]),
      pool.query(`DELETE FROM budget_entries         WHERE user_id = $1`, [uid]).catch(() => {}),
      pool.query(`DELETE FROM savings_goals          WHERE user_id = $1`, [uid]).catch(() => {}),
    ]);

    // ── Seed habits with streaks ─────────────────────────────────────────────
    const habitDefs = [
      { title: 'Morning Run',         emoji: '🏃', category: 'health',   identity_label: 'being an athlete',         streak: 7 },
      { title: 'Read 20 Minutes',     emoji: '📚', category: 'focus',    identity_label: 'being a lifelong learner',  streak: 5 },
      { title: 'Meditate',            emoji: '🧘', category: 'wellness', identity_label: 'being present and grounded',streak: 3 },
    ];

    for (const h of habitDefs) {
      const { rows: [habit] } = await pool.query(
        `INSERT INTO habits (user_id, title, emoji, category, identity_label)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [uid, h.title, h.emoji, h.category, h.identity_label]
      );
      // Streak completions — last N days
      for (let i = 1; i <= h.streak; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        await pool.query(
          `INSERT INTO habit_completions (habit_id, user_id, completion_date)
           VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
          [habit.id, uid, ds]
        ).catch(() => {});
      }
    }

    // ── Seed weekly schedule (life audit result) ─────────────────────────────
    const schedules = [
      { title: 'Morning Run',         start_time: '06:00', duration_minutes: 45,  category: 'health',    repeat_pattern: 'daily',    repeat_days: null },
      { title: 'Bible Study & Prayer',start_time: '07:00', duration_minutes: 30,  category: 'spiritual', repeat_pattern: 'daily',    repeat_days: null },
      { title: 'Deep Work — PLOS',    start_time: '09:00', duration_minutes: 120, category: 'work',      repeat_pattern: 'weekdays', repeat_days: null },
      { title: 'Lunch Break',         start_time: '13:00', duration_minutes: 60,  category: 'meal',      repeat_pattern: 'daily',    repeat_days: null },
      { title: 'Investor Outreach',   start_time: '15:00', duration_minutes: 90,  category: 'work',      repeat_pattern: 'weekdays', repeat_days: null },
      { title: 'Gym Session',         start_time: '17:30', duration_minutes: 60,  category: 'health',    repeat_pattern: 'weekly',   repeat_days: [1, 3, 5] },
      { title: 'Read 20 Minutes',     start_time: '20:00', duration_minutes: 20,  category: 'personal',  repeat_pattern: 'daily',    repeat_days: null },
      { title: 'Evening Journal',     start_time: '21:00', duration_minutes: 20,  category: 'personal',  repeat_pattern: 'daily',    repeat_days: null },
      { title: 'Weekly Review',       start_time: '10:00', duration_minutes: 60,  category: 'work',      repeat_pattern: 'weekly',   repeat_days: [0] },
    ];

    for (const s of schedules) {
      await pool.query(
        `INSERT INTO schedules (user_id, title, start_time, duration_minutes, category, repeat_pattern, repeat_days, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [uid, s.title, s.start_time, s.duration_minutes, s.category, s.repeat_pattern, s.repeat_days]
      ).catch(() => {});
    }

    // ── Seed journal entries (last 3 days) ───────────────────────────────────
    const journalEntries = [
      {
        offset: 0,
        fields: {
          freewrite: "Feeling really focused today. The PLOS build is coming together and I can see it becoming something real. Spoke to two potential users — both said they\'d pay for this.",
          mood: 'energized', intentions: 'Ship the investor demo by end of week',
        },
      },
      {
        offset: 1,
        fields: {
          freewrite: "Had a rough afternoon — distracted and couldn\'t focus. But I completed my morning run and Bible study which kept me grounded. Tomorrow I\'ll block off the afternoon properly.",
          mood: 'reflective', intentions: 'Protect deep work time',
        },
      },
      {
        offset: 2,
        fields: {
          freewrite: "Big clarity moment today. PLOS isn\'t just a productivity app — it\'s about helping people live with intention. ADHD brains especially need a system that works with them, not against them.",
          mood: 'inspired', intentions: 'Write investor pitch draft',
        },
      },
    ];

    for (const e of journalEntries) {
      const d = new Date(); d.setDate(d.getDate() - e.offset);
      const ds = d.toISOString().slice(0, 10);
      await pool.query(
        `INSERT INTO journal_page_entries (user_id, journal_type, template_name, entry_date, fields)
         VALUES ($1,'personal','Daily Reflection',$2,$3)
         ON CONFLICT (user_id, journal_type, template_name, entry_date)
         DO UPDATE SET fields = $3`,
        [uid, ds, JSON.stringify(e.fields)]
      ).catch(() => {});
    }

    // ── Seed budget transactions ─────────────────────────────────────────────
    const budgetItems = [
      { amount: 2500,  category: 'food',      note: 'Lunch',             type: 'expense' },
      { amount: 1800,  category: 'transport', note: 'Uber to client',    type: 'expense' },
      { amount: 50000, category: 'freelance', note: 'Freelance payment', type: 'income'  },
      { amount: 5000,  category: 'bills',     note: 'Netflix',           type: 'expense' },
    ];

    for (const b of budgetItems) {
      await pool.query(
        `INSERT INTO budget_entries (user_id, amount, category, note, type)
         VALUES ($1,$2,$3,$4,$5)`,
        [uid, b.amount, b.category, b.note, b.type]
      ).catch(() => {});
    }

    // ── Seed savings goal ────────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO savings_goals (user_id, name, emoji, target_amount, saved_amount, deadline)
       VALUES ($1,'Emergency Fund','🏦',500000,203000, NOW() + INTERVAL '6 months')`,
      [uid]
    ).catch(() => {});

    // ── Seed Lumi memories ───────────────────────────────────────────────────
    const memories = [
      { type: 'goal',    content: 'Alex wants to raise a pre-seed round for PLOS by Q3 2026',            importance: 9 },
      { type: 'pattern', content: 'Alex loses focus in the afternoons — tends to scroll instead of work', importance: 8 },
      { type: 'goal',    content: 'Alex wants to wake up at 5:30am consistently',                        importance: 7 },
      { type: 'fact',    content: 'Alex has ADHD and works best in 90-minute deep work sprints',          importance: 8 },
      { type: 'milestone',content: '7-day Morning Run streak — the longest one yet',                     importance: 7 },
    ];

    for (const m of memories) {
      await pool.query(
        `INSERT INTO lumi_memories (user_id, memory_type, content, source, importance)
         VALUES ($1,$2,$3,'demo',$4)`,
        [uid, m.type, m.content, m.importance]
      ).catch(() => {});
    }

    // ── Seed a Lumi conversation ─────────────────────────────────────────────
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    await pool.query(
      `INSERT INTO lumi_conversations (user_id, user_message, lumi_response, route, source, created_at)
       VALUES ($1,$2,$3,'conversation','chat',$4)`,
      [
        uid,
        'I want to wake up earlier but I keep hitting snooze',
        'I hear you — that battle with the snooze button is real. You\'ve actually been consistent with your Morning Run for 7 days now, which tells me the intention is there. What if we shift your sleep schedule back by just 15 minutes this week? Small steps protect momentum.',
        yesterday,
      ]
    ).catch(() => {});

    res.json({ success: true, message: 'Demo reset complete — 9 schedules, 3 habits, 3 journals, memories loaded' });
  } catch (err) {
    console.error('[Demo] reset error:', err);
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

module.exports = router;
