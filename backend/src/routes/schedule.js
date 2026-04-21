/**
 * Schedule Routes
 * Per AGENTS.md Part 6.5 — Daily Routine & Smart Scheduler
 * All routes require authentication + audit logging + input validation
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { auditLog } = require('../middleware/auditLog');
const { validateInput } = require('../middleware/validateInput');
const { query, body, param } = require('express-validator');
const { pool } = require('../db/connection');

/**
 * GET /api/schedule
 * Get all schedules for the user
 */
router.get(
  '/',
  authenticate,
  auditLog('view_schedules'),
  async (req, res) => {
    try {
      const schedules = await pool.query(
        `SELECT * FROM schedules
         WHERE user_id = $1 AND is_active = true
         ORDER BY start_time ASC`,
        [req.user.id]
      );

      res.json({ schedules });
    } catch (err) {
      console.error('Error fetching schedules:', err);
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  }
);

/**
 * GET /api/schedule/today
 * Get today's schedule with completion status
 */
router.get(
  '/today',
  authenticate,
  auditLog('view_today_schedule'),
  async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();

// Get schedules that apply to today
    const result = await pool.query(
      `SELECT s.*,
      CASE WHEN sc.id IS NOT NULL THEN true ELSE false END as completed,
      sc.completed_at,
      sc.notes as completion_notes
      FROM schedules s
      LEFT JOIN schedule_completions sc ON s.id = sc.schedule_id
      AND sc.completion_date = $2
      WHERE s.user_id = $1
      AND s.is_active = true
      AND (
      -- One-time events for today
      (s.repeat_pattern = 'none' AND s.target_date = $2)
      -- Daily repeating
      OR s.repeat_pattern = 'daily'
      -- Weekdays (Mon-Fri)
      OR (s.repeat_pattern = 'weekdays' AND $3 BETWEEN 1 AND 5)
      -- Weekly
      OR (s.repeat_pattern = 'weekly' AND $3 = ANY(s.repeat_days))
      -- Custom days
      OR (s.repeat_pattern = 'custom' AND $3 = ANY(s.repeat_days))
      )
      ORDER BY s.start_time ASC`,
      [req.user.id, today, dayOfWeek]
    );

    const schedules = result.rows;

    // Calculate streaks for each schedule
    const schedulesWithStreaks = await Promise.all(
      schedules.map(async (schedule) => {
          const streak = await calculateStreak(schedule.id, req.user.id);
          return { ...schedule, streak };
        })
      );

      res.json({ schedules: schedulesWithStreaks, date: today });
    } catch (err) {
      console.error('Error fetching today schedule:', err);
      res.status(500).json({ error: 'Failed to fetch today schedule' });
    }
  }
);

/**
 * POST /api/schedule
 * Create a new schedule
 */
router.post(
  '/',
  authenticate,
  auditLog('create_schedule'),
  validateInput([
    body('title').notEmpty().withMessage('Title is required'),
    body('start_time').notEmpty().withMessage('Start time is required'),
    body('category').isIn(['wellness', 'work', 'personal', 'learning', 'lumi-suggested']).optional(),
    body('repeat_pattern').isIn(['none', 'daily', 'weekdays', 'weekly', 'custom']).optional(),
  ]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        start_time,
        duration_minutes,
        repeat_pattern,
        repeat_days,
        category,
        colour,
        is_high_priority,
        target_date,
      } = req.body;

const result = await pool.query(
      `INSERT INTO schedules
      (user_id, title, description, start_time, duration_minutes,
      repeat_pattern, repeat_days, category, colour, is_high_priority, target_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        req.user.id,
        title,
        description,
        start_time,
        duration_minutes || 60,
        repeat_pattern || 'none',
        repeat_days || null,
        category || 'personal',
        colour || '#F5A623',
        is_high_priority || false,
        target_date || null,
      ]
    );

    res.status(201).json({ schedule: result.rows[0] });
    } catch (err) {
      console.error('Error creating schedule:', err);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  }
);

/**
 * PUT /api/schedule/:id
 * Update a schedule
 */
router.put(
  '/:id',
  authenticate,
  auditLog('update_schedule'),
  validateInput([
    param('id').isUUID(),
    body('title').notEmpty().withMessage('Title is required'),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        start_time,
        duration_minutes,
        repeat_pattern,
        repeat_days,
        category,
        colour,
        is_high_priority,
        is_active,
      } = req.body;

// Verify ownership
    const existing = await pool.query(
      'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const result = await pool.query(
        `UPDATE schedules SET
         title = $1, description = $2, start_time = $3, duration_minutes = $4,
         repeat_pattern = $5, repeat_days = $6, category = $7, colour = $8,
         is_high_priority = $9, is_active = $10, updated_at = NOW()
         WHERE id = $11 AND user_id = $12
         RETURNING *`,
        [
          title,
          description,
          start_time,
          duration_minutes,
          repeat_pattern,
          repeat_days,
          category,
          colour,
          is_high_priority,
          is_active,
          id,
          req.user.id,
        ]
      );

      res.json({ schedule: result.rows[0] });
    } catch (err) {
      console.error('Error updating schedule:', err);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  }
);

/**
 * DELETE /api/schedule/:id
 * Delete a schedule (soft delete by setting is_active = false)
 */
router.delete(
  '/:id',
  authenticate,
  auditLog('delete_schedule'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE schedules SET is_active = false, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [id, req.user.id]
      );

if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ success: true });
    } catch (err) {
      console.error('Error deleting schedule:', err);
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  }
);

/**
 * POST /api/schedule/:id/complete
 * Mark a schedule as complete for today
 */
router.post(
  '/:id/complete',
  authenticate,
  auditLog('complete_schedule'),
  validateInput([
    param('id').isUUID(),
    body('notes').optional().isString(),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const today = new Date().toISOString().split('T')[0];

// Verify schedule exists and belongs to user
    const scheduleResult = await pool.query(
      'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

      // Mark as complete
      await pool.query(
        `INSERT INTO schedule_completions
         (schedule_id, user_id, completion_date, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (schedule_id, completion_date)
         DO UPDATE SET completed_at = NOW(), notes = $4`,
        [id, req.user.id, today, notes]
      );

      // Calculate new streak
      const streak = await calculateStreak(id, req.user.id);

      res.json({
        success: true,
        completed: true,
        streak,
      });
    } catch (err) {
      console.error('Error completing schedule:', err);
      res.status(500).json({ error: 'Failed to complete schedule' });
    }
  }
);

/**
 * DELETE /api/schedule/:id/complete
 * Unmark a schedule as complete for today
 */
router.delete(
  '/:id/complete',
  authenticate,
  auditLog('uncomplete_schedule'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const today = new Date().toISOString().split('T')[0];

      await pool.query(
        `DELETE FROM schedule_completions
         WHERE schedule_id = $1 AND user_id = $2 AND completion_date = $3`,
        [id, req.user.id, today]
      );

      const streak = await calculateStreak(id, req.user.id);

      res.json({
        success: true,
        completed: false,
        streak,
      });
    } catch (err) {
      console.error('Error uncompleting schedule:', err);
      res.status(500).json({ error: 'Failed to uncomplete schedule' });
    }
  }
);

/**
 * GET /api/schedule/streak/:id
 * Get streak for a specific schedule
 */
router.get(
  '/streak/:id',
  authenticate,
  auditLog('view_streak'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const streak = await calculateStreak(id, req.user.id);
      res.json({ streak });
    } catch (err) {
      console.error('Error fetching streak:', err);
      res.status(500).json({ error: 'Failed to fetch streak' });
    }
  }
);

/**
 * Calculate streak for a schedule
 * @param {string} scheduleId - Schedule ID
 * @param {string} userId - User ID
 * @returns {number} Streak count
 */
async function calculateStreak(scheduleId, userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

// Get completion dates for the last 365 days
    const completionsResult = await pool.query(
      `SELECT completion_date FROM schedule_completions
      WHERE schedule_id = $1 AND user_id = $2
      AND completion_date >= $3
      ORDER BY completion_date DESC`,
      [scheduleId, userId, new Date(today - 365 * 24 * 60 * 60 * 1000)]
    );

    const completions = completionsResult.rows;

    if (completions.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date(today);

    // Check if completed today or yesterday
    const latestCompletion = new Date(completions[0].completion_date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (latestCompletion.getTime() !== today.getTime() &&
      latestCompletion.getTime() !== yesterday.getTime()) {
      // Not completed today or yesterday, streak broken
      return 0;
    }

    // Count consecutive days
    const completionDates = new Set(
      completions.map(c => c.completion_date.toISOString().split('T')[0])
    );

  while (true) {
    const dateString = checkDate.toISOString().split('T')[0];
    if (completionDates.has(dateString)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (checkDate.getTime() === today.getTime()) {
      // Today not completed, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = router;
