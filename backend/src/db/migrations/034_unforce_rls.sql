-- Migration 034: roll back the FORCE ROW LEVEL SECURITY from migration 033.
--
-- WHY: 033 turned on FORCE RLS for the app's owner role, but the app does NOT
-- yet set `app.current_user_id` per request (the withUserContext helper is wired
-- into nothing) and the dedicated `plos_app` role does not exist. With FORCE on,
-- queries through the plain pool fail the policy check and return no rows / error
-- on any DB role that is subject to RLS — which breaks the app on deploy.
--
-- This migration restores the pre-033 posture: RLS stays ENABLED, but the owner
-- bypasses it again (no regression vs. before stage-4). Re-apply FORCE later via a
-- new migration ONLY after: (1) the plos_app least-privilege role exists,
-- (2) policies are fail-safe (current_setting(..., true) + NULLIF), and
-- (3) all query paths run through withUserContext. See SECURITY_RLS_HOTFIX.md.
--
-- Guarded with a DO block so it can never fail on a table that doesn't exist.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'journal_page_entries','user_journal_types','daily_entries','weekly_reviews','monthly_compasses',
    'lumi_daily_entries','lumi_detected_patterns','lumi_action_log',
    'budget_entries','budget_goals','savings_goals',
    'schedules','schedule_completions','scheduled_posts','post_templates','daily_intentions',
    'year_goals','tasks','projects','learning_items','affirmations',
    'books','reading_sessions',
    'contacts','email_logs','email_templates',
    'job_applications','user_preferences','user_oauth_tokens'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
      EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;
