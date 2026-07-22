-- Bootstrap: mark all pre-existing migrations as already applied.
-- Runs ON CONFLICT DO NOTHING so it's safe on a fresh DB and on an existing one.
INSERT INTO schema_migrations (filename) VALUES
  ('001_create_users.sql'),
  ('002_create_journal_entries.sql'),
  ('003_add_ai_analysis.sql'),
  ('004_add_encrypted_analysis.sql'),
  ('005_create_schedules.sql'),
  ('006_create_affirmations_and_more.sql'),
  ('007_create_content_and_goals.sql'),
  ('008_create_email_tables.sql'),
  ('009_create_lumi_conversations.sql'),
  ('010_lumi_orchestration.sql'),
  ('011_create_budget.sql'),
  ('012_create_savings_goals.sql'),
  ('013_lumi_daily_entries.sql'),
  ('014_journal_page_entries.sql'),
  ('015_schedule_reminders.sql'),
  ('016_content_items.sql'),
  ('017_oauth_tokens.sql'),
  ('018_habits.sql'),
  ('019_habits_identity_revival.sql'),
  ('020_demo_account.sql'),
  ('021_lumi_persistent_memories.sql'),
  ('022_habit_commitments.sql'),
  ('023_push_subscriptions.sql')
ON CONFLICT (filename) DO NOTHING;
