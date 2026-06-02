/**
 * lumiRouter.js — Lumi: extraction, emotional intelligence, cross-journal writing
 *
 * FLOW:
 *  1. extractAndClassify() — Groq reads the message holistically, extracts every
 *     fact, generates empathetic response + follow-up questions.
 *  2. executeExtraction() — writes each action to the right DB table.
 *  3. writeToJournal()    — ALWAYS writes a human-readable narrative into
 *     lumi_daily_entries so the user sees everything in their Journal the next day.
 *
 * DATA ROUTING TABLE:
 *   budget_entry   → budget_entries (Pave / Budget)
 *   workout_note   → lumi_conversations health log + schedules (Planner)
 *   habit_log      → habits + habit_completions (Habit tracker)
 *   schedule_item  → schedules (Planner)
 *   life_note      → lumi_daily_entries narrative only (not its own table)
 *   journal_draft  → lumi_conversations pending_journal: true (Journal section)
 *
 * JOURNAL CROSS-POST:
 *   After every interaction, Lumi updates lumi_daily_entries for today with a
 *   growing narrative of what happened. Budget entries become expense lines.
 *   Workout skips become health entries. Life events become daily diary text.
 *   The user opens Journal → Daily Life and sees their full day in plain words.
 */

const { pool } = require('../db/connection');
const logger = require('../lib/logger');
const { getLegacyClient } = require('./aiClient');
const { tryLocal } = require('./lumiLocalRouter');
const { analyzeEmotionalContext, createCrisisResponse } = require('./lumiEmotion');
const { getUserLifeContext, formatLegacyContext } = require('./lumiContextEngine');
const { markMemoriesSurfaced, surfaceRelevantMemories } = require('./lumiMemorySurface');
const { applyLumiVoice } = require('./lumiVoiceRules');
const { getTemplateSchema, normalizeTags, normalizeTemplateType } = require('./journalSchema');
const { TIER, requiresConfirmEscalation } = require('./lumiSensitivity');

function getGroqClient() {
  return getLegacyClient();
}

// Pending confirmations — Redis-backed (survives restarts / multi-instance).
const PENDING_TTL = 30 * 60; // 30 minutes
async function getPending(userId) {
  try {
    const { getRedisClient } = require('../middleware/rateLimiter');
    const client = await getRedisClient();
    if (!client) return null;
    const raw = await client.get(`lumi_pending:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
async function setPending(userId, data) {
  try {
    const { getRedisClient } = require('../middleware/rateLimiter');
    const client = await getRedisClient();
    if (!client) return;
    await client.setEx(`lumi_pending:${userId}`, PENDING_TTL, JSON.stringify(data));
  } catch {}
}
async function deletePending(userId) {
  try {
    const { getRedisClient } = require('../middleware/rateLimiter');
    const client = await getRedisClient();
    if (!client) return;
    await client.del(`lumi_pending:${userId}`);
  } catch {}
}

// ─── Category normalisation ─────────────────────────────────────────────────────
const CATEGORY_MAP = {
  food:'food', lunch:'food', dinner:'food', breakfast:'food', snack:'food',
  restaurant:'food', eating:'food', groceries:'food', suya:'food', chicken:'food',
  rice:'food', bread:'food', meat:'food', eatery:'food', amala:'food',
  transport:'transport', uber:'transport', bolt:'transport', bus:'transport',
  taxi:'transport', ride:'transport', okada:'transport', keke:'transport', fuel:'transport',
  bills:'bills', electricity:'bills', water:'bills', rent:'bills', nepa:'bills',
  ikedc:'bills', ekedc:'bills', internet:'bills', wifi:'bills', subscription:'bills',
  shopping:'shopping', clothes:'shopping', shoes:'shopping', market:'shopping',
  health:'health', medical:'health', pharmacy:'health', hospital:'health',
  drugs:'health', medicine:'health', chemist:'health',
  education:'education', school:'education', course:'education', book:'education',
  savings:'savings', invest:'savings',
  giving:'giving', tithe:'giving', offering:'giving', gift:'giving', donation:'giving',
  data:'other', airtime:'other', recharge:'other',
};

function normaliseCategory(raw) {
  if (!raw) return 'other';
  const lower = raw.toLowerCase().trim();
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return lower;
}

function getActionData(action) {
  if (action.data && typeof action.data === 'object') return action.data;
  const { type, ...rest } = action;
  return rest;
}

// ─── Entity resolution: contact lookup with disambiguation ────────────────────
async function resolveContact(userId, nameOrEmail) {
  if (!nameOrEmail) return { resolved: null, candidates: [] };
  const clean = nameOrEmail.replace(/[^a-zA-Z0-9@.\s'-]/g, '').trim();
  if (!clean) return { resolved: null, candidates: [] };

  const { rows } = await pool.query(
    `SELECT id, name, email FROM contacts
     WHERE user_id = $1 AND (
       email ILIKE $2 OR name ILIKE $3 ESCAPE '\\'
     )
     ORDER BY name LIMIT 5`,
    [userId, clean, `%${clean.replace(/[%_\\]/g, '\\$&')}%`]
  );

  logger.info({ userId, action: 'entity_resolve', resource: 'contact', count: rows.length }, 'resolved');

  if (rows.length === 1) return { resolved: rows[0], candidates: rows };
  if (rows.length > 1) {
    // Check for exact match first
    const exact = rows.find(r =>
      r.email?.toLowerCase() === clean.toLowerCase() ||
      r.name?.toLowerCase() === clean.toLowerCase()
    );
    if (exact) return { resolved: exact, candidates: rows };
    return { resolved: null, candidates: rows };
  }
  return { resolved: null, candidates: [] };
}

const JOURNAL_LABELS = {
  personal: 'Everyday Life',
  spiritual: 'Bible & Faith',
  goals: 'Goals & Vision',
  business: 'My Business',
  wellness: 'Wellness',
  budget: 'Budget Diary',
  gratitude: 'Gratitude Log',
};

function summarizeFields(fields = {}) {
  return Object.entries(fields)
    .map(([key, value]) => {
      const rendered = Array.isArray(value) || (value && typeof value === 'object')
        ? JSON.stringify(value)
        : String(value ?? '');
      return `${key}: ${rendered.slice(0, 180)}`;
    })
    .join('\n');
}

function normalizeJournalPagePayload(page = {}) {
  const requestedType = page.journal_type || page.journalType || 'personal';
  const requestedTemplate = page.template_name || page.templateName || 'Classic Diary';
  const templateType = normalizeTemplateType(requestedTemplate);
  const schema = getTemplateSchema(templateType);
  const tags = normalizeTags([requestedType], templateType);
  const primaryTag = schema.tags?.includes(requestedType)
    ? requestedType
    : (schema.tags?.[0] || tags[0] || 'personal');

  return {
    journal_type: primaryTag,
    template_name: templateType,
    fields: page.fields || {},
    entry_date: page.entry_date || new Date().toISOString().slice(0, 10),
    source: page.source || 'lumi',
    tags,
  };
}

async function saveJournalPageToDailyEntries(userId, page) {
  const normalized = normalizeJournalPagePayload(page);
  const entryText = normalized.fields.entry_text
    || normalized.fields.entry
    || normalized.fields.story
    || normalized.fields.prayer_request
    || normalized.fields.financial_insights
    || summarizeFields(normalized.fields);

  const { rows } = await pool.query(
    `INSERT INTO daily_entries
       (user_id, entry_date, entry_type, template_type, title, entry_text, tags,
        fields, attachments, stickers, source)
     VALUES ($1,$2::date,'template_entry',$3,$4,$5,$6,$7::jsonb,'[]'::jsonb,'[]'::jsonb,$8)
     RETURNING id, entry_date, template_type, tags`,
    [
      userId,
      normalized.entry_date,
      normalized.template_name,
      `${normalized.template_name} - ${JOURNAL_LABELS[normalized.journal_type] || normalized.journal_type}`,
      entryText || '',
      normalized.tags,
      JSON.stringify(normalized.fields),
      normalized.source,
    ]
  );

  return rows[0];
}

// ─── Recurring plan intent detection ───────────────────────────────────────────
// Returns true if the text sounds like "I want to do X N times a week".
function isRecurringPlanRequest(text) {
  const lower = text.toLowerCase();
  const hasFreq = /(\d+\s*times?\s*(a|per)\s*week|every\s+day|daily|each\s+week|weekly)/i.test(text);
  const hasActivity = /(gym|yoga|workout|exercise|run|jog|swim|pilates|meditat|pray|read|bible|study|walk|cycle|lift|sprint|train)/i.test(lower);
  return hasFreq && hasActivity;
}

// ─── Persistent memory helpers (Postgres) ──────────────────────────────────────

async function getUserMemories(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT memory_type, content FROM lumi_memories
       WHERE user_id = $1 ORDER BY importance DESC, updated_at DESC LIMIT 12`,
      [userId]
    );
    return rows;
  } catch { return []; }
}

// Save pre-extracted memory facts directly to DB — no Groq call
async function saveExtractedMemories(userId, facts) {
  try {
    for (const fact of facts) {
      if (!fact?.content?.trim()) continue;
      const content = fact.content.trim();
      const { rows: existing } = await pool.query(
        `SELECT id FROM lumi_memories WHERE user_id = $1 AND content ILIKE $2 ESCAPE '\\' LIMIT 1`,
        [userId, `%${content.slice(0, 60).replace(/[%_\\]/g, '\\$&')}%`]
      );
      if (existing.length > 0) {
        await pool.query(
          `UPDATE lumi_memories SET updated_at = NOW(), importance = GREATEST(importance, $1) WHERE id = $2`,
          [fact.importance || 5, existing[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO lumi_memories (user_id, memory_type, memory_category, content, importance, source)
           VALUES ($1, $2, $3, $4, $5, 'chat')`,
          [userId, fact.type || 'fact', fact.category || fact.type || 'fact', content, Math.min(10, Math.max(1, fact.importance || 5))]
        );
      }
    }
  } catch (err) {
    logger.error({ userId, err: err.message }, 'memory save error');
  }
}

// Used only for life audit confirm — forces a Groq extraction from a summary string
async function extractAndSaveMemories(userId, userMessage, lumiResponse) {
  try {
    const prompt = `Extract 0-2 facts worth remembering long-term about this user.
Only extract things that reveal goals, fears, patterns, values, milestones, or strong preferences.
Ignore: task requests, questions, one-off comments, logging of expenses/workouts/schedule items.

User said: "${userMessage.slice(0, 400)}"
Assistant responded: "${lumiResponse.slice(0, 300)}"

Return a JSON array ONLY. No other text. Example:
[{ "type": "goal", "content": "Wants to save ₦500,000 for an emergency fund by December", "importance": 8 }]

Return [] if nothing genuinely memorable. Types: goal | fear | pattern | fact | milestone`;

    const result = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 300,
    });

    const raw = result.choices[0]?.message?.content?.trim() || '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return;
    const facts = JSON.parse(match[0]);
    if (!Array.isArray(facts)) return;

    for (const fact of facts) {
      if (!fact?.content?.trim()) continue;
      const content = fact.content.trim();
      // Deduplication — skip if very similar memory already exists
      const { rows: existing } = await pool.query(
        `SELECT id FROM lumi_memories WHERE user_id = $1 AND content ILIKE $2 ESCAPE '\\' LIMIT 1`,
        [userId, `%${content.slice(0, 60).replace(/[%_\\]/g, '\\$&')}%`]
      );
      if (existing.length > 0) {
        await pool.query(
          `UPDATE lumi_memories SET updated_at = NOW(), importance = GREATEST(importance, $1) WHERE id = $2`,
          [fact.importance || 5, existing[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO lumi_memories (user_id, memory_type, memory_category, content, importance, source)
           VALUES ($1, $2, $3, $4, $5, 'chat')`,
          [userId, fact.type || 'fact', fact.category || fact.type || 'fact', content, Math.min(10, Math.max(1, fact.importance || 5))]
        );
      }
    }
  } catch (err) {
    // Non-blocking — never let memory extraction crash the main flow
    logger.error({ userId, err: err.message }, 'memory extraction error');
  }
}

// ─── Redis conversation memory helpers ─────────────────────────────────────────
const CONV_TTL = 4 * 60 * 60; // 4 hours

async function getConvHistory(userId) {
  try {
    const { getRedisClient } = require('../middleware/rateLimiter');
    const client = await getRedisClient();
    const raw = await client.get(`lumi_conv:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function appendConvHistory(userId, userText, lumiResponse) {
  try {
    const { getRedisClient } = require('../middleware/rateLimiter');
    const client = await getRedisClient();
    const history = await getConvHistory(userId);
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: lumiResponse });
    // Keep last 20 turns (40 messages)
    const trimmed = history.slice(-40);
    await client.setEx(`lumi_conv:${userId}`, CONV_TTL, JSON.stringify(trimmed));
  } catch {}
}

async function clearConvHistory(userId) {
  try {
    const { getRedisClient } = require('../middleware/rateLimiter');
    const client = await getRedisClient();
    await client.del(`lumi_conv:${userId}`);
  } catch {}
}

// ─── Main entry point ───────────────────────────────────────────────────────────
async function routeLumiInput(userId, text, context = {}, source = 'dashboard') {
  try {
    const pendingData = await getPending(userId);
    if (pendingData) {
      if (pendingData._type === 'publishable_confirm') {
        return await handlePublishableConfirm(userId, text, pendingData);
      }
      return await handleConfirmation(userId, text, pendingData);
    }

    const convHistory = await getConvHistory(userId);
    const emotionalContext = analyzeEmotionalContext(text, convHistory);

    if (emotionalContext.crisis) {
      return {
        success: true,
        lumiResponse: createCrisisResponse(),
        saved: false,
        savedItems: [],
        route: 'support',
        needsConfirmation: false,
      };
    }

    // Detect recurring plan intent before passing to Groq (saves tokens + is faster)
    if (isRecurringPlanRequest(text)) {
      return {
        success: true,
        lumiResponse: `I'd love to set up a recurring plan for you! Let me ask a few quick questions to make it perfect.`,
        saved: false,
        savedItems: [],
        route: 'plan',
        needsConfirmation: false,
        needsRecurringPlan: true,
        recurringPlanText: text,
      };
    }

    // LOCAL LANE — simple lookups & commands, zero AI tokens.
    const localResult = await tryLocal(userId, text, {
      emotionalIntensity: emotionalContext.intensity || 1,
    });
    if (localResult) {
      localResult.lumiResponse = applyLumiVoice(localResult.lumiResponse, emotionalContext);
      await writeToJournalEntry(userId, text, { actions: [], lumiResponse: localResult.lumiResponse }, localResult.savedItems || []);
      await appendConvHistory(userId, text, localResult.lumiResponse);
      logger.info({ userId, action: 'local_handled', intent: localResult.intent, route: 'local' }, 'handled without AI');
      return localResult;
    }

    const lifeContext = context.lifeContext || await getUserLifeContext(userId, '30days', {
      userInput: text,
      currentTopic: source,
    }).catch(() => null);

    if (lifeContext) {
      context = {
        ...formatLegacyContext(lifeContext),
        ...context,
        lifeContext,
      };
    }

    const surfacedMemories = await surfaceRelevantMemories(userId, text, {
      currentTopic: source,
      emotionalContext,
    }, 8).catch(() => context.persistentMemories || []);
    context.persistentMemories = surfacedMemories;
    context.emotionalContext = emotionalContext;

    const extraction = await extractAndClassify(userId, text, context, convHistory, source);
    if (!extraction) throw new Error('Extraction returned null');

    const result = await executeExtraction(userId, text, extraction);
    result.lumiResponse = applyLumiVoice(result.lumiResponse || extraction.lumiResponse, emotionalContext);
    extraction.lumiResponse = result.lumiResponse;

    // Always update the daily journal entry — cross-post everything
    await writeToJournalEntry(userId, text, extraction, result.savedItems);

    // Save this exchange to Redis for future context
    if (result.lumiResponse) {
      await appendConvHistory(userId, text, result.lumiResponse);
      if (surfacedMemories.length > 0) {
        markMemoriesSurfaced(userId, surfacedMemories).catch(() => {});
      }
      // Save any memories Lumi identified — no extra API call needed
      if (Array.isArray(extraction.memories_to_save) && extraction.memories_to_save.length > 0) {
        saveExtractedMemories(userId, extraction.memories_to_save).catch(() => {});
      }
    }

    return result;
  } catch (err) {
    logger.error({ userId, err: err.message }, 'lumi router error');
    return {
      success: true,
      lumiResponse: "I'm here. Something went wrong — could you say that again?",
      saved: false, savedItems: [], needsConfirmation: false, route: 'chat',
    };
  }
}

// ─── Step 1: Extract + Emotional Intelligence ───────────────────────────────────
async function extractAndClassify(userId, text, context, convHistory = [], source = 'dashboard') {
  const customJournals = context.customJournalTypes || [];
  const customJournalBlock = customJournals.length > 0
    ? customJournals.map(j => `  "${j.type_key}" (${j.label}): keywords → ${(j.routing_keywords||[]).join(', ')}`).join('\n')
    : '  (none yet)';

  // Format last 6 conversation turns for context (12 messages = 6 exchanges)
  const recentConv = convHistory.slice(-12);
  const convBlock = recentConv.length > 0
    ? recentConv.map(m => `${m.role === 'user' ? 'User' : 'Lumi'}: ${m.content.slice(0, 120)}`).join('\n')
    : '(first message in this session)';

  // Format persistent memories for injection
  const memories = context.persistentMemories || [];
  const emotionalContext = context.emotionalContext || {};
  const emotionalBlock = `Primary emotion: ${emotionalContext.primaryEmotion || 'neutral'}
Intensity: ${emotionalContext.intensity || 1}/5
Response style: ${emotionalContext.responseStyle || 'acknowledge'}
Boundary: never diagnose, never prescribe, never shame; ask permission before exploring patterns.`;
  const memoriesBlock = memories.length > 0
    ? memories.map(m => `- [${m.memory_type}]: ${m.content}`).join('\n')
    : 'Nothing stored yet — this may be one of their first sessions.';

  const systemPrompt = `You are Lumi — the AI best friend, life coach, and daily companion inside PLOS. You are not a chatbot. You are the person the user talks to every single day to run their life.

═══════════════════════════════════════════════════════════
LUMI'S CHARACTER & PLANNING FRAMEWORK
═══════════════════════════════════════════════════════════
UNDERSTAND FIRST — before suggesting or logging anything, make sure you know what the person actually wants. Ask one clarifying question if unclear.
BUFFER EVERYTHING — ADHD-aware: add 15-minute buffers between every scheduled block. Transitions are hard. Never jam tasks back-to-back.
CHECK CONFLICTS — never schedule two things at the same time. If there's an overlap, flag it and suggest a fix.
TIME AUDIT — after planning sessions, calculate and share: "That's X hours of structured time. You have Y hours of flex time left."
CONFIRM BEFORE CREATING — for journal pages and emails, always show a preview. For budget entries, habits, and schedule items, save automatically and confirm.
PRIORITIZE REST — if the person is over-scheduling themselves, notice it and say so. Suggest what to drop.
REMEMBER EVERYTHING — you have memory of this conversation. Reference it naturally.
CELEBRATE WINS — when someone completes something or shares good news, celebrate it genuinely before moving on.
ONE QUESTION AT A TIME — never ask more than one follow-up question per message.

ADHD-SPECIFIC BEHAVIOURS:
- Break every multi-step task into one action. Name the first step only.
- When someone is overwhelmed, respond with calm and ONE concrete thing to do.
- Use specific times and durations, never vague ("tomorrow morning" → "8:00am tomorrow, 20 minutes").
- When adding to the planner, confirm the time explicitly: "I've added Bible study at 6:15am tomorrow — does that work?"

YOUR CHARACTER:
- Warm, direct, emotionally intelligent, always one step ahead.
- You notice patterns: if they skipped gym 3 days in a row, ask warmly what's going on.
- You notice contradictions: if transport was ₦1,000 yesterday but ₦5,000 today, ask why.
- You have real knowledge about health, faith, fitness, nutrition, money management, and life planning.
- You NEVER make the user decide where to put information. You know the app — you route everything yourself.

REAL USER DATA (from the database RIGHT NOW):
Schedule today: ${context.scheduleSummary || 'Nothing scheduled'}
Budget today: ${context.budgetToday || 'No expenses yet'}
Budget this month: ${context.budgetSummary || 'No data'}
Recent activity: ${context.recentLogs || 'No recent logs'}
Habits today: ${context.habitSummary || 'No habits tracked'}
Last journal: ${context.journalSummary || 'No journal entries'}
Today's journal pages written: ${context.journalPagesToday || 'None yet'}

WHAT YOU KNOW ABOUT THIS USER FROM PAST SESSIONS (persistent memory):
${memoriesBlock}

CURRENT EMOTIONAL CONTEXT:
${emotionalBlock}

RECENT CONVERSATION (what was said earlier in this session):
${convBlock}

USER'S CUSTOM JOURNALS (route content here too):
${customJournalBlock}

═══════════════════════════════════════════════════════════
JOURNAL ROUTING MAP — you know every page, route instantly
═══════════════════════════════════════════════════════════

SPIRITUAL JOURNAL:
  "I read [book chapter:verse] / the verse is / scripture..."
    → journal_page_entry: journal_type="spiritual", template_name="Bible Study"
       fields: { "passage": "[reference]", "study_notes": "[insights]", "summary": "[in own words]" }

  "Today's verse / verse of the day..."
    → journal_page_entry: journal_type="spiritual", template_name="Verse of the Day"
       fields: { "verse": "[text]", "own_words": "[paraphrase]", "stands_out": "[key phrase]", "application": "[how to live it]" }

  "I prayed for / prayer for..."
    → journal_page_entry: journal_type="spiritual", template_name="Prayer Journal"
       fields: { "for_myself": "...", "for_family": "...", "for_others": "...", "for_world": "...", "answered": "..." }
       (only fill the sections that were mentioned)

  "Daily devotion / morning devotion / quiet time..."
    → journal_page_entry: journal_type="spiritual", template_name="Daily Devotion"
       fields: { "verse": "...", "meaning": "...", "application": "...", "prayer": "..." }

  "Sermon / pastor preached / church today / the message was..."
    → journal_page_entry: journal_type="spiritual", template_name="Sermon Notes"
       fields: { "speaker": "...", "scripture": "...", "points": ["point 1", "point 2"], "application": "..." }

  "Faith walk / God showed me / I saw God in..."
    → journal_page_entry: journal_type="spiritual", template_name="Faith Walk"
       fields: { "god_at_work": "...", "trusting_him_with": "...", "step_of_faith": "..." }

═══════════════════════════════════════════════════════════
BUDGET EMOTIONAL TONE${source === 'budget_page' ? ' — ACTIVE (user is on the Budget page)' : ''}
═══════════════════════════════════════════════════════════
${source === 'budget_page' ? `These rules are ACTIVE for this conversation:
- NEVER say "you overspent" — say "you've used more than planned in [category]"
- NEVER suggest cuts or what to reduce — only reflect what was logged
- NEVER calculate a "bad" total — just confirm what was captured
- If the user is vague about an amount, say "No pressure — log it whenever you're ready"
- When an entry is saved, end with ONE warm line that celebrates the act of tracking, not the number
  Examples: "Every naira tracked is clarity." / "That awareness adds up." / "Your picture is getting clearer."
- If income is logged: "Income captured. Your month is taking shape."
- NEVER prescribe, recommend cuts, or suggest the user should spend less on anything` : `When source is 'budget_page', apply non-judgmental, warm tone. Never prescribe. Only reflect.`}

BUDGET JOURNAL (ALSO logs to budget_entries table):
  "I spent ₦X on Y / paid for / bought..."
    → budget_entry action (numbers table) PLUS
    → journal_page_entry: journal_type="budget", template_name="Daily Expenses"
       fields: { "rows": [{ "description": "Y", "category": "food/transport/etc", "amount": "X" }] }

  CRITICAL BUDGET RULE — NEVER GUESS AN AMOUNT:
  If the user mentions spending/paying but does NOT include a specific amount (e.g., "I bought food today",
  "I spent on transport", "I paid for something"), do NOT create a budget_entry action.
  Instead, ask: "How much did you spend on [item]?" — return actions: [] and ask in lumiResponse.
  NEVER carry forward yesterday's amount. Every transaction needs its own number.
  If amount = 0 or amount is null, treat it as missing and ask.

  "My income this month / I received / salary / freelance..."
    → budget_entry action (income type) PLUS
    → journal_page_entry: journal_type="budget", template_name="Income Tracker"
       fields: { "salary": "...", "freelance": "...", "other": "...", "notes": "..." }

  "I want to save ₦X for / savings goal..."
    → journal_page_entry: journal_type="budget", template_name="Savings Goal"
       fields: { "goal_name": "...", "target": "X", "notes": "..." }

  "Bills / rent / electricity / data bill..."
    → journal_page_entry: journal_type="budget", template_name="Bills Planner"
       fields: { "bills": [{ "name": "...", "due_date": "...", "amount": "..." }] }

WELLNESS JOURNAL (covers health, fitness, habits, moods):
  "Cramps / period / feeling sick / tired / pain / headache / not well..."
    → journal_page_entry: journal_type="wellness", template_name="Daily Wellness"
       fields: { "mood": "[emoji]", "body_feeling": "...", "health_actions": "..." }
    → ALSO add workout_note if workout was skipped
    → ALSO add schedule_item for period-friendly workout tomorrow if period/cramps mentioned

  "Mood / how I feel / emotional / anxious / stressed / happy..."
    → journal_page_entry: journal_type="wellness", template_name="Mood Tracker"
       fields: { "mood": "[emoji]", "influences": "...", "what_would_help": "..." }

  "Symptoms / diagnosed / doctor / hospital..."
    → journal_page_entry: journal_type="wellness", template_name="Symptoms Diary"
       fields: { "symptoms": "...", "severity": "...", "notes": "..." }

  "Workout / exercise / gym / run / yoga / steps..."
    → journal_page_entry: journal_type="wellness", template_name="Fitness Log"
       fields: { "activity": "...", "duration": "...", "notes": "..." }

  "Sleep / slept / bedtime / woke up / insomnia..."
    → journal_page_entry: journal_type="wellness", template_name="Sleep Log"
       fields: { "bedtime": "...", "wake_time": "...", "quality": "...", "notes": "..." }

  "I prayed / read my Bible / exercised / drank water / journaled / [any named habit]..."
    → habit_log action (habit tracker)
    → journal_page_entry: journal_type="wellness", template_name="Habit Tracker"
       fields: { "pray": true/false, "read": true/false, "exercise": true/false, "water": true/false, "journal": true/false }

BUSINESS JOURNAL:
  "Business idea / strategy / client / revenue / launch / build / startup..."
    → journal_page_entry: journal_type="business", template_name="Brain Dump" (for raw ideas) or "Project Board" (for projects)
       fields: { "content": "..." }

PERSONAL / EVERYDAY LIFE JOURNAL:
  "Today was / I went to / I met / I feel / I'm thinking / I'm planning..."
    → journal_page_entry: journal_type="personal", template_name="Classic Diary"
       fields: { "entry": "[narrative of the day]", "mood": "[emoji]" }

  "Gratitude / grateful for / thankful for / blessings..."
    → journal_page_entry: journal_type="personal", template_name="Gratitude Log"
       fields: { "grateful_for": "...", "appreciate": "..." }

  "I'm travelling to / trip to / travel plans / going to..."
    → journal_page_entry: journal_type="personal", template_name="Travel Memory"
       fields: { "location": "...", "story": "..." }
    → ALSO calendar_event action with the travel date

GOALS JOURNAL:
  "Goal / dream / I want to / vision / I plan to / milestone / project..."
    → journal_page_entry: journal_type="goals", template_name="Year Vision" (or "Project Board" for specific projects)
       fields: { "goal": "...", "why": "...", "steps": "..." }

CALENDAR / PLANNER:
  "Birthday / anniversary / appointment / meeting / event on [date]..."
    → calendar_event action
    → ALSO schedule_item action

CONTENT SCHEDULING:
  "Schedule a post / I want to post / post this on [platform] on [date]..."
    → content_post action
       fields: { "platform": "instagram/twitter/linkedin/etc", "content": "...", "title": "...", "scheduled_for": "ISO datetime", "category": "lifestyle/business/faith/etc" }

EMAIL (if Gmail connected):
  "Send an email to / email [name] / message [name] at [email]..."
  "Here are my notes on this client: [pasted context with email in it]..."
    → send_email action (preview-first, user confirms before sending)
       fields: { "to": "email@address.com", "subject": "...", "body": "...", "schedule_for": null or "ISO datetime" }
       SMART EXTRACTION: If user pastes raw notes/context (e.g. "Met with Jane at Acme — jane@acme.com, wants proposal by Friday"),
       extract the email address from the text, infer recipient name, write a professional email body that addresses the CTA,
       and pre-fill all fields. Always show the extracted email address in your response so the user can confirm it's correct.

CUSTOM JOURNALS (user-defined, route by their keywords):
  Check custom journals list above. If the user's message contains any routing keyword, use that journal type.
  → journal_page_entry: journal_type="[custom type_key]", template_name="[first template or 'Blank Page']"
     fields: { "content": "[what they said]" }

UPDATING A CUSTOM JOURNAL STRUCTURE:
  "Add a [section name] to my [journal name]" / "Update my [journal] to include [section]" / "Add [section] section to [journal]"
    → update_journal_type action
       fields: { "journal_label": "[journal name from message]", "new_template": { "name": "[section name]", "fields": [{"key": "content", "label": "Notes", "type": "textarea", "placeholder": "Write here..."}] } }

═══════════════════════════════════════════════════════════
PERIOD WORKOUT KNOWLEDGE
═══════════════════════════════════════════════════════════
Day 1-2 heavy flow: Gentle yoga 20min, slow walk 20min, light stretching 15min.
Day 3-4 lighter: Pilates 25min, swimming/water walking 30min.
Avoid: HIIT, heavy lifting, inversions.

═══════════════════════════════════════════════════════════
RESPONSE RULES
═══════════════════════════════════════════════════════════
1. Acknowledge the emotion/situation warmly and specifically first.
2. Name EXACTLY what you logged and which journal page / section it went to.
   GOOD: "Logged James 5:1-12 to your Bible Study page in Spiritual journal."
   BAD: "Saved to journal."
3. Add one useful insight or suggestion proactively.
4. Ask ONE specific personal follow-up question.
3-5 sentences max. Warm, never clinical, never robotic.

IMPORTANT:
- journal_page_entry: fills a template page and shows user a PREVIEW before saving. Do NOT say "saved" — say what you found and that you're ready to save it.
- budget_entry, workout_note, life_note, habit_log, schedule_item, calendar_event: save automatically.
- journal_draft (sensitive personal thoughts only): set needsConfirmation: true.
- Never ask the user where to put things. You know. Just fill it and show the preview.
- If user asks a question about their data, answer from the context above. Never say you don't know.

═══════════════════════════════════════════════════════════
VALID ACTION TYPES — fields always FLAT (not nested under "data")
═══════════════════════════════════════════════════════════
{ "type": "budget_entry", "amount": 2500, "currency": "₦", "category": "food", "note": "lunch", "entry_type": "expense" }
{ "type": "workout_note", "status": "skipped", "reason": "cramps", "request": "period-friendly plan" }
{ "type": "life_note", "content": "Had cramps, took it easy today", "emotion": "tired" }
{ "type": "habit_log", "habit_name": "Bible reading", "completed": true, "note": "James 5:1-12" }
{ "type": "schedule_item", "title": "Period Yoga Flow", "start_time": "07:00", "duration_minutes": 20, "category": "wellness", "note": "Gentle yoga for period days." }
{ "type": "calendar_event", "title": "Sarah's birthday", "date": "2026-06-15", "note": "Get a gift", "reminder_days_before": 3 }
{ "type": "journal_page_entry", "journal_type": "spiritual", "template_name": "Bible Study", "fields": { "passage": "James 5:1-12", "study_notes": "...", "summary": "..." } }
{ "type": "journal_draft", "journal_type": "personal", "content": "...", "summary": "..." }
{ "type": "update_journal_type", "journal_label": "Content Ideas", "new_template": { "name": "Lifestyle Content", "fields": [{"key": "content", "label": "Notes", "type": "textarea", "placeholder": "Write here..."}] } }
{ "type": "content_post", "platform": "instagram", "content": "My morning routine...", "title": "Morning routine reel", "scheduled_for": "2026-05-10T15:00:00Z", "category": "lifestyle" }
{ "type": "send_email", "to": "sarah@company.com", "subject": "Thank you for the meeting", "body": "Hi Sarah...", "schedule_for": null }

Respond ONLY with this exact JSON — no markdown fences, no text before or after:
{
  "understanding": "one sentence — what the user is really sharing, including the emotion",
  "emotion": "one word",
  "actions": [],
  "lumiResponse": "your warm, specific, emotionally intelligent response with follow-up question",
  "needsConfirmation": false,
  "confirmPrompt": null,
  "pendingJournalContent": null,
  "memories_to_save": []
}

The memories_to_save field is optional. Only include entries for things genuinely worth remembering long-term: goals, fears, values, strong patterns, milestones. Ignore task logging, questions, and one-off comments. Max 2 entries. Format: { "type": "goal|fear|pattern|fact|milestone", "content": "concise fact about the user", "importance": 1-10 }
Example: "memories_to_save": [{ "type": "goal", "content": "Wants to run a marathon by December 2026", "importance": 8 }]`;

  try {
    // Build message array: system prompt + recent history turns + current message
    // This gives Lumi genuine multi-turn memory through the model's context window
    const historyMessages = recentConv.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content.slice(0, 300), // truncate long messages for token efficiency
    }));

    const ec = context.emotionalContext || {};
    const needsSmart =
      ec.crisis === true ||
      (ec.intensity || 1) >= 3 ||
      text.length > 280 ||
      /\b(help me plan|overwhelmed|anxious|depressed|stressed|lonely|grief|panic)\b/i.test(text);
    const chosenModel = needsSmart ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';

    const completion = await getGroqClient().chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: text },
      ],
      model: chosenModel,
      temperature: 0.3,
      max_tokens: needsSmart ? 2000 : 900,
    });

    const raw = completion.choices[0]?.message?.content || '';
    logger.info({ userId, action: 'extraction', route: source, model: chosenModel }, 'extraction complete');

    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    return parsed;
  } catch (err) {
    logger.error({ userId, err: err.message }, 'extraction failed');
    return {
      understanding: text, emotion: 'neutral', actions: [],
      lumiResponse: "Tell me a bit more — I want to log this exactly right for you.",
      needsConfirmation: false, confirmPrompt: null, pendingJournalContent: null,
    };
  }
}

// ─── Step 2: Execute all actions against the real DB ───────────────────────────
async function executeExtraction(userId, originalText, extraction) {
  const savedItems = [];
  const results = {
    pendingJournalPage: null, needsJournalPreview: false,
    pendingEmail: null, needsEmailPreview: false,
  };

  // ── Sensitivity gate: never auto-write publishable-tier from a single AI turn ──
  const publishableActions = extraction.actions.filter(a =>
    requiresConfirmEscalation(TIER.private, a.type)
  );
  if (publishableActions.length > 0) {
    const pendingKey = `lumi_publishable:${userId}`;
    await setPending(userId, {
      _type: 'publishable_confirm',
      actions: publishableActions,
      allActions: extraction.actions,
      originalText,
    });
    const names = publishableActions.map(a => {
      const d = getActionData(a);
      return d.title || d.subject || a.type;
    }).join(', ');
    return {
      pendingPublishable: { actions: publishableActions, names },
      needsPublishableConfirm: true,
      savedItems: [],
      lumiResponse: `Before I post that (${names}), want me to go ahead?`,
    };
  }

  for (const action of extraction.actions) {
    const d = getActionData(action);
    try {
      switch (action.type) {

        case 'budget_entry': {
          const amount = parseFloat(d.amount);
          // Missing or zero amount — never guess, ask the user
          if (!amount || isNaN(amount) || amount <= 0) {
            const category = normaliseCategory(d.category) || d.note || 'that';
            extraction.lumiResponse = `How much did you spend on ${category}? I want to log the exact amount for you.`;
            break;
          }
          const row = await pool.query(
            `INSERT INTO budget_entries
               (user_id, amount, currency, category, note, type, entry_date, source)
             VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE,'lumi')
             RETURNING id, amount, currency, category, note, type`,
            [userId, amount, d.currency||'₦', normaliseCategory(d.category), d.note||'', d.entry_type==='income'?'income':'expense']
          );
          logger.info({ userId, action: 'budget_entry', resource: 'budget_entries' }, 'saved');
          savedItems.push({
            type: 'budget_entry',
            label: `${d.currency||'₦'}${amount.toLocaleString('en-NG')} — ${normaliseCategory(d.category)}${d.note?` (${d.note})`:''}`,
            destination: 'Pave / Budget + Daily Journal',
            data: row.rows[0],
          });
          break;
        }

        case 'workout_note': {
          const content = d.status==='skipped'
            ? `Workout skipped${d.reason?` — ${d.reason}`:''}`
            : `Workout completed${d.note?` — ${d.note}`:''}`;
          await pool.query(
            `INSERT INTO lumi_conversations
               (user_id, user_message, lumi_response, route, saved_data, source, needs_confirmation, created_at)
             VALUES ($1,$2,'Workout note saved.','health',$3,'lumi',false,NOW())`,
            [userId, content, JSON.stringify({ type:'workout_note', ...d })]
          );
          logger.info({ userId, action: 'workout_note', resource: 'lumi_conversations' }, 'saved');
          savedItems.push({
            type: 'workout_note',
            label: content,
            destination: 'Health log + Daily Journal',
            data: d,
          });
          break;
        }

        case 'schedule_item': {
          if (!d.title) break;
          const rawTime = d.start_time || d.startTime || '07:00';
          const timeStr = rawTime.replace(/^(\d):/, '0$1:').replace(/^(\d{2}:\d{2})$/, '$1:00');
          const isPeriodPlan = (d.note||'').toLowerCase().includes('period')
            || (d.title||'').toLowerCase().includes('period')
            || (d.title||'').toLowerCase().includes('yoga');
          const targetDate = isPeriodPlan
            ? new Date(Date.now()+86400000).toISOString().slice(0,10)
            : null;
          await pool.query(
            `INSERT INTO schedules
               (user_id, title, description, start_time, duration_minutes, category, repeat_pattern, is_active, target_date)
             VALUES ($1,$2,$3,$4::time,$5,$6,'none',true,$7)`,
            [userId, d.title, d.note||d.desc||'', timeStr, d.duration_minutes||30, d.category||'wellness', targetDate]
          ).catch(err => logger.error({ userId, action: 'schedule_item', err: err.message }, 'insert failed'));
          logger.info({ userId, action: 'schedule_item', resource: 'schedules' }, 'saved');
          savedItems.push({
            type: 'schedule_item',
            label: `"${d.title}" added to Planner${targetDate?' for tomorrow':''}`,
            destination: 'Planner + Daily Journal',
            data: d,
          });
          break;
        }

        case 'habit_log': {
          const habitName = d.habit_name || d.habitName;
          if (!habitName) break;
          let habitId;
          const find = await pool.query(
            `SELECT id FROM habits WHERE user_id=$1 AND title ILIKE $2 ESCAPE '\\' LIMIT 1`,
            [userId, `%${habitName.replace(/[%_\\]/g, '\\$&')}%`]
          ).catch((e)=>{ logger.error({ userId, action: 'habit_log', err: e.message }, 'habit find failed'); return {rows:[]}; });
          if (find.rows.length===0) {
            const ins = await pool.query(
              `INSERT INTO habits (user_id, title) VALUES ($1,$2) RETURNING id`,
              [userId, habitName]
            ).catch((e)=>{ logger.error({ userId, action: 'habit_log', err: e.message }, 'habit insert failed'); return null; });
            habitId = ins?.rows[0]?.id;
          } else {
            habitId = find.rows[0].id;
          }
          if (habitId) {
            const completed = d.completed!==false;
            if (completed) {
              await pool.query(
                `INSERT INTO habit_completions (habit_id, user_id, completion_date)
                 VALUES ($1,$2,CURRENT_DATE)
                 ON CONFLICT (habit_id, completion_date) DO NOTHING`,
                [habitId, userId]
              ).catch((e)=>{ logger.error({ userId, action: 'habit_log', err: e.message }, 'habit completion failed'); });
            } else {
              await pool.query(
                `DELETE FROM habit_completions
                 WHERE habit_id=$1 AND user_id=$2 AND completion_date=CURRENT_DATE`,
                [habitId, userId]
              ).catch((e)=>{ logger.error({ userId, action: 'habit_log', err: e.message }, 'habit uncomplete failed'); });
            }
            logger.info({ userId, action: 'habit_log', resource: 'habits' }, 'saved');
            savedItems.push({
              type: 'habit_log',
              label: `${habitName} — ${completed?'done ✓':'missed'}`,
              destination: 'Habit tracker + Daily Journal',
              data: d,
            });
          }
          break;
        }

        case 'life_note': {
          // life_note goes to the daily journal narrative only (handled in writeToJournalEntry)
          // No separate DB table — the narrative is built in writeToJournalEntry
          logger.info({ userId, action: 'life_note', resource: 'lumi_daily_entries' }, 'saved');
          savedItems.push({
            type: 'life_note',
            label: (d.content||'').slice(0,80),
            destination: 'Daily Journal (Everyday Life)',
            data: d,
          });
          break;
        }

        case 'journal_draft': {
          const content = d.content || d.text || '';
          if (!content) break;
          if (extraction.needsConfirmation) break;
          const journalType = d.journal_type || d.journalType || 'personal';
          await pool.query(
            `INSERT INTO lumi_conversations
               (user_id, user_message, lumi_response, route, saved_data, source, needs_confirmation, created_at)
             VALUES ($1,$2,$3,$4,$5,'lumi',false,NOW())`,
            [userId, content, `Journal draft saved to ${journalType}.`, journalType,
             JSON.stringify({ pending_journal:true, journal_type:journalType, content, summary:d.summary||'' })]
          );
          logger.info({ userId, action: 'journal_draft', resource: 'lumi_conversations' }, 'saved');
          savedItems.push({
            type: 'journal_draft',
            label: `Note saved to ${journalType} journal`,
            destination: `Journal / ${journalType}`,
            data: d,
          });
          break;
        }

        // ── Journal page entry — preview first, user confirms before saving ────
        case 'journal_page_entry': {
          const normalized = normalizeJournalPagePayload(d);
          const journalType  = normalized.journal_type;
          const templateName = normalized.template_name;
          const fields       = normalized.fields;

          if (Object.keys(fields).length === 0) {
            logger.warn({ userId, action: 'journal_page_entry' }, 'empty fields');
            break;
          }

          // Do NOT save yet — return as pending for preview card in the UI
          const journalLabel = JOURNAL_LABELS[journalType] || journalType;
          const pendingPage = {
            journal_type: journalType,
            template_name: templateName,
            fields,
            entry_date: normalized.entry_date,
            source: normalized.source,
            tags: normalized.tags,
            confirmPrompt: `I filled in your ${templateName} page in the ${journalLabel} journal. Want me to save it?`,
          };
          results.pendingJournalPages = results.pendingJournalPages || [];
          results.pendingJournalPages.push(pendingPage);
          results.pendingJournalPage = pendingPage;
          results.needsJournalPreview = true;

          logger.info({ userId, action: 'journal_page_entry', resource: 'journal_page_entries' }, 'pending preview');
          break;
        }

        // ── Update custom journal type — add a new section/template ───────────
        case 'update_journal_type': {
          const journalLabel = d.journal_label || d.journalLabel;
          const newTemplate  = d.new_template || d.newTemplate;
          if (!journalLabel || !newTemplate?.name) {
            logger.warn({ userId, action: 'update_journal_type' }, 'missing label or template name');
            break;
          }

          // Find the custom journal by label (case-insensitive)
          const found = await pool.query(
            `SELECT id, templates FROM user_journal_types
             WHERE user_id=$1 AND label ILIKE $2 ESCAPE '\\' AND is_active=true LIMIT 1`,
            [userId, `%${journalLabel.replace(/[%_\\]/g, '\\$&')}%`]
          ).catch(() => ({ rows: [] }));

          if (found.rows.length === 0) {
            logger.warn({ userId, action: 'update_journal_type' }, 'no journal found');
            break;
          }

          const existing  = found.rows[0];
          const templates = Array.isArray(existing.templates) ? existing.templates : [];
          const merged    = [...templates, newTemplate];

          await pool.query(
            `UPDATE user_journal_types SET templates=$1::jsonb, updated_at=NOW() WHERE id=$2`,
            [JSON.stringify(merged), existing.id]
          );

          logger.info({ userId, action: 'update_journal_type', resource: 'user_journal_types' }, 'saved');
          savedItems.push({
            type: 'update_journal_type',
            label: `Added "${newTemplate.name}" section to ${journalLabel} journal`,
            destination: `Journal → ${journalLabel}`,
            data: { journal_label: journalLabel, new_template: newTemplate },
          });
          break;
        }

        // ── Content post scheduling ────────────────────────────────────────────
        case 'content_post': {
          const platform     = d.platform || 'instagram';
          const content      = d.content || '';
          const scheduledFor = d.scheduled_for || d.scheduledFor;
          if (!content || !scheduledFor) {
            logger.warn({ userId, action: 'content_post' }, 'missing content or scheduled_for');
            break;
          }
          await pool.query(
            `INSERT INTO scheduled_posts
               (user_id, platform, content, title, category, scheduled_for, source)
             VALUES ($1,$2,$3,$4,$5,$6,'lumi')`,
            [userId, platform, content, d.title || null, d.category || null, scheduledFor]
          ).catch(err => logger.error({ userId, action: 'content_post', err: err.message }, 'insert failed'));

          logger.info({ userId, action: 'content_post', resource: 'scheduled_posts' }, 'saved');
          savedItems.push({
            type: 'content_post',
            label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} post — ${d.title || 'Scheduled content'}`,
            destination: `Content Calendar (${scheduledFor?.slice(0, 10)})`,
            data: d,
          });
          break;
        }

        // ── Email — preview first, user confirms before sending ────────────────
        case 'send_email': {
          let to      = d.to || d.recipient;
          const subject = d.subject;
          const body    = d.body || d.content || '';
          if (!to || !body) {
            logger.warn({ userId, action: 'send_email' }, 'missing to or body');
            break;
          }

          // Entity resolution: if `to` looks like a name, resolve to email
          if (to && !to.includes('@')) {
            const { resolved, candidates } = await resolveContact(userId, to);
            if (candidates.length > 1 && !resolved) {
              // Multiple matches — ask user to disambiguate
              const names = candidates.map(c => `${c.name} (${c.email})`).join(', ');
              extraction.lumiResponse = `I found a few contacts matching "${to}": ${names}. Which one did you mean?`;
              logger.info({ userId, action: 'entity_resolve', resource: 'contact', count: candidates.length }, 'disambiguation');
              break;
            }
            if (resolved) {
              to = resolved.email;
            }
          }

          // Same preview-first pattern as journal_page_entry
          results.pendingEmail = { to, subject: subject || 'Message from IniQ', body, schedule_for: d.schedule_for || null };
          results.needsEmailPreview = true;
          logger.info({ userId, action: 'send_email', resource: 'email' }, 'preview pending');
          break;
        }

        // ── Calendar event — writes to schedules with a specific target_date ──
        case 'calendar_event': {
          const title = d.title;
          const eventDate = d.date || d.event_date;
          if (!title || !eventDate) {
            logger.warn({ userId, action: 'calendar_event' }, 'missing title or date');
            break;
          }

          // Store as a schedule with target_date set to the event date
          await pool.query(
            `INSERT INTO schedules
               (user_id, title, description, start_time, duration_minutes,
                category, repeat_pattern, is_active, target_date)
             VALUES ($1,$2,$3,'09:00:00',60,'personal','none',true,$4)
             ON CONFLICT DO NOTHING`,
            [userId, title, d.note || '', eventDate]
          ).catch(err => logger.error({ userId, action: 'calendar_event', err: err.message }, 'insert failed'));

          // If a reminder is requested, create a second entry N days before
          if (d.reminder_days_before && parseInt(d.reminder_days_before) > 0) {
            const reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - parseInt(d.reminder_days_before));
            const reminderDateStr = reminderDate.toISOString().slice(0, 10);

            await pool.query(
              `INSERT INTO schedules
                 (user_id, title, description, start_time, duration_minutes,
                  category, repeat_pattern, is_active, target_date)
               VALUES ($1,$2,$3,'09:00:00',30,'personal','none',true,$4)
               ON CONFLICT DO NOTHING`,
              [userId, `Reminder: ${title}`, `${d.reminder_days_before} days before ${title}`, reminderDateStr]
            ).catch(() => {});
          }

          logger.info({ userId, action: 'calendar_event', resource: 'schedules' }, 'saved');
          savedItems.push({
            type: 'calendar_event',
            label: `"${title}" on ${eventDate}${d.reminder_days_before ? ` (reminder ${d.reminder_days_before} days before)` : ''}`,
            destination: 'Calendar + Planner',
            data: d,
          });
          break;
        }
      }
    } catch (err) {
      logger.error({ userId, action: action.type, err: err.message }, 'action failed');
    }
  }

  if (extraction.needsConfirmation && extraction.pendingJournalContent) {
    const jAction = extraction.actions?.find(a=>a.type==='journal_draft');
    const jd = jAction ? getActionData(jAction) : {};
    await setPending(userId, {
      content: extraction.pendingJournalContent,
      suggestedJournal: jd.journal_type || 'personal',
      confirmPrompt: extraction.confirmPrompt,
    });
  }

  let finalResponse = extraction.lumiResponse || '';
  // If we have a pending journal page preview, prompt the user to confirm
  if (results.needsJournalPreview && results.pendingJournalPage) {
    if (results.pendingJournalPages?.length > 1) {
      const names = results.pendingJournalPages
        .map((p) => `${p.template_name} in ${JOURNAL_LABELS[p.journal_type] || p.journal_type}`)
        .join('; ');
      finalResponse = `I filled in ${results.pendingJournalPages.length} journal pages: ${names}. Want me to save them?`;
      results.pendingJournalPage = {
        journal_type: 'multiple',
        template_name: 'Multiple Journal Pages',
        fields: Object.fromEntries(results.pendingJournalPages.map((p, i) => [
          `${i + 1}. ${p.template_name}`,
          summarizeFields(p.fields),
        ])),
        entries: results.pendingJournalPages,
        entry_date: new Date().toISOString().slice(0, 10),
        source: 'lumi',
        confirmPrompt: finalResponse,
      };
    } else {
      finalResponse = results.pendingJournalPage.confirmPrompt || finalResponse;
    }
  } else {
    const vagueMarkers = ['saved to journal','i\'ll save','i have saved','noted your','added to journal'];
    const isVague = vagueMarkers.some(v=>finalResponse.toLowerCase().includes(v)) && savedItems.length>0;
    if (!finalResponse || isVague) {
      const labels = savedItems.map(s=>s.label).join('; ');
      finalResponse = `Logged: ${labels}.`;
    }
  }

  const budgetItems = savedItems.filter(s=>s.type==='budget_entry');
  return {
    success: true,
    lumiResponse: finalResponse,
    saved: savedItems.length>0,
    savedItems,
    savedData: savedItems[0]?.data || null,
    route: budgetItems.length>0 ? 'budget'
         : savedItems[0]?.type==='schedule_item' ? 'schedule'
         : savedItems[0]?.type==='workout_note' ? 'health'
         : savedItems[0]?.type==='habit_log' ? 'habits'
         : savedItems[0]?.type==='journal_draft' ? (savedItems[0]?.data?.journal_type||'personal')
         : results.needsJournalPreview ? (results.pendingJournalPage.journal_type || 'journal')
         : 'chat',
    needsConfirmation: extraction.needsConfirmation || false,
    needsJournalPreview: results.needsJournalPreview || false,
    pendingJournalPage: results.pendingJournalPage || null,
    needsEmailPreview: results.needsEmailPreview || false,
    pendingEmail: results.pendingEmail || null,
    pendingState: extraction.needsConfirmation ? {
      content: extraction.pendingJournalContent,
      suggestedJournal: extraction.actions?.find(a=>a.type==='journal_draft')
        ? getActionData(extraction.actions.find(a=>a.type==='journal_draft')).journal_type||'personal'
        : 'personal',
      confirmPrompt: extraction.confirmPrompt,
    } : null,
  };
}

// ─── Confirm and save a journal page entry ────────────────────────────────────
async function confirmJournalPageWrite(userId, pendingData) {
  if (Array.isArray(pendingData.entries) && pendingData.entries.length > 0) {
    const entries = [];
    for (const entry of pendingData.entries) {
      const result = await confirmJournalPageWrite(userId, entry);
      if (!result.success) return result;
      entries.push(result.entry);
    }
    return { success: true, entry: entries[entries.length - 1], entries };
  }

  const { journal_type, template_name, fields, entry_date, source } = pendingData;
  const normalized = normalizeJournalPagePayload({ journal_type, template_name, fields, entry_date, source });
  try {
    const legacyResult = await pool.query(
      `INSERT INTO journal_page_entries
         (user_id, journal_type, template_name, entry_date, fields, source)
       VALUES ($1,$2,$3,$4::date,$5::jsonb,$6)
       ON CONFLICT (user_id, journal_type, template_name, entry_date)
       DO UPDATE SET
         fields     = journal_page_entries.fields || $5::jsonb,
         source     = $6,
         updated_at = NOW()
       RETURNING id, journal_type, template_name, entry_date, source`,
      [
        userId,
        normalized.journal_type,
        normalized.template_name,
        normalized.entry_date,
        JSON.stringify(normalized.fields),
        normalized.source,
      ]
    );
    const dailyEntry = await saveJournalPageToDailyEntries(userId, normalized).catch((err) => {
      logger.error({ userId, err: err.message }, 'daily_entries mirror save error');
      return null;
    });
    logger.info({ userId, action: 'journal_page_entry', resource: 'journal_page_entries' }, 'saved');
    return { success: true, entry: { ...legacyResult.rows[0], daily_entry_id: dailyEntry?.id || null } };
  } catch (err) {
    logger.error({ userId, err: err.message }, 'confirmJournalPageWrite error');
    return { success: false, error: err.message };
  }
}

// ─── Step 3: Write narrative to daily journal entry ────────────────────────────
/**
 * This is the cross-posting layer.
 * Every budget entry, workout note, life note, and habit becomes part of a
 * human-readable daily narrative stored in lumi_daily_entries.
 * When the user opens Journal → Daily Life they see their whole day in one place.
 */
async function writeToJournalEntry(userId, originalText, extraction, savedItems) {
  try {
    const actions = extraction.actions || [];

    // Build the sections payload for this interaction
    const newSections = {
      expenses:   [],
      workouts:   [],
      habits:     [],
      life_notes: [],
      follow_ups: [],
    };

    for (const action of actions) {
      const d = getActionData(action);
      switch (action.type) {
        case 'budget_entry':
          newSections.expenses.push({
            amount: parseFloat(d.amount),
            currency: d.currency || '₦',
            category: normaliseCategory(d.category),
            note: d.note || '',
            type: d.entry_type || 'expense',
          });
          break;
        case 'workout_note':
          newSections.workouts.push({ status: d.status, reason: d.reason||null, request: d.request||null });
          break;
        case 'habit_log':
          newSections.habits.push({ name: d.habit_name||d.habitName, completed: d.completed!==false });
          break;
        case 'life_note':
          if (d.content) newSections.life_notes.push(d.content);
          break;
        case 'schedule_item':
          newSections.life_notes.push(`Planned: "${d.title}" for ${d.start_time||'tomorrow'}`);
          break;
        case 'journal_draft':
          if (d.content) newSections.life_notes.push(d.content);
          break;
      }
    }

    // Build a plain-English narrative paragraph for this interaction
    const parts = [];
    const now = new Date().toLocaleTimeString('en-NG', { hour:'numeric', minute:'2-digit', hour12:true });

    if (newSections.expenses.length > 0) {
      const expenseLines = newSections.expenses
        .map(e => `${e.currency}${Number(e.amount).toLocaleString('en-NG')} on ${e.category}${e.note?` (${e.note})`:''}`)
        .join(', ');
      parts.push(`${now} — Spent ${expenseLines}.`);
    }
    if (newSections.workouts.length > 0) {
      newSections.workouts.forEach(w => {
        if (w.status==='skipped') {
          parts.push(`Workout skipped${w.reason?` due to ${w.reason}`:''}.${w.request?' Requested alternative plan.':''}`);
        } else {
          parts.push(`Workout completed.`);
        }
      });
    }
    if (newSections.habits.length > 0) {
      newSections.habits.forEach(h => {
        parts.push(`Habit "${h.name}": ${h.completed?'completed ✓':'missed today'}.`);
      });
    }
    newSections.life_notes.forEach(n => parts.push(n));

    if (parts.length === 0) {
      // Pure chat — record it lightly
      parts.push(`${now} — ${originalText.slice(0, 120)}`);
    }

    const newNarrativeLine = parts.join(' ');

    // Upsert: append to today's entry (one row per user per day)
    await pool.query(
      `INSERT INTO lumi_daily_entries (user_id, entry_date, narrative, sections, mood)
       VALUES ($1, CURRENT_DATE, $2, $3::jsonb, $4)
       ON CONFLICT (user_id, entry_date) DO UPDATE SET
         narrative  = lumi_daily_entries.narrative || E'\\n' || $2,
         sections   = jsonb_strip_nulls(jsonb_build_object(
           'expenses',   COALESCE(lumi_daily_entries.sections->'expenses',   '[]'::jsonb) || COALESCE($3::jsonb->'expenses',   '[]'::jsonb),
           'workouts',   COALESCE(lumi_daily_entries.sections->'workouts',   '[]'::jsonb) || COALESCE($3::jsonb->'workouts',   '[]'::jsonb),
           'habits',     COALESCE(lumi_daily_entries.sections->'habits',     '[]'::jsonb) || COALESCE($3::jsonb->'habits',     '[]'::jsonb),
           'life_notes', COALESCE(lumi_daily_entries.sections->'life_notes', '[]'::jsonb) || COALESCE($3::jsonb->'life_notes', '[]'::jsonb),
           'follow_ups', COALESCE(lumi_daily_entries.sections->'follow_ups', '[]'::jsonb) || COALESCE($3::jsonb->'follow_ups', '[]'::jsonb)
         )),
         mood       = COALESCE($4, lumi_daily_entries.mood),
         updated_at = NOW()`,
      [userId, newNarrativeLine, JSON.stringify(newSections), extraction.emotion || null]
    ).catch((err) => { logger.error({ userId, err: err.message }, 'daily_entries upsert failed'); });

    logger.info({ userId, action: 'daily_journal', resource: 'lumi_daily_entries' }, 'updated');
  } catch (err) {
    logger.error({ userId, err: err.message }, 'writeToJournalEntry error');
    // Non-fatal — don't break the main response
  }
}

// ─── Confirmation handler for publishable-tier escalation ─────────────────────
async function handlePublishableConfirm(userId, userResponse, pendingData) {
  const lower = userResponse.toLowerCase().trim();
  const yes = ['yes','yeah','sure','ok','okay','go ahead','do it','yep','please','confirm','post it','send it'].some(w=>lower.includes(w));
  const no  = ['no',"don't",'skip','nope','cancel','dont','never mind','stop'].some(w=>lower.includes(w));

  if (no) {
    return {
      success: true,
      lumiResponse: "Got it — I won't post or send that. What else is on your mind?",
      saved: false, savedItems: [], route: 'chat', needsConfirmation: false,
    };
  }

  if (yes) {
    // Execute only the publishable actions that were held back
    const savedItems = [];
    for (const action of pendingData.actions) {
      const d = getActionData(action);
      try {
        switch (action.type) {
          case 'content_post': {
            const platform = d.platform || 'instagram';
            const content = d.content || '';
            const scheduledFor = d.scheduled_for || d.scheduledFor;
            if (!content || !scheduledFor) break;
            await pool.query(
              `INSERT INTO scheduled_posts
                 (user_id, platform, content, title, category, scheduled_for, source)
               VALUES ($1,$2,$3,$4,$5,$6,'lumi')`,
              [userId, platform, content, d.title || null, d.category || null, scheduledFor]
            );
            logger.info({ userId, action: 'content_post', resource: 'scheduled_posts' }, 'confirmed');
            savedItems.push({
              type: 'content_post',
              label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} post — ${d.title || 'Scheduled content'}`,
              destination: `Content Calendar (${scheduledFor?.slice(0, 10)})`,
              data: d,
            });
            break;
          }
          case 'send_email': {
            const to = d.to || d.recipient;
            const subject = d.subject;
            const body = d.body || d.content || '';
            if (!to || !body) break;
            results.pendingEmail = { to, subject: subject || 'Message', body, schedule_for: d.schedule_for || null };
            results.needsEmailPreview = true;
            break;
          }
        }
      } catch (err) {
        logger.error({ userId, action: action.type, err: err.message }, 'publishable action failed');
      }
    }
    return {
      success: true,
      lumiResponse: savedItems.length > 0
        ? `Done — ${savedItems.map(s => s.label).join('; ')}.`
        : "All set. What's next?",
      saved: savedItems.length > 0,
      savedItems,
      route: savedItems[0]?.type === 'content_post' ? 'content' : 'chat',
      needsConfirmation: false,
    };
  }

  // Ambiguous — re-ask
  return {
    success: true,
    lumiResponse: `Should I go ahead with that? Say "yes" to confirm or "no" to cancel.`,
    saved: false, savedItems: [], route: 'chat', needsConfirmation: true,
    pendingState: pendingData,
  };
}

// ─── Confirmation handler ───────────────────────────────────────────────────────
async function handleConfirmation(userId, userResponse, pendingData) {
  const lower = userResponse.toLowerCase().trim();
  const yes = ['yes','yeah','sure','ok','okay','save','go ahead','do it','yep','please','correct'].some(w=>lower.includes(w));
  const no  = ['no',"don't",'skip','nope','cancel','dont','never mind'].some(w=>lower.includes(w));

  await deletePending(userId);

  if (yes) {
    const journalType = pendingData.suggestedJournal || 'personal';
    await pool.query(
      `INSERT INTO lumi_conversations
         (user_id, user_message, lumi_response, route, saved_data, source, needs_confirmation, created_at)
       VALUES ($1,$2,$3,$4,$5,'lumi',false,NOW())`,
      [userId, pendingData.content||'', `Saved to ${journalType} journal.`, journalType,
       JSON.stringify({ pending_journal:true, journal_type:journalType, content:pendingData.content })]
    );

    // Also cross-post to daily entry
    const narrative = `Journal entry saved to ${journalType}: "${(pendingData.content||'').slice(0,120)}"`;
    await pool.query(
      `INSERT INTO lumi_daily_entries (user_id, entry_date, narrative, sections, mood)
       VALUES ($1,CURRENT_DATE,$2,'{}',null)
       ON CONFLICT (user_id,entry_date) DO UPDATE SET
         narrative  = lumi_daily_entries.narrative || E'\\n' || $2,
         updated_at = NOW()`,
      [userId, narrative]
    ).catch(()=>{});

    logger.info({ userId, action: 'journal_draft', resource: 'lumi_conversations' }, 'confirmed');
    return {
      success: true,
      lumiResponse: `Saved to your ${journalType} journal ✓. It's there whenever you want to reflect on it.`,
      saved: true,
      savedItems: [{ type:'journal_draft', label:`Note → ${journalType} journal`, destination:`Journal / ${journalType}` }],
      route: journalType, needsConfirmation: false,
    };
  }

  if (no) {
    return {
      success: true,
      lumiResponse: "No problem — I won't save that. What else is on your mind?",
      saved: false, savedItems: [], route: 'chat', needsConfirmation: false,
    };
  }

  await setPending(userId, pendingData);
  return {
    success: true,
    lumiResponse: pendingData.confirmPrompt || "Should I save that to your journal?",
    saved: false, savedItems: [], route: 'chat', needsConfirmation: true, pendingState: pendingData,
  };
}

// ─── External: /lumi/confirm endpoint ──────────────────────────────────────────
async function confirmAndSave(userId, journalType, content, summary='') {
  await deletePending(userId);
  try {
    await pool.query(
      `INSERT INTO lumi_conversations
         (user_id, user_message, lumi_response, route, saved_data, source, needs_confirmation, created_at)
       VALUES ($1,$2,$3,$4,$5,'lumi',false,NOW())`,
      [userId, content, `Saved to ${journalType} journal.`, journalType,
       JSON.stringify({ pending_journal:true, journal_type:journalType, content, summary })]
    );
    return { success:true, savedData:{ journal_type:journalType, content } };
  } catch (err) {
    return { success:false, error:err.message };
  }
}

// ─── Shared context builder ─────────────────────────────────────────────────────
async function buildUserContext(userId) {
  try {
    const lifeContext = await getUserLifeContext(userId, '30days');
    return formatLegacyContext(lifeContext);
  } catch (err) {
    logger.error({ userId, err: err.message }, 'context engine fallback');
  }

  const ctx = {
    scheduleSummary:'No tasks today',
    habitSummary:'No habits tracked',
    budgetToday:'No expenses yet today',
    budgetSummary:'No expenses this month',
    recentLogs:'No recent activity',
    journalSummary:'No journal entries',
    journalPagesToday:'None yet',
    customJournalTypes:[],
    persistentMemories:[],
  };
  try {
    const [sched, hab, todayB, monthB, logs, journal] = await Promise.all([
      pool.query(
        `SELECT title, start_time FROM schedules
         WHERE user_id=$1 AND is_active=true
           AND (repeat_pattern IN ('daily','weekdays') OR target_date=CURRENT_DATE)
         ORDER BY start_time LIMIT 5`, [userId]
      ).catch(()=>({rows:[]})),
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM habit_completions WHERE user_id=$1 AND completion_date=CURRENT_DATE) AS done,
           (SELECT COUNT(*) FROM habits WHERE user_id=$1 AND is_active=true) AS total`, [userId]
      ).catch(()=>({rows:[]})),
      pool.query(
        `SELECT amount, currency, category, note, type FROM budget_entries
         WHERE user_id=$1 AND entry_date=CURRENT_DATE AND archived_at IS NULL ORDER BY created_at DESC LIMIT 10`, [userId]
      ).catch(()=>({rows:[]})),
      pool.query(
        `SELECT category, SUM(amount) AS total FROM budget_entries
         WHERE user_id=$1 AND type='expense' AND archived_at IS NULL AND entry_date >= DATE_TRUNC('month',CURRENT_DATE)
         GROUP BY category ORDER BY total DESC LIMIT 6`, [userId]
      ).catch(()=>({rows:[]})),
      pool.query(
        `SELECT route, user_message, created_at FROM lumi_conversations
         WHERE user_id=$1 AND saved_data IS NOT NULL
         ORDER BY created_at DESC LIMIT 5`, [userId]
      ).catch(()=>({rows:[]})),
      pool.query(
        `SELECT recorded_at FROM journal_entries WHERE user_id=$1 ORDER BY recorded_at DESC LIMIT 1`, [userId]
      ).catch(()=>({rows:[]})),
    ]);

    if (sched.rows.length>0) ctx.scheduleSummary = sched.rows.map(r=>`${r.title} at ${String(r.start_time).slice(0,5)}`).join(', ');
    if (parseInt(hab.rows[0]?.total)>0) ctx.habitSummary = `${hab.rows[0].done} of ${hab.rows[0].total} habits done`;
    if (todayB.rows.length>0) ctx.budgetToday = todayB.rows.map(r=>`${r.type==='income'?'+':'-'}${r.currency||'₦'}${Number(r.amount).toLocaleString('en-NG')} ${r.category}${r.note?` (${r.note})`:''}`).join('; ');
    if (monthB.rows.length>0) ctx.budgetSummary = monthB.rows.map(r=>`${r.category}: ₦${Number(r.total).toLocaleString('en-NG')}`).join(', ');
    if (logs.rows.length>0) ctx.recentLogs = logs.rows.map(r=>{
      const when = new Date(r.created_at).toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit',hour12:true});
      return `[${r.route}] ${r.user_message.slice(0,60)} (${when})`;
    }).join(' | ');
    if (journal.rows.length>0) {
      const days = Math.floor((Date.now()-new Date(journal.rows[0].recorded_at))/86400000);
      ctx.journalSummary = days===0?'Wrote in journal today':`Last journal entry ${days} day${days>1?'s':''} ago`;
    }

    // Today's journal page entries (so Lumi knows what template pages are already open)
    const journalPagesRes = await pool.query(
      `SELECT journal_type, template_name, fields FROM journal_page_entries
       WHERE user_id=$1 AND entry_date=CURRENT_DATE AND archived_at IS NULL ORDER BY updated_at DESC`,
      [userId]
    ).catch(()=>({rows:[]}));
    if (journalPagesRes.rows.length>0) {
      ctx.journalPagesToday = journalPagesRes.rows
        .map(r => `${r.journal_type}/${r.template_name}: ${Object.keys(r.fields||{}).join(', ')}`)
        .join(' | ');
    }

    // User's custom journal types (so Lumi can route to them)
    const customRes = await pool.query(
      `SELECT type_key, label, routing_keywords FROM user_journal_types
       WHERE user_id=$1 AND is_active=true AND archived_at IS NULL ORDER BY display_order`,
      [userId]
    ).catch(()=>({rows:[]}));
    ctx.customJournalTypes = customRes.rows.map(r => ({
      type_key: r.type_key,
      label: r.label,
      routing_keywords: r.routing_keywords || [],
    }));

    // Persistent memories — what Lumi knows about this user across all sessions
    ctx.persistentMemories = await getUserMemories(userId);

  } catch (err) {
    logger.error({ userId, err: err.message }, 'buildUserContext error');
  }
  return ctx;
}

// ─── Legacy helpers ─────────────────────────────────────────────────────────────
async function saveToBudget(userId, data) {
  const r = await pool.query(
    `INSERT INTO budget_entries (user_id, amount, currency, category, note, type, entry_date, source)
     VALUES ($1,$2,$3,$4,$5,'expense',CURRENT_DATE,'lumi') RETURNING *`,
    [userId, data.amount||0, data.currency||'₦', normaliseCategory(data.expenseCategory), data.note||'']
  );
  return r.rows[0];
}

async function saveToJournal(userId, type, data) {
  const payload = { pending_journal:true, journal_type:type, content:data.content||'', summary:data.summary||'', emotion:data.emotion||'neutral' };
  const r = await pool.query(
    `INSERT INTO lumi_conversations (user_id, user_message, lumi_response, route, saved_data, source, needs_confirmation, created_at)
     VALUES ($1,$2,'Journal draft saved.',$3,$4,'lumi',false,NOW()) RETURNING id`,
    [userId, data.content||'', type, JSON.stringify(payload)]
  );
  return { ...payload, conversation_id:r.rows[0].id };
}

async function saveToSchedule(userId, data) {
  const timeStr = ((data.time||'09:00').replace(/^(\d):/,'0$1:')+':00').slice(0,8);
  const r = await pool.query(
    `INSERT INTO schedules (user_id, title, start_time, duration_minutes, category, repeat_pattern, is_active)
     VALUES ($1,$2,$3::time,60,$4,'none',true) RETURNING *`,
    [userId, data.title||'Untitled', timeStr, data.category||'personal']
  );
  return r.rows[0];
}

async function updateHabit(userId, data) {
  let habitId;
  const find = await pool.query(`SELECT id FROM habits WHERE user_id=$1 AND title ILIKE $2 ESCAPE '\\' LIMIT 1`,[userId,`%${data.habitName.replace(/[%_\\]/g, '\\$&')}%`]).catch(()=>({rows:[]}));
  if (find.rows.length===0) {
    const ins = await pool.query(`INSERT INTO habits (user_id, title) VALUES ($1,$2) RETURNING id`,[userId,data.habitName]).catch(()=>null);
    habitId = ins?.rows[0]?.id;
  } else { habitId = find.rows[0].id; }
  if (habitId) {
    await pool.query(
      `INSERT INTO habit_completions (habit_id, user_id, completion_date)
       VALUES ($1,$2,CURRENT_DATE) ON CONFLICT (habit_id, completion_date) DO NOTHING`,
      [habitId, userId]
    ).catch((e)=>{ logger.error({ userId, action: 'updateHabit', err: e.message }, 'completion failed'); });
  }
  return { habit_name:data.habitName, completed:true };
}

async function getConversationHistory(userId, limit=5) {
  const r = await pool.query(
    `SELECT user_message, lumi_response, created_at FROM lumi_conversations
     WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  ).catch(()=>({rows:[]}));
  return r.rows.reverse();
}

module.exports = {
  routeLumiInput, confirmAndSave, confirmJournalPageWrite, buildUserContext,
  clearConvHistory, getConversationHistory,
  saveToJournal, saveToBudget, saveToSchedule, updateHabit,
  getUserMemories, extractAndSaveMemories, saveExtractedMemories,
};
