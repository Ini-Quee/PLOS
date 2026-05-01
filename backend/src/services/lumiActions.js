/**
 * Lumi Actions Service
 * Executes cross-app writes on Lumi's behalf after user confirmation.
 * Each action is atomic — if one fails the others still run.
 */
const { pool } = require('../db/connection');

/**
 * Execute a list of confirmed actions
 * @param {string} userId
 * @param {Array} actions - array of {type, payload} objects
 * @returns {Array} results with success/error per action
 */
async function executeActions(userId, actions) {
  const results = [];
  for (const action of actions) {
    try {
      const result = await executeOne(userId, action);
      results.push({ type: action.type, success: true, data: result });
    } catch (err) {
      results.push({ type: action.type, success: false, error: err.message });
    }
  }
  return results;
}

async function executeOne(userId, action) {
  switch (action.type) {

    // ── Schedule: create one block ───────────────────────────────────────────
    case 'create_schedule': {
      const {
        title, description, start_time, duration_minutes = 60,
        repeat_pattern = 'none', repeat_days, category = 'personal',
        is_high_priority = false, target_date, colour,
      } = action.payload;

      const r = await pool.query(
        `INSERT INTO schedules
          (user_id, title, description, start_time, duration_minutes,
           repeat_pattern, repeat_days, category, colour, is_high_priority, target_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          userId, title, description || null,
          start_time, duration_minutes,
          repeat_pattern, repeat_days || null,
          category, colour || '#C8955C',
          is_high_priority, target_date || null,
        ]
      );
      return r.rows[0];
    }

    // ── Schedule: create multiple blocks at once (e.g. anniversary plan) ─────
    case 'create_schedule_batch': {
      const { blocks } = action.payload; // array of schedule payloads
      const created = [];
      for (const block of blocks) {
        const r = await pool.query(
          `INSERT INTO schedules
            (user_id, title, description, start_time, duration_minutes,
             repeat_pattern, repeat_days, category, colour, is_high_priority, target_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           RETURNING *`,
          [
            userId,
            block.title, block.description || null,
            block.start_time, block.duration_minutes || 60,
            block.repeat_pattern || 'custom',
            block.repeat_days || null,
            block.category || 'personal',
            block.colour || '#C8955C',
            block.is_high_priority || false,
            block.target_date || null,
          ]
        );
        created.push(r.rows[0]);
      }
      return created;
    }

    // ── Schedule: mark complete ───────────────────────────────────────────────
    case 'complete_schedule': {
      const { schedule_id, notes } = action.payload;
      const today = new Date().toISOString().split('T')[0];
      const r = await pool.query(
        `INSERT INTO schedule_completions
           (schedule_id, user_id, completion_date, notes)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (schedule_id, completion_date)
         DO UPDATE SET notes = EXCLUDED.notes, completed_at = NOW()
         RETURNING *`,
        [schedule_id, userId, today, notes || null]
      );
      return r.rows[0];
    }

    // ── Journal: save entry ───────────────────────────────────────────────────
    case 'save_journal': {
      const { journal_type, content, ai_summary, emotion, source = 'lumi' } = action.payload;
      const r = await pool.query(
        `INSERT INTO journal_entries
           (user_id, journal_type, content, ai_summary, emotion, source, recorded_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
         RETURNING id, journal_type, recorded_at`,
        [userId, journal_type, content, ai_summary || '', emotion || 'neutral', source]
      );
      return r.rows[0];
    }

    // ── Goal: mark achieved + add milestone ───────────────────────────────────
    case 'achieve_goal': {
      const { goal_id, achievement_label, milestone_emoji = '🏆' } = action.payload;
      const r = await pool.query(
        `UPDATE year_goals
         SET is_completed = true,
             completed_at = NOW(),
             achievement_label = $2,
             milestone_emoji = $3,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $4
         RETURNING *`,
        [goal_id, achievement_label || 'Achieved!', milestone_emoji, userId]
      );
      return r.rows[0];
    }

    // ── Goal: update progress ─────────────────────────────────────────────────
    case 'update_goal_progress': {
      const { goal_id, progress_pct, notes } = action.payload;
      const r = await pool.query(
        `UPDATE year_goals
         SET progress_percentage = $2,
             progress_notes = $3,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $4
         RETURNING *`,
        [goal_id, progress_pct, notes || null, userId]
      );
      return r.rows[0];
    }

    // ── Habit: log completion ─────────────────────────────────────────────────
    case 'complete_habit': {
      const { habit_name, habit_id } = action.payload;
      let hid = habit_id;
      if (!hid && habit_name) {
        let found = await pool.query(
          `SELECT id FROM habits WHERE user_id = $1 AND name ILIKE $2 LIMIT 1`,
          [userId, `%${habit_name}%`]
        );
        if (found.rows.length === 0) {
          found = await pool.query(
            `INSERT INTO habits (user_id, name, created_at) VALUES ($1,$2,NOW()) RETURNING id`,
            [userId, habit_name]
          );
        }
        hid = found.rows[0].id;
      }
      const r = await pool.query(
        `INSERT INTO habit_completions (habit_id, user_id, completed, date, created_at)
         VALUES ($1,$2,true,CURRENT_DATE,NOW())
         ON CONFLICT (habit_id, date) DO UPDATE SET completed = true
         RETURNING *`,
        [hid, userId]
      );
      return r.rows[0];
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Pull context Lumi needs to build smart proposals:
 * recent journal entries, goals, schedule today
 */
async function getUserFullContext(userId) {
  const ctx = {};

  try {
    // Today's schedule
    const today = new Date().toISOString().split('T')[0];
    const dow = new Date().getDay();
    const sched = await pool.query(
      `SELECT id, title, start_time, category, is_high_priority, duration_minutes
       FROM schedules
       WHERE user_id = $1 AND is_active = true
       AND (repeat_pattern = 'daily'
            OR (repeat_pattern = 'weekdays' AND $3 BETWEEN 1 AND 5)
            OR (repeat_pattern = 'weekly'   AND $3 = ANY(repeat_days))
            OR (repeat_pattern = 'custom'   AND $3 = ANY(repeat_days))
            OR (repeat_pattern = 'none'     AND target_date = $2))
       ORDER BY start_time ASC`,
      [userId, today, dow]
    );
    ctx.todaySchedule = sched.rows;

    // Last 5 journal entries (just summaries — no full content for privacy)
    const jnl = await pool.query(
      `SELECT journal_type, ai_summary, emotion, recorded_at
       FROM journal_entries
       WHERE user_id = $1
       ORDER BY recorded_at DESC LIMIT 5`,
      [userId]
    );
    ctx.recentJournal = jnl.rows;

    // Active goals
    const goals = await pool.query(
      `SELECT id, title, progress_percentage, is_completed, milestone_emoji
       FROM year_goals
       WHERE user_id = $1 AND year = $2
       ORDER BY display_order ASC`,
      [userId, new Date().getFullYear()]
    );
    ctx.goals = goals.rows;

    // Habit completions today
    const habits = await pool.query(
      `SELECT h.name, hc.completed
       FROM habits h
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.date = CURRENT_DATE
       WHERE h.user_id = $1`,
      [userId]
    );
    ctx.habits = habits.rows;
  } catch (e) {
    // Context enrichment is best-effort
  }

  return ctx;
}

module.exports = { executeActions, getUserFullContext };
