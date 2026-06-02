const { pool } = require('../db/connection');

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextWeekdayIso(dayName) {
  const names = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const wanted = names.findIndex((name) => dayName.toLowerCase().startsWith(name));
  if (wanted < 0) return null;
  const d = new Date();
  const diff = (wanted - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function extractDateHint(text = '') {
  if (/\byesterday\b/i.test(text)) return yesterdayIso();
  if (/\btoday|this morning|this afternoon|tonight\b/i.test(text)) return todayIso();
  const weekday = text.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/i);
  if (weekday) return nextWeekdayIso(weekday[1]);
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return iso ? iso[1] : null;
}

function extractTimeHint(text = '') {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2] || '00';
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${minute}:00`;
}

function extractMoney(text = '') {
  const match = text.match(/(?:₦|NGN|N)?\s*([0-9][0-9,]*(?:\.\d+)?)/i);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ''));
}

function extractJournalTypeHint(text = '', customTypes = []) {
  const lower = text.toLowerCase();
  const builtIns = [
    ['spiritual', ['spiritual', 'bible', 'faith', 'devotion']],
    ['budget', ['budget', 'money', 'financial', 'expense']],
    ['wellness', ['wellness', 'health', 'mood', 'sleep', 'fitness']],
    ['goals', ['goal', 'vision']],
    ['business', ['business', 'client', 'startup', 'content']],
    ['personal', ['personal', 'daily', 'diary', 'journal']],
  ];
  for (const [type, words] of builtIns) {
    if (words.some((word) => lower.includes(word))) return type;
  }
  for (const custom of customTypes || []) {
    const hay = [custom.type_key, custom.label, ...(custom.routing_keywords || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (hay && hay.split(/\s+/).some((word) => word.length > 2 && lower.includes(word))) {
      return custom.type_key;
    }
  }
  return null;
}

function extractContentHint(text = '') {
  const about = text.match(/\b(?:about|for|called|named)\s+["']?([^"'.]+)["']?/i);
  if (about) return about[1].trim();
  const quoted = text.match(/["']([^"']{3,80})["']/);
  if (quoted) return quoted[1].trim();
  return null;
}

function targetHint(text = '', stopWords = []) {
  const cleaned = text
    .replace(/₦?\s*[0-9][0-9,]*(?:\.\d+)?/g, ' ')
    .replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat|today|tomorrow|yesterday)\b/gi, ' ')
    .replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, ' ')
    .replace(/\b(to|at|on|from|my|the|that|this|a|an)\b/gi, ' ');
  const words = cleaned
    .split(/\s+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 2 && !stopWords.includes(word));
  return words[0] || '';
}

function ambiguous(rows, labeler) {
  return {
    found: 'ambiguous',
    candidates: rows.map(labeler),
    reason: 'multiple_matches',
  };
}

async function resolveJournalEntry(reference, userId, context = {}) {
  const customTypes = context.customJournalTypes || context.lifeContext?.customJournalTypes || [];
  const typeHint = extractJournalTypeHint(reference, customTypes);
  const dateHint = extractDateHint(reference);
  const contentHint = extractContentHint(reference);

  const conditions = ['user_id=$1', 'archived_at IS NULL'];
  const params = [userId];
  let i = 2;
  if (typeHint) { conditions.push(`journal_type=$${i++}`); params.push(typeHint); }
  if (dateHint) { conditions.push(`entry_date=$${i++}`); params.push(dateHint); }
  if (contentHint) { conditions.push(`fields::text ILIKE $${i++}`); params.push(`%${contentHint}%`); }

  const { rows } = await pool.query(
    `SELECT id, journal_type, template_name, entry_date, fields, source, updated_at
       FROM journal_page_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY entry_date DESC, updated_at DESC
      LIMIT 5`,
    params
  ).catch(() => ({ rows: [] }));

  if (!rows.length) return { found: false, reason: 'no_matching_journal_entry' };
  if (rows.length === 1 || /\blast|latest|most recent\b/i.test(reference)) {
    return { found: true, record: rows[0], confidence: rows.length === 1 ? 0.9 : 0.75 };
  }
  return ambiguous(rows, (row) => ({
    id: row.id,
    label: `${row.entry_date} - ${row.journal_type}/${row.template_name}`,
    snippet: JSON.stringify(row.fields || {}).slice(0, 160),
  }));
}

async function resolveScheduleItem(reference, userId) {
  const contentHint = extractContentHint(reference) || targetHint(reference, ['move', 'reschedule', 'delete', 'remove', 'archive', 'complete', 'mark', 'schedule', 'task', 'change']);
  const dateHint = extractDateHint(reference);
  const params = [userId, `%${contentHint || ''}%`];
  const dateClause = dateHint ? 'AND (target_date=$3 OR repeat_pattern != \'none\')' : '';
  if (dateHint) params.push(dateHint);
  const { rows } = await pool.query(
    `SELECT * FROM schedules
      WHERE user_id=$1 AND is_active=true AND ($2='%%' OR title ILIKE $2 OR description ILIKE $2)
      ${dateClause}
      ORDER BY target_date DESC NULLS LAST, start_time ASC
      LIMIT 5`,
    params
  ).catch(() => ({ rows: [] }));
  if (!rows.length) return { found: false, reason: 'no_matching_schedule_item' };
  if (rows.length === 1) return { found: true, record: rows[0], confidence: 0.85 };
  return ambiguous(rows, (row) => ({ id: row.id, label: `${row.title} at ${String(row.start_time).slice(0, 5)}`, snippet: row.description || '' }));
}

async function resolveHabit(reference, userId) {
  const hint = extractContentHint(reference) || targetHint(reference, ['remove', 'delete', 'archive', 'complete', 'mark', 'habit']);
  const { rows } = await pool.query(
    `SELECT * FROM habits
      WHERE user_id=$1 AND is_active=true AND ($2='%%' OR title ILIKE $2 OR category ILIKE $2)
      ORDER BY created_at DESC LIMIT 5`,
    [userId, `%${hint || ''}%`]
  ).catch(() => ({ rows: [] }));
  if (!rows.length) return { found: false, reason: 'no_matching_habit' };
  if (rows.length === 1) return { found: true, record: rows[0], confidence: 0.85 };
  return ambiguous(rows, (row) => ({ id: row.id, label: row.title, snippet: row.category || '' }));
}

async function resolveBudgetEntry(reference, userId) {
  const dateHint = extractDateHint(reference);
  const hint = extractContentHint(reference) || targetHint(reference, ['delete', 'remove', 'archive', 'expense', 'entry', 'purchase', 'correct', 'change', 'was', 'should']);
  const conditions = ['user_id=$1', 'archived_at IS NULL'];
  const params = [userId];
  let i = 2;
  if (dateHint) { conditions.push(`entry_date=$${i++}`); params.push(dateHint); }
  if (hint) { conditions.push(`(note ILIKE $${i} OR category ILIKE $${i})`); params.push(`%${hint}%`); i++; }
  const { rows } = await pool.query(
    `SELECT * FROM budget_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY entry_date DESC, created_at DESC LIMIT 5`,
    params
  ).catch(() => ({ rows: [] }));
  if (!rows.length) return { found: false, reason: 'no_matching_budget_entry' };
  if (rows.length === 1 || /\bthat\b/i.test(reference)) return { found: true, record: rows[0], confidence: rows.length === 1 ? 0.9 : 0.7 };
  return ambiguous(rows, (row) => ({
    id: row.id,
    label: `${row.currency || '₦'}${Number(row.amount).toLocaleString('en-NG')} - ${row.category}`,
    snippet: `${row.note || ''} (${row.entry_date})`,
  }));
}

async function resolveGoal(reference, userId) {
  const hint = extractContentHint(reference) || targetHint(reference, ['remove', 'delete', 'archive', 'goal', 'complete', 'update']);
  const { rows } = await pool.query(
    `SELECT * FROM year_goals
      WHERE user_id=$1 AND archived_at IS NULL AND ($2='%%' OR title ILIKE $2 OR description ILIKE $2)
      ORDER BY updated_at DESC LIMIT 5`,
    [userId, `%${hint || ''}%`]
  ).catch(() => ({ rows: [] }));
  if (!rows.length) return { found: false, reason: 'no_matching_goal' };
  if (rows.length === 1) return { found: true, record: rows[0], confidence: 0.85 };
  return ambiguous(rows, (row) => ({ id: row.id, label: row.title, snippet: row.description || '' }));
}

async function resolveMemory(reference, userId) {
  const hint = extractContentHint(reference) || targetHint(reference, ['forget', 'memory', 'remember']);
  const { rows } = await pool.query(
    `SELECT id, memory_type, memory_category, content, importance, updated_at
       FROM lumi_memories
      WHERE user_id=$1 AND ($2='%%' OR content ILIKE $2 OR memory_type ILIKE $2 OR memory_category ILIKE $2)
      ORDER BY importance DESC, updated_at DESC LIMIT 5`,
    [userId, `%${hint || ''}%`]
  ).catch(() => ({ rows: [] }));
  if (!rows.length) return { found: false, reason: 'no_matching_memory' };
  if (rows.length === 1) return { found: true, record: rows[0], confidence: 0.85 };
  return ambiguous(rows, (row) => ({ id: row.id, label: `[${row.memory_type}] ${row.content.slice(0, 80)}`, snippet: row.content }));
}

async function resolveTarget(domain, reference, userId, context = {}) {
  switch (domain) {
    case 'journals': return resolveJournalEntry(reference, userId, context);
    case 'schedule': return resolveScheduleItem(reference, userId, context);
    case 'habits': return resolveHabit(reference, userId, context);
    case 'budget': return resolveBudgetEntry(reference, userId, context);
    case 'goals': return resolveGoal(reference, userId, context);
    case 'memories': return resolveMemory(reference, userId, context);
    default: return { found: false, reason: 'unsupported_domain' };
  }
}

module.exports = {
  extractDateHint,
  extractJournalTypeHint,
  extractMoney,
  extractTimeHint,
  nextWeekdayIso,
  resolveTarget,
  targetHint,
};
