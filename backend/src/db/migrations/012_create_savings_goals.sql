-- Migration 012: Savings Goals
-- Separate from budget_goals (which are spending caps).
-- savings_goals tracks named targets the user is building toward.

CREATE TABLE IF NOT EXISTS savings_goals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    emoji         VARCHAR(10)  NOT NULL DEFAULT '🎯',
    target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
    saved_amount  NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
    deadline      DATE,
    is_complete   BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user
    ON savings_goals(user_id, created_at DESC);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'savings_goals_user_isolation') THEN
        CREATE POLICY savings_goals_user_isolation ON savings_goals
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_savings_goals_updated_at') THEN
        CREATE TRIGGER update_savings_goals_updated_at
        BEFORE UPDATE ON savings_goals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
