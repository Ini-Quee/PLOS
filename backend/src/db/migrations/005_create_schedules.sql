-- Migration 005: Create schedules and schedule_completions tables
-- Per AGENTS.md Part 6.5 — Daily Routine & Smart Scheduler

-- Schedules table for recurring and one-off events
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  repeat_pattern VARCHAR(50) DEFAULT 'none', -- 'none', 'daily', 'weekdays', 'weekly', 'custom'
  repeat_days INTEGER[], -- For custom days: [0,1,2,3,4,5,6] where 0=Sunday
  category VARCHAR(50) DEFAULT 'personal', -- 'wellness', 'work', 'personal', 'learning', 'lumi-suggested'
  colour VARCHAR(7) DEFAULT '#F5A623', -- Hex color for calendar display
  is_high_priority BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  target_date DATE, -- For one-off events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule completions table for tracking completed routines
CREATE TABLE IF NOT EXISTS schedule_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_active ON schedules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_category ON schedules(user_id, category);
CREATE INDEX IF NOT EXISTS idx_schedule_completions_user_date ON schedule_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_schedule_completions_schedule ON schedule_completions(schedule_id, completion_date);

-- Unique constraint to prevent duplicate completions
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_completions_unique
ON schedule_completions(schedule_id, completion_date);

-- Row Level Security (RLS) policies
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_completions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own schedules
CREATE POLICY schedules_user_isolation ON schedules
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Users can only see their own completions
CREATE POLICY completions_user_isolation ON schedule_completions
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
