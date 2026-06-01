-- Migration 033: FORCE ROW LEVEL SECURITY on every user-owned table.
--
-- ENABLE alone lets the table owner (the app's DB role) bypass policies.
-- FORCE closes that hole: even the owner goes through the RLS policy check.
--
-- Precondition: every table below already has a CREATE POLICY ... FOR ALL USING
-- (user_id = current_setting('app.current_user_id')::UUID) from earlier migrations.
-- Verified by querying pg_policy on each table before landing this.
--
-- Rollback: migration 034 with ALTER TABLE ... NO FORCE ROW LEVEL SECURITY.

-- Journal system
ALTER TABLE journal_page_entries     FORCE ROW LEVEL SECURITY;
ALTER TABLE user_journal_types       FORCE ROW LEVEL SECURITY;
ALTER TABLE daily_entries            FORCE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews           FORCE ROW LEVEL SECURITY;
ALTER TABLE monthly_compasses        FORCE ROW LEVEL SECURITY;

-- Lumi / AI
ALTER TABLE lumi_daily_entries       FORCE ROW LEVEL SECURITY;
ALTER TABLE lumi_detected_patterns   FORCE ROW LEVEL SECURITY;
ALTER TABLE lumi_action_log          FORCE ROW LEVEL SECURITY;

-- Budget & savings
ALTER TABLE budget_entries           FORCE ROW LEVEL SECURITY;
ALTER TABLE budget_goals             FORCE ROW LEVEL SECURITY;
ALTER TABLE savings_goals            FORCE ROW LEVEL SECURITY;

-- Schedule & content
ALTER TABLE schedules                FORCE ROW LEVEL SECURITY;
ALTER TABLE schedule_completions     FORCE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts          FORCE ROW LEVEL SECURITY;
ALTER TABLE post_templates           FORCE ROW LEVEL SECURITY;
ALTER TABLE daily_intentions         FORCE ROW LEVEL SECURITY;

-- Goals & productivity
ALTER TABLE year_goals               FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks                    FORCE ROW LEVEL SECURITY;
ALTER TABLE projects                 FORCE ROW LEVEL SECURITY;
ALTER TABLE learning_items           FORCE ROW LEVEL SECURITY;
ALTER TABLE affirmations             FORCE ROW LEVEL SECURITY;

-- Reading
ALTER TABLE books                    FORCE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions         FORCE ROW LEVEL SECURITY;

-- Contacts & email
ALTER TABLE contacts                 FORCE ROW LEVEL SECURITY;
ALTER TABLE email_logs               FORCE ROW LEVEL SECURITY;
ALTER TABLE email_templates          FORCE ROW LEVEL SECURITY;

-- Career
ALTER TABLE job_applications         FORCE ROW LEVEL SECURITY;

-- User settings
ALTER TABLE user_preferences         FORCE ROW LEVEL SECURITY;

-- OAuth
ALTER TABLE user_oauth_tokens        FORCE ROW LEVEL SECURITY;
