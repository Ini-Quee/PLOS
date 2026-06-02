-- Migration 031: Lumi full app agent action log + archive support

CREATE TABLE IF NOT EXISTS lumi_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL DEFAULT gen_random_uuid(),
  action_type VARCHAR(100) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'proposed',
  confirmation_level VARCHAR(30) NOT NULL DEFAULT 'preview',
  target JSONB NOT NULL DEFAULT '{}',
  action_data JSONB NOT NULL DEFAULT '{}',
  payload_summary JSONB NOT NULL DEFAULT '{}',
  preview_summary JSONB NOT NULL DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lumi_action_log_user_created
  ON lumi_action_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lumi_action_log_proposal
  ON lumi_action_log(user_id, proposal_id, status);

CREATE INDEX IF NOT EXISTS idx_lumi_action_log_action
  ON lumi_action_log(user_id, action_id);

ALTER TABLE lumi_action_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'lumi_action_log_user_isolation'
  ) THEN
    CREATE POLICY lumi_action_log_user_isolation ON lumi_action_log
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
  END IF;
END $$;

ALTER TABLE journal_page_entries
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by_lumi_action_id UUID;

ALTER TABLE user_journal_types
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by_lumi_action_id UUID;

ALTER TABLE budget_entries
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by_lumi_action_id UUID;

ALTER TABLE year_goals
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by_lumi_action_id UUID;

CREATE INDEX IF NOT EXISTS idx_jpe_user_active_date
  ON journal_page_entries(user_id, archived_at, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_budget_entries_user_active_date
  ON budget_entries(user_id, archived_at, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_year_goals_user_active_year
  ON year_goals(user_id, archived_at, year);
