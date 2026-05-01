const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/authenticate');
const {
  routeLumiInput,
  confirmAndSave,
  getConversationHistory
} = require('../services/lumiRouter');
const { executeActions, getUserFullContext } = require('../services/lumiActions');
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

/**
 * POST /api/lumi/plan
 * Lumi reads user intent (free text) and returns a PROPOSED action plan.
 * Nothing is written yet — user sees the plan and confirms or edits.
 */
router.post('/plan', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, source = 'dashboard' } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });

    // Pull full context so Lumi can build a smart plan
    const context = await getUserFullContext(userId);

    // Ask Lumi to propose concrete actions (uses same Groq model)
    const { Groq } = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are Lumi, the AI core of PLOS life planning app. The user just said something and you need to figure out what they want done across their app — their planner, journal, goals, and habits.

USER'S CURRENT DATA:
Schedule today: ${JSON.stringify(context.todaySchedule?.map(s => `${s.start_time} ${s.title}`).join(', ') || 'empty')}
Goals: ${JSON.stringify(context.goals?.map(g => `${g.id}: ${g.title} (${g.progress_percentage || 0}%)`).join(', ') || 'none')}
Recent journal: ${JSON.stringify(context.recentJournal?.map(j => `${j.journal_type}: ${j.ai_summary}`).join(' | ') || 'none')}
Habits today: ${JSON.stringify(context.habits?.map(h => `${h.name}: ${h.completed ? 'done' : 'pending'}`).join(', ') || 'none')}

Based on what the user said, propose a list of concrete actions Lumi should take.
Each action has a type, a human-readable summary, and a payload.

Action types available:
- create_schedule: { title, description, start_time (HH:MM), duration_minutes, repeat_pattern (none/daily/weekly/custom), repeat_days (array of 0-6), category (wellness/work/personal/learning/lumi-suggested), is_high_priority, target_date (YYYY-MM-DD) }
- create_schedule_batch: { blocks: [array of schedule objects above] }
- save_journal: { journal_type (personal/spiritual/business/goals/health), content, ai_summary, emotion }
- complete_habit: { habit_name }
- achieve_goal: { goal_id, achievement_label, milestone_emoji }
- update_goal_progress: { goal_id, progress_pct, notes }

Rules:
- Only propose actions you are confident the user wants
- For multi-day plans (e.g. "work on anniversary Mon, Fri, Sat"), use create_schedule_batch with the right repeat_days
- If the user mentions completing something, propose complete_habit or achieve_goal
- If the user shares reflections, propose save_journal
- Always ask before saving sensitive journal content — set needsJournalConfirmation: true
- Return ONLY valid JSON, no markdown

Response format:
{
  "lumiMessage": "Here is what I'd like to do for you...",
  "confirmPrompt": "Should I go ahead and set all this up?",
  "actions": [
    { "type": "create_schedule", "summary": "Add Bible Reading at 5:00 AM daily", "payload": {...} }
  ],
  "needsJournalConfirmation": false,
  "journalDraft": null
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    let plan = {};
    try { plan = JSON.parse(jsonMatch?.[0] || '{}'); } catch { plan = { lumiMessage: raw, actions: [] }; }

    res.json({
      success: true,
      lumiMessage: plan.lumiMessage || "Here's what I'd set up for you.",
      confirmPrompt: plan.confirmPrompt || "Should I go ahead?",
      actions: plan.actions || [],
      needsJournalConfirmation: plan.needsJournalConfirmation || false,
      journalDraft: plan.journalDraft || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to build plan', message: "I ran into an issue planning that. Could you tell me more?" });
  }
});

/**
 * POST /api/lumi/execute
 * User confirmed — Lumi executes the action list.
 */
router.post('/execute', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { actions } = req.body;
    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'No actions to execute' });
    }

    const results = await executeActions(userId, actions);
    const allOk = results.every(r => r.success);
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Build a celebratory / summary message
    const summaries = succeeded.map(r => {
      switch (r.type) {
        case 'create_schedule':       return `Added "${r.data?.title}" to your planner`;
        case 'create_schedule_batch': return `Added ${r.data?.length || 0} blocks to your planner`;
        case 'save_journal':          return `Saved to your ${r.data?.journal_type} journal`;
        case 'complete_habit':        return `Logged habit completion`;
        case 'achieve_goal':          return `🏆 Goal achieved — "${r.data?.title}"`;
        case 'update_goal_progress':  return `Updated goal progress`;
        default:                      return `Action complete`;
      }
    });

    // Check if any goal was just achieved — trigger celebration
    const achievements = results.filter(r => r.type === 'achieve_goal' && r.success);

    res.json({
      success: true,
      allOk,
      results,
      summaryMessage: allOk
        ? `Done! ${summaries.join('. ')}.`
        : `Completed ${succeeded.length} of ${results.length} actions. ${failed.map(f => f.error).join(', ')}.`,
      achievements: achievements.map(a => a.data),
      // Signal the frontend to re-fetch these sections
      refresh: [...new Set(results.filter(r => r.success).map(r => {
        if (r.type.includes('schedule')) return 'schedule';
        if (r.type.includes('journal'))  return 'journal';
        if (r.type.includes('goal'))     return 'goals';
        if (r.type.includes('habit'))    return 'habits';
        return null;
      }).filter(Boolean))],
    });
  } catch (error) {
    res.status(500).json({ error: 'Execution failed', message: "Something went wrong executing that. Your data is safe — try again?" });
  }
});

/**
 * POST /api/lumi/complete-task
 * When user marks a schedule item done, Lumi proactively asks to document it.
 */
router.post('/complete-task', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule_id, title, category } = req.body;

    // Mark completion
    const today = new Date().toISOString().split('T')[0];
    if (schedule_id) {
      await pool.query(
        `INSERT INTO schedule_completions (schedule_id, user_id, completion_date)
         VALUES ($1,$2,$3) ON CONFLICT (schedule_id, completion_date) DO NOTHING`,
        [schedule_id, userId, today]
      );
    }

    // Build a contextual follow-up based on category
    const followUps = {
      spiritual: {
        message: `You completed "${title}" ✓ Beautiful. Would you like to document your devotion? I can ask you a few questions and save it to your spiritual journal.`,
        prompts: ['What Bible verse did you read?', 'Any insights from prayer?', 'How do you feel spiritually right now?', 'Skip journaling'],
      },
      health: {
        message: `"${title}" done ✓ Great work! Want to log how it went? I can save notes to your health journal.`,
        prompts: ['How was the intensity?', 'Any pain or issues?', 'Log and move on', 'Skip'],
      },
      work: {
        message: `"${title}" complete ✓ What did you accomplish? I can save a quick note to your journal or update a goal.`,
        prompts: ['Log key wins', 'Update a goal', 'Save to journal', 'Skip'],
      },
      meal: {
        message: `"${title}" logged ✓ Did you stick to the plan? I can note any changes in your health journal.`,
        prompts: ['Followed the plan', 'Made changes', 'Skip'],
      },
      default: {
        message: `"${title}" done ✓ Want to capture anything about this in your journal?`,
        prompts: ['Yes, journal it', 'No thanks'],
      },
    };

    const follow = followUps[category] || followUps.default;

    res.json({
      success: true,
      completionAck: `Marked "${title}" as complete.`,
      followUp: follow.message,
      quickPrompts: follow.prompts,
      canJournal: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

module.exports = router;
