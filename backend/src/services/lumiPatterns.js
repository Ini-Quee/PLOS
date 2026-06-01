const { pool } = require('../db/connection');
const { buildPatternMessage } = require('./lumiVoiceRules');

const MIN_CONFIDENCE = 0.7;
const MIN_EVIDENCE = 3;
const MAX_SURFACED_PER_DAY = 2;

function makePattern(type, title, description, evidence, confidence, priority) {
  return {
    pattern_type: type,
    pattern_title: title,
    pattern_description: description,
    evidence,
    confidence,
    priority,
  };
}

function detectStuckTaskFromRows(rows = []) {
  return rows
    .filter(row => Number(row.missed_count || 0) >= MIN_EVIDENCE)
    .map(row => makePattern(
      'stuck_task',
      row.title,
      `"${row.title}" has stayed incomplete repeatedly.`,
      { taskId: row.id, taskTitle: row.title, count: Number(row.missed_count || 0) },
      Math.min(0.95, 0.55 + Number(row.missed_count || 0) * 0.08),
      7
    ))
    .filter(pattern => pattern.confidence >= MIN_CONFIDENCE);
}

function detectHabitGapFromRows(rows = []) {
  return rows
    .filter(row => Number(row.days_since_completion || 999) >= 3)
    .map(row => makePattern(
      'habit_gap',
      row.title,
      `"${row.title}" has not been tracked for ${row.days_since_completion} days.`,
      { habitId: row.id, habitTitle: row.title, days: Number(row.days_since_completion) },
      Math.min(0.95, 0.65 + Number(row.days_since_completion) * 0.05),
      6
    ))
    .filter(pattern => pattern.confidence >= MIN_CONFIDENCE);
}

function detectBudgetSpikeFromRows(rows = []) {
  return rows
    .filter(row => Number(row.current_total || 0) > 0 && Number(row.baseline_avg || 0) > 0)
    .filter(row => Number(row.tx_count || 0) >= MIN_EVIDENCE)
    .filter(row => Number(row.current_total) >= Number(row.baseline_avg) * 1.25)
    .map(row => {
      const ratio = Number(row.current_total) / Number(row.baseline_avg);
      return makePattern(
        'budget_spike',
        row.category,
        `${row.category} spending is higher than usual.`,
        {
          category: row.category,
          currentTotal: Number(row.current_total),
          baselineAverage: Number(row.baseline_avg),
          count: Number(row.tx_count),
          ratio,
        },
        Math.min(0.95, 0.7 + Math.min(0.25, (ratio - 1.25) / 2)),
        7
      );
    })
    .filter(pattern => pattern.confidence >= MIN_CONFIDENCE);
}

async function detectPatterns(userId) {
  const [stuckRows, habitRows, budgetRows] = await Promise.all([
    pool.query(
      `WITH days AS (
          SELECT generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day')::date AS day
        ),
        eligible AS (
          SELECT s.id, s.title, d.day
            FROM schedules s
            JOIN days d ON (
              s.repeat_pattern='daily'
              OR (s.repeat_pattern='weekdays' AND EXTRACT(DOW FROM d.day) BETWEEN 1 AND 5)
              OR (s.repeat_pattern IN ('weekly','custom') AND EXTRACT(DOW FROM d.day)::int = ANY(s.repeat_days))
              OR (s.repeat_pattern='none' AND s.target_date=d.day)
            )
           WHERE s.user_id=$1 AND s.is_active=true
        )
        SELECT e.id, e.title, COUNT(*)::int AS missed_count
          FROM eligible e
          LEFT JOIN schedule_completions sc
            ON sc.schedule_id=e.id AND sc.completion_date=e.day
         WHERE sc.id IS NULL AND e.day < CURRENT_DATE
         GROUP BY e.id, e.title
         HAVING COUNT(*) >= 3
         LIMIT 10`,
      [userId]
    ).catch(() => ({ rows: [] })),
    pool.query(
      `SELECT h.id, h.title,
              COALESCE((CURRENT_DATE - MAX(hc.completion_date))::int, 999) AS days_since_completion
         FROM habits h
         LEFT JOIN habit_completions hc ON hc.habit_id=h.id
        WHERE h.user_id=$1 AND h.is_active=true
        GROUP BY h.id, h.title
        LIMIT 20`,
      [userId]
    ).catch(() => ({ rows: [] })),
    pool.query(
      `WITH current_week AS (
          SELECT category, SUM(amount) AS current_total, COUNT(*) AS tx_count
            FROM budget_entries
           WHERE user_id=$1 AND type='expense'
             AND entry_date >= CURRENT_DATE - 6
           GROUP BY category
        ),
        baseline AS (
          SELECT category, SUM(amount) / 3.0 AS baseline_avg
            FROM budget_entries
           WHERE user_id=$1 AND type='expense'
             AND entry_date >= CURRENT_DATE - 27
             AND entry_date < CURRENT_DATE - 6
           GROUP BY category
        )
        SELECT cw.category, cw.current_total, cw.tx_count, b.baseline_avg
          FROM current_week cw
          JOIN baseline b ON b.category=cw.category`,
      [userId]
    ).catch(() => ({ rows: [] })),
  ]);

  return [
    ...detectStuckTaskFromRows(stuckRows.rows),
    ...detectHabitGapFromRows(habitRows.rows),
    ...detectBudgetSpikeFromRows(budgetRows.rows),
  ].sort((a, b) => b.priority - a.priority);
}

async function upsertDetectedPatterns(userId, patterns = []) {
  for (const pattern of patterns) {
    await pool.query(
      `INSERT INTO lumi_detected_patterns
         (user_id, pattern_type, pattern_title, pattern_description, evidence, confidence, priority)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)
       ON CONFLICT (user_id, pattern_type, pattern_title)
       DO UPDATE SET
         pattern_description = EXCLUDED.pattern_description,
         evidence = EXCLUDED.evidence,
         confidence = EXCLUDED.confidence,
         priority = EXCLUDED.priority,
         updated_at = NOW()`,
      [
        userId,
        pattern.pattern_type,
        pattern.pattern_title,
        pattern.pattern_description,
        JSON.stringify(pattern.evidence || {}),
        pattern.confidence,
        pattern.priority,
      ]
    ).catch(() => {});
  }
}

function shouldSurfacePattern(pattern, userContext = {}) {
  if (!pattern) return false;
  if (Number(pattern.confidence || 0) < MIN_CONFIDENCE) return false;
  const evidence = pattern.evidence || {};
  const count = Number(evidence.count || evidence.days || evidence.tx_count || 0);
  if (count < MIN_EVIDENCE && pattern.pattern_type !== 'budget_spike') return false;
  if (userContext.emotionalContext?.crisis) return false;
  if (userContext.emotionalContext?.primaryEmotion === 'exhaustion' && userContext.emotionalContext?.intensity >= 4) return false;
  return true;
}

async function getCheckInForUser(userId, userContext = {}) {
  const surfacedToday = await pool.query(
    `SELECT COUNT(*)::int AS count
       FROM lumi_detected_patterns
      WHERE user_id=$1 AND surfaced_at >= CURRENT_DATE`,
    [userId]
  ).catch(() => ({ rows: [{ count: 0 }] }));
  if (Number(surfacedToday.rows[0]?.count || 0) >= MAX_SURFACED_PER_DAY) {
    return { hasCheckIn: false, message: null, pattern: null };
  }

  const freshPatterns = await detectPatterns(userId);
  await upsertDetectedPatterns(userId, freshPatterns);

  const { rows } = await pool.query(
    `SELECT *
       FROM lumi_detected_patterns
      WHERE user_id=$1
        AND surfaced=false
        AND confidence >= $2
      ORDER BY priority DESC, confidence DESC, updated_at DESC
      LIMIT 5`,
    [userId, MIN_CONFIDENCE]
  ).catch(() => ({ rows: [] }));

  const pattern = rows.find(row => shouldSurfacePattern(row, userContext));
  if (!pattern) return { hasCheckIn: false, message: null, pattern: null };

  await pool.query(
    `UPDATE lumi_detected_patterns
        SET surfaced=true, surfaced_at=NOW()
      WHERE id=$1 AND user_id=$2`,
    [pattern.id, userId]
  ).catch(() => {});

  return {
    hasCheckIn: true,
    message: buildPatternMessage(pattern),
    pattern,
  };
}

module.exports = {
  detectBudgetSpikeFromRows,
  detectHabitGapFromRows,
  detectPatterns,
  detectStuckTaskFromRows,
  getCheckInForUser,
  shouldSurfacePattern,
  upsertDetectedPatterns,
};
