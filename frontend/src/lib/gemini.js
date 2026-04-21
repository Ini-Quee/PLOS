import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not set. AI analysis will be unavailable.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Send a message to Lumi (the AI companion)
 * This is the main conversation function that powers the TalkToLumi interface
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
  userName = 'there',
  userRole = '',
  aiName = 'Lumi',
  todaysPlan = [],
  recentJournal = '',
  currentTime = '',
}) {
  if (!genAI) {
    console.error('Gemini API not initialized - missing API key');
    return "I'm having trouble connecting to my brain. Please check that VITE_GEMINI_API_KEY is set in your .env file.";
  }

  if (!userMessage?.trim()) {
    return "I didn't catch that. Could you say it again?";
  }

  try {
    // Get current time info
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';

    const todayDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    // Build system prompt with user context
    const systemPrompt = `You are ${aiName}, a warm, intelligent, and deeply personal AI life companion built into the PLOS life scheduler app.

USER CONTEXT:
- Name: ${userName}
${userRole ? `- Role/Profession: ${userRole}` : ''}
- Today's date: ${todayDate}
- Time of day: ${timeOfDay}
${currentTime ? `- Current time: ${currentTime}` : ''}

TODAY'S PLAN:
${todaysPlan.length > 0 
  ? todaysPlan.map(t => `- ${t.title}${t.time ? ` at ${t.time}` : ''}${t.completed ? ' (completed)' : ''}`).join('\n')
  : '- No specific items planned yet'
}

${recentJournal ? `\nRECENT JOURNAL CONTEXT:\n${recentJournal}` : ''}

YOUR PERSONALITY:
- Warm and encouraging like a best friend
- Smart and practical like a life coach
- Faith-aware and respectful of spirituality
- Never robotic, never scripted
- Use the user's name naturally in responses
- Keep responses conversational (2-4 sentences usually, longer only when asked)
- Never say "I hear you" or "I understand you" as standalone responses — always add substance
- Ask follow-up questions to keep conversation going
- Remember what was said earlier in this conversation

YOU CAN HELP WITH:
- Daily planning and scheduling
- Habit tracking and motivation
- Budget and financial thinking
- Bible reading and spiritual reflection
- Goal setting and progress
- Journaling and emotional processing
- Focus and productivity
- Sleep and health habits
- Any life challenge the user brings up

CONVERSATION HISTORY:
${conversationHistory.slice(-6).map(msg => `${msg.role === 'user' ? userName : aiName}: ${msg.content}`).join('\n')}

INSTRUCTIONS:
1. Acknowledge what the user said specifically
2. Add a helpful insight, question, or suggestion
3. Never give generic filler responses
4. Be warm, personal, and conversational
5. If the user mentions completing a task, celebrate it
6. If the user seems stressed, be supportive
7. Always use their name (${userName}) naturally in your response

Respond as ${aiName}:`;

    // Get the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 500,
      },
    });

    // Generate content
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userName + ': ' + userMessage }] }
      ],
    });

    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up the response - remove any role prefixes that might have been generated
    responseText = responseText.replace(/^(User|Lumi|Assistant|AI):\s*/i, '');
    responseText = responseText.replace(new RegExp(`^${userName}:\s*`, 'i'), '');

    return responseText;

  } catch (error) {
    console.error('Lumi AI error:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      return "Give me a moment to think... I've been a bit busy. Try again in a few seconds.";
    }
    
    if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      return "I'm having trouble connecting. Check your internet and try again in a moment.";
    }
    
    if (error.message?.includes('API key') || error.status === 400) {
      return "I'm having trouble accessing my brain. Please check that VITE_GEMINI_API_KEY is set correctly.";
    }

    return `Hey ${userName}, I'm having a bit of trouble thinking right now. Could you try again?`;
  }
}

/**
 * Analyzes a journal entry using Google Gemini API.
 * This runs client-side to preserve zero-knowledge architecture.
 * 
 * @param {string} transcript - The journal entry text to analyze
 * @returns {Promise<Object>} Analysis result with mood, themes, commitments, etc.
 */
export async function analyzeJournalEntryWithGemini(transcript) {
  if (!genAI) {
    console.log('Gemini API key not available, skipping analysis');
    return null;
  }

  console.log('\n=== GEMINI ANALYSIS START ===');
  console.log('Input transcript:', transcript.substring(0, 100) + '...');

  const prompt = `You are a personal life assistant reading someone's private journal.

Analyse this journal entry and return a JSON object with exactly these fields:
{
  "mood": "one word describing the dominant emotional tone",
  "themes": ["up to 5 short phrases describing main topics"],
  "commitments": ["things the person said they would do, as action items"],
  "schedule_suggestions": ["specific activities that could be added to their calendar, with suggested times if mentioned"],
  "summary": "2-3 sentences summarising the key points of this entry"
}

Return ONLY the JSON. No explanation. No markdown.

Journal entry:
"""
${transcript}
"""`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    const text = response.text().trim();

    console.log('Gemini response received');

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
    console.log('=== GEMINI ANALYSIS END ===\n');

    return validated;

  } catch (error) {
    console.error('\n=== GEMINI ANALYSIS ERROR ===');
    console.error('Error:', error.message);
    if (error.status === 429) {
      console.error('Rate limit exceeded. Free tier allows limited requests per minute.');
    }
    console.error('=== ERROR END ===\n');
    return null;
  }
}

/**
 * Generates daily summary of journal entries
 */
export async function generateDailySummaryWithGemini(transcripts) {
  if (!genAI || !transcripts || transcripts.length === 0) {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const response = await result.response;
    return response.text().trim();

  } catch (error) {
    console.error('Daily summary generation error:', error);
    return null;
  }
}

/**
 * Generates weekly insights from daily summaries
 */
export async function generateWeeklyInsightsWithGemini(dailySummaries) {
  if (!genAI || !dailySummaries || dailySummaries.length === 0) {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const response = await result.response;
    return response.text().trim();

  } catch (error) {
    console.error('Weekly insights generation error:', error);
    return null;
  }
}

export default {
  sendToLumi,
  analyzeJournalEntryWithGemini,
  generateDailySummaryWithGemini,
  generateWeeklyInsightsWithGemini,
};
