-- Migration 030: Lumi reliable intelligence helpers

ALTER TABLE lumi_memories
  ADD COLUMN IF NOT EXISTS memory_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS last_surfaced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS surface_count INTEGER DEFAULT 0;

UPDATE lumi_memories
   SET memory_category = COALESCE(memory_category, memory_type)
 WHERE memory_category IS NULL;

CREATE INDEX IF NOT EXISTS idx_lumi_memories_category
  ON lumi_memories(user_id, memory_category);

CREATE INDEX IF NOT EXISTS idx_lumi_memories_surfacing
  ON lumi_memories(user_id, importance DESC, last_surfaced_at ASC NULLS FIRST);

CREATE TABLE IF NOT EXISTS lumi_detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL,
  pattern_title VARCHAR(255) NOT NULL,
  pattern_description TEXT,
  evidence JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  priority INTEGER NOT NULL DEFAULT 5,
  surfaced BOOLEAN NOT NULL DEFAULT FALSE,
  surfaced_at TIMESTAMPTZ,
  user_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pattern_type, pattern_title)
);

CREATE INDEX IF NOT EXISTS idx_lumi_patterns_user_surface
  ON lumi_detected_patterns(user_id, surfaced, priority DESC, confidence DESC);

CREATE INDEX IF NOT EXISTS idx_lumi_patterns_user_type
  ON lumi_detected_patterns(user_id, pattern_type, updated_at DESC);

ALTER TABLE lumi_detected_patterns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'lumi_patterns_user_isolation'
  ) THEN
    CREATE POLICY lumi_patterns_user_isolation ON lumi_detected_patterns
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_lumi_patterns_updated_at'
  ) THEN
    CREATE TRIGGER update_lumi_patterns_updated_at
    BEFORE UPDATE ON lumi_detected_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
