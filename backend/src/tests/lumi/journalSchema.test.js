const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getTemplateSchema,
  inferRoute,
  normalizeTags,
  normalizeTemplateType,
} = require('../../services/journalSchema');

test('journal schema normalizes ambiguous template names to canonical templates', () => {
  assert.equal(normalizeTemplateType('Reflection'), 'Evening Reflection');
  assert.equal(normalizeTemplateType('daily reflection'), 'Evening Reflection');
  assert.equal(normalizeTemplateType('blank'), 'Blank Page');
  assert.equal(normalizeTemplateType('Travel Plans'), 'Travel Memory');
});

test('journal schema routes high-priority time horizons before daily tags', () => {
  assert.deepEqual(inferRoute('Let me review this week and plan next week'), {
    destination: 'weekly_reviews',
    template_type: 'Weekly Review',
    tags: ['personal'],
    entry_type: 'weekly_review',
  });

  assert.deepEqual(inferRoute('My monthly goal is to save for a car'), {
    destination: 'monthly_compasses',
    template_type: 'Monthly Compass',
    tags: ['personal'],
    entry_type: 'monthly_compass',
  });
});

test('journal schema routes daily capture into the correct template and tags', () => {
  assert.equal(inferRoute('I am grateful for my sister').template_type, 'Gratitude Log');
  assert.deepEqual(inferRoute('I am grateful for my sister').tags, ['gratitude']);

  assert.equal(inferRoute('I spent 2500 on lunch').template_type, 'Daily Expenses');
  assert.deepEqual(inferRoute('I spent 2500 on lunch').tags, ['budget']);

  assert.equal(inferRoute('Pray for my family').template_type, 'Prayer Journal');
  assert.deepEqual(inferRoute('Pray for my family').tags, ['spiritual']);
});

test('journal schema combines known tags and template tags without invalid values', () => {
  assert.deepEqual(normalizeTags(['business', 'unknown'], 'Savings Goal'), ['business', 'budget', 'goals']);
  assert.deepEqual(normalizeTags([], 'Classic Diary'), ['personal']);
});

test('journal schema exposes field definitions for Lumi routing', () => {
  const schema = getTemplateSchema('Daily Expenses');
  assert.equal(schema.tags[0], 'budget');
  assert.ok(schema.fields.amount);
  assert.ok(schema.fields.category);
});
