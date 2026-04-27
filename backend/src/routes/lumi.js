const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/authenticate');
const { 
  routeLumiInput, 
  confirmAndSave,
  getConversationHistory 
} = require('../services/lumiRouter');
const { pool } = require('../db/connection');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/lumi/message
 * Main endpoint for all Lumi text interactions
 * Lumi is a conversational AI companion - she talks first, saves later
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, source = 'dashboard', conversationHistory = [] } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get user's context (but don't let it dictate rigid routing)
    const context = await getUserContext(userId);

    // Route through Lumi - she will converse, analyze, then suggest
    const result = await routeLumiInput(userId, text, context);

    // Save conversation for context
    await pool.query(
      `INSERT INTO lumi_conversations (user_id, user_message, lumi_response, route, saved_data, source, needs_confirmation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        userId, 
        text, 
        result.lumiResponse, 
        result.route, 
        result.savedData ? JSON.stringify(result.savedData) : null, 
        source,
        result.needsConfirmation || false
      ]
    );

    // Return response
    res.json({
      success: result.success,
      message: result.lumiResponse,
      route: result.route,
      saved: result.saved || false,
      savedData: result.savedData,
      needsConfirmation: result.needsConfirmation || false,
      pendingState: result.pendingState || null,
      context: {
        scheduleSummary: context.scheduleSummary,
        habitSummary: context.habitSummary,
        budgetSummary: context.budgetSummary,
        journalSummary: context.journalSummary,
      },
    });
  } catch (error) {
    console.error('Lumi message error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: "I'm here and listening. Tell me what's on your mind."
    });
  }
});

/**
 * POST /api/lumi/confirm
 * User confirms where to save a journal entry
 */
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { journalType, content, summary } = req.body;

    if (!journalType || !content) {
      return res.status(400).json({ error: 'Journal type and content are required' });
    }

    const result = await confirmAndSave(userId, journalType, content, summary);

    res.json({
      success: result.success,
      message: `Saved to your ${journalType} journal.`,
      savedData: result.savedData,
    });
  } catch (error) {
    console.error('Lumi confirm error:', error);
    res.status(500).json({ error: 'Failed to save' });
  }
});

/**
 * POST /api/lumi/voice
 * Endpoint for voice uploads (audio → Whisper → Lumi)
 */
router.post('/voice', authenticate, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { source = 'voice' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Check if Whisper API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'Voice transcription not configured',
        message: "I can't hear you yet — voice is still being set up. You can type to me instead!"
      });
    }

    // Send to Whisper API
    const FormData = require('form-data');
    const axios = require('axios');

    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: 'audio.webm', contentType: 'audio/webm' });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const whisperResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    const transcript = whisperResponse.data.text;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Could not transcribe audio',
        message: "I couldn't quite catch that. Could you try again, or type it out?"
      });
    }

    // Get user's context
    const context = await getUserContext(userId);

    // Route the transcribed text through Lumi
    const result = await routeLumiInput(userId, transcript, context);

    // Save conversation
    await pool.query(
      `INSERT INTO lumi_conversations (user_id, user_message, lumi_response, route, saved_data, source, transcript, needs_confirmation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        userId, 
        transcript, 
        result.lumiResponse, 
        result.route, 
        result.savedData ? JSON.stringify(result.savedData) : null, 
        source,
        transcript,
        result.needsConfirmation || false
      ]
    );

    // Return response
    res.json({
      success: result.success,
      transcript,
      message: result.lumiResponse,
      route: result.route,
      saved: result.saved || false,
      savedData: result.savedData,
      needsConfirmation: result.needsConfirmation || false,
      pendingState: result.pendingState || null,
      context: {
        scheduleSummary: context.scheduleSummary,
        habitSummary: context.habitSummary,
        budgetSummary: context.budgetSummary,
        journalSummary: context.journalSummary,
      },
    });
  } catch (error) {
    console.error('Lumi voice error:', error);
    res.status(500).json({ 
      error: 'Failed to process voice input',
      message: "I had trouble with that. What were you trying to tell me?"
    });
  }
});

/**
 * GET /api/lumi/history
 * Get conversation history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT id, user_message, lumi_response, route, saved_data, source, needs_confirmation, created_at
       FROM lumi_conversations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      conversations: result.rows.map(row => ({
        ...row,
        saved_data: row.saved_data ? JSON.parse(row.saved_data) : null,
      })),
      limit,
      offset,
    });
  } catch (error) {
    console.error('Lumi history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * POST /api/lumi/chat
 * Pure chat endpoint - no saving, just conversation
 */
router.post('/chat', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get conversation history for context
    const history = await getConversationHistory(userId, 10);
    
    // Simple chat response - no routing, just conversation
    const result = await routeLumiInput(userId, text, { mode: 'chat_only' });

    // Save to history
    await pool.query(
      `INSERT INTO lumi_conversations (user_id, user_message, lumi_response, route, source, created_at)
       VALUES ($1, $2, $3, 'chat', 'chat', NOW())`,
      [userId, text, result.lumiResponse]
    );

    res.json({
      success: true,
      message: result.lumiResponse,
      saved: false,
      route: 'chat',
    });
  } catch (error) {
    console.error('Lumi chat error:', error);
    res.status(500).json({ 
      error: 'Failed to chat',
      message: "I'm still here. What were you saying?"
    });
  }
});

/**
 * Helper: Get user context for smarter responses
 */
async function getUserContext(userId) {
  const context = {
    scheduleSummary: '',
    habitSummary: '',
    budgetSummary: '',
    journalSummary: '',
  };

  try {
    // Today's schedule count
    const scheduleResult = await pool.query(
      `SELECT COUNT(*) as count FROM schedules WHERE user_id = $1 AND start_time::date = CURRENT_DATE`,
      [userId]
    );
    const scheduleCount = parseInt(scheduleResult.rows[0]?.count) || 0;
    context.scheduleSummary = scheduleCount > 0 
      ? `You have ${scheduleCount} task${scheduleCount !== 1 ? 's' : ''} today` 
      : 'No tasks scheduled today';

    // Habit completion for today
    const habitResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE completed = true) as completed,
        COUNT(*) as total
       FROM habit_completions 
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );
    const completed = parseInt(habitResult.rows[0]?.completed) || 0;
    const total = parseInt(habitResult.rows[0]?.total) || 0;
    context.habitSummary = total > 0 
      ? `${completed} of ${total} habits done today` 
      : 'No habits tracked today';

    // Budget spent this month
    const budgetResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM budget_entries WHERE user_id = $1 AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const spent = parseInt(budgetResult.rows[0]?.total) || 0;
    context.budgetSummary = spent > 0 
      ? `₦${(spent / 1000).toFixed(1)}k spent this month` 
      : 'No expenses tracked this month';

    // Last journal entry
    const journalResult = await pool.query(
      `SELECT recorded_at FROM journal_entries WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
      [userId]
    );
    if (journalResult.rows.length > 0) {
      const lastEntry = new Date(journalResult.rows[0].recorded_at);
      const daysAgo = Math.floor((Date.now() - lastEntry.getTime()) / (1000 * 60 * 60 * 24));
      context.journalSummary = daysAgo === 0 
        ? 'Last entry today' 
        : daysAgo === 1 
        ? 'Last entry yesterday' 
        : `Last entry ${daysAgo} days ago`;
    } else {
      context.journalSummary = 'No journal entries yet';
    }

  } catch (error) {
    console.error('Get user context error:', error);
  }

  return context;
}

module.exports = router;
