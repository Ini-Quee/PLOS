-- Migration 006: Create affirmations, books, projects, and goals tables
-- Per AGENTS.md Part 6.7, 6.6, 6.8

-- Affirmations table (for AGENTS.md Part 6.7)
CREATE TABLE IF NOT EXISTS affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table (for AGENTS.md Part 6.6)
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  total_pages INTEGER,
  pages_read INTEGER DEFAULT 0,
  category VARCHAR(50) DEFAULT 'personal',
  is_complete BOOLEAN DEFAULT false,
  date_started DATE,
  date_completed DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading sessions table
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pages_read INTEGER NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (for AGENTS.md Part 6.8)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'personal',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'archived'
  progress_percent INTEGER DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (sub-tasks of projects)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning items table (for AGENTS.md Part 6.8)
CREATE TABLE IF NOT EXISTS learning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(100),
  url TEXT,
  modules_complete INTEGER DEFAULT 0,
  modules_total INTEGER,
  target_date DATE,
  cert_expiry DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications table (for AGENTS.md Part 6.8)
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  date_applied DATE,
  status VARCHAR(50) DEFAULT 'applied', -- 'applied', 'interview', 'offer', 'rejected', 'withdrawn'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table (for settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'dark',
  living_background_enabled BOOLEAN DEFAULT false,
  background_theme VARCHAR(50) DEFAULT 'cloud',
  voice_enabled BOOLEAN DEFAULT true,
  voice_rate DECIMAL(3,2) DEFAULT 0.95,
  voice_pitch DECIMAL(3,2) DEFAULT 1.05,
  voice_name VARCHAR(100),
  journal_font VARCHAR(50) DEFAULT 'Caveat',
  journal_pen_color VARCHAR(7) DEFAULT '#1A1A1A',
  journal_paper_style VARCHAR(20) DEFAULT 'linen',
  notifications_enabled BOOLEAN DEFAULT false,
  check_in_time TIME DEFAULT '07:00',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affirmations_user_active ON affirmations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_complete ON books(user_id, is_complete);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_learning_items_user ON learning_items(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);

-- RLS policies
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- User isolation policies
CREATE POLICY affirmations_user_isolation ON affirmations
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY books_user_isolation ON books
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY reading_sessions_user_isolation ON reading_sessions
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY projects_user_isolation ON projects
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY tasks_user_isolation ON tasks
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY learning_items_user_isolation ON learning_items
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY job_applications_user_isolation ON job_applications
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_preferences_user_isolation ON user_preferences
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Update triggers
CREATE TRIGGER update_affirmations_updated_at
  BEFORE UPDATE ON affirmations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_items_updated_at
  BEFORE UPDATE ON learning_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
