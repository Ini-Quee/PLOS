-- Migration 015: Add reminder_minutes to schedules
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER DEFAULT 10;

COMMENT ON COLUMN schedules.reminder_minutes IS 'Minutes before start_time to fire an alarm. NULL = no reminder.';
