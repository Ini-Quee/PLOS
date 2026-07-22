const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '../..');

function readService(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), 'utf8');
}

test('Lumi habit logging uses current habit_completions schema', () => {
  const router = readService('services/lumiRouter.js');
  const contextEngine = readService('services/lumiContextEngine.js');
  const combined = `${router}\n${contextEngine}`;

  assert.match(combined, /habit_completions[\s\S]*completion_date/);
  assert.doesNotMatch(combined, /habit_completions[\s\S]{0,200}\bentry_date\b/);
  assert.doesNotMatch(combined, /habit_completions[\s\S]{0,200}\bstatus\b/);
});
