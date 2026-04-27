const { pool } = require('../db/connection');

// Lazy-load Groq SDK - only initialize when needed
let groq = null;
function getGroqClient() {
  if (!groq) {
    const { Groq } = require('groq-sdk');
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key' });
  }
  return groq;
}

/**
 * JOURNAL HELPER FOR LUMI
 * 
 * This is NOT replacing Lumi - it's adding a feature.
 * After Lumi has a full conversation with the user,
 * this analyzes if the conversation should be saved to a journal.
 * 
 * Core Philosophy:
 * 1. Lumi ALWAYS talks first - she's a companion, not a router
 * 2. Only after real conversation suggest saving
 * 3. ALWAYS ask user before saving personal content
 * 4. Let user pick which journal or decline
 */

/**
 * Analyze conversation and suggest if it should be saved
 * Returns null if not worth saving
 */
async function analyzeForJournal(userId, conversationText) {
  try {
    const prompt = `You are analyzing a conversation to decide if it's worth saving to a journal.

Conversation:
"""
${conversationText}
"""

DECISION CRITERIA:
- Is there emotional depth? (reflection, feelings, processing)
- Is there insight or realization?
- Is it about something important in their life?
- Would they want to look back at this later?

If YES to any, suggest the best journal:
- personal: emotions, relationships, daily life, family
- spiritual: faith, prayer, God, scripture, purpose
- business: work, PLOS, career, clients, building
- goals: future plans, dreams, ambitions, progress
- health: physical health, mental health, wellness

If NO (shallow chat, small talk, already handled), return null journal.

Respond in JSON:
{
  "shouldSuggest": true/false,
  "suggestedJournal": "personal/spiritual/business/goals/health/null",
  "reasoning": "why you think this should or shouldn't be saved",
  "confidence": 0.0-1.0
}`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content || '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : response;
    
    const result = JSON.parse(jsonString);
    
    return {
      shouldSuggest: result.shouldSuggest && result.confidence > 0.7,
      suggestedJournal: result.suggestedJournal,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('Journal analysis error:', error);
    return { shouldSuggest: false, suggestedJournal: null, reasoning: '' };
  }
}

/**
 * Save conversation to journal after user confirms
 */
async function saveConversationToJournal(userId, journalType, conversationText, aiSummary) {
  try {
    const result = await pool.query(
      `INSERT INTO journal_entries 
       (user_id, journal_type, content, ai_summary, source, recorded_at, created_at) 
       VALUES ($1, $2, $3, $4, 'lumi_conversation', NOW(), NOW()) 
       RETURNING *`,
      [
        userId,
        journalType,
        conversationText,
        aiSummary || 'Conversation with Lumi',
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Save conversation error:', error);
    throw error;
  }
}

/**
 * Get available journals for user
 */
async function getUserJournals(userId) {
  try {
    // Default journals
    const defaultJournals = [
      { type: 'personal', name: 'Everyday Life', emoji: '🌿' },
      { type: 'spiritual', name: 'Bible & Faith', emoji: '✝️' },
      { type: 'business', name: 'My Business', emoji: '💡' },
      { type: 'goals', name: 'Goals & Vision', emoji: '🎯' },
      { type: 'health', name: 'Mental Health', emoji: '🌸' },
    ];

    return defaultJournals;
  } catch (error) {
    console.error('Get journals error:', error);
    return [];
  }
}

module.exports = {
  analyzeForJournal,
  saveConversationToJournal,
  getUserJournals,
};
