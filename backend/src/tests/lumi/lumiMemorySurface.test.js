const test = require('node:test');
const assert = require('node:assert/strict');

const { inferMemoryCategory, scoreMemory } = require('../../services/lumiMemorySurface');

test('infers memory categories from content', () => {
  assert.equal(inferMemoryCategory('Wants to save money for December'), 'goal');
  assert.equal(inferMemoryCategory('Feels anxious about money'), 'fear');
  assert.equal(inferMemoryCategory('Usually spends more when tired'), 'pattern');
});

test('relevance can beat raw importance', () => {
  const relevant = scoreMemory(
    { content: 'Money anxiety around food spending', importance: 5, memory_category: 'fear' },
    'I feel anxious about spending on food',
    { currentTopic: 'fear' }
  );
  const importantButUnrelated = scoreMemory(
    { content: 'Wants to run a marathon', importance: 10, memory_category: 'goal' },
    'I feel anxious about spending on food',
    { currentTopic: 'fear' }
  );
  assert.ok(relevant > importantButUnrelated);
});
