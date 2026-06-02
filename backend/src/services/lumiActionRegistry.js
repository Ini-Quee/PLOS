const CONFIRMATION = {
  AUTO: 'auto',
  PREVIEW: 'preview',
  EXPLICIT: 'explicit',
};

const registry = {
  create_journal_entry: {
    domain: 'journals', operation: 'create', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['journal_type', 'template_name', 'fields'], refresh: ['journal'],
  },
  append_journal_entry: {
    domain: 'journals', operation: 'append', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['entry_id', 'fields'], requiresTarget: true, refresh: ['journal'],
  },
  update_journal_entry: {
    domain: 'journals', operation: 'update', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['entry_id', 'fields'], requiresTarget: true, refresh: ['journal'],
  },
  archive_journal_entry: {
    domain: 'journals', operation: 'archive', confirmationLevel: CONFIRMATION.EXPLICIT,
    required: ['entry_id'], requiresTarget: true, destructive: true, refresh: ['journal'],
  },
  update_journal_type: {
    domain: 'journals', operation: 'update_type', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['journal_type_id'], requiresTarget: true, refresh: ['journal'],
  },
  archive_journal_type: {
    domain: 'journals', operation: 'archive_type', confirmationLevel: CONFIRMATION.EXPLICIT,
    required: ['journal_type_id'], requiresTarget: true, destructive: true, refresh: ['journal'],
  },

  create_schedule_item: {
    domain: 'schedule', operation: 'create', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['title', 'start_time'], refresh: ['schedule'],
  },
  update_schedule_item: {
    domain: 'schedule', operation: 'update', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['schedule_id'], requiresTarget: true, refresh: ['schedule'],
  },
  complete_schedule_item: {
    domain: 'schedule', operation: 'complete', confirmationLevel: CONFIRMATION.AUTO,
    required: ['schedule_id'], requiresTarget: true, refresh: ['schedule'],
  },
  uncomplete_schedule_item: {
    domain: 'schedule', operation: 'uncomplete', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['schedule_id'], requiresTarget: true, refresh: ['schedule'],
  },
  archive_schedule_item: {
    domain: 'schedule', operation: 'archive', confirmationLevel: CONFIRMATION.EXPLICIT,
    required: ['schedule_id'], requiresTarget: true, destructive: true, refresh: ['schedule'],
  },

  create_habit: {
    domain: 'habits', operation: 'create', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['title'], refresh: ['habits'],
  },
  update_habit: {
    domain: 'habits', operation: 'update', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['habit_id'], requiresTarget: true, refresh: ['habits'],
  },
  log_habit_completion: {
    domain: 'habits', operation: 'complete', confirmationLevel: CONFIRMATION.AUTO,
    required: ['habit_id'], requiresTarget: true, refresh: ['habits'],
  },
  undo_habit_completion: {
    domain: 'habits', operation: 'uncomplete', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['habit_id'], requiresTarget: true, refresh: ['habits'],
  },
  revive_habit: {
    domain: 'habits', operation: 'revive', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['habit_id'], requiresTarget: true, refresh: ['habits'],
  },
  archive_habit: {
    domain: 'habits', operation: 'archive', confirmationLevel: CONFIRMATION.EXPLICIT,
    required: ['habit_id'], requiresTarget: true, destructive: true, refresh: ['habits'],
  },

  create_budget_entry: {
    domain: 'budget', operation: 'create', confirmationLevel: CONFIRMATION.AUTO,
    required: ['type', 'amount'], refresh: ['budget', 'journal'],
  },
  update_budget_entry: {
    domain: 'budget', operation: 'update', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['entry_id'], requiresTarget: true, refresh: ['budget', 'journal'],
  },
  archive_budget_entry: {
    domain: 'budget', operation: 'archive', confirmationLevel: CONFIRMATION.EXPLICIT,
    required: ['entry_id'], requiresTarget: true, destructive: true, refresh: ['budget', 'journal'],
  },

  create_goal: {
    domain: 'goals', operation: 'create', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['title'], refresh: ['goals'],
  },
  update_goal: {
    domain: 'goals', operation: 'update', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['goal_id'], requiresTarget: true, refresh: ['goals'],
  },
  complete_goal: {
    domain: 'goals', operation: 'complete', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['goal_id'], requiresTarget: true, refresh: ['goals'],
  },
  archive_goal: {
    domain: 'goals', operation: 'archive', confirmationLevel: CONFIRMATION.EXPLICIT,
    required: ['goal_id'], requiresTarget: true, destructive: true, refresh: ['goals'],
  },

  create_memory: {
    domain: 'memories', operation: 'create', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['content'], refresh: ['memories'],
  },
  update_memory: {
    domain: 'memories', operation: 'update', confirmationLevel: CONFIRMATION.PREVIEW,
    required: ['memory_id'], requiresTarget: true, refresh: ['memories'],
  },
  forget_memory: {
    domain: 'memories', operation: 'forget', confirmationLevel: CONFIRMATION.EXPLICIT,
    required: ['memory_id'], requiresTarget: true, destructive: true, refresh: ['memories'],
  },
};

const blockedPatterns = [
  /\b(delete|remove|clear|wipe)\s+(all|everything|every)\b/i,
  /\b(account|password|billing|subscription|oauth|google|email sending|send email)\b/i,
];

function getActionDefinition(type) {
  return registry[type] || null;
}

function isBlockedBatchOrSensitiveIntent(text = '') {
  return blockedPatterns.some((pattern) => pattern.test(text));
}

function listActionTypes() {
  return Object.keys(registry);
}

module.exports = {
  CONFIRMATION,
  getActionDefinition,
  isBlockedBatchOrSensitiveIntent,
  listActionTypes,
  registry,
};
