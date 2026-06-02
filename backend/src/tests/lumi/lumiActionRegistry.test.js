const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getActionDefinition,
  isBlockedBatchOrSensitiveIntent,
  listActionTypes,
} = require('../../services/lumiActionRegistry');

test('registry exposes known safe Life OS actions', () => {
  assert.ok(listActionTypes().includes('update_journal_entry'));
  assert.ok(listActionTypes().includes('archive_budget_entry'));
  assert.equal(getActionDefinition('archive_habit').confirmationLevel, 'explicit');
  assert.equal(getActionDefinition('create_budget_entry').confirmationLevel, 'auto');
});

test('registry blocks batch destructive and account-level intents', () => {
  assert.equal(isBlockedBatchOrSensitiveIntent('delete all my journal entries'), true);
  assert.equal(isBlockedBatchOrSensitiveIntent('change my billing subscription'), true);
  assert.equal(isBlockedBatchOrSensitiveIntent('move gym to Friday'), false);
});
