-- Migration 016: Extend scheduled_posts with title, category, source, media_url
-- (content_items concept merged into the existing scheduled_posts table)

ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS title      VARCHAR(300),
  ADD COLUMN IF NOT EXISTS category   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source     VARCHAR(20) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS media_url  TEXT;

-- Index for calendar view (range queries by date)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_scheduled_for
  ON scheduled_posts (user_id, scheduled_for DESC);

COMMENT ON COLUMN scheduled_posts.title IS 'Short title / caption headline';
COMMENT ON COLUMN scheduled_posts.category IS 'lifestyle, business, faith, fitness, etc.';
COMMENT ON COLUMN scheduled_posts.source IS 'user | lumi | import';
COMMENT ON COLUMN scheduled_posts.media_url IS 'Image or video URL / Google Drive link';
