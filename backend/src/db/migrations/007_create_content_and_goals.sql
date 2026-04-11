-- Migration 007: Create content and goals tables
-- Per AGENTS.md Part 6.9 and 6.11

-- Scheduled posts table (for Content Planner)
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'linkedin', 'twitter', 'instagram', etc.
    content TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'posted', 'cancelled'
    posted_at TIMESTAMP WITH TIME ZONE,
    is_memorial BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    reposts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post templates table
CREATE TABLE IF NOT EXISTS post_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    platform VARCHAR(50),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Year goals table (for Year Planning)
CREATE TABLE IF NOT EXISTS year_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    quarter INTEGER, -- 1, 2, 3, 4 or NULL for full year
    month INTEGER, -- 1-12 or NULL
    week INTEGER, -- 1-52 or NULL
    is_complete BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily intentions table
CREATE TABLE IF NOT EXISTS daily_intentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    intention_date DATE NOT NULL DEFAULT CURRENT_DATE,
    intention TEXT NOT NULL,
    is_spoken BOOLEAN DEFAULT false,
    spoken_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_status ON scheduled_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_scheduled ON scheduled_posts(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_year_goals_user_year ON year_goals(user_id, year);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_user_date ON daily_intentions(user_id, intention_date);

-- Unique constraint for daily intention
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_intentions_unique
ON daily_intentions(user_id, intention_date);

-- RLS policies
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_intentions ENABLE ROW LEVEL SECURITY;

-- User isolation policies (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scheduled_posts_user_isolation') THEN
        CREATE POLICY scheduled_posts_user_isolation ON scheduled_posts
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'post_templates_user_isolation') THEN
        CREATE POLICY post_templates_user_isolation ON post_templates
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'year_goals_user_isolation') THEN
        CREATE POLICY year_goals_user_isolation ON year_goals
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'daily_intentions_user_isolation') THEN
        CREATE POLICY daily_intentions_user_isolation ON daily_intentions
        FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
    END IF;
END $$;

-- Update triggers (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_scheduled_posts_updated_at') THEN
        CREATE TRIGGER update_scheduled_posts_updated_at
        BEFORE UPDATE ON scheduled_posts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_year_goals_updated_at') THEN
        CREATE TRIGGER update_year_goals_updated_at
        BEFORE UPDATE ON year_goals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
