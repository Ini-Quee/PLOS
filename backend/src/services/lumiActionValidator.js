const { FREE_LIMITS, isPro } = require('../middleware/checkTier');
const { getActionDefinition, isBlockedBatchOrSensitiveIntent } = require('./lumiActionRegistry');

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function assertPositiveAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function validateTime(value) {
  return !value || /^\d{2}:\d{2}(:\d{2})?$/.test(String(value));
}

function validateDate(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

function findScheduleConflict(context = {}, payload = {}, targetId = null) {
  const life = context.lifeContext || {};
  const rows = life.scheduleToday || [];
  const start = String(payload.start_time || '').slice(0, 5);
  if (!start) return null;
  return rows.find((row) => {
    if (targetId && row.id === targetId) return false;
    return String(row.start_time || '').slice(0, 5) === start;
  }) || null;
}

async function validateAction(action, userId, reqLike = {}, context = {}) {
  const def = getActionDefinition(action.type);
  if (!def) {
    return { valid: false, reason: 'unknown_action', message: `Lumi cannot perform "${action.type}".` };
  }

  if (isBlockedBatchOrSensitiveIntent(action.originalText || '')) {
    return {
      valid: false,
      reason: 'blocked_sensitive_or_batch_intent',
      message: 'I cannot perform batch destructive or account-level changes. Please use the app screen for that.',
    };
  }

  const payload = action.payload || {};
  for (const field of def.required || []) {
    if (isMissing(payload[field])) {
      return { valid: false, reason: 'missing_required_field', message: `Missing required field: ${field}` };
    }
  }

  if (def.requiresTarget && !action.target?.id) {
    return { valid: false, reason: 'missing_target', message: 'I need to know exactly which item to change first.' };
  }

  if (def.domain === 'journals') {
    const journalType = payload.journal_type || action.target?.journal_type;
    if (journalType && !isPro(reqLike) && !FREE_LIMITS.journal_types.includes(journalType)) {
      return {
        valid: false,
        reason: 'tier_restricted_journal',
        message: `Free accounts can only use the ${FREE_LIMITS.journal_types.join(', ')} journal.`,
      };
    }
    if (payload.fields && (typeof payload.fields !== 'object' || Array.isArray(payload.fields))) {
      return { valid: false, reason: 'invalid_fields', message: 'Journal fields must be an object.' };
    }
  }

  if (def.domain === 'schedule') {
    if (!validateTime(payload.start_time)) {
      return { valid: false, reason: 'invalid_time', message: 'Schedule time must use HH:MM format.' };
    }
    if (!validateDate(payload.target_date)) {
      return { valid: false, reason: 'invalid_date', message: 'Schedule date must use YYYY-MM-DD format.' };
    }
    const conflict = findScheduleConflict(context, payload, action.target?.id);
    if (conflict) {
      action.warning = `This overlaps with "${conflict.title}" at ${String(conflict.start_time).slice(0, 5)}.`;
    }
  }

  if (def.domain === 'budget') {
    if (payload.amount !== undefined && !assertPositiveAmount(payload.amount)) {
      return { valid: false, reason: 'invalid_amount', message: 'Budget amount must be greater than zero.' };
    }
    if (payload.entry_date && !validateDate(payload.entry_date)) {
      return { valid: false, reason: 'invalid_date', message: 'Budget date must use YYYY-MM-DD format.' };
    }
  }

  if (def.domain === 'goals') {
    if (payload.progress_percentage !== undefined) {
      const pct = Number(payload.progress_percentage);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return { valid: false, reason: 'invalid_progress', message: 'Goal progress must be between 0 and 100.' };
      }
    }
  }

  return {
    valid: true,
    definition: def,
    confirmationLevel: def.confirmationLevel,
    warning: action.warning || null,
  };
}

module.exports = {
  assertPositiveAmount,
  validateAction,
};
