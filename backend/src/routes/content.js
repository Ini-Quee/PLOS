/**
 * Content Routes
 * Per AGENTS.md Part 6.9 — Content Planner
 * Copy-paste notification system, no API costs
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const auditLog = require('../middleware/auditLog');
const validateInput = require('../middleware/validateInput');
const { body, param, query } = require('express-validator');
const db = require('../db/connection');

/**
 * GET /api/content/posts
 * Get all scheduled posts
 */
router.get(
  '/posts',
  authenticate,
  auditLog('view_posts'),
  async (req, res) => {
    try {
      const { status, start_date, end_date } = req.query;

      let sql = `SELECT * FROM scheduled_posts WHERE user_id = $1`;
      const params = [req.user.id];
      let paramIndex = 2;

      if (status) {
        sql += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (start_date) {
        sql += ` AND scheduled_for >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        sql += ` AND scheduled_for <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      sql += ` ORDER BY scheduled_for ASC`;

      const posts = await db.query(sql, params);
      res.json({ posts });
    } catch (err) {
      console.error('Error fetching posts:', err);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }
);

/**
 * GET /api/content/posts/due
 * Get posts that are due (for cron job)
 */
router.get(
  '/posts/due',
  authenticate,
  async (req, res) => {
    try {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);

      const posts = await db.query(
        `SELECT * FROM scheduled_posts
         WHERE user_id = $1
         AND status = 'scheduled'
         AND scheduled_for <= $2
         AND scheduled_for >= $3
         ORDER BY scheduled_for ASC`,
        [req.user.id, now, fifteenMinutesAgo]
      );

      res.json({ posts });
    } catch (err) {
      console.error('Error fetching due posts:', err);
      res.status(500).json({ error: 'Failed to fetch due posts' });
    }
  }
);

/**
 * POST /api/content/posts
 * Create a new scheduled post
 */
router.post(
  '/posts',
  authenticate,
  auditLog('create_post'),
  validateInput([
    body('platform').notEmpty().withMessage('Platform is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('scheduled_for').isISO8601().withMessage('Valid scheduled date is required'),
  ]),
  async (req, res) => {
    try {
      const { platform, content, scheduled_for, is_memorial } = req.body;

      const post = await db.query(
        `INSERT INTO scheduled_posts
         (user_id, platform, content, scheduled_for, is_memorial)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, platform, content, scheduled_for, is_memorial || false]
      );

      res.status(201).json({ post: post[0] });
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

/**
 * PUT /api/content/posts/:id
 * Update a post
 */
router.put(
  '/posts/:id',
  authenticate,
  auditLog('update_post'),
  validateInput([
    param('id').isUUID(),
    body('platform').notEmpty().optional(),
    body('content').notEmpty().optional(),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { platform, content, scheduled_for, is_memorial } = req.body;

      const post = await db.query(
        `UPDATE scheduled_posts SET
         platform = COALESCE($1, platform),
         content = COALESCE($2, content),
         scheduled_for = COALESCE($3, scheduled_for),
         is_memorial = COALESCE($4, is_memorial),
         updated_at = NOW()
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [platform, content, scheduled_for, is_memorial, id, req.user.id]
      );

      if (post.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({ post: post[0] });
    } catch (err) {
      console.error('Error updating post:', err);
      res.status(500).json({ error: 'Failed to update post' });
    }
  }
);

/**
 * POST /api/content/posts/:id/mark-posted
 * Mark a post as posted (user copied and pasted)
 */
router.post(
  '/posts/:id/mark-posted',
  authenticate,
  auditLog('mark_post_posted'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { likes, comments, reposts } = req.body;

      const post = await db.query(
        `UPDATE scheduled_posts SET
         status = 'posted',
         posted_at = NOW(),
         likes = COALESCE($1, likes),
         comments = COALESCE($2, comments),
         reposts = COALESCE($3, reposts),
         updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [likes, comments, reposts, id, req.user.id]
      );

      if (post.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({ post: post[0] });
    } catch (err) {
      console.error('Error marking post:', err);
      res.status(500).json({ error: 'Failed to mark post' });
    }
  }
);

/**
 * DELETE /api/content/posts/:id
 * Cancel/delete a post
 */
router.delete(
  '/posts/:id',
  authenticate,
  auditLog('delete_post'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `UPDATE scheduled_posts SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [id, req.user.id]
      );

      if (result.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  }
);

// ===== TEMPLATES =====

/**
 * GET /api/content/templates
 * Get all post templates
 */
router.get(
  '/templates',
  authenticate,
  auditLog('view_templates'),
  async (req, res) => {
    try {
      const templates = await db.query(
        `SELECT * FROM post_templates
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json({ templates });
    } catch (err) {
      console.error('Error fetching templates:', err);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  }
);

/**
 * POST /api/content/templates
 * Create a template
 */
router.post(
  '/templates',
  authenticate,
  auditLog('create_template'),
  validateInput([
    body('name').notEmpty().withMessage('Template name is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ]),
  async (req, res) => {
    try {
      const { name, platform, content } = req.body;

      const template = await db.query(
        `INSERT INTO post_templates
         (user_id, name, platform, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, name, platform, content]
      );

      res.status(201).json({ template: template[0] });
    } catch (err) {
      console.error('Error creating template:', err);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
);

module.exports = router;
