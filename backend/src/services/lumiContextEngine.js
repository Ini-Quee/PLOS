const { pool } = require('../db/connection');
const { surfaceRelevantMemories } = require('./lumiMemorySurface');

function toDays(timeframe) {
  if (timeframe === '1day') return 1;
  if (timeframe === '7days') return 7;
  if (timeframe === '30days') return 30;
  const match = String(timeframe || '').match(/^(\d+)/);
  return match ? Math.max(1, Math.min(90, Number(match[1]))) : 30;
}

function money(value) {
  return `₦${Number(value || 0).toLocaleString('en-NG')}`;
}

const logger = require('../lib/logger');
async function getUserLifeContext(userId, timeframe = '30days', opts = {}) {
  const days = toDays(timeframe);
  const today = new Date().toISOString().slice(0, 10);
  const dow = new Date().getDay();

  const [
    schedule,
    scheduleCompletions,
    habits,
    budgetToday,
    budgetWindow,
    journalPages,
    journalEntries,
    recentLogs,
    customJournals,
    goals,
    contacts,
    books,
    projects,
  ] = await Promise.all([
    pool.query(
      `SELECT id, title, start_time, duration_minutes, category, repeat_pattern, repeat_days, target_date
         FROM schedules
        WHERE user_id=$1 AND is_active=true
          AND (repeat_pattern='daily'
            OR (repeat_pattern='weekdays' AND $3 BETWEEN 1 AND 5)
            OR (repeat_pattern IN ('weekly','custom') AND $3 = ANY(repeat_days))
            OR (repeat_pattern='none' AND target_date=$2))
        ORDER BY start_time LIMIT 12`,
      [userId, today, dow]
    ).catch((e) => { logger.error({ where: 'ctx.schedule', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT schedule_id, completion_date
         FROM schedule_completions
        WHERE user_id=$1 AND completion_date >= CURRENT_DATE - ($2::int - 1)`,
      [userId, days]
    ).catch((e) => { logger.error({ where: 'ctx.scheduleCompletions', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT h.id, h.title, h.category, h.target_days, h.is_active,
              MAX(hc.completion_date) AS last_completed,
              COUNT(hc.id) FILTER (WHERE hc.completion_date >= CURRENT_DATE - ($2::int - 1)) AS completions
         FROM habits h
         LEFT JOIN habit_completions hc ON hc.habit_id = h.id
        WHERE h.user_id=$1 AND h.is_active=true
        GROUP BY h.id
        ORDER BY h.created_at DESC LIMIT 20`,
      [userId, days]
    ).catch((e) => { logger.error({ where: 'ctx.habits', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT amount, currency, category, note, type
         FROM budget_entries
        WHERE user_id=$1 AND entry_date=CURRENT_DATE
          AND archived_at IS NULL
        ORDER BY created_at DESC LIMIT 10`,
      [userId]
    ).catch((e) => { logger.error({ where: 'ctx.budgetToday', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT category, type, COUNT(*) AS count, SUM(amount) AS total
         FROM budget_entries
        WHERE user_id=$1 AND entry_date >= CURRENT_DATE - ($2::int - 1)
          AND archived_at IS NULL
        GROUP BY category, type
        ORDER BY total DESC LIMIT 12`,
      [userId, days]
    ).catch((e) => { logger.error({ where: 'ctx.budgetWindow', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT journal_type, template_name, fields, source, entry_date, updated_at
         FROM journal_page_entries
        WHERE user_id=$1 AND entry_date >= CURRENT_DATE - ($2::int - 1)
          AND archived_at IS NULL
        ORDER BY entry_date DESC, updated_at DESC LIMIT 25`,
      [userId, days]
    ).catch((e) => { logger.error({ where: 'ctx.journalPages', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT recorded_at
         FROM journal_entries
        WHERE user_id=$1
        ORDER BY recorded_at DESC LIMIT 1`,
      [userId]
    ).catch((e) => { logger.error({ where: 'ctx.journalEntries', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT route, user_message, created_at
         FROM lumi_conversations
        WHERE user_id=$1 AND saved_data IS NOT NULL
        ORDER BY created_at DESC LIMIT 8`,
      [userId]
    ).catch((e) => { logger.error({ where: 'ctx.recentLogs', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT type_key, label, routing_keywords, templates
         FROM user_journal_types
        WHERE user_id=$1 AND is_active=true AND archived_at IS NULL
        ORDER BY display_order`,
      [userId]
    ).catch((e) => { logger.error({ where: 'ctx.customJournals', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT id, title, progress_percentage, is_completed, milestone_emoji
         FROM year_goals
        WHERE user_id=$1 AND year=$2 AND archived_at IS NULL
        ORDER BY display_order ASC LIMIT 20`,
      [userId, new Date().getFullYear()]
    ).catch((e) => { logger.error({ where: 'ctx.goals', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT id, name, email, category, notes, last_contacted
         FROM contacts WHERE user_id=$1
        ORDER BY name LIMIT 50`,
      [userId]
    ).catch((e) => { logger.error({ where: 'ctx.contacts', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT title, author, is_complete, pages_read, total_pages, notes
         FROM books WHERE user_id=$1
        ORDER BY updated_at DESC LIMIT 20`,
      [userId]
    ).catch((e) => { logger.error({ where: 'ctx.books', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
    pool.query(
      `SELECT id, name, status, description, progress_percent, target_date
         FROM projects WHERE user_id=$1 AND status <> 'archived'
        ORDER BY updated_at DESC LIMIT 10`,
      [userId]
    ).catch((e) => { logger.error({ where: 'ctx.projects', userId, err: e.message }, 'query failed'); return { rows: [] }; }),
  ]);

  const memories = await surfaceRelevantMemories(userId, opts.userInput || '', opts, 12).catch((e) => { logger.error({ where: 'ctx.memories', userId, err: e.message }, 'query failed'); return []; });

  return {
    timeframe,
    days,
    scheduleToday: schedule.rows,
    scheduleCompletions: scheduleCompletions.rows,
    habits: habits.rows,
    budgetToday: budgetToday.rows,
    budgetWindow: budgetWindow.rows,
    journalPages: journalPages.rows,
    journalEntries: journalEntries.rows,
    recentLogs: recentLogs.rows,
    customJournalTypes: customJournals.rows,
    goals: goals.rows,
    contacts: contacts.rows,
    books: books.rows,
    projects: projects.rows,
    persistentMemories: memories,
  };
}

function formatLegacyContext(lifeContext) {
  const ctx = {
    scheduleSummary: 'No tasks today',
    habitSummary: 'No habits tracked',
    budgetToday: 'No expenses yet today',
    budgetSummary: 'No expenses this month',
    recentLogs: 'No recent activity',
    journalSummary: 'No journal entries',
    journalPagesToday: 'None yet',
    customJournalTypes: lifeContext.customJournalTypes || [],
    persistentMemories: lifeContext.persistentMemories || [],
    lifeContext,
  };

  if (lifeContext.scheduleToday?.length) {
    ctx.scheduleSummary = lifeContext.scheduleToday
      .slice(0, 5)
      .map(r => `${r.title} at ${String(r.start_time).slice(0, 5)}`)
      .join(', ');
  }

  if (lifeContext.habits?.length) {
    const done = lifeContext.habits.filter(h => Number(h.completions || 0) > 0).length;
    ctx.habitSummary = `${done} of ${lifeContext.habits.length} active habits touched in this window`;
  }

  if (lifeContext.budgetToday?.length) {
    ctx.budgetToday = lifeContext.budgetToday
      .map(r => `${r.type === 'income' ? '+' : '-'}${r.currency || '₦'}${Number(r.amount).toLocaleString('en-NG')} ${r.category}${r.note ? ` (${r.note})` : ''}`)
      .join('; ');
  }

  const monthSpend = (lifeContext.budgetWindow || []).filter(r => r.type === 'expense');
  if (monthSpend.length) {
    ctx.budgetSummary = monthSpend.map(r => `${r.category}: ${money(r.total)}`).join(', ');
  }

  if (lifeContext.recentLogs?.length) {
    ctx.recentLogs = lifeContext.recentLogs.map(r => `[${r.route}] ${String(r.user_message || '').slice(0, 60)}`).join(' | ');
  }

  if (lifeContext.journalPages?.length) {
    const latest = lifeContext.journalPages[0];
    ctx.journalSummary = `Last journal page: ${latest.journal_type}/${latest.template_name}`;
    ctx.journalPagesToday = lifeContext.journalPages
      .filter(r => String(r.entry_date).slice(0, 10) === new Date().toISOString().slice(0, 10))
      .map(r => `${r.journal_type}/${r.template_name}: ${Object.keys(r.fields || {}).join(', ')}`)
      .join(' | ') || 'None yet';
  } else if (lifeContext.journalEntries?.length) {
    const days = Math.floor((Date.now() - new Date(lifeContext.journalEntries[0].recorded_at)) / 86400000);
    ctx.journalSummary = days === 0 ? 'Wrote in journal today' : `Last journal entry ${days} day${days > 1 ? 's' : ''} ago`;
  }

  return ctx;
}

module.exports = {
  formatLegacyContext,
  getUserLifeContext,
  toDays,
};
