-- Migration 035: undo the RLS write-block from 033 (reliably this time).
--
-- 033 ran `FORCE ROW LEVEL SECURITY` on ~28 user tables whose policies use the
-- ONE-argument current_setting('app.current_user_id') — which THROWS when that
-- value isn't set. The app never sets it (it isolates rows with WHERE user_id=$1
-- in every query), so writes to a forced table 500 (e.g. saving a journal page).
-- Habit writes work because `habits` was never in 033's list.
--
-- 034_unforce_rls.sql was meant to remove FORCE but the write-block persists, so
-- this migration re-applies NO FORCE under a fresh filename guaranteed to run.
-- NO FORCE returns the owner role the app connects as to bypassing RLS — the
-- pre-033, working posture. Row isolation is still enforced by WHERE user_id=$1.
--
-- Guarded so it can never fail on a table that doesn't exist (a failed migration
-- would stop the server from starting).

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
