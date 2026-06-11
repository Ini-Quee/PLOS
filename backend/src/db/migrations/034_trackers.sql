-- Trackers: user-generated streak trackers for anything.
-- Mirrors habits/habit_completions so the existing streak + grid engine works.
CREATE TABLE IF NOT EXISTS trackers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  emoji          VARCHAR(10) DEFAULT '✅',
  type           VARCHAR(20) NOT NULL DEFAULT 'chain',   -- 'chain' | 'challenge' | 'count'
  target_days    INTEGER,                                 -- for 'challenge' (e.g. 75)
  target_count   INTEGER,                                 -- for 'count' (e.g. 100 workouts)
  target_dow     INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',     -- which weekdays count
  color          VARCHAR(7) DEFAULT '#C8955C',
  revival_tokens INTEGER DEFAULT 2,
  start_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active      BOOLEAN DEFAULT true,
  archived_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracker_marks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id  UUID NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mark_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tracker_id, mark_date)
);

CREATE INDEX IF NOT EXISTS idx_trackers_user_active ON trackers(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tracker_marks_tracker ON tracker_marks(tracker_id, mark_date DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_marks_user_date ON tracker_marks(user_id, mark_date DESC);

ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_marks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'trackers_user_isolation'
  ) THEN
    CREATE POLICY trackers_user_isolation ON trackers
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'tracker_marks_user_isolation'
  ) THEN
    CREATE POLICY tracker_marks_user_isolation ON tracker_marks
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
  END IF;
END $$;
