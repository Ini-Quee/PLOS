ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS ai_tasks TEXT[],
ADD COLUMN IF NOT EXISTS ai_mood VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

CREATE TABLE IF NOT EXISTS journal_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP,
    attendees TEXT[],
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_actions_user_id ON journal_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_actions_entry_id ON journal_actions(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_actions_status ON journal_actions(user_id, status);

CREATE TABLE IF NOT EXISTS mood_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    mood VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_log_user_date ON mood_log(user_id, recorded_at DESC);