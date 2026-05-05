-- PostgreSQL fallback for life audit session state (when Redis is unavailable)
CREATE TABLE IF NOT EXISTS lumi_audit_sessions (
  user_id      UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
