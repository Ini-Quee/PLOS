CREATE TABLE IF NOT EXISTS lumi_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type VARCHAR(30) NOT NULL DEFAULT 'fact', -- 'goal', 'fear', 'pattern', 'fact', 'milestone'
  content TEXT NOT NULL,
  source VARCHAR(30) DEFAULT 'chat', -- 'chat', 'life_audit', 'journal', 'habit_pattern'
  importance INTEGER DEFAULT 5, -- 1-10, higher = injected first
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lumi_memories_user ON lumi_memories(user_id, importance DESC, updated_at DESC);
