-- Per-user settings stored as JSONB — avoids adding columns for every new setting
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
