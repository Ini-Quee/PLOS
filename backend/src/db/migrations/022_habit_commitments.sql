CREATE TABLE IF NOT EXISTS habit_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_email TEXT NOT NULL,
  stake_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ,
  UNIQUE(habit_id, partner_email)
);

CREATE INDEX IF NOT EXISTS idx_habit_commitments_habit ON habit_commitments(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_commitments_user ON habit_commitments(user_id);
