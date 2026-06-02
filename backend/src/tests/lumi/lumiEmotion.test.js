const test = require('node:test');
const assert = require('node:assert/strict');

const {
  analyzeEmotionalContext,
  detectPrimaryEmotion,
  isCrisisSignal,
} = require('../../services/lumiEmotion');

test('detects core emotional tones', () => {
  assert.equal(detectPrimaryEmotion('I feel anxious and overwhelmed'), 'anxiety');
  assert.equal(detectPrimaryEmotion('I am exhausted and drained'), 'exhaustion');
  assert.equal(detectPrimaryEmotion('I should have done this, I feel behind'), 'guilt');
  assert.equal(detectPrimaryEmotion('I am hopeful and excited'), 'hope');
});

test('detects crisis signals and marks routing boundary', () => {
  assert.equal(isCrisisSignal("I don't see the point anymore"), true);
  const ctx = analyzeEmotionalContext("I don't see the point anymore", []);
  assert.equal(ctx.crisis, true);
  assert.equal(ctx.primaryEmotion, 'crisis');
  assert.equal(ctx.responseStyle, 'redirect');
});
