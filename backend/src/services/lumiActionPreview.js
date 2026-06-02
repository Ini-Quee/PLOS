function clip(value, max = 260) {
  if (value === undefined || value === null) return value;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function summarizeRecord(record = {}) {
  if (!record) return null;
  return {
    id: record.id,
    title: record.title,
    journal_type: record.journal_type,
    template_name: record.template_name,
    entry_date: record.entry_date,
    category: record.category,
    note: record.note,
    amount: record.amount,
    currency: record.currency,
    content: clip(record.content || record.fields || record.description || record.user_message),
  };
}

function diffPreview(before, after, message) {
  return {
    type: 'diff',
    message,
    before: summarizeRecord(before),
    after: summarizeRecord({ ...before, ...after }),
  };
}

function createPreview(action) {
  const payload = action.payload || {};
  const target = action.target?.record || null;
  switch (action.type) {
    case 'create_journal_entry':
      return { type: 'create', message: `Create ${payload.template_name} in ${payload.journal_type}.`, after: summarizeRecord(payload) };
    case 'append_journal_entry':
      return { type: 'diff', message: 'Append these fields to the journal page.', before: summarizeRecord(target), after: summarizeRecord({ ...target, fields: { ...(target?.fields || {}), ...payload.fields } }) };
    case 'update_journal_entry':
      return { type: 'diff', message: 'Update this journal page.', before: summarizeRecord(target), after: summarizeRecord({ ...target, fields: payload.fields }) };
    case 'archive_journal_entry':
      return { type: 'archive', message: `Archive ${target?.journal_type}/${target?.template_name} from ${target?.entry_date}.`, target: summarizeRecord(target) };
    case 'create_schedule_item':
      return { type: 'create', message: `Add "${payload.title}" to the planner.`, after: summarizeRecord(payload) };
    case 'update_schedule_item':
      return diffPreview(target, payload, `Update "${target?.title || 'schedule item'}".`);
    case 'archive_schedule_item':
      return { type: 'archive', message: `Archive "${target?.title}".`, target: summarizeRecord(target) };
    case 'create_habit':
      return { type: 'create', message: `Create habit "${payload.title}".`, after: summarizeRecord(payload) };
    case 'update_habit':
      return diffPreview(target, payload, `Update habit "${target?.title || 'habit'}".`);
    case 'archive_habit':
      return { type: 'archive', message: `Archive habit "${target?.title}".`, target: summarizeRecord(target) };
    case 'create_budget_entry':
      return { type: 'create', message: `Log ${payload.currency || '₦'}${Number(payload.amount).toLocaleString('en-NG')} ${payload.type || 'expense'}.`, after: summarizeRecord(payload) };
    case 'update_budget_entry':
      return diffPreview(target, payload, 'Correct this budget entry.');
    case 'archive_budget_entry':
      return { type: 'archive', message: `Archive ${target?.currency || '₦'}${Number(target?.amount || 0).toLocaleString('en-NG')} ${target?.category || 'entry'}.`, target: summarizeRecord(target) };
    case 'create_goal':
      return { type: 'create', message: `Create goal "${payload.title}".`, after: summarizeRecord(payload) };
    case 'update_goal':
    case 'complete_goal':
      return diffPreview(target, payload, `Update goal "${target?.title || 'goal'}".`);
    case 'archive_goal':
      return { type: 'archive', message: `Archive goal "${target?.title}".`, target: summarizeRecord(target) };
    case 'create_memory':
      return { type: 'create', message: 'Save this as a Lumi memory.', after: { content: clip(payload.content), memory_type: payload.memory_type || 'fact' } };
    case 'update_memory':
      return { type: 'diff', message: 'Update this Lumi memory.', before: summarizeRecord(target), after: summarizeRecord({ ...target, ...payload }) };
    case 'forget_memory':
      return { type: 'archive', message: `Forget: "${clip(target?.content, 120)}"`, target: summarizeRecord(target) };
    default:
      return { type: 'notice', message: 'This action needs confirmation.' };
  }
}

function redactPreview(preview = {}) {
  return {
    type: preview.type,
    message: clip(preview.message, 180),
    before: preview.before ? { ...preview.before, content: clip(preview.before.content, 120) } : undefined,
    after: preview.after ? { ...preview.after, content: clip(preview.after.content, 120) } : undefined,
    target: preview.target ? { ...preview.target, content: clip(preview.target.content, 120) } : undefined,
  };
}

module.exports = {
  clip,
  createPreview,
  redactPreview,
  summarizeRecord,
};
