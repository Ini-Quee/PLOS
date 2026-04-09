const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');
const { validateInput } = require('../middleware/validateInput');
const { rateLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLog');
const { analyzeJournalEntry } = require('../services/aiAnalysis');

const router = express.Router();

// Protect all journal routes
router.use(authenticate);

const createEntrySchema = z.object({
  encryptedContent: z.string().min(1, 'Content is required'),
  encryptionIv: z.string().min(1, 'IV is required'),
  encryptionSalt: z.string().min(1, 'Salt is required'),
  wordCount: z.number().int().min(0).optional(),
  characterCount: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  recordedAt: z.string(),
  plaintextForAnalysis: z.string().optional(),
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
        plaintextForAnalysis,
      } = req.body;

      let aiAnalysis = null;
      let aiTasks = [];
      let aiMood = null;
      let aiSummary = null;
if (plaintextForAnalysis) {
  try {
    aiAnalysis = await analyzeJournalEntry(plaintextForAnalysis);
    console.log('AI RESULT:', aiAnalysis);
    aiTasks = aiAnalysis.tasks || [];
    aiMood = aiAnalysis.mood || null;
    aiSummary = aiAnalysis.summary || null;
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

        
      }

      const result = await pool.query(
        `INSERT INTO journal_entries
           (user_id, encrypted_content, encryption_iv, encryption_salt,
            word_count, character_count, duration_seconds, recorded_at,
            ai_analysis, ai_tasks, ai_mood, ai_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, recorded_at, created_at, ai_analysis`,
        [
          req.user.id,
          encryptedContent,
          encryptionIv,
          encryptionSalt,
          wordCount || null,
          characterCount || null,
          durationSeconds || null,
          recordedAt,
          aiAnalysis || null,
          aiTasks,
          aiMood,
          aiSummary,
        ]
      );

      const entry = result.rows[0];

      if (aiAnalysis) {
        for (const task of aiAnalysis.tasks || []) {
          await pool.query(
            `INSERT INTO journal_actions
               (user_id, journal_entry_id, action_type, title, status)
             VALUES ($1, $2, 'task', $3, 'pending')`,
            [req.user.id, entry.id, task]
          );
        }

        for (const meeting of aiAnalysis.meetings || []) {
          await pool.query(
            `INSERT INTO journal_actions
               (user_id, journal_entry_id, action_type, title, description, status)
             VALUES ($1, $2, 'meeting', $3, $4, 'pending')`,
            [
              req.user.id,
              entry.id,
              meeting.title || 'Meeting',
              `When: ${meeting.when || 'not specified'}${
                meeting.with ? `, With: ${meeting.with}` : ''
              }`,
            ]
          );
        }

        for (const goal of aiAnalysis.goals || []) {
          await pool.query(
            `INSERT INTO journal_actions
               (user_id, journal_entry_id, action_type, title, status)
             VALUES ($1, $2, 'goal', $3, 'pending')`,
            [req.user.id, entry.id, goal]
          );
        }

        if (aiAnalysis.mood && aiAnalysis.mood !== 'neutral') {
          await pool.query(
            `INSERT INTO mood_log (user_id, journal_entry_id, mood, recorded_at)
             VALUES ($1, $2, $3, $4)`,
            [req.user.id, entry.id, aiAnalysis.mood, recordedAt]
          );
        }
      }

      res.status(201).json({
        message: 'Journal entry created',
        entry: {
          id: entry.id,
          recorded_at: entry.recorded_at,
          created_at: entry.created_at,
        },
        analysis: aiAnalysis,
      });
    } catch (error) {
      console.error('Create journal entry error:', error);
      res.status(500).json({
        error: 'Failed to create journal entry',
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

module.exports = router;