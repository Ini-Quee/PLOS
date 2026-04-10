-- Migration to add encrypted analysis fields for zero-knowledge AI analysis
-- Analysis is encrypted client-side and stored as encrypted data

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS encrypted_analysis TEXT,
ADD COLUMN IF NOT EXISTS analysis_iv TEXT,
ADD COLUMN IF NOT EXISTS analysis_salt TEXT;

-- Add index for encrypted analysis lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_ai_mood 
ON journal_entries(user_id, ai_mood) 
WHERE ai_mood IS NOT NULL;
