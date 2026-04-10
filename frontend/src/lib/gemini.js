import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not set. AI analysis will be unavailable.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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
  analyzeJournalEntryWithGemini,
  generateDailySummaryWithGemini,
  generateWeeklyInsightsWithGemini,
};
