/**
 * Content Routes
 * Per AGENTS.md Part 6.9 — Content Planner
 * Copy-paste notification system, no API costs
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { getLegacyClient } = require('../services/aiClient');
const { auditLog } = require('../middleware/auditLog');
const { validateInput } = require('../middleware/validateInput');
const { body, param, query } = require('express-validator');
const { pool } = require('../db/connection');

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

    const result = await pool.query(sql, params);
    const posts = result.rows;
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

    const result = await pool.query(
      `SELECT * FROM scheduled_posts
      WHERE user_id = $1
      AND status = 'scheduled'
      AND scheduled_for <= $2
      AND scheduled_for >= $3
      ORDER BY scheduled_for ASC`,
      [req.user.id, now, fifteenMinutesAgo]
    );
    const posts = result.rows;

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

    const result = await pool.query(
      `INSERT INTO scheduled_posts
      (user_id, platform, content, scheduled_for, is_memorial)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [req.user.id, platform, content, scheduled_for, is_memorial || false]
    );
    const post = result.rows;

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

    const result = await pool.query(
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
    const post = result.rows;

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

    const result = await pool.query(
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
    const post = result.rows;

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

    const result = await pool.query(
      `UPDATE scheduled_posts SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  }
);

/**
 * GET /api/content/posts/calendar?month=YYYY-MM
 * Returns all posts for a given month — used by the content calendar UI.
 */
router.get('/posts/calendar', authenticate, async (req, res) => {
  const uid = req.user.id;
  const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
  try {
    const result = await pool.query(
      `SELECT id, platform, title, content, scheduled_for, status, media_url, category, source
       FROM scheduled_posts
       WHERE user_id = $1
         AND date_trunc('month', scheduled_for) = date_trunc('month', $2::date)
       ORDER BY scheduled_for ASC`,
      [uid, `${month}-01`]
    );
    res.json({ posts: result.rows, month });
  } catch (err) {
    console.error('Content calendar error:', err);
    res.status(500).json({ error: 'Failed to load calendar' });
  }
});

/**
 * GET /api/content/posts/today
 * Returns posts due today — used by AlarmBar for content alerts.
 */
router.get('/posts/today', authenticate, async (req, res) => {
  const uid = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, platform, title, content, scheduled_for, status, media_url, category
       FROM scheduled_posts
       WHERE user_id = $1
         AND status = 'scheduled'
         AND DATE(scheduled_for AT TIME ZONE 'UTC') = CURRENT_DATE
       ORDER BY scheduled_for ASC`,
      [uid]
    );
    res.json({ posts: result.rows });
  } catch (err) {
    console.error('Content today error:', err);
    res.status(500).json({ error: 'Failed to load today content' });
  }
});

/**
 * POST /api/content/posts/bulk
 * Bulk-create scheduled posts — for year-long content planning or Lumi imports.
 * Body: { posts: [{ platform, content, scheduled_for, title?, category?, media_url? }] }
 */
router.post('/posts/bulk', authenticate, async (req, res) => {
  const uid = req.user.id;
  const { posts } = req.body;

  if (!Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({ error: 'posts array is required' });
  }
  if (posts.length > 500) {
    return res.status(400).json({ error: 'Maximum 500 posts per bulk import' });
  }

  const created = [];
  const failed  = [];

  for (const p of posts) {
    if (!p.platform || !p.content || !p.scheduled_for) {
      failed.push({ post: p, reason: 'Missing platform, content, or scheduled_for' });
      continue;
    }
    try {
      const r = await pool.query(
        `INSERT INTO scheduled_posts
           (user_id, platform, content, scheduled_for, title, category, media_url, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, platform, title, scheduled_for, status`,
        [uid, p.platform, p.content, p.scheduled_for,
         p.title || null, p.category || null, p.media_url || null, p.source || 'import']
      );
      created.push(r.rows[0]);
    } catch (err) {
      failed.push({ post: p, reason: err.message });
    }
  }

  res.status(201).json({
    created: created.length,
    failed:  failed.length,
    posts:   created,
    message: failed.length === 0
      ? `All ${created.length} posts scheduled!`
      : `${created.length} posts created, ${failed.length} failed.`,
  });
});

/**
 * POST /api/content/posts/import-from-lumi
 * Lumi parses a user's pasted content list and returns structured posts.
 * Body: { text: "..." }
 */
router.post('/posts/import-from-lumi', authenticate, async (req, res) => {
  const uid = req.user.id;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  try {
    const groq = getLegacyClient();

    const today = new Date().toISOString().slice(0, 10);
    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'system',
        content: `Today is ${today}. Extract content posts from the following text.
For each post return a JSON object with:
  platform (instagram/twitter/linkedin/facebook/tiktok/blog/email),
  content (the post text),
  title (short headline, max 60 chars),
  scheduled_for (ISO datetime, e.g. "2026-05-10T15:00:00Z"),
  category (lifestyle/business/faith/fitness/food/travel/other).
If the date is relative (e.g. "next Friday", "in 2 weeks"), calculate from today.
Return ONLY a JSON array, no markdown.`
      }, {
        role: 'user',
        content: text.slice(0, 4000),
      }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    let posts = [];
    try { posts = JSON.parse(match?.[0] || '[]'); } catch {}

    res.json({
      posts,
      message: posts.length
        ? `Found ${posts.length} post${posts.length > 1 ? 's' : ''} in your content. Review and confirm to schedule them.`
        : "I couldn't extract any posts. Try pasting in a clearer format: one post per line with a date.",
    });
  } catch (err) {
    console.error('Import from Lumi error:', err);
    res.status(500).json({ error: 'Failed to parse content' });
  }
});

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
    const result = await pool.query(
      `SELECT * FROM post_templates
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [req.user.id]
    );
    const templates = result.rows;

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

    const result = await pool.query(
      `INSERT INTO post_templates
      (user_id, name, platform, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [req.user.id, name, platform, content]
    );
    const template = result.rows;

    res.status(201).json({ template: template[0] });
    } catch (err) {
      console.error('Error creating template:', err);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
);

module.exports = router;
