/**
 * Contacts & Email Routes
 * Per AGENTS.md Part 6.10 — Email Automation
 * Uses Nodemailer with Gmail SMTP (user's own account)
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { auditLog } = require('../middleware/auditLog');
const { validateInput } = require('../middleware/validateInput');
const { body, param } = require('express-validator');
const { pool } = require('../db/connection');
const nodemailer = require('nodemailer');

/**
 * GET /api/contacts
 * Get all contacts
 */
router.get(
  '/',
  authenticate,
  auditLog('view_contacts'),
  async (req, res) => {
    try {
      const { category } = req.query;

      let sql = `SELECT * FROM contacts WHERE user_id = $1`;
      const params = [req.user.id];

      if (category) {
        sql += ` AND category = $2`;
        params.push(category);
      }

      sql += ` ORDER BY name ASC`;

    const result = await pool.query(sql, params);
    const contacts = result.rows;
    res.json({ contacts });
    } catch (err) {
      console.error('Error fetching contacts:', err);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }
);

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post(
  '/',
  authenticate,
  auditLog('create_contact'),
  validateInput([
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ]),
  async (req, res) => {
    try {
      const { name, email, category, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO contacts (user_id, name, email, category, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [req.user.id, name, email, category || 'personal', notes]
    );
    const contact = result.rows;

    res.status(201).json({ contact: contact[0] });
    } catch (err) {
      console.error('Error creating contact:', err);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }
);

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
router.put(
  '/:id',
  authenticate,
  auditLog('update_contact'),
  validateInput([
    param('id').isUUID(),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, category, notes } = req.body;

    const result = await pool.query(
      `UPDATE contacts SET
      name = $1, email = $2, category = $3, notes = $4, updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING *`,
      [name, email, category, notes, id, req.user.id]
    );
    const contact = result.rows;

    if (contact.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact: contact[0] });
    } catch (err) {
      console.error('Error updating contact:', err);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }
);

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete(
  '/:id',
  authenticate,
  auditLog('delete_contact'),
  validateInput([param('id').isUUID()]),
  async (req, res) => {
    try {
      const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting contact:', err);
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  }
);

/**
 * GET /api/contacts/stats
 * Get email statistics
 */
router.get(
  '/stats',
  authenticate,
  auditLog('view_email_stats'),
  async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const statsResult = await pool.query(
      `SELECT
      COUNT(*) FILTER (WHERE DATE(sent_at) = $2) as today,
      COUNT(*) FILTER (WHERE sent_at >= $3) as this_week,
      COUNT(*) as total,
      COUNT(DISTINCT contact_id) as unique_contacts
      FROM email_logs
      WHERE user_id = $1 AND status = 'sent'`,
      [req.user.id, today, weekAgo]
    );

    const contactCountResult = await pool.query(
      'SELECT COUNT(*) as total FROM contacts WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      emails: statsResult.rows[0],
      contacts: parseInt(contactCountResult.rows[0].total),
    });
    } catch (err) {
      console.error('Error fetching stats:', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
);

// ===== EMAIL SENDING =====

/**
 * POST /api/contacts/send-email
 * Send an email using user's Gmail
 */
router.post(
  '/send-email',
  authenticate,
  auditLog('send_email'),
  validateInput([
    body('to').isEmail().withMessage('Valid recipient email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('body').notEmpty().withMessage('Body is required'),
  ]),
  async (req, res) => {
    try {
      const { to, to_name, subject, body, contact_id } = req.body;

      // Check if Gmail is configured
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return res.status(400).json({
          error: 'Gmail not configured. Please connect your Gmail in Settings.',
        });
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      // Send email
      const info = await transporter.sendMail({
        from: `"${req.user.name || 'PLOS'}" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: subject,
        text: body,
        html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${body}</pre>`,
      });

      // Log the email
    const logResult = await pool.query(
      `INSERT INTO email_logs
      (user_id, contact_id, to_email, to_name, subject, body, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'sent')
      RETURNING *`,
      [req.user.id, contact_id || null, to, to_name || null, subject, body]
    );

    // Update last_contacted if contact_id provided
    if (contact_id) {
      await pool.query(
        `UPDATE contacts SET last_contacted = CURRENT_DATE, updated_at = NOW()
        WHERE id = $1 AND user_id = $2`,
        [contact_id, req.user.id]
      );
    }

    res.json({
      success: true,
      messageId: info.messageId,
      log: logResult.rows[0],
    });
    } catch (err) {
      console.error('Error sending email:', err);

      // Log the failure
      await pool.query(
        `INSERT INTO email_logs
         (user_id, contact_id, to_email, to_name, subject, body, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, 'failed', $7)`,
        [
          req.user.id,
          req.body.contact_id || null,
          req.body.to,
          req.body.to_name || null,
          req.body.subject,
          req.body.body,
          err.message,
        ]
      );

      res.status(500).json({
        error: 'Failed to send email',
        details: err.message,
      });
    }
  }
);

/**
 * GET /api/contacts/email-logs
 * Get email history
 */
router.get(
  '/email-logs',
  authenticate,
  auditLog('view_email_logs'),
  async (req, res) => {
    try {
    const result = await pool.query(
      `SELECT el.*, c.name as contact_name
      FROM email_logs el
      LEFT JOIN contacts c ON el.contact_id = c.id
      WHERE el.user_id = $1
      ORDER BY el.sent_at DESC
      LIMIT 50`,
      [req.user.id]
    );
    const logs = result.rows;

    res.json({ logs });
    } catch (err) {
      console.error('Error fetching logs:', err);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  }
);

// ===== EMAIL TEMPLATES =====

/**
 * GET /api/contacts/templates
 * Get email templates
 */
router.get(
  '/templates',
  authenticate,
  auditLog('view_email_templates'),
  async (req, res) => {
    try {
    const result = await pool.query(
      `SELECT * FROM email_templates
      WHERE user_id = $1
      ORDER BY category, name`,
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
 * POST /api/contacts/templates
 * Create email template
 */
router.post(
  '/templates',
  authenticate,
  auditLog('create_email_template'),
  validateInput([
    body('name').notEmpty().withMessage('Template name is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('body').notEmpty().withMessage('Body is required'),
  ]),
  async (req, res) => {
    try {
      const { name, subject, body, category } = req.body;

    const result = await pool.query(
      `INSERT INTO email_templates (user_id, name, subject, body, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [req.user.id, name, subject, body, category || 'general']
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
