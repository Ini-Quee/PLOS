/**
 * Goals Routes
 * Per AGENTS.md Part 6.11 — Year Planning System
 * Year Goal → Quarterly Milestone → Monthly Theme → Weekly Priority → Daily Intention
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { auditLog } = require('../middleware/auditLog');
const { validateInput } = require('../middleware/validateInput');
const { body, param } = require('express-validator');
const db = require('../db/connection');

/**
 * GET /api/goals
 * Get year goals
 */
router.get(
  '/',
  authenticate,
  auditLog('view_goals'),
  async (req, res) => {
    try {
      const { year } = req.query;
      const targetYear = year || new Date().getFullYear();

      const goals = await db.query(
        `SELECT * FROM year_goals
         WHERE user_id = $1 AND year = $2
         ORDER BY
           quarter ASC NULLS LAST,
           month ASC NULLS LAST,
           week ASC NULLS LAST,
           display_order ASC`,
        [req.user.id, targetYear]
      );

      // Group by level
      const grouped = {
        year: goals.filter((g) => !g.quarter && !g.month && !g.week),
        quarters: {},
        months: {},
        weeks: {},
      };

      goals.forEach((goal) => {
        if (goal.quarter && !goal.month) {
          if (!grouped.quarters[goal.quarter]) grouped.quarters[goal.quarter] = [];
          grouped.quarters[goal.quarter].push(goal);
        } else if (goal.month && !goal.week) {
          if (!grouped.months[goal.month]) grouped.months[goal.month] = [];
          grouped.months[goal.month].push(goal);
        } else if (goal.week) {
          if (!grouped.weeks[goal.week]) grouped.weeks[goal.week] = [];
          grouped.weeks[goal.week].push(goal);
        }
      });

      res.json({ goals: grouped, year: targetYear });
    } catch (err) {
      console.error('Error fetching goals:', err);
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  }
);

/**
 * POST /api/goals
 * Create a goal
 */
router.post(
  '/',
  authenticate,
  auditLog('create_goal'),
  validateInput([body('title').notEmpty().withMessage('Goal title is required')]),
  async (req, res) => {
    try {
      const { title, description, year, quarter, month, week } = req.body;

      const goal = await db.query(
        `INSERT INTO year_goals
         (user_id, title, description, year, quarter, month, week)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.user.id,
          title,
          description,
          year || new Date().getFullYear(),
          quarter || null,
          month || null,
          week || null,
        ]
      );

      res.status(201).json({ goal: goal[0] });
    } catch (err) {
      console.error('Error creating goal:', err);
      res.status(500).json({ error: 'Failed to create goal' });
    }
  }
);

/**
 * PUT /api/goals/:id/complete
 * Mark goal complete
 */
router.post(
  '/:id/complete',
  authenticate,
  auditLog('complete_goal'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const goal = await db.query(
        `UPDATE year_goals SET
         is_complete = true, completed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, req.user.id]
      );

      if (goal.length === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ goal: goal[0] });
    } catch (err) {
      console.error('Error completing goal:', err);
      res.status(500).json({ error: 'Failed to complete goal' });
    }
  }
);

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete(
  '/:id',
  authenticate,
  auditLog('delete_goal'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM year_goals WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

      if (result.length === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting goal:', err);
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  }
);

// ===== DAILY INTENTIONS =====

/**
 * GET /api/goals/intention/today
 * Get today's intention
 */
router.get(
  '/intention/today',
  authenticate,
  auditLog('view_today_intention'),
  async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const intention = await db.query(
        `SELECT * FROM daily_intentions
         WHERE user_id = $1 AND intention_date = $2`,
        [req.user.id, today]
      );

      res.json({ intention: intention[0] || null });
    } catch (err) {
      console.error('Error fetching intention:', err);
      res.status(500).json({ error: 'Failed to fetch intention' });
    }
  }
);

/**
 * POST /api/goals/intention
 * Set today's intention
 */
router.post(
  '/intention',
  authenticate,
  auditLog('set_intention'),
  validateInput([body('intention').notEmpty().withMessage('Intention is required')]),
  async (req, res) => {
    try {
      const { intention } = req.body;
      const today = new Date().toISOString().split('T')[0];

      const result = await db.query(
        `INSERT INTO daily_intentions
         (user_id, intention_date, intention)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, intention_date)
         DO UPDATE SET intention = $3, updated_at = NOW()
         RETURNING *`,
        [req.user.id, today, intention]
      );

      res.json({ intention: result[0] });
    } catch (err) {
      console.error('Error setting intention:', err);
      res.status(500).json({ error: 'Failed to set intention' });
    }
  }
);

/**
 * POST /api/goals/intention/mark-spoken
 * Mark intention as spoken by Lumi
 */
router.post(
  '/intention/mark-spoken',
  authenticate,
  auditLog('mark_intention_spoken'),
  async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const result = await db.query(
        `UPDATE daily_intentions SET
         is_spoken = true, spoken_at = NOW()
         WHERE user_id = $1 AND intention_date = $2
         RETURNING *`,
        [req.user.id, today]
      );

      res.json({ intention: result[0] || null });
    } catch (err) {
      console.error('Error marking intention spoken:', err);
      res.status(500).json({ error: 'Failed to mark intention spoken' });
    }
  }
);

module.exports = router;
