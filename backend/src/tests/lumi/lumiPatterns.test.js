const test = require('node:test');
const assert = require('node:assert/strict');

const {
  detectBudgetSpikeFromRows,
  detectHabitGapFromRows,
  detectStuckTaskFromRows,
  shouldSurfacePattern,
} = require('../../services/lumiPatterns');

test('stuck task detector requires at least three misses', () => {
  assert.equal(detectStuckTaskFromRows([{ id: '1', title: 'Call dentist', missed_count: 2 }]).length, 0);
  const patterns = detectStuckTaskFromRows([{ id: '1', title: 'Call dentist', missed_count: 3 }]);
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].pattern_type, 'stuck_task');
});

test('habit gap detector requires at least three days', () => {
  assert.equal(detectHabitGapFromRows([{ id: '1', title: 'Morning walk', days_since_completion: 2 }]).length, 0);
  assert.equal(detectHabitGapFromRows([{ id: '1', title: 'Morning walk', days_since_completion: 3 }]).length, 1);
});

test('budget spike detector requires evidence and 125 percent threshold', () => {
  assert.equal(detectBudgetSpikeFromRows([{ category: 'food', current_total: 120, baseline_avg: 100, tx_count: 3 }]).length, 0);
  assert.equal(detectBudgetSpikeFromRows([{ category: 'food', current_total: 130, baseline_avg: 100, tx_count: 2 }]).length, 0);
  assert.equal(detectBudgetSpikeFromRows([{ category: 'food', current_total: 130, baseline_avg: 100, tx_count: 3 }]).length, 1);
});

test('surfacing blocks crisis context', () => {
  const pattern = detectStuckTaskFromRows([{ id: '1', title: 'Call dentist', missed_count: 3 }])[0];
  assert.equal(shouldSurfacePattern(pattern, { emotionalContext: { crisis: true } }), false);
  assert.equal(shouldSurfacePattern(pattern, { emotionalContext: { crisis: false } }), true);
});
