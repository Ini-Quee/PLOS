-- Migration 011: Budget Module
-- budget_entries: every expense/income transaction
-- budget_goals: per-category monthly spending limits + monthly income declaration

CREATE TABLE IF NOT EXISTS budget_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(10)  NOT NULL CHECK (type IN ('expense', 'income')),
    amount        NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency      VARCHAR(5)   NOT NULL DEFAULT '₦',
    category      VARCHAR(50)  NOT NULL DEFAULT 'other',
    note          TEXT,
    entry_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
    source        VARCHAR(20)  DEFAULT 'manual',  -- 'manual' | 'voice' | 'lumi'
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly income declaration + per-category budget caps
CREATE TABLE IF NOT EXISTS budget_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month           DATE NOT NULL,               -- first day of the month
    declared_income NUMERIC(14,2) DEFAULT 0,
    category        VARCHAR(50)   NOT NULL DEFAULT 'total',
    limit_amount    NUMERIC(14,2) DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, month, category)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_entries_user_date
    ON budget_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_entries_user_type_date
    ON budget_entries(user_id, type, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_goals_user_month
    ON budget_goals(user_id, month DESC);

-- Row-Level Security
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_goals   ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'budget_entries_user_isolation') THEN
        CREATE POLICY budget_entries_user_isolation ON budget_entries
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'budget_goals_user_isolation') THEN
        CREATE POLICY budget_goals_user_isolation ON budget_goals
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
END $$;

-- updated_at triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_entries_updated_at') THEN
        CREATE TRIGGER update_budget_entries_updated_at
        BEFORE UPDATE ON budget_entries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_goals_updated_at') THEN
        CREATE TRIGGER update_budget_goals_updated_at
        BEFORE UPDATE ON budget_goals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
