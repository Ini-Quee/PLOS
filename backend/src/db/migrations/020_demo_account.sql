-- Migration 020: Demo account flag for investor demo mode
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_demo ON users(is_demo) WHERE is_demo = true;
