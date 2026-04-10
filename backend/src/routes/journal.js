const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');
const { validateInput } = require('../middleware/validateInput');
const { rateLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();

// Protect all journal routes
router.use(authenticate);

// --- GET all journal entries ---
router.get(
  '/entries',
  auditLog('journal_list', 'journal'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
          id, 
          recorded_at, 
          created_at,
          ai_mood,
          ai_summary,
          word_count
        FROM journal_entries 
        WHERE user_id = $1 
        ORDER BY recorded_at DESC`,
        [req.user.id]
      );

      res.json({ entries: result.rows });
    } catch (error) {
      console.error('Get journal entries error:', error);
      res.status(500).json({
        error: 'Failed to retrieve journal entries',
      });
    }
  }
);

const createEntrySchema = z.object({
  encryptedContent: z.string().min(1, 'Content is required'),
  encryptionIv: z.string().min(1, 'IV is required'),
  encryptionSalt: z.string().min(1, 'Salt is required'),
  wordCount: z.number().int().min(0).optional(),
  characterCount: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  recordedAt: z.string(),
  journalType: z.string().optional(),
});

// --- CREATE journal entry ---
router.post(
  '/',
  rateLimiter(100, 900, 'journal_create'),
  auditLog('journal_create', 'journal'),
  validateInput(createEntrySchema),
  async (req, res) => {
    try {
      const {
        encryptedContent,
        encryptionIv,
        encryptionSalt,
        wordCount,
        characterCount,
        durationSeconds,
        recordedAt,
        journalType,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO journal_entries
        (user_id, encrypted_content, encryption_iv, encryption_salt,
        word_count, character_count, duration_seconds, recorded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, recorded_at, created_at`,
        [
          req.user.id,
          encryptedContent,
          encryptionIv,
          encryptionSalt,
          wordCount || null,
          characterCount || null,
          durationSeconds || null,
          recordedAt,
        ]
      );

      const entry = result.rows[0];

      res.status(201).json({
        message: 'Journal entry created',
        entry: {
          id: entry.id,
          recorded_at: entry.recorded_at,
          created_at: entry.created_at,
        },
      });
    } catch (error) {
      console.error('Create journal entry error:', error);
      res.status(500).json({
        error: 'Failed to create journal entry',
      });
    }
  }
);

// --- UPDATE journal entry with AI analysis ---
const updateAnalysisSchema = z.object({
  aiMood: z.string().optional(),
  aiSummary: z.string().optional(),
  aiAnalysis: z.object({}).passthrough().optional(),
  encryptedAnalysis: z.string().optional(),
  analysisIv: z.string().optional(),
  analysisSalt: z.string().optional(),
});

router.patch(
  '/entries/:id/analysis',
  authenticate,
  validateInput(updateAnalysisSchema),
  auditLog('journal_analysis_update', 'journal'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        aiMood,
        aiSummary,
        aiAnalysis,
        encryptedAnalysis,
        analysisIv,
        analysisSalt,
      } = req.body;

      // Verify the entry belongs to the user
      const entryCheck = await pool.query(
        'SELECT id FROM journal_entries WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (entryCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      // Update the entry with AI analysis
      await pool.query(
        `UPDATE journal_entries
        SET ai_mood = $1,
            ai_summary = $2,
            ai_analysis = $3,
            encrypted_analysis = $4,
            analysis_iv = $5,
            analysis_salt = $6,
            updated_at = NOW()
        WHERE id = $7`,
        [
          aiMood || null,
          aiSummary || null,
          aiAnalysis ? JSON.stringify(aiAnalysis) : null,
          encryptedAnalysis || null,
          analysisIv || null,
          analysisSalt || null,
          id,
        ]
      );

      // Create action items from analysis if present
      if (aiAnalysis) {
        const commitments = aiAnalysis.commitments || [];
        const scheduleSuggestions = aiAnalysis.schedule_suggestions || [];

        for (const task of commitments) {
          await pool.query(
            `INSERT INTO journal_actions
            (user_id, journal_entry_id, action_type, title, status)
            VALUES ($1, $2, 'task', $3, 'pending')`,
            [req.user.id, id, task]
          );
        }

        for (const suggestion of scheduleSuggestions) {
          await pool.query(
            `INSERT INTO journal_actions
            (user_id, journal_entry_id, action_type, title, description, status)
            VALUES ($1, $2, 'schedule_suggestion', $3, $4, 'pending')`,
            [req.user.id, id, suggestion, 'Suggested from journal analysis']
          );
        }

        // Log mood if present
        if (aiAnalysis.mood && aiAnalysis.mood !== 'neutral') {
          await pool.query(
            `INSERT INTO mood_log (user_id, journal_entry_id, mood, recorded_at)
            VALUES ($1, $2, $3, NOW())`,
            [req.user.id, id, aiAnalysis.mood]
          );
        }
      }

      res.json({ message: 'Analysis updated successfully' });
    } catch (error) {
      console.error('Update analysis error:', error);
      res.status(500).json({
        error: 'Failed to update analysis',
      });
    }
  }
);

// --- GET pending action items ---
router.get(
  '/actions/pending',
  auditLog('journal_actions_list', 'journal'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          ja.id,
          ja.action_type,
          ja.title,
          ja.description,
          ja.scheduled_time,
          ja.created_at,
          je.recorded_at as journal_date
        FROM journal_actions ja
        JOIN journal_entries je ON je.id = ja.journal_entry_id
        WHERE ja.user_id = $1 AND ja.status = 'pending'
        ORDER BY ja.created_at DESC`,
        [req.user.id]
      );

      res.json({ actions: result.rows });
    } catch (error) {
      console.error('Get pending actions error:', error);
      res.status(500).json({
        error: 'Failed to retrieve pending actions',
      });
    }
  }
);

// --- UPDATE action status ---
router.patch(
  '/actions/:id',
  validateInput(
    z.object({
      status: z.enum(['accepted', 'dismissed', 'completed']),
    })
  ),
  auditLog('journal_action_update', 'journal'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE journal_actions
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id, status`,
        [req.body.status, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Action not found' });
      }

      res.json({ action: result.rows[0] });
    } catch (error) {
      console.error('Update action error:', error);
      res.status(500).json({
        error: 'Failed to update action',
      });
    }
  }
);

// --- GET mood trends ---
router.get(
  '/mood/trends',
  auditLog('journal_mood_trends', 'journal'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          mood,
          COUNT(*) as count,
          DATE(recorded_at) as date
        FROM mood_log
        WHERE user_id = $1
        AND recorded_at >= NOW() - INTERVAL '30 days'
        GROUP BY mood, DATE(recorded_at)
        ORDER BY date DESC`,
        [req.user.id]
      );

      const distribution = await pool.query(
        `SELECT mood, COUNT(*) as count
        FROM mood_log
        WHERE user_id = $1
        AND recorded_at >= NOW() - INTERVAL '30 days'
        GROUP BY mood
        ORDER BY count DESC`,
        [req.user.id]
      );

      res.json({
        daily: result.rows,
        distribution: distribution.rows,
      });
    } catch (error) {
      console.error('Get mood trends error:', error);
      res.status(500).json({
        error: 'Failed to retrieve mood trends',
      });
    }
  }
);

// --- GET specific journal entry (with encrypted content) ---
router.get(
  '/entries/:id',
  auditLog('journal_entry_get', 'journal'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          id,
          encrypted_content,
          encryption_iv,
          encryption_salt,
          recorded_at,
          created_at,
          ai_mood,
          ai_summary,
          ai_analysis,
          encrypted_analysis,
          analysis_iv,
          analysis_salt,
          word_count
        FROM journal_entries
        WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ entry: result.rows[0] });
    } catch (error) {
      console.error('Get journal entry error:', error);
      res.status(500).json({
        error: 'Failed to retrieve journal entry',
      });
    }
  }
);

module.exports = router;
