-- Migration 017: OAuth tokens for Google (Gmail + Drive)
CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      VARCHAR(20) NOT NULL DEFAULT 'google',
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMP WITH TIME ZONE,
  scopes        TEXT[] DEFAULT '{}',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_oauth_tokens'
      AND policyname = 'oauth_tokens_user_isolation'
  ) THEN
    CREATE POLICY oauth_tokens_user_isolation ON user_oauth_tokens
      USING (user_id::text = current_setting('app.current_user_id', true));
  END IF;
END$$;

DROP TRIGGER IF EXISTS trg_oauth_tokens_updated_at ON user_oauth_tokens;
CREATE TRIGGER trg_oauth_tokens_updated_at
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
