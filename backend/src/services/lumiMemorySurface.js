const { pool } = require('../db/connection');

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function inferMemoryCategory(text, fallback = 'fact') {
  const lower = String(text || '').toLowerCase();
  if (/\b(goal|want to|dream|save|build|finish|launch)\b/.test(lower)) return 'goal';
  if (/\b(fear|afraid|worried|anxious|stress|panic)\b/.test(lower)) return 'fear';
  if (/\b(always|usually|pattern|every time|again|tends to)\b/.test(lower)) return 'pattern';
  if (/\b(finished|completed|achieved|milestone|won)\b/.test(lower)) return 'milestone';
  return fallback || 'fact';
}

function scoreMemory(memory, userInput = '', context = {}) {
  const inputTokens = new Set(tokenize(userInput));
  const memoryTokens = tokenize(memory.content || memory.memory_content || '');
  const overlap = memoryTokens.filter(token => inputTokens.has(token)).length;
  const importance = Number(memory.importance || 5) / 10;
  const category = memory.memory_category || memory.memory_type || 'fact';
  const topicBoost = context.currentTopic && category === context.currentTopic ? 0.25 : 0;
  const surfacedPenalty = memory.last_surfaced_at ? 0.1 : 0;
  return overlap * 0.2 + importance + topicBoost - surfacedPenalty;
}

async function surfaceRelevantMemories(userId, userInput = '', context = {}, limit = 5) {
  const { rows } = await pool.query(
    `SELECT id, memory_type, content, source, importance, created_at, updated_at,
            memory_category, last_surfaced_at, surface_count
       FROM lumi_memories
      WHERE user_id = $1
      ORDER BY importance DESC, updated_at DESC
      LIMIT 30`,
    [userId]
  ).catch(async err => {
    if (!/memory_category|last_surfaced_at|surface_count/i.test(err.message || '')) throw err;
    return pool.query(
      `SELECT id, memory_type, content, source, importance, created_at, updated_at
         FROM lumi_memories
        WHERE user_id = $1
        ORDER BY importance DESC, updated_at DESC
        LIMIT 30`,
      [userId]
    );
  });

  return rows
    .map(memory => ({
      ...memory,
      memory_category: memory.memory_category || inferMemoryCategory(memory.content, memory.memory_type),
      relevance_score: scoreMemory(memory, userInput, context),
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);
}

async function markMemoriesSurfaced(userId, memories = []) {
  const ids = memories.map(memory => memory.id).filter(Boolean);
  if (!ids.length) return;
  await pool.query(
    `UPDATE lumi_memories
        SET last_surfaced_at = NOW(),
            surface_count = COALESCE(surface_count, 0) + 1
      WHERE user_id = $1 AND id = ANY($2::uuid[])`,
    [userId, ids]
  ).catch(() => {});
}

module.exports = {
  inferMemoryCategory,
  markMemoriesSurfaced,
  scoreMemory,
  surfaceRelevantMemories,
  tokenize,
};
