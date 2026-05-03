-- Migration 014: Journal page entries + user-defined journal types
--
-- journal_page_entries: stores the structured field content of every journal
--   template page. One row per user + journal_type + template_name + entry_date.
--   The "fields" JSONB column holds the actual text the user / Lumi wrote into
--   each named field of the template (e.g. "passage", "study_notes", "prayer").
--
-- user_journal_types: lets users create custom journal notebooks beyond the
--   six built-in ones (personal, spiritual, budget, habit, goals, health).
--   Lumi reads this table so she can route content to user-created notebooks.

-- ── journal_page_entries ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_page_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Which notebook and which template inside that notebook
    journal_type    VARCHAR(100) NOT NULL,   -- 'spiritual', 'budget', 'personal', custom
    template_name   VARCHAR(200) NOT NULL,   -- 'Bible Study', 'Daily Expenses', etc.
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,

    -- All the named fields for this template stored as JSON.
    -- Each template has its own shape; examples:
    --   Bible Study:     { "passage": "James 5:1-12", "study_notes": "...", "summary": "..." }
    --   Daily Devotion:  { "verse": "...", "meaning": "...", "application": "...", "prayer": "..." }
    --   Prayer Journal:  { "for_myself": "...", "for_family": "...", "for_others": "...", "answered": "..." }
    --   Sermon Notes:    { "speaker": "...", "scripture": "...", "points": ["...", "..."], "application": "..." }
    --   Daily Expenses:  { "rows": [{ "description": "...", "category": "food", "amount": "2500" }] }
    --   Income Tracker:  { "salary": "150000", "freelance": "50000", "other": "", "notes": "..." }
    --   Daily Wellness:  { "mood": "😊", "water": 4, "body_feeling": "...", "health_actions": "..." }
    --   Habit Tracker:   { "pray": true, "read": true, "exercise": false, "water": true, "journal": true }
    fields          JSONB NOT NULL DEFAULT '{}',

    -- Source: who wrote this — 'user' (manual) or 'lumi' (AI-populated)
    source          VARCHAR(20) DEFAULT 'user',

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One entry per user per template per day (upsertable)
    UNIQUE (user_id, journal_type, template_name, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_jpe_user_type_date
    ON journal_page_entries(user_id, journal_type, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_jpe_user_date
    ON journal_page_entries(user_id, entry_date DESC);

ALTER TABLE journal_page_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'jpe_user_isolation'
    ) THEN
        CREATE POLICY jpe_user_isolation ON journal_page_entries
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_jpe_updated_at'
    ) THEN
        CREATE TRIGGER update_jpe_updated_at
        BEFORE UPDATE ON journal_page_entries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;


-- ── user_journal_types ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_journal_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Internal key used by Lumi for routing (e.g. 'content', 'travel', 'sermon')
    type_key        VARCHAR(100) NOT NULL,

    -- Display name shown in the UI
    label           VARCHAR(200) NOT NULL,

    -- Emoji for the book cover
    emoji           VARCHAR(10) DEFAULT '📓',

    -- Cover colour (hex)
    color           VARCHAR(7) DEFAULT '#7C3AED',

    -- Template definitions: array of { name, fields: [{key, label, type, placeholder, rows}] }
    -- Lumi uses this to know which fields to fill when routing to this journal type.
    templates       JSONB DEFAULT '[]',

    -- Keywords / phrases that should trigger routing to this journal type.
    -- E.g. ["content idea", "post idea", "caption idea", "reel idea"]
    routing_keywords JSONB DEFAULT '[]',

    is_active       BOOLEAN DEFAULT true,
    display_order   INTEGER DEFAULT 0,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (user_id, type_key)
);

CREATE INDEX IF NOT EXISTS idx_ujt_user
    ON user_journal_types(user_id, is_active);

ALTER TABLE user_journal_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'ujt_user_isolation'
    ) THEN
        CREATE POLICY ujt_user_isolation ON user_journal_types
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_ujt_updated_at'
    ) THEN
        CREATE TRIGGER update_ujt_updated_at
        BEFORE UPDATE ON user_journal_types
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
