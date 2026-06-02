const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractDateHint,
  extractJournalTypeHint,
  extractMoney,
  extractTimeHint,
  nextWeekdayIso,
  targetHint,
} = require('../../services/lumiTargetResolver');

test('target resolver extracts dates, times, and money from natural text', () => {
  assert.match(extractDateHint('coffee yesterday'), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(nextWeekdayIso('friday'), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(extractTimeHint('move gym to 6am'), '06:00:00');
  assert.equal(extractTimeHint('meeting at 3:30pm'), '15:30:00');
  assert.equal(extractMoney('that food expense was ₦2,500'), 2500);
});

test('target hint strips action words, dates, times, and amounts', () => {
  assert.equal(targetHint('move gym to Friday at 6am', ['move', 'change']), 'gym');
  assert.equal(targetHint('that food expense was ₦2,500', ['expense', 'was']), 'food');
});

test('target resolver handles built-in and custom journal type hints', () => {
  assert.equal(extractJournalTypeHint('change my last spiritual entry'), 'spiritual');
  assert.equal(
    extractJournalTypeHint('save this blog idea', [
      { type_key: 'content_ideas', label: 'Content Ideas', routing_keywords: ['blog', 'caption'] },
    ]),
    'content_ideas'
  );
});
