-- Migration 010: Lumi Orchestration Support
-- Adds achievement tracking to goals and enriches schedules

-- Goals: achievement fields
ALTER TABLE year_goals
  ADD COLUMN IF NOT EXISTS is_completed        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at        TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS achievement_label   TEXT,
  ADD COLUMN IF NOT EXISTS milestone_emoji     VARCHAR(10) DEFAULT '🏆',
  ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_notes      TEXT;

-- Schedules: notes field for completion context
ALTER TABLE schedule_completions
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Lumi conversations: track which actions were proposed/executed
ALTER TABLE lumi_conversations
  ADD COLUMN IF NOT EXISTS proposed_actions  JSONB,
  ADD COLUMN IF NOT EXISTS executed_actions  JSONB,
  ADD COLUMN IF NOT EXISTS actions_confirmed BOOLEAN DEFAULT false;

-- Index for fast goal lookups
CREATE INDEX IF NOT EXISTS idx_year_goals_user_year ON year_goals(user_id, year);
CREATE INDEX IF NOT EXISTS idx_year_goals_completed ON year_goals(user_id, is_completed);
