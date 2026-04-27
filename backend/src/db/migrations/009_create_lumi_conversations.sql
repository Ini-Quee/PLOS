-- Migration: Create lumi_conversations table
-- Created: 2026-04-26

CREATE TABLE IF NOT EXISTS lumi_conversations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  lumi_response TEXT,
  route VARCHAR(50),
  saved_data JSONB,
  source VARCHAR(50) DEFAULT 'dashboard',
  transcript TEXT,
  needs_confirmation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lumi_conversations_user_id ON lumi_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_lumi_conversations_created_at ON lumi_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_lumi_conversations_user_created ON lumi_conversations(user_id, created_at DESC);
