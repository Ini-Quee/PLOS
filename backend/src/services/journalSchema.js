const JOURNAL_TAGS = [
  'personal',
  'gratitude',
  'spiritual',
  'budget',
  'wellness',
  'goals',
  'business',
];

const ENTRY_TYPES = [
  'daily',
  'blank_page',
  'template_entry',
  'weekly_review',
  'monthly_compass',
];

const TEMPLATE_SCHEMAS = {
  'Weekly Review': {
    tags: ['personal'],
    fields: {
      wins: 'Array of wins from the week.',
      struggles: 'Array of struggles or recurring issues from the week.',
      learning: 'What the user learned this week.',
      next_week_intention: 'How the user wants next week to go.',
      user_notes: 'Editable user notes.',
    },
    aliases: ['weekly review', 'this week', 'my week', 'week review'],
  },
  'Monthly Compass': {
    tags: ['personal'],
    fields: {
      theme: 'Monthly theme.',
      goals: 'Array of goals for the month.',
      achievements: 'Array of achievements.',
      lessons: 'Array of lessons from the month.',
      review: 'Monthly review text.',
      cover_image: 'Optional cover image.',
    },
    aliases: ['monthly compass', 'this month', 'monthly review', 'monthly goal'],
  },
  'Blank Page': {
    tags: [],
    fields: {},
    aliases: ['blank', 'blank page', 'free page', 'free write'],
  },
  'Classic Diary': {
    tags: ['personal'],
    fields: {
      entry_text: 'Long-form narrative of what happened and how the user feels.',
      mood: 'Optional mood label or emoji.',
    },
    aliases: ['diary', 'daily diary', 'daily journal', 'classic diary'],
  },
  'Morning Pages': {
    tags: ['personal'],
    fields: {
      stream_text: 'Unfiltered stream-of-consciousness writing.',
      intention: 'Optional intention for the day.',
    },
    aliases: ['morning pages', 'morning dump', 'stream of consciousness'],
  },
  'Evening Reflection': {
    tags: ['personal'],
    fields: {
      what_went_well: 'What went well.',
      what_i_would_change: 'What the user would change.',
      what_i_am_proud_of: 'What the user is proud of.',
      what_i_am_learning: 'What the user is learning about themselves.',
      mood: 'Optional mood label or emoji.',
      hydration: 'Optional hydration check-in.',
    },
    aliases: ['reflection', 'daily reflection', 'evening reflection', 'review my day'],
  },
  'Brain Dump': {
    tags: ['personal'],
    fields: {
      clutter_text: 'Tasks, ideas, worries, reminders, or mental clutter.',
      extracted_tasks: 'Optional array of tasks noticed in the brain dump.',
    },
    aliases: ['brain dump', 'mental clutter', 'clear my head', 'dump this'],
  },
  'Travel Memory': {
    tags: ['personal'],
    fields: {
      location: 'Trip location.',
      travel_dates: 'Travel dates or date range.',
      story: 'Travel memory or narrative.',
    },
    aliases: ['travel', 'travel plan', 'travel plans', 'trip', 'vacation', 'journey'],
  },
  'Gratitude Log': {
    tags: ['gratitude'],
    fields: {
      gratitude_item: 'One or more things the user is grateful for.',
    },
    aliases: ['gratitude', 'grateful', 'thankful', 'blessed'],
  },
  'Prayer Journal': {
    tags: ['spiritual'],
    fields: {
      prayer_request: 'The prayer request or prayer note.',
      prayer_status: 'open, in-progress, or answered.',
      answered_note: 'Optional note if the prayer was answered.',
    },
    aliases: ['prayer', 'pray for', 'prayer request', 'answered prayer'],
  },
  'Bible Study': {
    tags: ['spiritual'],
    fields: {
      scripture_reference: 'Book, chapter, and verse reference.',
      study_notes: 'Study notes or observations.',
      summary: 'Summary in the user’s own words.',
      application: 'Optional application to the user’s life.',
    },
    aliases: ['bible study', 'scripture study', 'read my bible', 'passage'],
  },
  'Sermon Notes': {
    tags: ['spiritual'],
    fields: {
      sermon_title: 'Sermon title or topic.',
      speaker: 'Speaker or pastor.',
      scripture_reference: 'Scripture reference.',
      takeaways: 'Array of key takeaways.',
      application: 'How the user wants to respond.',
    },
    aliases: ['sermon', 'church notes', 'pastor preached', 'message at church'],
  },
  'Faith Walk': {
    tags: ['spiritual'],
    fields: {
      entry_text: 'Long-form spiritual reflection.',
      growth_note: 'Optional note about growth, doubt, or faith progress.',
    },
    aliases: ['faith walk', 'spiritual growth', 'god showed me', 'trusting god'],
  },
  'Verse of the Day': {
    tags: ['spiritual'],
    fields: {
      scripture_reference: 'Verse reference.',
      verse_text: 'Verse text.',
      reflection: 'Short reflection on the verse.',
    },
    aliases: ['verse of the day', 'today’s verse', 'todays verse', 'verse'],
  },
  'Daily Expenses': {
    tags: ['budget'],
    fields: {
      amount: 'Expense amount as a number.',
      category: 'Expense category.',
      description: 'What the money was spent on.',
      date_of_transaction: 'Transaction date.',
    },
    aliases: ['spent', 'expense', 'paid', 'bought', 'cost'],
  },
  'Weekly Budget': {
    tags: ['budget'],
    fields: {
      planned_limit: 'Optional weekly spending limit.',
      planned_expenses: 'Array of expected expenses.',
      notes: 'Budget plan notes.',
    },
    aliases: ['weekly budget', 'budget this week', 'spending limit'],
  },
  'Income Tracker': {
    tags: ['budget'],
    fields: {
      amount: 'Income amount as a number.',
      income_source: 'Income source.',
      date_of_transaction: 'Income date.',
      notes: 'Optional income notes.',
    },
    aliases: ['income', 'salary', 'received money', 'freelance payment'],
  },
  'Savings Goal': {
    tags: ['budget', 'goals'],
    fields: {
      goal_name: 'Savings goal name.',
      savings_target_amount: 'Target amount.',
      current_savings_progress: 'Current saved amount or progress.',
      notes: 'Optional notes.',
    },
    aliases: ['saving goal', 'savings goal', 'save for', 'saving for'],
  },
  'Bills Planner': {
    tags: ['budget'],
    fields: {
      bill_name: 'Bill name.',
      bill_due_date: 'Due date.',
      amount: 'Bill amount.',
      bill_status: 'unpaid or paid.',
    },
    aliases: ['bill', 'rent', 'subscription', 'due date'],
  },
  'Spending Review': {
    tags: ['budget'],
    fields: {
      review_period: 'weekly or monthly.',
      financial_insights: 'Reflection on spending patterns.',
      next_adjustment: 'Optional next adjustment.',
    },
    aliases: ['spending review', 'money review', 'budget review'],
  },
  'Wellness Log': {
    tags: ['wellness'],
    fields: {
      entry_body: 'General wellness note.',
      mood: 'Mood scale or preset.',
      hours_of_sleep: 'Number of hours slept.',
      energy_level: 'Energy scale from 1 to 5.',
      exercise: 'Exercise yes/no plus optional type.',
    },
    aliases: ['wellness', 'daily wellness', 'health check-in', 'feel physically'],
  },
  'Mood Tracker': {
    tags: ['wellness'],
    fields: {
      mood: 'Mood scale or preset.',
      influences: 'What influenced the mood.',
      what_would_help: 'What might help.',
    },
    aliases: ['mood', 'feeling', 'anxious', 'stressed', 'happy'],
  },
  'Fitness Log': {
    tags: ['wellness'],
    fields: {
      exercise: 'Exercise type.',
      duration: 'Exercise duration.',
      notes: 'Workout notes.',
    },
    aliases: ['workout', 'exercise', 'gym', 'run', 'walk'],
  },
  'Sleep Log': {
    tags: ['wellness'],
    fields: {
      hours_of_sleep: 'Number of hours slept.',
      bedtime: 'Bedtime.',
      wake_time: 'Wake time.',
      quality: 'Sleep quality.',
    },
    aliases: ['sleep', 'slept', 'bedtime', 'woke up', 'insomnia'],
  },
  'Goal Tracker': {
    tags: ['goals'],
    fields: {
      goal_name: 'Goal name.',
      goal_description: 'Goal description.',
      target_date: 'Target date.',
      milestones: 'Array of milestones.',
      progress_percent: 'Progress from 0 to 100.',
      related_entries: 'Optional related entry ids.',
    },
    aliases: ['goal', 'milestone', 'progress', 'north star'],
  },
  'Business Note': {
    tags: ['business'],
    fields: {
      idea_text: 'Business idea, meeting note, project note, or client note.',
      project_name: 'Optional project name.',
      next_step: 'Optional next step.',
    },
    aliases: ['business', 'idea', 'project', 'client', 'content idea', 'inspiration'],
  },
};

const ROUTING_RULES = [
  { priority: 1, keywords: ['this week', 'weekly review', 'my week'], destination: 'weekly_reviews', template_type: 'Weekly Review' },
  { priority: 2, keywords: ['this month', 'monthly goal', 'monthly compass'], destination: 'monthly_compasses', template_type: 'Monthly Compass' },
  { priority: 3, keywords: ['thankful', 'grateful', 'blessed'], destination: 'daily_entries', template_type: 'Gratitude Log' },
  { priority: 4, keywords: ['spent', 'cost', 'money', 'budget', 'expense', 'paid', 'bought'], destination: 'daily_entries', template_type: 'Daily Expenses' },
  { priority: 5, keywords: ['pray', 'prayer', 'answered prayer'], destination: 'daily_entries', template_type: 'Prayer Journal' },
  { priority: 6, keywords: ['bible', 'verse', 'scripture'], destination: 'daily_entries', template_type: 'Bible Study' },
  { priority: 7, keywords: ['sermon', 'church', 'pastor'], destination: 'daily_entries', template_type: 'Sermon Notes' },
  { priority: 8, keywords: ['slept', 'energy', 'workout', 'exercise', 'mood'], destination: 'daily_entries', template_type: 'Wellness Log' },
  { priority: 9, keywords: ['goal', 'milestone', 'progress', 'working on'], destination: 'daily_entries', template_type: 'Goal Tracker' },
  { priority: 10, keywords: ['idea', 'project', 'client', 'business'], destination: 'daily_entries', template_type: 'Business Note' },
  { priority: 11, keywords: ['travel', 'vacation', 'trip'], destination: 'daily_entries', template_type: 'Travel Memory' },
  { priority: 12, keywords: ['morning pages'], destination: 'daily_entries', template_type: 'Morning Pages' },
  { priority: 13, keywords: ['brain dump'], destination: 'daily_entries', template_type: 'Brain Dump' },
  { priority: 14, keywords: [], destination: 'daily_entries', template_type: 'Classic Diary' },
];

function normalizeTemplateType(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Classic Diary';
  const direct = Object.keys(TEMPLATE_SCHEMAS).find((name) => name.toLowerCase() === raw.toLowerCase());
  if (direct) return direct;
  const aliasMatch = Object.entries(TEMPLATE_SCHEMAS).find(([, schema]) => {
    return (schema.aliases || []).some((alias) => alias.toLowerCase() === raw.toLowerCase());
  });
  return aliasMatch ? aliasMatch[0] : raw;
}

function getTemplateSchema(templateType) {
  return TEMPLATE_SCHEMAS[normalizeTemplateType(templateType)] || TEMPLATE_SCHEMAS['Classic Diary'];
}

function inferRoute(text = '') {
  const lower = String(text).toLowerCase();
  const match = ROUTING_RULES.find((rule) => {
    if (rule.keywords.length === 0) return true;
    return rule.keywords.some((keyword) => lower.includes(keyword));
  });
  const templateType = normalizeTemplateType(match.template_type);
  const schema = getTemplateSchema(templateType);
  return {
    destination: match.destination,
    template_type: templateType,
    tags: schema.tags.length ? schema.tags : ['personal'],
    entry_type: match.destination === 'daily_entries' ? 'template_entry' : match.template_type.toLowerCase().replace(/\s+/g, '_'),
  };
}

function normalizeTags(tags = [], fallbackTemplate = 'Classic Diary') {
  const schemaTags = getTemplateSchema(fallbackTemplate).tags;
  const combined = [...(Array.isArray(tags) ? tags : []), ...schemaTags]
    .map((tag) => String(tag || '').toLowerCase().trim())
    .filter(Boolean);
  const known = combined.filter((tag) => JOURNAL_TAGS.includes(tag));
  return Array.from(new Set(known.length ? known : ['personal']));
}

module.exports = {
  ENTRY_TYPES,
  JOURNAL_TAGS,
  ROUTING_RULES,
  TEMPLATE_SCHEMAS,
  getTemplateSchema,
  inferRoute,
  normalizeTags,
  normalizeTemplateType,
};
