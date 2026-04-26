/**
 * Lumi AI Brain — Groq API Integration
 * Fast, free AI using Groq's OpenAI-compatible API
 * Model: llama-3.3-70b-versatile
 */
import axios from 'axios';

// Groq API Configuration
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Warn if API key is missing
if (!GROQ_API_KEY) {
  console.warn('VITE_GROQ_API_KEY not set. Lumi AI will be unavailable.');
}

/**
 * Send a message to Lumi (the AI companion)
 * This is the main conversation function that powers the TalkToLumi interface
 * Now uses Groq API for faster, free responses
 *
 * @param {Object} params - Conversation parameters
 * @param {string} params.userMessage - What the user just said
 * @param {Array} params.conversationHistory - Last 10 messages for context
 * @param {string} params.userName - User's name
 * @param {string} params.userRole - User's role/profession
 * @param {string} params.aiName - What user named their AI (default: "Lumi")
 * @param {Array} params.todaysPlan - Today's schedule items
 * @param {string} params.recentJournal - Summary of last journal entry
 * @param {string} params.currentTime - Current time string
 * @returns {Promise<string>} - Lumi's response text
 */
export async function sendToLumi({
  userMessage,
  conversationHistory = [],
  userName = 'Friend',
  userRole = 'personal',
  aiName = 'Lumi',
  todaysPlan = [],
  recentJournal = '',
  currentTime = new Date().toLocaleTimeString(),
}) {
  // DEBUG: Check API key
  console.log('Groq Key Status:', GROQ_API_KEY ? `Found - starts with: ${GROQ_API_KEY.substring(0, 8)}...` : 'MISSING - add VITE_GROQ_API_KEY to .env')

  // Return early if no API key
  if (!GROQ_API_KEY) {
    return `I need my API key to think, ${userName}! Please add VITE_GROQ_API_KEY to frontend/.env`
  }

  // Validate user message
  if (!userMessage?.trim()) {
    return "I didn't catch that. Could you say it again?";
  }

  // Build system prompt — handle all undefined values
  const systemPrompt = `You are ${aiName || 'Lumi'}, a warm, intelligent personal AI life companion in the PLOS app.

User name: ${userName || 'Friend'}
User role: ${userRole || 'personal'}
Current time: ${currentTime || 'unknown'}

Today's plan: ${Array.isArray(todaysPlan) && todaysPlan.length > 0 ? todaysPlan.map(p => p.title || String(p)).join(', ') : 'No plan set yet'}

Recent journal: ${recentJournal || 'No recent entries'}

Your personality rules:
- Always address the user by their first name naturally
- Keep responses warm, specific, and 2-4 sentences max
- Always reference exactly what the user said
- End with ONE follow-up question
- Never use filler phrases like "I hear you" alone
- Be helpful and actionable, like a smart best friend`

  // FIX BUG 2: Convert 'model' role to 'assistant' for Groq
  // Groq uses OpenAI format: only 'system', 'user', 'assistant'
  // Gemini used 'model' — we must convert
  const formattedHistory = conversationHistory
    .slice(-10)
    .map(msg => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: String(msg.content || '').trim()
    }))
    .filter(msg => msg.content.length > 0)

  // Build final messages array
  // FIX BUG 1: Declare messages OUTSIDE try block
  // so catch block can also access it
  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: String(userMessage || '').trim() }
  ].filter(msg => msg.content && msg.content.trim().length > 0)

  // Log what we are sending
  console.log('Sending messages to Groq:', messages.length, 'messages')
  console.log('Message roles:', messages.map(m => m.role))

  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.8,
        max_tokens: 300,
      },
      timeout: 15000,
    })

    const reply = response.data.choices[0].message.content
    console.log('Groq responded successfully:', reply.substring(0, 50) + '...')
    return reply
  } catch (error) {
    // FIX BUG 1: messages is now accessible here
    console.error('Groq Error Details:', {
      message: error.message,
      status: error.response?.status,
      errorData: JSON.stringify(error.response?.data),
      messagesCount: messages.length,
      messageRoles: messages.map(m => m.role),
      firstMessageLength: messages[0]?.content?.length,
      key: GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 12)}...` : 'MISSING'
    })

    if (error.response?.status === 400) {
      console.error('400 Bad Request body:', JSON.stringify(error.response?.data, null, 2))
      return `Let me try that again, ${userName || 'friend'}!`
    }

    if (error.response?.status === 401) {
      return `My connection key needs updating. Check the Groq key in frontend/.env`
    }

    if (error.response?.status === 429) {
      return `Give me a moment! Try again in a few seconds.`
    }

    if (error.code === 'ECONNABORTED') {
      return `That took too long. Check your internet and try again.`
    }

    return `Something went wrong on my end, ${userName || 'friend'}. Check browser console for details.`
  }
}

/**
 * Quick console test for Lumi - Run this in browser console
 * Usage: window.testLumi()
 */
export async function quickTestLumi() {
  console.log('🧪 Testing Lumi connection...');
  console.log('API Key:', GROQ_API_KEY ? `Found (${GROQ_API_KEY.substring(0, 8)}...)` : 'MISSING');

  if (!GROQ_API_KEY) {
    console.error('❌ No API key found. Check .env file for VITE_GROQ_API_KEY');
    return false;
  }

  try {
    const response = await sendToLumi({
      userMessage: 'Say hello and confirm you are working',
      userName: 'Tester',
      aiName: 'Lumi',
      conversationHistory: [],
    });
    console.log('✅ Lumi responded:', response);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Attach to window for easy console access
if (typeof window !== 'undefined') {
  window.testLumi = quickTestLumi;
}

/**
 * Test connection to Groq API
 * Useful for verifying the API key works
 *
 * @returns {Promise<boolean>} - true if connection works, false if not
 */
export async function testLumiConnection() {
  if (!GROQ_API_KEY) {
    console.error('Groq API key not configured');
    return false;
  }

  try {
    const response = await axios({
      method: 'POST',
      url: GROQ_URL,
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello in one sentence' }
        ],
        temperature: 0.7,
        max_tokens: 50,
      },
      timeout: 10000,
    });

    if (response.data?.choices?.[0]?.message?.content) {
      console.log('Groq connected! Response:', response.data.choices[0].message.content);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Groq connection test failed:', error.message);
    return false;
  }
}

/**
 * Generate a warm morning greeting based on today's plan
 *
 * @param {string} userName - User's name
 * @param {Array} todaysPlan - Today's schedule items
 * @param {string} aiName - AI companion's name
 * @returns {Promise<string>} - Morning greeting
 */
export async function generateDailyGreeting(userName, todaysPlan, aiName = 'Lumi') {
  return sendToLumi({
    userMessage: "Generate a warm morning greeting for me based on my plan for today",
    userName,
    todaysPlan,
    aiName,
    conversationHistory: [],
  });
}

/**
 * Analyzes a journal entry using Groq API
 * Now uses llama-3.3-70b-versatile model via Groq
 *
 * @param {string} transcript - The journal entry text to analyze
 * @returns {Promise<Object>} Analysis result with mood, themes, commitments, etc.
 */
export async function analyzeJournalEntryWithGemini(transcript) {
  if (!GROQ_API_KEY) {
    console.log('Groq API key not available, skipping analysis');
    return null;
  }

  if (!transcript?.trim()) {
    return null;
  }

  console.log('\n=== GROQ JOURNAL ANALYSIS START ===');
  console.log('Input transcript:', transcript.substring(0, 100) + '...');

  const prompt = `You are a personal life assistant reading someone's private journal.

Analyze this journal entry and return a JSON object with exactly these fields:
{
  "mood": "one word describing the dominant emotional tone",
  "themes": ["up to 5 short phrases describing main topics"],
  "commitments": ["things the person said they would do, as action items"],
  "schedule_suggestions": ["specific activities that could be added to their calendar, with suggested times if mentioned"],
  "summary": "2-3 sentences summarizing the key points of this entry"
}

Return ONLY the JSON. No explanation. No markdown.

Journal entry:
"""
${transcript}
"""`;

  try {
    const response = await axios({
      method: 'POST',
      url: GROQ_URL,
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes journal entries and returns JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      timeout: 15000,
    });

    const text = response.data?.choices?.[0]?.message?.content?.trim();
    console.log('Groq response received');

    // Extract JSON from response
    let jsonString = text;

    // Remove markdown code blocks if present
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
      console.log('Extracted from code block');
    } else {
      // Try to find JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
    }

    // Parse JSON
    let analysis;
    try {
      analysis = JSON.parse(jsonString);
      console.log('✓ JSON parsed successfully');
    } catch (parseError) {
      console.error('✗ JSON parse failed:', parseError.message);
      console.error('Attempted to parse:', jsonString.substring(0, 200));
      return null;
    }

    // Validate and normalize structure
    const validated = {
      mood: analysis.mood || 'neutral',
      themes: Array.isArray(analysis.themes) ? analysis.themes.slice(0, 5) : [],
      commitments: Array.isArray(analysis.commitments) ? analysis.commitments : [],
      schedule_suggestions: Array.isArray(analysis.schedule_suggestions)
        ? analysis.schedule_suggestions
        : [],
      summary: analysis.summary || '',
      generated_at: new Date().toISOString(),
    };

    console.log('Mood:', validated.mood);
    console.log('Themes:', validated.themes);
    console.log('Commitments:', validated.commitments);
    console.log('Schedule suggestions:', validated.schedule_suggestions);
    console.log('=== GROQ ANALYSIS END ===\n');

    return validated;

  } catch (error) {
    console.error('\n=== GROQ ANALYSIS ERROR ===');
    console.error('Error:', error.message);
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Groq free tier has limits.');
    }
    console.error('=== ERROR END ===\n');
    return null;
  }
}

/**
 * Generates daily summary of journal entries
 * Now uses Groq API
 *
 * @param {Array} transcripts - Array of journal entry texts
 * @returns {Promise<string|null>} Daily summary text
 */
export async function generateDailySummaryWithGemini(transcripts) {
  if (!GROQ_API_KEY || !transcripts || transcripts.length === 0) {
    return null;
  }

  const combinedText = transcripts.join('\n\n---\n\n');

  const prompt = `You are a personal life assistant reviewing today's journal entries.

Create a warm, insightful daily summary under 200 words. Highlight meaningful moments, acknowledge emotions, celebrate wins, and end with encouragement.

Today's entries:
"""
${combinedText}
"""

Return only the summary text, no JSON formatting needed.`;

  try {
    const response = await axios({
      method: 'POST',
      url: GROQ_URL,
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that writes warm daily summaries.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 512,
      },
      timeout: 15000,
    });

    return response.data?.choices?.[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('Daily summary generation error:', error);
    return null;
  }
}

/**
 * Generates weekly insights from daily summaries
 * Now uses Groq API
 *
 * @param {Array} dailySummaries - Array of {date, summary} objects
 * @returns {Promise<string|null>} Weekly insights text
 */
export async function generateWeeklyInsightsWithGemini(dailySummaries) {
  if (!GROQ_API_KEY || !dailySummaries || dailySummaries.length === 0) {
    return null;
  }

  const summariesText = dailySummaries
    .map((s) => `${s.date}: ${s.summary}`)
    .join('\n\n');

  const prompt = `You are a personal life assistant reviewing a week of journal entries.

Share key themes, emotional journey, wins to celebrate, and one caring suggestion for next week. Under 250 words.

This week's summaries:
"""
${summariesText}
"""

Return only the insights text, no JSON formatting needed.`;

  try {
    const response = await axios({
      method: 'POST',
      url: GROQ_URL,
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that provides warm weekly insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 512,
      },
      timeout: 15000,
    });

    return response.data?.choices?.[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('Weekly insights generation error:', error);
    return null;
  }
}

// Default export for compatibility
export default {
  sendToLumi,
  testLumiConnection,
  generateDailyGreeting,
  analyzeJournalEntryWithGemini,
  generateDailySummaryWithGemini,
  generateWeeklyInsightsWithGemini,
};
