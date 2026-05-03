/**
 * lifeAudit.js — Lumi Deep Life Planning Interview
 *
 * Multi-turn interview across 8 life categories.
 * State is stored in Redis per user (TTL 4 hours) so conversations survive
 * page refreshes and resume naturally.
 *
 * Flow:
 *   POST /api/lumi/life-audit/start       → begin or resume a session
 *   POST /api/lumi/life-audit/answer      → submit an answer, get next question
 *   GET  /api/lumi/life-audit/preview     → get proposed weekly schedule
 *   POST /api/lumi/life-audit/confirm     → create all schedule entries
 *   DELETE /api/lumi/life-audit/session   → clear session, start over
 *   POST /api/lumi/life-audit/category    → mini-interview for one category only
 *   POST /api/lumi/import-plan            → parse pasted Claude/AI plan text
 */

const express  = require('express');
const { authenticate } = require('../middleware/authenticate');
const { getRedisClient } = require('../middleware/rateLimiter');
const { pool } = require('../db/connection');

const router = express.Router();
router.use(authenticate);

// ─── Life category definitions ─────────────────────────────────────────────────
const LIFE_CATEGORIES = [
  {
    id: 'morning',
    label: 'Morning Routine',
    emoji: '🌅',
    questions: [
      'What time do you want to wake up?',
      'What\'s your morning routine like? (e.g. shower, brush teeth, get dressed — how long does it take?)',
      'Do you pray or do devotions in the morning? If yes, for how long?',
      'Do you have breakfast? Where and how long does that take?',
    ],
  },
  {
    id: 'work',
    label: 'Work & Study',
    emoji: '💼',
    questions: [
      'What time does your work or study day usually start?',
      'When does it usually end?',
      'Do you work from home or do you travel? If travelling, how long is the commute?',
      'Do you have a lunch break? How long?',
      'Are there fixed meetings or calls you can\'t move?',
    ],
  },
  {
    id: 'meals',
    label: 'Meals & Nutrition',
    emoji: '🍽️',
    questions: [
      'Do you cook your own meals? Which meals — lunch, dinner, both?',
      'How long does cooking usually take you?',
      'Do you do meal prep (e.g. batch cooking on Sundays)?',
    ],
  },
  {
    id: 'health',
    label: 'Health & Body',
    emoji: '💪',
    questions: [
      'Do you exercise? What type — gym, running, yoga, walks, home workout?',
      'How many times a week do you want to exercise?',
      'How long per session?',
      'Do you want a water reminder during the day?',
    ],
  },
  {
    id: 'faith',
    label: 'Faith & Spiritual',
    emoji: '✝️',
    questions: [
      'Do you go to church? Which day(s) and what time?',
      'Do you have Bible study, small group, or any spiritual activities during the week?',
      'Do you want a daily evening prayer or devotion reminder?',
    ],
  },
  {
    id: 'family',
    label: 'Family & Social',
    emoji: '👨‍👩‍👧',
    questions: [
      'Do you have family time you want to protect — meals together, kids\' activities, errands?',
      'Any regular calls with family or friends you want scheduled?',
      'Do you have a date night or self-care evening?',
    ],
  },
  {
    id: 'creative',
    label: 'Creative & Content',
    emoji: '🎨',
    questions: [
      'Do you create content — videos, posts, writing, podcasts?',
      'How many times a week do you want to create or plan content?',
      'Do you have a business, side project, or anything you want dedicated time for?',
      'Do you want a weekly review or planning session? (e.g. Sunday evenings to plan the week)',
    ],
  },
  {
    id: 'evening',
    label: 'Evening & Sleep',
    emoji: '🌙',
    questions: [
      'What time do you want to start winding down in the evening?',
      'Do you have a bedtime routine? (e.g. reading, journaling, skincare)',
      'What time do you want to be in bed?',
    ],
  },
];

const SESSION_TTL = 4 * 60 * 60; // 4 hours in seconds

// ─── Redis helpers ──────────────────────────────────────────────────────────────
async function getSession(userId) {
  try {
    const client = await getRedisClient();
    const raw = await client.get(`life_audit:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveSession(userId, session) {
  try {
    const client = await getRedisClient();
    await client.setEx(`life_audit:${userId}`, SESSION_TTL, JSON.stringify(session));
  } catch (err) {
    console.error('[LifeAudit] Redis save error:', err.message);
  }
}

async function clearSession(userId) {
  try {
    const client = await getRedisClient();
    await client.del(`life_audit:${userId}`);
  } catch {}
}

// ─── Build a new session object ─────────────────────────────────────────────────
function newSession(categoryId = null) {
  const categories = categoryId
    ? LIFE_CATEGORIES.filter(c => c.id === categoryId)
    : LIFE_CATEGORIES;

  return {
    startedAt:    new Date().toISOString(),
    categoryId:   categoryId || null,
    categoryIdx:  0,
    questionIdx:  0,
    answers:      {},   // { categoryId: { question: answer, ... } }
    schedule:     [],   // proposed schedule blocks built up as answers come in
    done:         false,
    categories,
  };
}

// ─── Get current question ───────────────────────────────────────────────────────
function getCurrentQuestion(session) {
  const cat = session.categories[session.categoryIdx];
  if (!cat) return null;
  const q = cat.questions[session.questionIdx];
  return q ? { category: cat.id, categoryLabel: cat.label, emoji: cat.emoji, question: q } : null;
}

// ─── Compute progress ───────────────────────────────────────────────────────────
function getProgress(session) {
  let totalQ = session.categories.reduce((s, c) => s + c.questions.length, 0);
  let answeredQ = 0;
  for (let ci = 0; ci < session.categoryIdx; ci++) {
    answeredQ += session.categories[ci].questions.length;
  }
  answeredQ += session.questionIdx;
  return { answered: answeredQ, total: totalQ, pct: Math.round((answeredQ / totalQ) * 100) };
}

// ─── POST /api/lumi/life-audit/start ───────────────────────────────────────────
router.post('/start', async (req, res) => {
  const userId = req.user.id;
  const { restart = false } = req.body;

  let session = await getSession(userId);

  if (!session || restart) {
    session = newSession();
    await saveSession(userId, session);
  }

  const currentQ = getCurrentQuestion(session);
  const progress  = getProgress(session);

  if (session.done) {
    return res.json({
      status: 'complete',
      message: 'Your life plan is ready! Tap "View Schedule" to see the proposed weekly plan.',
      progress: { answered: progress.total, total: progress.total, pct: 100 },
      schedule: session.schedule,
    });
  }

  const isResume = !restart && session.questionIdx > 0;

  res.json({
    status: 'in_progress',
    isResume,
    message: isResume
      ? `Welcome back! We were on ${currentQ?.categoryLabel}. Let's continue.`
      : `Let's plan your life together! I'll ask you a few questions across 8 areas. Take your time — this is all about making your week work for YOU. Starting with your mornings...`,
    currentQuestion: currentQ,
    progress,
    categories: session.categories.map(c => ({ id: c.id, label: c.label, emoji: c.emoji })),
  });
});

// ─── POST /api/lumi/life-audit/answer ──────────────────────────────────────────
router.post('/answer', async (req, res) => {
  const userId = req.user.id;
  const { answer, skip = false } = req.body;

  let session = await getSession(userId);
  if (!session) {
    session = newSession();
  }

  const cat = session.categories[session.categoryIdx];
  if (!cat) return res.status(400).json({ error: 'No active question' });

  const q = cat.questions[session.questionIdx];

  // Store answer
  if (!session.answers[cat.id]) session.answers[cat.id] = {};
  session.answers[cat.id][q] = skip ? null : answer;

  // Advance to next question
  session.questionIdx++;

  if (session.questionIdx >= cat.questions.length) {
    // Move to next category
    session.categoryIdx++;
    session.questionIdx = 0;
  }

  // Check if interview is complete
  if (session.categoryIdx >= session.categories.length) {
    session.done = true;
    session.schedule = buildScheduleFromAnswers(session.answers);
    await saveSession(userId, session);

    const timeAudit = computeTimeAudit(session.schedule);

    return res.json({
      status: 'complete',
      message: `Amazing! I've built your weekly schedule based on everything you told me. Here's your full week — review it and tap "Create Schedule" when you're ready.`,
      schedule: session.schedule,
      timeAudit,
      progress: { answered: getProgress(session).total, total: getProgress(session).total, pct: 100 },
    });
  }

  const nextQ    = getCurrentQuestion(session);
  const progress = getProgress(session);

  // Generate a warm acknowledgement of the answer
  const ack = generateAck(cat.id, q, answer, skip);

  await saveSession(userId, session);

  res.json({
    status: 'in_progress',
    ack,
    currentQuestion: nextQ,
    progress,
    // Flag when moving to a new category
    newCategory: session.questionIdx === 0 ? session.categories[session.categoryIdx] : null,
  });
});

// ─── GET /api/lumi/life-audit/preview ──────────────────────────────────────────
router.get('/preview', async (req, res) => {
  const userId = req.user.id;
  const session = await getSession(userId);

  if (!session || !session.done) {
    return res.status(404).json({ error: 'No completed life audit session found' });
  }

  res.json({
    schedule: session.schedule,
    timeAudit: computeTimeAudit(session.schedule),
    answers: session.answers,
  });
});

// ─── POST /api/lumi/life-audit/confirm ─────────────────────────────────────────
// Creates all schedule entries in the database from the proposed session.schedule
router.post('/confirm', async (req, res) => {
  const userId  = req.user.id;
  const session = await getSession(userId);

  if (!session?.schedule?.length) {
    return res.status(400).json({ error: 'No schedule to confirm' });
  }

  const created = [];
  const failed  = [];

  for (const block of session.schedule) {
    try {
      const r = await pool.query(
        `INSERT INTO schedules
           (user_id, title, description, start_time, duration_minutes,
            repeat_pattern, repeat_days, category, colour, is_high_priority, reminder_minutes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT DO NOTHING
         RETURNING id, title, start_time`,
        [
          userId,
          block.title,
          block.description || null,
          block.start_time,
          block.duration_minutes || 30,
          block.repeat_pattern || 'daily',
          block.repeat_days || null,
          block.category || 'personal',
          block.colour || '#C8955C',
          block.is_high_priority || false,
          block.reminder_minutes ?? 10,
        ]
      );
      if (r.rows[0]) created.push(r.rows[0]);
    } catch (err) {
      failed.push({ title: block.title, error: err.message });
    }
  }

  // Clear session after successful confirmation
  if (failed.length === 0) await clearSession(userId);

  res.json({
    success: true,
    created: created.length,
    failed: failed.length,
    message: failed.length === 0
      ? `Done! I've added ${created.length} blocks to your weekly schedule. Your planner is ready. 🎉`
      : `Created ${created.length} entries. ${failed.length} had issues — ${failed.map(f => f.title).join(', ')}.`,
    entries: created,
  });
});

// ─── DELETE /api/lumi/life-audit/session ────────────────────────────────────────
router.delete('/session', async (req, res) => {
  await clearSession(req.user.id);
  res.json({ success: true, message: 'Session cleared. Start fresh whenever you\'re ready.' });
});

// ─── POST /api/lumi/life-audit/category ─────────────────────────────────────────
// Mini-interview for a single life category (e.g. "plan my evenings better")
router.post('/category', async (req, res) => {
  const userId = req.user.id;
  const { category } = req.body;

  const cat = LIFE_CATEGORIES.find(c => c.id === category || c.label.toLowerCase().includes(category?.toLowerCase()));
  if (!cat) {
    return res.status(400).json({
      error: 'Unknown category',
      available: LIFE_CATEGORIES.map(c => ({ id: c.id, label: c.label })),
    });
  }

  const session = newSession(cat.id);
  await saveSession(userId, session);

  res.json({
    status: 'in_progress',
    message: `Let's focus on your ${cat.label.toLowerCase()}. ${cat.emoji} I'll ask you ${cat.questions.length} quick questions.`,
    currentQuestion: { category: cat.id, categoryLabel: cat.label, emoji: cat.emoji, question: cat.questions[0] },
    progress: { answered: 0, total: cat.questions.length, pct: 0 },
  });
});

// ─── POST /api/lumi/import-plan ─────────────────────────────────────────────────
// Parse pasted Claude/AI plan text and extract schedule blocks
router.post('/import-plan', async (req, res) => {
  const userId = req.user.id;
  const { text } = req.body;

  if (!text?.trim()) return res.status(400).json({ error: 'Plan text is required' });

  try {
    const { Groq } = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'system',
        content: `You are a schedule parser. Extract all schedule items from the following plan text.
For each item extract: title, start_time (HH:MM 24h), duration_minutes, category (wellness/work/personal/learning/spiritual), repeat_pattern (daily/weekly/none), repeat_days (array 0-6 where 0=Sun).
Return ONLY a JSON array, no markdown:
[{"title":"...","start_time":"06:00","duration_minutes":30,"category":"spiritual","repeat_pattern":"daily","repeat_days":null,"description":"..."}]`
      }, {
        role: 'user',
        content: text.slice(0, 3000),
      }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    let blocks = [];
    try { blocks = JSON.parse(match?.[0] || '[]'); } catch {}

    if (!blocks.length) {
      return res.json({
        success: false,
        message: "I couldn't extract a clear schedule from that text. Could you paste it in a more structured way, like listing each activity with a time?",
        blocks: [],
      });
    }

    res.json({
      success: true,
      blocks,
      message: `I found ${blocks.length} schedule items in your plan. Review them below and tap "Import" to add them to your planner.`,
    });
  } catch (err) {
    console.error('[LifeAudit] import-plan error:', err.message);
    res.status(500).json({ error: 'Failed to parse plan' });
  }
});

// ─── Schedule builder ───────────────────────────────────────────────────────────
function buildScheduleFromAnswers(answers) {
  const blocks = [];

  // Helper to add a block
  function add(title, time, duration, category, opts = {}) {
    blocks.push({
      title,
      start_time: time,
      duration_minutes: duration,
      category,
      repeat_pattern: opts.repeat_pattern || 'daily',
      repeat_days: opts.repeat_days || null,
      description: opts.description || '',
      colour: opts.colour || categoryColour(category),
      is_high_priority: opts.priority || false,
      reminder_minutes: opts.reminder ?? 10,
    });
  }

  const m = answers.morning || {};
  const w = answers.work || {};
  const me = answers.meals || {};
  const h = answers.health || {};
  const f = answers.faith || {};
  const fa = answers.family || {};
  const cr = answers.creative || {};
  const ev = answers.evening || {};

  // ── Morning ──
  const wakeTime = extractTime(Object.values(m)[0]) || '06:00';
  add('Wake up', wakeTime, 5, 'personal', { priority: true, reminder: 0 });

  const routineMin = extractMinutes(Object.values(m)[1]) || 30;
  add('Morning routine', addMinutes(wakeTime, 5), routineMin, 'personal');

  const hasDevotion = hasYes(Object.values(m)[2]);
  if (hasDevotion) {
    const devMin = extractMinutes(Object.values(m)[2]) || 30;
    add('Devotion & Prayer', addMinutes(wakeTime, 10 + routineMin), devMin, 'spiritual', { priority: true });
  }

  const hasBreakfast = hasYes(Object.values(m)[3]);
  if (hasBreakfast) {
    const bfMin = extractMinutes(Object.values(m)[3]) || 20;
    const bfStart = addMinutes(wakeTime, 15 + routineMin + (hasDevotion ? (extractMinutes(Object.values(m)[2]) || 30) : 0));
    add('Breakfast', bfStart, bfMin, 'personal');
  }

  // ── Work ──
  const workStart = extractTime(Object.values(w)[0]) || '09:00';
  const workEnd   = extractTime(Object.values(w)[1]) || '17:00';
  const isRemote  = !hasYes(Object.values(w)[2]);
  const commuteMin = isRemote ? 0 : (extractMinutes(Object.values(w)[2]) || 30);

  if (commuteMin > 0) {
    add('Commute', addMinutes(workStart, -commuteMin), commuteMin, 'personal');
  }
  add('Deep work block', workStart, 120, 'work', { priority: true });

  const hasLunch = hasYes(Object.values(w)[3]);
  if (hasLunch) {
    const lunchMin = extractMinutes(Object.values(w)[3]) || 60;
    const workMid = midTime(workStart, workEnd);
    add('Lunch break', workMid, lunchMin, 'personal');
    add('Deep work block 2', addMinutes(workMid, lunchMin), 90, 'work');
  }

  // ── Meals ──
  const cooksDinner = hasYes(Object.values(me)[0]);
  if (cooksDinner) {
    const cookMin = extractMinutes(Object.values(me)[1]) || 45;
    add('Cook dinner', addMinutes(workEnd, 30), cookMin, 'personal');
  }
  const mealPrep = hasYes(Object.values(me)[2]);
  if (mealPrep) {
    add('Meal prep', '10:00', 90, 'personal', { repeat_pattern: 'weekly', repeat_days: [0], description: 'Sunday meal prep' });
  }

  // ── Health ──
  const exercises = hasYes(Object.values(h)[0]);
  if (exercises) {
    const freqNum = extractNumber(Object.values(h)[1]) || 3;
    const exMin   = extractMinutes(Object.values(h)[2]) || 45;
    const exDays  = spreadDays(freqNum);
    add('Workout', addMinutes(wakeTime, 60 + routineMin), exMin, 'wellness', {
      repeat_pattern: 'custom', repeat_days: exDays, priority: true, reminder: 15,
    });
    // Rest days — light activity
    if (freqNum < 5) {
      add('Rest day — light stretch', addMinutes(wakeTime, 60 + routineMin), 15, 'wellness', {
        repeat_pattern: 'custom', repeat_days: complementDays(exDays).slice(0, 2),
      });
    }
  }
  const waterReminder = hasYes(Object.values(h)[3]);
  if (waterReminder) {
    ['09:00','11:00','13:00','15:00','17:00'].forEach(t => {
      add('💧 Water reminder', t, 5, 'wellness', { repeat_pattern: 'daily', reminder: 0, colour: '#06B6D4' });
    });
  }

  // ── Faith ──
  const church = hasYes(Object.values(f)[0]);
  if (church) {
    const churchTime = extractTime(Object.values(f)[0]) || '09:00';
    add('Church', churchTime, 120, 'spiritual', {
      repeat_pattern: 'weekly', repeat_days: [0], priority: true, reminder: 30,
    });
  }
  const bibleStudy = hasYes(Object.values(f)[1]);
  if (bibleStudy) {
    add('Bible study / Small group', '19:00', 90, 'spiritual', {
      repeat_pattern: 'weekly', repeat_days: [3], priority: true,
    });
  }
  const eveningPrayer = hasYes(Object.values(f)[2]);
  if (eveningPrayer) {
    add('Evening prayer', '21:00', 15, 'spiritual', { repeat_pattern: 'daily' });
  }

  // ── Family ──
  const familyTime = hasYes(Object.values(fa)[0]);
  if (familyTime) {
    add('Family time', addMinutes(workEnd, 60), 60, 'personal', { repeat_pattern: 'daily', priority: true });
  }
  const dateNight = hasYes(Object.values(fa)[2]);
  if (dateNight) {
    add('Date night / Self-care', '19:00', 120, 'personal', {
      repeat_pattern: 'weekly', repeat_days: [5], colour: '#EC4899',
    });
  }

  // ── Creative ──
  const createsContent = hasYes(Object.values(cr)[0]);
  if (createsContent) {
    const crFreq = extractNumber(Object.values(cr)[1]) || 2;
    add('Content creation', '14:00', 90, 'work', {
      repeat_pattern: 'custom', repeat_days: spreadDays(crFreq), colour: '#8B5CF6',
    });
  }
  const hasBusiness = hasYes(Object.values(cr)[2]);
  if (hasBusiness) {
    add('Business / Side project', '16:00', 60, 'work', {
      repeat_pattern: 'custom', repeat_days: [1, 3, 5], colour: '#F59E0B',
    });
  }
  const weeklyReview = hasYes(Object.values(cr)[3]);
  if (weeklyReview) {
    add('Weekly review & planning', '18:00', 60, 'personal', {
      repeat_pattern: 'weekly', repeat_days: [0], colour: '#10B981', priority: true,
    });
  }

  // ── Evening & Sleep ──
  const windDownTime = extractTime(Object.values(ev)[0]) || '21:00';
  add('Wind down', windDownTime, 30, 'personal');
  const bedtime = extractTime(Object.values(ev)[2]) || '22:30';
  add('Bedtime', addMinutes(bedtime, -5), 5, 'personal', { reminder: 15, colour: '#6366F1' });

  // Sort by start_time
  blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));

  return blocks;
}

// ─── Time audit ─────────────────────────────────────────────────────────────────
function computeTimeAudit(schedule) {
  const dailyBlocks = schedule.filter(b =>
    b.repeat_pattern === 'daily' || !b.repeat_pattern
  );
  const totalMinutes = dailyBlocks.reduce((s, b) => s + (b.duration_minutes || 0), 0);
  const wakingHours  = 16; // assume 6am-10pm = 16 hours
  const wakingMins   = wakingHours * 60;
  const freeMins     = Math.max(0, wakingMins - totalMinutes);

  // Find gaps (simplified — just count unallocated hours)
  const gaps = [];
  if (freeMins > 60) {
    gaps.push(`~${Math.floor(freeMins / 60)}h ${freeMins % 60}min of flexible / buffer time`);
  }

  return {
    scheduledMinutes:  totalMinutes,
    freeMinutes:       freeMins,
    scheduledHours:    Math.round(totalMinutes / 60 * 10) / 10,
    freeHours:         Math.round(freeMins / 60 * 10) / 10,
    totalBlocks:       schedule.length,
    dailyBlocks:       dailyBlocks.length,
    gaps,
    isOverScheduled:   totalMinutes > wakingMins,
  };
}

// ─── Warm acknowledgements ──────────────────────────────────────────────────────
function generateAck(categoryId, question, answer, skip) {
  if (skip) return "No problem — I'll leave that flexible.";

  const acks = {
    morning: [
      `${answer}? I love that. Early starts are powerful.`,
      'Good — I\'ll make sure your morning has breathing room.',
      'Prayer in the morning sets the whole tone. I\'ll protect that time.',
      'Breakfast locked in. You need that fuel.',
    ],
    work: [
      'Got it — I\'ll block your deep work hours.',
      'I\'ll put a hard stop at that time.',
      'Noted — I\'ll add commute time as a buffer.',
      'Lunch break protected. Your brain needs that reset.',
    ],
    health: [
      'Exercise is non-negotiable. I\'ll lock it in.',
      `${answer} sessions a week — I\'ll spread them out evenly.`,
      'Perfect duration. Consistent and sustainable.',
      'Water reminders set. Your body will thank you.',
    ],
    faith: [
      'Church is in. Nothing moves that slot.',
      'Bible study scheduled. Your spirit needs that too.',
      'Evening prayer added. A beautiful way to close the day.',
    ],
    default: [
      'Got it.',
      'Noted — I\'ll work that in.',
      'Perfect.',
      'Good to know. I\'ll factor that in.',
    ],
  };

  const pool = acks[categoryId] || acks.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Utility functions ──────────────────────────────────────────────────────────
function extractTime(text) {
  if (!text) return null;
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2] || '0');
  const ampm = (m[3] || '').toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function extractMinutes(text) {
  if (!text) return null;
  const hourMatch = text.match(/(\d+)\s*h/i);
  const minMatch  = text.match(/(\d+)\s*min/i);
  if (hourMatch) return parseInt(hourMatch[1]) * 60 + (minMatch ? parseInt(minMatch[1]) : 0);
  if (minMatch) return parseInt(minMatch[1]);
  const plain = text.match(/\b(\d+)\b/);
  if (plain) {
    const n = parseInt(plain[1]);
    return n > 5 ? n : n * 60;
  }
  return null;
}

function extractNumber(text) {
  if (!text) return null;
  const m = text.match(/\b(\d+)\b/);
  return m ? parseInt(m[1]) : null;
}

function hasYes(text) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return /(yes|yeah|yep|sure|do|have|go|attend|i pray|i read|i go|church|gym|exercise|yoga|run|cook|write|create)/i.test(lower)
    && !/(no|don't|nope|not|never|skip|don't have|i don't)/i.test(lower.split('no').join('__no__'));
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total  = h * 60 + m + minutes;
  const nh     = Math.floor(total / 60) % 24;
  const nm     = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function midTime(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mid = Math.floor((sh * 60 + sm + eh * 60 + em) / 2);
  return `${String(Math.floor(mid / 60) % 24).padStart(2, '0')}:${String(mid % 60).padStart(2, '0')}`;
}

function spreadDays(n) {
  // Spread n workout days evenly across Mon-Sun
  const allDays = [1, 3, 5, 2, 4, 6, 0];
  return allDays.slice(0, Math.min(n, 7));
}

function complementDays(days) {
  return [0,1,2,3,4,5,6].filter(d => !days.includes(d));
}

function categoryColour(cat) {
  const map = {
    wellness: '#00d4aa', spiritual: '#8B5CF6', work: '#F59E0B',
    personal: '#C8955C', learning: '#3B82F6',
  };
  return map[cat] || '#C8955C';
}

module.exports = router;
