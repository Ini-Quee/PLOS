const { randomUUID } = require('crypto');
const { getActionDefinition, isBlockedBatchOrSensitiveIntent } = require('./lumiActionRegistry');
const { createPreview } = require('./lumiActionPreview');
const { logProposedActions } = require('./lumiActionAudit');
const { resolveTarget, extractDateHint, extractMoney, extractTimeHint } = require('./lumiTargetResolver');
const { validateAction } = require('./lumiActionValidator');

function lower(text) {
  return String(text || '').toLowerCase();
}

function chooseFieldUpdate(record, text) {
  const fields = record?.fields || {};
  const replace = text.match(/\b(?:say|to say|change .* to)\s+(.+)$/i);
  if (replace) {
    const key = Object.keys(fields)[0] || 'entry';
    return { ...fields, [key]: replace[1].trim() };
  }
  return fields;
}

async function classifyIntent(userId, text, context = {}) {
  const l = lower(text);
  if (isBlockedBatchOrSensitiveIntent(text)) {
    return { blocked: true, message: 'I cannot perform batch destructive or account-level changes.' };
  }

  if (/\bforget\b/.test(l)) {
    const target = await resolveTarget('memories', text, userId, context);
    return [{ type: 'forget_memory', target, payload: { memory_id: target.record?.id }, originalText: text }];
  }

  if (/\b(remove|delete|archive)\b/.test(l)) {
    if (/\b(habit|reading|workout|prayer|water|gym)\b/.test(l)) {
      const target = await resolveTarget('habits', text, userId, context);
      return [{ type: 'archive_habit', target, payload: { habit_id: target.record?.id }, originalText: text }];
    }
    if (/\b(expense|purchase|budget|coffee|food|transport|entry)\b/.test(l)) {
      const target = await resolveTarget('budget', text, userId, context);
      return [{ type: 'archive_budget_entry', target, payload: { entry_id: target.record?.id }, originalText: text }];
    }
    if (/\b(goal)\b/.test(l)) {
      const target = await resolveTarget('goals', text, userId, context);
      return [{ type: 'archive_goal', target, payload: { goal_id: target.record?.id }, originalText: text }];
    }
    const target = await resolveTarget('journals', text, userId, context);
    return [{ type: 'archive_journal_entry', target, payload: { entry_id: target.record?.id }, originalText: text }];
  }

  if (/\b(move|reschedule|change .*to .*am|change .*to .*pm)\b/.test(l) && /\b(gym|meeting|task|schedule|workout|call|appointment)\b/.test(l)) {
    const target = await resolveTarget('schedule', text, userId, context);
    const start_time = extractTimeHint(text);
    const target_date = extractDateHint(text);
    return [{
      type: 'update_schedule_item',
      target,
      payload: { schedule_id: target.record?.id, ...(start_time ? { start_time } : {}), ...(target_date ? { target_date, repeat_pattern: 'none' } : {}) },
      originalText: text,
    }];
  }

  if (/\b(was|should be|correct|change)\b/.test(l) && /\b(expense|food|budget|coffee|transport|₦|ngn)\b/i.test(text)) {
    const target = await resolveTarget('budget', text, userId, context);
    const amount = extractMoney(text);
    return [{ type: 'update_budget_entry', target, payload: { entry_id: target.record?.id, ...(amount ? { amount } : {}) }, originalText: text }];
  }

  if (/\b(edit|change|update)\b/.test(l) && /\b(journal|entry|spiritual|bible|diary)\b/.test(l)) {
    const target = await resolveTarget('journals', text, userId, context);
    return [{
      type: 'update_journal_entry',
      target,
      payload: { entry_id: target.record?.id, fields: chooseFieldUpdate(target.record, text) },
      originalText: text,
    }];
  }

  if (/\b(complete|done|finished)\b/.test(l) && /\b(goal)\b/.test(l)) {
    const target = await resolveTarget('goals', text, userId, context);
    return [{ type: 'complete_goal', target, payload: { goal_id: target.record?.id }, originalText: text }];
  }

  return {
    blocked: true,
    message: 'I need a clearer action to propose. Try naming what to edit, move, archive, correct, or forget.',
  };
}

function normalizeResolvedAction(action) {
  const def = getActionDefinition(action.type);
  const resolvedTarget = action.target?.found === true ? action.target.record : null;
  const targetSummary = resolvedTarget ? {
    id: resolvedTarget.id,
    label: resolvedTarget.title || resolvedTarget.template_name || resolvedTarget.note || resolvedTarget.content?.slice(0, 80),
    journal_type: resolvedTarget.journal_type,
    entry_date: resolvedTarget.entry_date,
  } : {};
  return {
    id: randomUUID(),
    type: action.type,
    domain: def.domain,
    operation: def.operation,
    confirmationLevel: def.confirmationLevel,
    risk: def.destructive ? 'high' : def.confirmationLevel === 'auto' ? 'low' : 'medium',
    refresh: def.refresh || [],
    target: resolvedTarget ? { id: resolvedTarget.id, record: resolvedTarget } : null,
    targetSummary,
    payload: action.payload || {},
    originalText: action.originalText || '',
  };
}

async function proposeLumiActions(userId, text, reqLike = {}, context = {}) {
  const classified = await classifyIntent(userId, text, context);
  if (classified.blocked) {
    return { success: false, blocked: true, message: classified.message, actions: [], previews: [] };
  }

  const normalized = [];
  for (const raw of classified) {
    if (raw.target?.found === 'ambiguous') {
      return {
        success: true,
        needsDisambiguation: true,
        message: raw.target.message || 'I found more than one possible match. Which one should I use?',
        candidates: raw.target.candidates,
        actions: [],
        previews: [],
      };
    }
    if (raw.target?.found === false) {
      return { success: false, message: `I could not find the item to change (${raw.target.reason}).`, actions: [], previews: [] };
    }
    const action = normalizeResolvedAction(raw);
    const validation = await validateAction(action, userId, reqLike, context);
    if (!validation.valid) {
      return { success: false, message: validation.message || validation.reason, actions: [], previews: [] };
    }
    action.warning = validation.warning;
    action.preview = createPreview(action);
    normalized.push(action);
  }

  const { proposalId, actions } = await logProposedActions(userId, normalized);
  return {
    success: true,
    proposalId,
    message: actions.length ? 'I found the change. Please review before I apply it.' : 'No actions proposed.',
    actions: actions.map(({ target, originalText, ...a }) => a),
    previews: actions.map((a) => a.preview),
    needsConfirmation: true,
  };
}

module.exports = {
  classifyIntent,
  proposeLumiActions,
};
