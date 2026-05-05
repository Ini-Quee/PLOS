/**
 * cronWorker.js — all scheduled background jobs for PLOS.
 * Extracted from server.js so the HTTP process stays clean.
 *
 * Jobs:
 *   1. Weekly partner habit emails  — every Monday 8am
 *   2. Push notification reminders  — every minute
 *
 * Idempotency guarantees:
 *   - Weekly emails: guarded by last_notified_at column (skips if already sent this week)
 *   - Push reminders: guarded by push_notification_log unique constraint (ON CONFLICT DO NOTHING)
 */

require('dotenv').config();

const cron = require('node-cron');
const { pool } = require('../db/connection');
const { router: _r, sendWeeklyPartnerEmails } = require('../routes/habits');
const { router: _p, sendPushToUser } = require('../routes/push');

// ── Job 1: Weekly partner emails ────────────────────────────────────────────────
cron.schedule('0 8 * * 1', async () => {
  const runId = await startRun('weekly_partner_emails');
  let affected = 0;
  try {
    // Only users whose commitments have NOT been notified this week
    const { rows } = await pool.query(
      `SELECT DISTINCT hc.user_id
       FROM habit_commitments hc
       JOIN habits h ON h.id = hc.habit_id AND h.is_active = true
       WHERE hc.last_notified_at IS NULL
          OR hc.last_notified_at < DATE_TRUNC('week', NOW())`
    );

    for (const row of rows) {
      await sendWeeklyPartnerEmails(row.user_id).catch(e =>
        console.error('[Cron] partner email error for user', row.user_id, e.message)
      );
      affected++;
    }

    await finishRun(runId, 'completed', null, affected);
    console.log(`[Cron] Weekly emails sent to ${affected} users`);
  } catch (err) {
    await finishRun(runId, 'failed', err.message, affected);
    console.error('[Cron] Weekly email job failed:', err.message);
  }
});

// ── Job 2: Push notification reminders ─────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nowTime = `${hh}:${mm}`;
    const sentMinute = now.getHours() * 60 + now.getMinutes();

    const { rows } = await pool.query(
      `SELECT s.id AS schedule_id, s.user_id, s.title, s.category, sc.streak
       FROM schedules s
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS streak FROM schedule_completions
         WHERE schedule_id = s.id AND user_id = s.user_id
           AND completion_date >= CURRENT_DATE - 6
       ) sc ON true
       WHERE s.is_active = true
         AND s.reminder_minutes IS NOT NULL
         AND (
           s.start_time::time - (s.reminder_minutes || ' minutes')::interval
         )::time BETWEEN $1::time AND ($1::time + '1 minute'::interval)
         AND (
           s.repeat_pattern = 'daily'
           OR (s.repeat_pattern = 'weekdays' AND EXTRACT(DOW FROM NOW()) BETWEEN 1 AND 5)
           OR (s.repeat_pattern = 'weekly'   AND EXTRACT(DOW FROM NOW()) = ANY(s.repeat_days))
           OR (s.repeat_pattern = 'none'     AND s.target_date = CURRENT_DATE)
         )`,
      [nowTime]
    );

    for (const row of rows) {
      // Dedup: only send if not already sent this minute for this schedule+user
      const { rowCount } = await pool.query(
        `INSERT INTO push_notification_log (schedule_id, user_id, sent_date, sent_minute)
         VALUES ($1, $2, CURRENT_DATE, $3)
         ON CONFLICT (schedule_id, user_id, sent_date, sent_minute) DO NOTHING`,
        [row.schedule_id, row.user_id, sentMinute]
      );

      if (rowCount === 0) continue; // already sent this minute

      const streak = Number(row.streak || 0);
      const body = streak >= 3
        ? `🔥 ${streak}-day streak on the line. Don't miss it.`
        : `Time to show up for yourself today.`;

      await sendPushToUser(row.user_id, {
        title: `Time for: ${row.title}`,
        body,
        icon: '/icons/icon-192.png',
        tag: `reminder-${row.user_id}-${row.title}`,
        url: '/schedule',
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[Cron] Push reminder job error:', err.message);
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────────
async function startRun(jobName) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO cron_job_runs (job_name) VALUES ($1) RETURNING id`,
      [jobName]
    );
    return rows[0]?.id;
  } catch { return null; }
}

async function finishRun(runId, status, errorMessage, affectedRows) {
  if (!runId) return;
  try {
    await pool.query(
      `UPDATE cron_job_runs
       SET completed_at = NOW(), status = $2, error_message = $3, affected_rows = $4
       WHERE id = $1`,
      [runId, status, errorMessage, affectedRows]
    );
  } catch {}
}

console.log('[CronWorker] Jobs scheduled: weekly emails (Mon 8am), push reminders (every minute)');
