const test = require('node:test');
const assert = require('node:assert/strict');

const { applyLumiVoice, trimExcessQuestions } = require('../../services/lumiVoiceRules');

test('removes forbidden robotic and shaming phrases', () => {
  const text = applyLumiVoice('Processing your request. You failed yesterday. You should try again? Why not now?');
  assert.equal(text.includes('Processing your request'), false);
  assert.equal(text.includes('You failed'), false);
  assert.equal(text.includes('You should'), false);
});

test('keeps only one follow-up question', () => {
  const text = trimExcessQuestions('Want to look at it? Should I save it? Are you ready?');
  assert.equal((text.match(/\?/g) || []).length, 1);
});

test('adds grounded opening for anxiety', () => {
  const text = applyLumiVoice('Want to talk through it?', { primaryEmotion: 'anxiety' });
  assert.match(text, /^I hear you\./);
});
