CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    encrypted_content TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    encryption_salt TEXT NOT NULL,

    word_count INTEGER,
    character_count INTEGER,
    duration_seconds INTEGER,

    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id
  ON journal_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_recorded_at
  ON journal_entries(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_recorded_at
  ON journal_entries(user_id, recorded_at DESC);