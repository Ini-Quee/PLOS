-- OAuth CSRF state tokens — prevents account hijacking via state parameter forgery
CREATE TABLE IF NOT EXISTS oauth_states (
  state       VARCHAR(64) PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
