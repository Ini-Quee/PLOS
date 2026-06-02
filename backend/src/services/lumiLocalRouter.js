/**
 * lumiLocalRouter — deterministic intent handling with NO AI call.
 * Returns a Lumi-shaped result for simple reads/commands, or null to fall through to AI.
 * Governing rule: only act on CONFIDENT matches; never guess. Reads require low emotional intensity.
 * Cost: zero tokens. Uses the real DB schema (verified).
 */
const { pool } = require('../db/connection');
const logger = require('../lib/logger');

function enabled() {
  return process.env.LUMI_LOCAL_ROUTER !== 'false'; // on by default; set false to kill instantly
}

// ---- time helpers ----
function parseTimeToken(text) {
  // matches 7am, 7:30am, 15:00, 9 pm
  const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

function fmtTime(t) {
  const [h, m] = String(t).split(':');
  const hh = parseInt(h, 10);
  const ap = hh >= 12 ? 'pm' : 'am';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${m} ${ap}`;
}

const reply = (text, extra = {}) => ({
  success: true, lumiResponse: text, saved: false, savedItems: [],
  route: 'local', needsConfirmation: false, lane: 'local', ...extra,
});

/**
 * Main entry. userId, text, opts{ emotionalIntensity }.
 * Returns result object (handled locally) or null (fall through to AI).
 */
async function tryLocal(userId, text, opts = {}) {
  if (!enabled()) return null;
  const t = text.toLowerCase().trim();
  const intensity = opts.emotionalIntensity || 1;

  // Emotional bypass: anything heated goes to AI, even if it looks like a lookup.
  if (intensity >= 3) return null;

  const wantsTomorrow = /\b(tomorrow|tmrw|tmr)\b/.test(t);
  const wantsToday = /\b(today|tonight)\b/.test(t);

  try {
    // ---- READ: schedule for today/tomorrow ----
    if (/\b(plan|schedule|agenda|what do i have|what'?s on|what am i doing)\b/.test(t) && (wantsTomorrow || wantsToday)) {
      const offset = wantsTomorrow ? 1 : 0;
      const { rows } = await pool.query(
        `SELECT title, start_time FROM schedules
          WHERE user_id=$1 AND is_active=true
            AND (repeat_pattern='daily'
              OR (repeat_pattern='weekdays' AND EXTRACT(DOW FROM (CURRENT_DATE + $2::int)) BETWEEN 1 AND 5)
              OR (repeat_pattern IN ('weekly','custom') AND EXTRACT(DOW FROM (CURRENT_DATE + $2::int))::int = ANY(repeat_days))
              OR (repeat_pattern='none' AND target_date = CURRENT_DATE + $2::int))
          ORDER BY start_time`,
        [userId, offset]
      );
      const when = wantsTomorrow ? 'tomorrow' : 'today';
      if (rows.length === 0) return reply(`Your ${when} is clear — nothing scheduled yet.`, { intent: 'schedule_lookup' });
      const list = rows.map(r => `\u2022 ${r.title} at ${fmtTime(r.start_time)}`).join('\n');
      return reply(`Here's ${when}:\n${list}`, { intent: 'schedule_lookup' });
    }

    // ---- READ: today's spend ----
    if (/\b(spend|spent|expenses?|budget)\b/.test(t) && wantsToday) {
      const { rows } = await pool.query(
        `SELECT amount, currency, category, note FROM budget_entries
          WHERE user_id=$1 AND entry_date=CURRENT_DATE AND archived_at IS NULL AND type='expense'
          ORDER BY created_at DESC`,
        [userId]
      );
      if (rows.length === 0) return reply('No expenses logged today.', { intent: 'budget_lookup' });
      const total = rows.reduce((s, r) => s + Number(r.amount), 0);
      const lines = rows.map(r => `\u2022 ${r.currency || '\u20A6'}${Number(r.amount).toLocaleString('en-NG')} ${r.category}${r.note ? ` (${r.note})` : ''}`).join('\n');
      return reply(`Today you've spent \u20A6${total.toLocaleString('en-NG')}:\n${lines}`, { intent: 'budget_lookup' });
    }

    // ---- READ: habits today ----
    if (/\b(habits?)\b/.test(t) && (wantsToday || /\b(did i|list|my)\b/.test(t))) {
      const { rows } = await pool.query(
        `SELECT h.title, (hc.id IS NOT NULL) AS done
           FROM habits h
           LEFT JOIN habit_completions hc ON hc.habit_id=h.id AND hc.completion_date=CURRENT_DATE
          WHERE h.user_id=$1 AND h.is_active=true
          ORDER BY h.created_at DESC`,
        [userId]
      );
      if (rows.length === 0) return reply("You don't have any habits set up yet.", { intent: 'habit_lookup' });
      const done = rows.filter(r => r.done).length;
      const list = rows.map(r => `${r.done ? '\u2713' : '\u25CB'} ${r.title}`).join('\n');
      return reply(`Habits today (${done}/${rows.length}):\n${list}`, { intent: 'habit_lookup' });
    }

    // ---- WRITE: add a schedule item with an explicit time ----
    if (/\b(add|schedule|remind me to|put)\b/.test(t)) {
      const time = parseTimeToken(t);
      if (time) {
        // crude title extraction: strip command words and the time token
        let title = text
          .replace(/\b(add|schedule|remind me to|put|please|to|at|on|for)\b/gi, ' ')
          .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/i, ' ')
          .replace(/\b(tomorrow|today|tonight|tmrw|tmr)\b/gi, ' ')
          .replace(/\s+/g, ' ').trim();
        if (title.length >= 2) {
          const offset = wantsTomorrow ? 1 : 0;
          await pool.query(
            `INSERT INTO schedules (user_id, title, start_time, duration_minutes, category, repeat_pattern, is_active, target_date)
             VALUES ($1,$2,$3::time,60,'personal','none',true, CURRENT_DATE + $4::int)`,
            [userId, title, time, offset]
          );
          const when = wantsTomorrow ? ' tomorrow' : (wantsToday ? ' today' : '');
          return reply(`Added "${title}" at ${fmtTime(time)}${when} \u2713`, { intent: 'schedule_add', saved: true });
        }
      }
    }

    // ---- WRITE: log a habit completion ("log gym", "did my workout") ----
    const habitLog = t.match(/\b(log|did|done|completed|finished|mark)\b\s+(my\s+)?([a-z][a-z ]{1,30})/);
    if (habitLog) {
      const phrase = habitLog[3].replace(/\b(today|done|completed)\b/g, '').trim();
      if (phrase.length >= 2) {
        const found = await pool.query(
          `SELECT id, title FROM habits WHERE user_id=$1 AND title ILIKE $2 ESCAPE '\\' AND is_active=true LIMIT 1`,
          [userId, `%${phrase.replace(/[%_\\]/g, '\\$&')}%`]
        );
        if (found.rows.length > 0) {
          await pool.query(
            `INSERT INTO habit_completions (habit_id, user_id, completion_date)
             VALUES ($1,$2,CURRENT_DATE) ON CONFLICT (habit_id, completion_date) DO NOTHING`,
            [found.rows[0].id, userId]
          );
          return reply(`Logged "${found.rows[0].title}" for today \u2713`, { intent: 'habit_log', saved: true });
        }
        // habit not found → fall through to AI (it can offer to create it)
      }
    }

    return null; // nothing matched confidently → AI lanes
  } catch (err) {
    logger.error({ userId, where: 'lumiLocalRouter', err: err.message }, 'local router failed');
    return null; // on any error, fall through to AI — never break the message
  }
}

module.exports = { tryLocal };
