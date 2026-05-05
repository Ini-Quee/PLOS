const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/authenticate');
const {
  routeLumiInput,
  confirmAndSave,
  confirmJournalPageWrite,
  buildUserContext,
  clearConvHistory,
  getConversationHistory,
  getUserMemories,
  extractAndSaveMemories,
} = require('../services/lumiRouter');
const { executeActions, getUserFullContext } = require('../services/lumiActions');
const { pool } = require('../db/connection');
const { getLegacyClient } = require('../services/aiClient');
const { attachTier, isPro, FREE_LIMITS } = require('../middleware/checkTier');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/lumi/message
 * Main endpoint for all Lumi text interactions
 * Lumi is a conversational AI companion - she talks first, saves later
 */
router.post('/message', authenticate, attachTier, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, source = 'dashboard', conversationHistory = [] } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Tier-aware daily message cap
    const dailyLimit = isPro(req) ? 200 : FREE_LIMITS.lumi_messages_per_day;
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS count FROM lumi_conversations
       WHERE user_id = $1 AND created_at >= CURRENT_DATE`,
      [userId]
    );
    const todayCount = Number(countRows[0]?.count || 0);
    if (todayCount >= dailyLimit) {
      return res.status(429).json({
        error: isPro(req)
          ? `You've had ${dailyLimit} conversations with me today. I'll be back tomorrow!`
          : `You've used your ${dailyLimit} free messages today. Upgrade to Pro for unlimited Lumi access.`,
        rateLimited: true,
        upgrade: !isPro(req),
        retryAfter: 'tomorrow',
      });
    }

    // Build rich context from the real database — shared across all Lumi instances
    const context = await buildUserContext(userId);

    // Route through Lumi - she will converse, analyze, then suggest
    const result = await routeLumiInput(userId, text, context, source);

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
      savedItems: result.savedItems || [],
      savedData: result.savedData,
      needsConfirmation: result.needsConfirmation || false,
      pendingState: result.pendingState || null,
      needsJournalPreview: result.needsJournalPreview || false,
      pendingJournalPage: result.pendingJournalPage || null,
      needsRecurringPlan: result.needsRecurringPlan || false,
      recurringPlanText: result.recurringPlanText || null,
      needsEmailPreview: result.needsEmailPreview || false,
      pendingEmail: result.pendingEmail || null,
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
 * POST /api/lumi/confirm-journal-page
 * User confirmed the journal page preview — save it to journal_page_entries.
 */
router.post('/confirm-journal-page', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pendingJournalPage } = req.body;

    if (!pendingJournalPage?.journal_type || !pendingJournalPage?.template_name || !pendingJournalPage?.fields) {
      return res.status(400).json({ error: 'Missing journal page data' });
    }

    const result = await confirmJournalPageWrite(userId, pendingJournalPage);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to save journal page' });
    }

    const JOURNAL_LABELS = {
      personal: 'Everyday Life', spiritual: 'Bible & Faith', goals: 'Goals & Vision',
      business: 'My Business', wellness: 'Wellness', budget: 'Budget Diary',
    };
    const label = JOURNAL_LABELS[pendingJournalPage.journal_type] || pendingJournalPage.journal_type;

    res.json({
      success: true,
      entry: result.entry,
      message: `Saved to your ${pendingJournalPage.template_name} page in the ${label} journal ✓`,
    });
  } catch (error) {
    console.error('Lumi confirm-journal-page error:', error);
    res.status(500).json({ error: 'Failed to save journal page' });
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
    const context = await buildUserContext(userId);

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
 * GET /api/lumi/daily-entries
 * Returns the Lumi-written daily journal narrative entries.
 * Used by the Journal page to show the user a full narrative of each day.
 * Query params: limit (default 30), offset (default 0)
 */
router.get('/daily-entries', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit  = Math.min(parseInt(req.query.limit)  || 30, 90);
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT id, entry_date, narrative, sections, mood, created_at, updated_at
       FROM lumi_daily_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      entries: result.rows.map(r => ({
        ...r,
        sections: r.sections || {},
      })),
      limit,
      offset,
    });
  } catch (err) {
    console.error('Lumi daily-entries error:', err);
    res.status(500).json({ error: 'Failed to fetch daily entries' });
  }
});

/**
 * GET /api/lumi/daily-entries/today
 * Returns just today's daily entry — used by Dashboard and Journal page header.
 */
router.get('/daily-entries/today', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, entry_date, narrative, sections, mood, updated_at
       FROM lumi_daily_entries
       WHERE user_id = $1 AND entry_date = CURRENT_DATE`,
      [req.user.id]
    );
    res.json({ entry: result.rows[0] || null });
  } catch (err) {
    console.error('Lumi today entry error:', err);
    res.status(500).json({ error: 'Failed to fetch today entry' });
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

    // Use the same rich context as /message so the AI knows the user's real data
    const context = await buildUserContext(userId);
    const result = await routeLumiInput(userId, text, context);

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
 * DELETE /api/lumi/memory
 * Clears Lumi's Redis conversation memory for this user.
 * Called when the user taps "Clear" in TalkToLumi.
 */
router.delete('/memory', authenticate, async (req, res) => {
  try {
    await clearConvHistory(req.user.id);
    res.json({ success: true, message: 'Conversation memory cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear memory' });
  }
});

/**
 * GET /api/lumi/memories
 * Returns all persistent memories Lumi has stored about this user.
 */
router.get('/memories', authenticate, async (req, res) => {
  try {
    const memories = await getUserMemories(req.user.id);
    res.json({ memories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load memories' });
  }
});

/**
 * DELETE /api/lumi/memories/:id
 * Delete a specific persistent memory (user controls their own data).
 */
router.delete('/memories/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM lumi_memories WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Memory not found' });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

/**
 * DELETE /api/lumi/memories
 * Clear ALL persistent memories for this user (privacy reset).
 */
router.delete('/memories', authenticate, async (req, res) => {
  try {
    await pool.query(`DELETE FROM lumi_memories WHERE user_id = $1`, [req.user.id]);
    res.json({ success: true, message: 'All memories cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear memories' });
  }
});

/**
 * GET /api/lumi/context
 * Returns the full shared user context from the database.
 * Used by all Lumi instances (TalkToLumi, JournalPage, BudgetPage)
 * so they all read from the same source of truth.
 */
router.get('/context', authenticate, async (req, res) => {
  try {
    const ctx = await buildUserContext(req.user.id);
    res.json(ctx);
  } catch (err) {
    console.error('Lumi context error:', err);
    res.status(500).json({ error: 'Failed to load context' });
  }
});

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
    const groq = getLegacyClient();

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
 * POST /api/lumi/recurring-plan
 * Start a smart recurring plan interview.
 * Lumi proposes a default schedule and returns the first interview question.
 */
router.post('/recurring-plan', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });

    const groq = getLegacyClient();

    const systemPrompt = `You are Lumi, a smart life planner AI. The user wants to set up a recurring activity in their schedule.

Extract:
1. The activity (e.g. "gym", "yoga", "Bible study", "reading")
2. Frequency (times per week / daily / specific days)
3. Propose a sensible default weekly schedule

Return ONLY valid JSON in this exact format:
{
  "activity": "gym",
  "frequency": "4 times a week",
  "defaultSchedule": [
    { "day": "Mon", "dayNum": 1, "time": "07:00", "duration": 45, "focus": "Strength training", "category": "wellness" },
    { "day": "Wed", "dayNum": 3, "time": "07:00", "duration": 45, "focus": "Cardio", "category": "wellness" },
    { "day": "Fri", "dayNum": 5, "time": "07:00", "duration": 45, "focus": "Strength training", "category": "wellness" },
    { "day": "Sat", "dayNum": 6, "time": "09:00", "duration": 60, "focus": "Full body", "category": "wellness" }
  ],
  "interviewQuestions": [
    "What's your main goal — weight loss, strength, cardio, or general fitness?",
    "What's your current fitness level — beginner, intermediate, or advanced?",
    "Which days work best for you?",
    "How long can you spend per session?",
    "Morning, afternoon, or evening?",
    "Any injuries or limitations I should know about?",
    "Do you want rest-day activities like stretching or walking?"
  ],
  "category": "wellness"
}

Use appropriate categories: wellness, learning, spiritual, work, personal.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    let plan = {};
    try { plan = JSON.parse(match?.[0] || '{}'); } catch { plan = {}; }

    if (!plan.activity) {
      return res.json({
        success: false,
        message: "I didn't quite catch what activity you want to plan. Could you tell me more, like 'I want to go to the gym 4 times a week'?"
      });
    }

    res.json({
      success: true,
      needsPlanInterview: true,
      planDraft: {
        activity: plan.activity,
        frequency: plan.frequency,
        category: plan.category || 'wellness',
        defaultSchedule: plan.defaultSchedule || [],
        interviewQuestions: plan.interviewQuestions || [],
        currentQuestion: 0,
        answers: [],
      },
      message: `I'd love to set up your ${plan.activity} schedule! Here's a default plan — let me ask a few quick questions to personalise it.`,
    });
  } catch (error) {
    console.error('Recurring plan error:', error);
    res.status(500).json({ error: 'Failed to create plan', message: "I ran into an issue. Could you try again?" });
  }
});

/**
 * PATCH /api/lumi/plan-interview
 * User answered an interview question — refine the plan draft and return the next question.
 */
router.patch('/plan-interview', authenticate, async (req, res) => {
  try {
    const { planDraft, answer } = req.body;
    if (!planDraft) return res.status(400).json({ error: 'planDraft is required' });

    const qIndex = planDraft.currentQuestion || 0;
    const questions = planDraft.interviewQuestions || [];
    const answers   = [...(planDraft.answers || []), { q: questions[qIndex], a: answer }];
    const nextQ     = qIndex + 1;
    const done      = nextQ >= questions.length;

    if (done) {
      // All questions answered — refine the schedule with AI
      const groq = getLegacyClient();

      const answersSummary = answers.map(({ q, a }) => `Q: ${q}\nA: ${a}`).join('\n\n');
      const completion = await groq.chat.completions.create({
        messages: [{
          role: 'system',
          content: `You are a smart fitness/life coach. Based on the interview answers, refine the weekly schedule.
Original plan: ${JSON.stringify(planDraft.defaultSchedule)}
Activity: ${planDraft.activity}

Return ONLY a JSON array of schedule blocks:
[{ "day": "Mon", "dayNum": 1, "time": "07:00", "duration": 45, "focus": "Strength — chest/back", "category": "${planDraft.category || 'wellness'}", "description": "..." }]`
        }, {
          role: 'user',
          content: `Interview answers:\n${answersSummary}`
        }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 600,
      });

      const raw = completion.choices[0]?.message?.content || '[]';
      const match = raw.match(/\[[\s\S]*\]/);
      let refinedSchedule = planDraft.defaultSchedule;
      try { refinedSchedule = JSON.parse(match?.[0] || '[]'); } catch {}
      if (!refinedSchedule.length) refinedSchedule = planDraft.defaultSchedule;

      return res.json({
        success: true,
        done: true,
        planDraft: { ...planDraft, defaultSchedule: refinedSchedule, answers, currentQuestion: nextQ },
        message: `Perfect! Here's your personalised ${planDraft.activity} plan. Ready to add it to your schedule?`,
      });
    }

    res.json({
      success: true,
      done: false,
      planDraft: { ...planDraft, answers, currentQuestion: nextQ },
      message: questions[nextQ],
    });
  } catch (error) {
    console.error('Plan interview error:', error);
    res.status(500).json({ error: 'Failed to process answer' });
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

/**
 * POST /api/lumi/monthly-review
 * Generates a personalised monthly review using Groq and saves it as a
 * journal entry. Idempotent — returns existing review if already generated
 * this calendar month.
 */
router.post('/monthly-review', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    // Guard: return existing review if already generated this month
    const existing = await pool.query(
      `SELECT id, fields, entry_date FROM journal_page_entries
       WHERE user_id = $1
         AND journal_type = 'lumi_monthly_review'
         AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
       ORDER BY entry_date DESC LIMIT 1`,
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.json({ review: existing.rows[0].fields, existing: true });
    }

    // Gather data for the prompt
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const monthLabel = new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date().getDate(); // days elapsed so far

    const [habitsRes, savingsRes, journalRes] = await Promise.all([
      pool.query(
        `SELECT h.title, h.emoji, h.category,
           COUNT(hc.id) AS completions,
           ROUND(AVG(hc.identity_score), 1) AS avg_identity
         FROM habits h
         LEFT JOIN habit_completions hc
           ON hc.habit_id = h.id AND hc.completion_date >= $2
         WHERE h.user_id = $1 AND h.is_active = true
         GROUP BY h.id ORDER BY completions DESC`,
        [userId, monthStartISO]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT title, target_amount, current_amount, currency
         FROM savings_goals WHERE user_id = $1 AND is_active = true
         ORDER BY current_amount DESC LIMIT 3`,
        [userId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT COUNT(*) AS count FROM journal_page_entries
         WHERE user_id = $1 AND entry_date >= $2`,
        [userId, monthStartISO]
      ).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const habitLines = habitsRes.rows.map(h => {
      const rate = daysInMonth > 0 ? Math.round((h.completions / daysInMonth) * 100) : 0;
      const identity = h.avg_identity ? ` · identity avg ${h.avg_identity}/10` : '';
      return `- ${h.emoji} ${h.title}: ${rate}% completion${identity}`;
    }).join('\n') || '- No habits tracked yet';

    const savingsLines = savingsRes.rows.map(s => {
      const pct = s.target_amount > 0
        ? Math.round((s.current_amount / s.target_amount) * 100) : 0;
      return `- ${s.title}: ${s.currency}${Number(s.current_amount).toLocaleString()} of ${s.currency}${Number(s.target_amount).toLocaleString()} (${pct}%)`;
    }).join('\n') || '- No savings goals set';

    const journalCount = Number(journalRes.rows[0]?.count || 0);

    const prompt = `Write a warm, honest 3-paragraph monthly review for this person. Be specific — use the actual numbers. Do not be generic or use toxic positivity.

Data for ${monthLabel} (${daysInMonth} days elapsed):
Habits:
${habitLines}
Savings:
${savingsLines}
Journal pages written: ${journalCount}

Paragraph 1: What genuinely went well this month (name specific habits or wins from the data).
Paragraph 2: One honest pattern you noticed — something interesting or worth paying attention to. No judgment.
Paragraph 3: One specific, actionable thing to focus on next month based on what you see.

Tone: Lumi — warm, direct, treats them like an intelligent adult. No corporate cheerleading. 3 paragraphs, no headings, plain prose.`;

    const groq = getLegacyClient();
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 600,
    });

    const reviewText = completion.choices[0]?.message?.content?.trim() || '';
    const paragraphs = reviewText.split(/\n\n+/).filter(Boolean);

    const fields = {
      month: monthLabel,
      review: reviewText,
      paragraphs,
      generated_at: new Date().toISOString(),
      data_snapshot: {
        habit_count: habitsRes.rows.length,
        journal_pages: journalCount,
        savings_goals: savingsRes.rows.length,
      },
    };

    // Save to journal
    await pool.query(
      `INSERT INTO journal_page_entries
         (user_id, journal_type, template_name, entry_date, fields, source)
       VALUES ($1, 'lumi_monthly_review', 'Month in Review', CURRENT_DATE, $2::jsonb, 'lumi')
       ON CONFLICT (user_id, journal_type, template_name, entry_date)
       DO UPDATE SET fields = $2::jsonb, updated_at = NOW()`,
      [userId, JSON.stringify(fields)]
    );

    res.json({ review: fields, existing: false });
  } catch (err) {
    console.error('[Lumi] monthly-review error:', err.message);
    res.status(500).json({ error: 'Failed to generate monthly review' });
  }
});

module.exports = router;
