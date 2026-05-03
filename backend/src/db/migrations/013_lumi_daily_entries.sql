-- Migration 013: Lumi Daily Entries
-- Stores human-readable narrative summaries of everything Lumi processed each day.
-- These appear in the Journal as a "Daily Life" entry the user can reflect on.

CREATE TABLE IF NOT EXISTS lumi_daily_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date    DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Narrative content written by Lumi in plain language
    narrative     TEXT NOT NULL,

    -- Structured sub-sections (JSONB so each section can grow independently)
    sections      JSONB DEFAULT '{}',
    -- sections shape:
    -- {
    --   "expenses":    [{ "amount": 2500, "category": "food", "note": "morning food" }],
    --   "workouts":    [{ "status": "skipped", "reason": "cramps" }],
    --   "habits":      [{ "name": "exercise", "completed": false }],
    --   "life_notes":  ["Had cramps, took it easy", "Planning to travel next week"],
    --   "mood":        "tired but determined",
    --   "follow_ups":  ["Asked about period-friendly workout plan"]
    -- }

    mood          VARCHAR(50),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One entry per user per day — upserted so the entry grows across the day
    UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_lumi_daily_entries_user_date
    ON lumi_daily_entries(user_id, entry_date DESC);

ALTER TABLE lumi_daily_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'lumi_daily_entries_user_isolation'
    ) THEN
        CREATE POLICY lumi_daily_entries_user_isolation ON lumi_daily_entries
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_lumi_daily_entries_updated_at'
    ) THEN
        CREATE TRIGGER update_lumi_daily_entries_updated_at
        BEFORE UPDATE ON lumi_daily_entries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
