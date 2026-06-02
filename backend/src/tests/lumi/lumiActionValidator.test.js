const test = require('node:test');
const assert = require('node:assert/strict');

const { validateAction } = require('../../services/lumiActionValidator');

test('validator rejects unknown actions and missing required fields', async () => {
  const unknown = await validateAction({ type: 'launch_rocket', payload: {} }, 'user-1', {}, {});
  assert.equal(unknown.valid, false);
  assert.equal(unknown.reason, 'unknown_action');

  const missing = await validateAction({ type: 'create_budget_entry', payload: { amount: 10 } }, 'user-1', {}, {});
  assert.equal(missing.valid, false);
  assert.equal(missing.reason, 'missing_required_field');
});

test('validator blocks invalid budget amount', async () => {
  const result = await validateAction(
    { type: 'create_budget_entry', payload: { type: 'expense', amount: -2 } },
    'user-1',
    {},
    {}
  );
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'invalid_amount');
});

test('validator warns on schedule conflicts', async () => {
  const result = await validateAction(
    {
      type: 'create_schedule_item',
      payload: { title: 'Gym', start_time: '06:00:00' },
    },
    'user-1',
    {},
    { lifeContext: { scheduleToday: [{ id: 'a', title: 'Prayer', start_time: '06:00:00' }] } }
  );
  assert.equal(result.valid, true);
  assert.match(result.warning, /Prayer/);
});
