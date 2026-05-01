const { pool } = require('../db/connection');

// Lazy-load Groq SDK - only initialize when needed
let groq = null;
function getGroqClient() {
  if (!groq) {
    const { Groq } = require('groq-sdk');
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || 'dummy-key',
    });
  }
  return groq;
}

// Active conversations store (in production, use Redis)
const activeConversations = new Map();

/**
 * Route user input through Lumi AI
 * Lumi is a conversational companion first - she talks, asks questions, analyzes
 * Only after conversation does she help save things
 */
async function routeLumiInput(userId, text, conversationContext = {}) {
  try {
    // Check if there's an active conversation waiting for confirmation
    const conversationKey = `${userId}_lumi`;
    const pendingState = activeConversations.get(conversationKey);

    // If user is responding to a confirmation request
    if (pendingState && pendingState.awaitingConfirmation) {
      return await handleConfirmation(userId, text, pendingState);
    }

    // Step 1: Lumi analyzes the full meaning semantically
    const analysis = await analyzeWithLumi(userId, text, conversationContext);

    // Step 2: Determine what Lumi should do
    return await determineLumiResponse(userId, text, analysis);

  } catch (error) {
    console.error('Lumi router error:', error);
    return {
      success: true,
      lumiResponse: "I'm here and listening. Tell me more about what's on your mind.",
      saved: false,
      needsConfirmation: false,
      route: 'chat',
    };
  }
}

/**
 * Lumi analyzes the user's message deeply
 * She understands meaning, emotion, intent - not keywords
 */
async function analyzeWithLumi(userId, text, context) {
  const systemPrompt = `You are Lumi — the AI core of PLOS, a life planning app. You are the user's personal system builder, daily companion, and proactive planner.

YOUR IDENTITY:
You are warm, intelligent, direct, and one step ahead. You don't wait for the user to ask — you anticipate, suggest, and act. You speak like a trusted friend who also happens to be brilliant at organising life.

YOUR CORE ROLE — PLANNER BRAIN:
Every morning, proactively greet the user. Pull from their journal, habits, sleep log, goals, and schedule. Build their day automatically — filling time slots with spiritual time (Bible, prayer, meditation), meals, workouts, medication, focus blocks, and social time. Check for conflicts between blocks and resolve them. Lock high-priority spiritual and health blocks so they can't be moved without confirmation.

Remind them of upcoming tasks at least 45 minutes in advance. At night (after 9 PM), ask: "You're about to sleep. What do you want tomorrow to look like?" Then generate the next day's full plan.

Always track completion: when the user says "done", "finished", or "completed [task]", mark the block complete and celebrate briefly but genuinely.

Never be passive — always be one step ahead of the user's day.

WHEN HANDLING PLANNER REQUESTS:
- "Fix my conflict" → resolve overlapping time blocks, suggest the new slot
- "Add a task" → ask for time, duration, category if not given, then confirm
- "Plan my day" → generate a full structured schedule based on their known routines
- "What's next?" → tell them the next task and prep tip
- "Reschedule X" → find a clear slot and move it
- "Lock/unlock X" → confirm the priority anchor change

CONTENT CLASSIFICATION:
- personal: emotions, relationships, daily life, family, feelings
- spiritual: faith, prayer, God, Bible, purpose, meaning, gratitude
- business: work, projects, career decisions, clients
- goals: future plans, dreams, ambitions, progress
- health: physical health, mental health, energy, body, wellness
- budget_transaction: specific money amount spent/received (must have real number)
- schedule: specific time/date event or reminder (must have real time)
- habit: completed habit to log (must name the habit)
- planner: schedule management, conflicts, task planning, day building

IMPORTANT RULES:
- Emotional content about money belongs in journal, not budget
- Only classify as budget_transaction if there is a REAL specific amount
- Only classify as schedule if there is a REAL specific time
- Planner requests get immediate, actionable responses — no journaling
- Conversations are PRIMARY. Saving is secondary.
- Keep responses concise and warm — no more than 3 sentences for simple confirmations

CONTEXT (from user's app):
${conversationContext.scheduleSummary || 'No schedule data yet'}
${conversationContext.habitSummary || 'No habit data yet'}
${conversationContext.journalSummary || 'No journal data yet'}

Respond in this exact JSON format:
{
  "understanding": "One empathetic sentence describing what this person is really expressing",
  "emotion": "primary emotion: happy, sad, anxious, grateful, excited, tired, focused, determined, etc.",
  "categories": ["personal"],
  "confidence": 0.0,
  "isActionable": false,
  "extracted": {
    "amount": null,
    "currency": null,
    "scheduleTime": null,
    "scheduleTitle": null,
    "habitName": null
  },
  "suggestedJournals": ["personal"],
  "followUpQuestion": "A warm thoughtful question",
  "lumiResponse": "Your actual warm response to the user — direct, helpful, one step ahead",
  "shouldSave": false,
  "saveSuggestion": null
}`;

  try {
    const completion = await getGroqClient().chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    
    // Extract JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
    
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      // If JSON parsing fails, create a fallback
      return {
        understanding: "The user is sharing something with me",
        emotion: "neutral",
        categories: ["chat"],
        confidence: 0.5,
        isActionable: false,
        extracted: {},
        suggestedJournals: [],
        followUpQuestion: "Tell me more about that.",
        lumiResponse: "I'm listening. Go on.",
        shouldSave: false,
        saveSuggestion: null,
      };
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

/**
 * Determine what Lumi should say/do based on analysis
 */
async function determineLumiResponse(userId, text, analysis) {
  const conversationKey = `${userId}_lumi`;

  // Case 1: Factual data (can auto-save)
  if (analysis.extracted?.amount && analysis.categories.includes('budget_transaction')) {
    const saved = await saveToBudget(userId, {
      amount: analysis.extracted.amount,
      currency: analysis.extracted.currency || '₦',
      category: 'expense',
      note: analysis.understanding,
    });

    return {
      success: true,
      lumiResponse: `${analysis.lumiResponse}\n\nI've logged that ${analysis.extracted.currency || '₦'}${analysis.extracted.amount} expense for you.`,
      saved: true,
      route: 'budget',
      savedData: saved,
      needsConfirmation: false,
    };
  }

  // Case 2: Schedule with specific time
  if (analysis.extracted?.scheduleTime && analysis.categories.includes('schedule')) {
    const saved = await saveToSchedule(userId, {
      title: analysis.extracted.scheduleTitle || 'Reminder',
      time: analysis.extracted.scheduleTime,
    });

    return {
      success: true,
      lumiResponse: `${analysis.lumiResponse}\n\nGot it — I'll remind you ${analysis.extracted.scheduleTime}.`,
      saved: true,
      route: 'schedule',
      savedData: saved,
      needsConfirmation: false,
    };
  }

  // Case 3: Habit completion
  if (analysis.extracted?.habitName && analysis.categories.includes('habit')) {
    const saved = await updateHabit(userId, {
      habitName: analysis.extracted.habitName,
      completed: true,
    });

    return {
      success: true,
      lumiResponse: `${analysis.lumiResponse}\n\nNice! I've marked ${analysis.extracted.habitName} as complete for today.`,
      saved: true,
      route: 'habit',
      savedData: saved,
      needsConfirmation: false,
    };
  }

  // Case 4: Journal content - LUMI CONVERSES FIRST
  const journalCategories = analysis.categories.filter(c => 
    ['personal', 'spiritual', 'business', 'goals', 'health'].includes(c)
  );

  if (journalCategories.length > 0) {
    // Store conversation state
    activeConversations.set(conversationKey, {
      userMessage: text,
      analysis,
      journalCategories,
      awaitingConfirmation: false,
      conversationDepth: 1,
    });

    // Lumi responds conversationally first
    let response = analysis.lumiResponse;
    
    // If confidence is high, suggest saving after conversation
    if (analysis.confidence >= 0.8 && journalCategories.length === 1) {
      response += `\n\n${analysis.saveSuggestion || `Would you like me to save this to your ${journalCategories[0]} journal once we're done talking?`}`;
      
      // Update state to await confirmation
      const state = activeConversations.get(conversationKey);
      state.awaitingConfirmation = true;
      state.suggestedJournal = journalCategories[0];
      activeConversations.set(conversationKey, state);

      return {
        success: true,
        lumiResponse: response,
        saved: false,
        route: journalCategories[0],
        needsConfirmation: true,
        pendingState: {
          content: text,
          suggestedJournal: journalCategories[0],
          summary: analysis.understanding,
        },
      };
    }

    // If unclear, ask where to save later
    if (journalCategories.length > 1) {
      response += `\n\nBy the way, when we're done talking, this could go in your ${journalCategories.join(' or ')} journal — just let me know where it feels right.`;
    }

    return {
      success: true,
      lumiResponse: response,
      saved: false,
      route: 'chat',
      needsConfirmation: false,
    };
  }

  // Case 5: Just chat - no saving
  return {
    success: true,
    lumiResponse: analysis.lumiResponse,
    saved: false,
    route: 'chat',
    needsConfirmation: false,
  };
}

/**
 * Handle user's confirmation response
 */
async function handleConfirmation(userId, userResponse, pendingState) {
  const lowerResponse = userResponse.toLowerCase().trim();
  const conversationKey = `${userId}_lumi`;

  // User wants to save
  if (lowerResponse.includes('yes') || 
      lowerResponse.includes('yeah') || 
      lowerResponse.includes('sure') ||
      lowerResponse.includes('ok') ||
      lowerResponse.includes('save it')) {
    
    const journalType = pendingState.suggestedJournal || 'personal';
    const saved = await saveToJournal(userId, journalType, {
      content: pendingState.userMessage || pendingState.content,
      summary: pendingState.analysis?.understanding || '',
      emotion: pendingState.analysis?.emotion || 'neutral',
    });

    // Clear conversation
    activeConversations.delete(conversationKey);

    return {
      success: true,
      lumiResponse: `Saved to your ${journalType} journal. Thanks for sharing with me — I'm here anytime you want to talk.`,
      saved: true,
      route: journalType,
      savedData: saved,
      needsConfirmation: false,
    };
  }

  // User doesn't want to save
  if (lowerResponse.includes('no') || 
      lowerResponse.includes("don't") ||
      lowerResponse.includes('skip')) {
    
    activeConversations.delete(conversationKey);

    return {
      success: true,
      lumiResponse: "No problem at all — our conversation stays between us. What else is on your mind?",
      saved: false,
      route: 'chat',
      needsConfirmation: false,
    };
  }

  // User specifies a journal
  const journalOptions = ['personal', 'spiritual', 'business', 'goals', 'health'];
  const foundJournal = journalOptions.find(j => lowerResponse.includes(j));
  
  if (foundJournal) {
    const saved = await saveToJournal(userId, foundJournal, {
      content: pendingState.userMessage || pendingState.content,
      summary: pendingState.analysis?.understanding || '',
      emotion: pendingState.analysis?.emotion || 'neutral',
    });

    activeConversations.delete(conversationKey);

    return {
      success: true,
      lumiResponse: `Perfect — saved to your ${foundJournal} journal. Anything else you'd like to share?`,
      saved: true,
      route: foundJournal,
      savedData: saved,
      needsConfirmation: false,
    };
  }

  // Ambiguous response - keep talking
  return {
    success: true,
    lumiResponse: "I'm listening. Would you like me to save what you shared, or shall we keep talking?",
    saved: false,
    route: 'chat',
    needsConfirmation: true,
    pendingState,
  };
}

/**
 * Confirm and save (called externally when user confirms)
 */
async function confirmAndSave(userId, journalType, content, summary = '') {
  const conversationKey = `${userId}_lumi`;
  
  try {
    const saved = await saveToJournal(userId, journalType, {
      content,
      summary,
      emotion: 'neutral',
    });

    // Clear any pending conversation
    activeConversations.delete(conversationKey);

    return {
      success: true,
      savedData: saved,
    };
  } catch (error) {
    console.error('Confirm save error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Save to journal
 */
async function saveToJournal(userId, type, data) {
  try {
    const result = await pool.query(
      `INSERT INTO journal_entries 
       (user_id, journal_type, content, ai_summary, emotion, source, recorded_at, created_at) 
       VALUES ($1, $2, $3, $4, $5, 'lumi_voice', NOW(), NOW()) 
       RETURNING *`,
      [
        userId,
        type,
        data.content || '',
        data.summary || '',
        data.emotion || 'neutral',
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Save to journal error:', error);
    throw error;
  }
}

/**
 * Save to budget
 */
async function saveToBudget(userId, data) {
  try {
    const result = await pool.query(
      `INSERT INTO budget_entries 
       (user_id, amount, currency, category, note, type, date, created_at) 
       VALUES ($1, $2, $3, $4, $5, 'expense', CURRENT_DATE, NOW()) 
       RETURNING *`,
      [
        userId,
        data.amount || 0,
        data.currency || '₦',
        data.category || 'other',
        data.note || '',
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Save to budget error:', error);
    throw error;
  }
}

/**
 * Save to schedule
 */
async function saveToSchedule(userId, data) {
  try {
    // Parse time
    let startTime = null;
    if (data.time) {
      const timeMatch = data.time.match(/(\d+):?(\d*)?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3]?.toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        startTime = date;
      }
    }

    const result = await pool.query(
      `INSERT INTO schedules 
       (user_id, title, start_time, category, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [
        userId,
        data.title || 'Untitled',
        startTime,
        data.category || 'personal',
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Save to schedule error:', error);
    throw error;
  }
}

/**
 * Update habit completion
 */
async function updateHabit(userId, data) {
  try {
    // Find or create habit
    let habitResult = await pool.query(
      `SELECT id FROM habits WHERE user_id = $1 AND name ILIKE $2`,
      [userId, `%${data.habitName}%`]
    );

    let habitId;
    if (habitResult.rows.length === 0) {
      const newHabit = await pool.query(
        `INSERT INTO habits (user_id, name, created_at) VALUES ($1, $2, NOW()) RETURNING id`,
        [userId, data.habitName]
      );
      habitId = newHabit.rows[0].id;
    } else {
      habitId = habitResult.rows[0].id;
    }

    // Mark as completed
    const result = await pool.query(
      `INSERT INTO habit_completions (habit_id, user_id, completed, date, created_at) 
       VALUES ($1, $2, true, CURRENT_DATE, NOW()) 
       ON CONFLICT (habit_id, date) DO UPDATE SET completed = true 
       RETURNING *`,
      [habitId, userId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Update habit error:', error);
    throw error;
  }
}

/**
 * Get conversation history for context
 */
async function getConversationHistory(userId, limit = 5) {
  try {
    const result = await pool.query(
      `SELECT user_message, lumi_response, created_at
       FROM lumi_conversations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.reverse();
  } catch (error) {
    console.error('Get conversation history error:', error);
    return [];
  }
}

module.exports = {
  routeLumiInput,
  confirmAndSave,
  saveToJournal,
  saveToBudget,
  saveToSchedule,
  updateHabit,
  getConversationHistory,
};
