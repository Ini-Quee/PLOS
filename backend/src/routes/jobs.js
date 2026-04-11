/**
 * Job Tracker Routes
 * Per AGENTS.md Part 6.8 — Project, Learning & Job Tracker
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { auditLog } = require('../middleware/auditLog');
const { validateInput } = require('../middleware/validateInput');
const { body, param } = require('express-validator');
const db = require('../db/connection');

/**
 * GET /api/jobs/applications
 * Get all job applications for the user
 */
router.get(
  '/applications',
  authenticate,
  auditLog('view_job_applications'),
  async (req, res) => {
    try {
      const applications = await db.query(
        `SELECT * FROM job_applications
        WHERE user_id = $1
        ORDER BY 
          CASE status
            WHEN 'applied' THEN 1
            WHEN 'interview' THEN 2
            WHEN 'offer' THEN 3
            WHEN 'rejected' THEN 4
          END,
          date_applied DESC`,
        [req.user.id]
      );

      res.json({ applications });
    } catch (err) {
      console.error('Error fetching job applications:', err);
      res.status(500).json({ error: 'Failed to fetch job applications' });
    }
  }
);

/**
 * POST /api/jobs/applications
 * Add a new job application
 */
router.post(
  '/applications',
  authenticate,
  auditLog('create_job_application'),
  validateInput([
    body('company').notEmpty().withMessage('Company name is required'),
    body('role').notEmpty().withMessage('Job role is required'),
    body('status').isIn(['applied', 'interview', 'offer', 'rejected']).optional(),
  ]),
  async (req, res) => {
    try {
      const { company, role, date_applied, status, notes } = req.body;

      const application = await db.query(
        `INSERT INTO job_applications
        (user_id, company, role, date_applied, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          req.user.id,
          company,
          role,
          date_applied || new Date().toISOString().split('T')[0],
          status || 'applied',
          notes,
        ]
      );

      res.status(201).json({ application: application[0] });
    } catch (err) {
      console.error('Error creating job application:', err);
      res.status(500).json({ error: 'Failed to create job application' });
    }
  }
);

/**
 * PUT /api/jobs/applications/:id
 * Update a job application
 */
router.put(
  '/applications/:id',
  authenticate,
  auditLog('update_job_application'),
  validateInput([
    param('id').isUUID(),
    body('company').notEmpty().optional(),
    body('role').notEmpty().optional(),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { company, role, date_applied, status, notes } = req.body;

      const application = await db.query(
        `UPDATE job_applications SET
        company = COALESCE($1, company),
        role = COALESCE($2, role),
        date_applied = COALESCE($3, date_applied),
        status = COALESCE($4, status),
        notes = COALESCE($5, notes),
        updated_at = NOW()
        WHERE id = $6 AND user_id = $7
        RETURNING *`,
        [company, role, date_applied, status, notes, id, req.user.id]
      );

      if (application.length === 0) {
        return res.status(404).json({ error: 'Job application not found' });
      }

      res.json({ application: application[0] });
    } catch (err) {
      console.error('Error updating job application:', err);
      res.status(500).json({ error: 'Failed to update job application' });
    }
  }
);

/**
 * DELETE /api/jobs/applications/:id
 * Delete a job application
 */
router.delete(
  '/applications/:id',
  authenticate,
  auditLog('delete_job_application'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

      if (result.length === 0) {
        return res.status(404).json({ error: 'Job application not found' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting job application:', err);
      res.status(500).json({ error: 'Failed to delete job application' });
    }
  }
);

/**
 * GET /api/jobs/stats
 * Get job application statistics
 */
router.get(
  '/stats',
  authenticate,
  auditLog('view_job_stats'),
  async (req, res) => {
    try {
      const stats = await db.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'applied') as applied,
          COUNT(*) FILTER (WHERE status = 'interview') as interviews,
          COUNT(*) FILTER (WHERE status = 'offer') as offers,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected
        FROM job_applications
        WHERE user_id = $1`,
        [req.user.id]
      );

      // Get weekly stats
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const weekly = await db.query(
        `SELECT COUNT(*) as count
        FROM job_applications
        WHERE user_id = $1 AND date_applied >= $2`,
        [req.user.id, weekAgo]
      );

      res.json({
        stats: {
          ...stats[0],
          weekly: parseInt(weekly[0].count),
        },
      });
    } catch (err) {
      console.error('Error fetching job stats:', err);
      res.status(500).json({ error: 'Failed to fetch job statistics' });
    }
  }
);

module.exports = router;
