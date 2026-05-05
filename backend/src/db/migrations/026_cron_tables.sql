-- Dedup log for push notifications — prevents duplicate sends on restart or multi-instance
CREATE TABLE IF NOT EXISTS push_notification_log (
  id          SERIAL PRIMARY KEY,
  schedule_id UUID        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  sent_minute SMALLINT    NOT NULL,
  UNIQUE (schedule_id, user_id, sent_date, sent_minute)
);

CREATE INDEX IF NOT EXISTS idx_push_log_date ON push_notification_log(sent_date);

-- Cron job run history for observability
CREATE TABLE IF NOT EXISTS cron_job_runs (
  id             SERIAL PRIMARY KEY,
  job_name       VARCHAR(100) NOT NULL,
  started_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  status         VARCHAR(20)  NOT NULL DEFAULT 'running',
  error_message  TEXT,
  affected_rows  INTEGER      DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_job ON cron_job_runs(job_name, started_at DESC);
