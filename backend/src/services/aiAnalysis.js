const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://localhost:11434' });

/**
 * Analyzes a journal entry using local AI (Ollama).
 */
async function analyzeJournalEntry(transcript) {
  console.log('\n=== AI ANALYSIS START ===');
  console.log('Input transcript:', transcript.substring(0, 100) + '...');

  const prompt = `You are an intelligent journal assistant. Analyze this journal entry and extract structured information.

Journal entry:
"""
${transcript}
"""

Extract and return ONLY valid JSON with this exact structure (no markdown, no explanations, no code blocks):
{
  "tasks": ["task 1", "task 2"],
  "meetings": [{"title": "meeting name", "when": "time/date mentioned or 'not specified'", "with": "person name or null"}],
  "goals": ["goal 1", "goal 2"],
  "emotions": ["emotion 1", "emotion 2"],
  "people": ["person 1", "person 2"],
  "places": ["place 1", "place 2"],
  "mood": "one word: happy/sad/anxious/excited/calm/stressed/neutral",
  "key_themes": ["theme 1", "theme 2"],
  "summary": "one sentence summary of the entry"
}

Rules:
- Only include items that are explicitly mentioned
- Use empty arrays if nothing found
- For meetings, extract any time/date references even if vague
- Mood should be a single word
- Summary should be one clear sentence
- Return ONLY the JSON object, nothing else`;

  try {
    console.log('Calling Ollama...');
    
    const response = await ollama.chat({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
      },
    });

    console.log('\n=== RAW OLLAMA RESPONSE ===');
    console.log('Full response object:', JSON.stringify(response, null, 2));
    
    const content = response.message.content.trim();
    console.log('\n=== RESPONSE CONTENT ===');
    console.log('Content length:', content.length);
    console.log('First 500 chars:', content.substring(0, 500));

    // Try to extract JSON from markdown code blocks
    let jsonString = content;
    
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      console.log('Found JSON in markdown code block');
      jsonString = codeBlockMatch[1];
    }

    // Try to find JSON object in the text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
      console.log('Extracted JSON string length:', jsonString.length);
    }

    console.log('\n=== ATTEMPTING TO PARSE ===');

    let analysis;
    try {
      analysis = JSON.parse(jsonString);
      console.log('✓ JSON parsed successfully');
    } catch (parseError) {
      console.error('✗ JSON parse failed:', parseError.message);
      console.error('Failed to parse this string:', jsonString);
      throw new Error('AI returned invalid JSON: ' + parseError.message);
    }

    console.log('\n=== PARSED ANALYSIS ===');
    console.log('Raw parsed object:', JSON.stringify(analysis, null, 2));

    // Validate and normalize
    const validated = {
      tasks: Array.isArray(analysis.tasks) ? analysis.tasks : [],
      meetings: Array.isArray(analysis.meetings) ? analysis.meetings : [],
      goals: Array.isArray(analysis.goals) ? analysis.goals : [],
      emotions: Array.isArray(analysis.emotions) ? analysis.emotions : [],
      people: Array.isArray(analysis.people) ? analysis.people : [],
      places: Array.isArray(analysis.places) ? analysis.places : [],
      mood: analysis.mood || 'neutral',
      key_themes: Array.isArray(analysis.key_themes) ? analysis.key_themes : [],
      summary: analysis.summary || '',
    };

    console.log('\n=== VALIDATED ANALYSIS ===');
    console.log('Tasks count:', validated.tasks.length);
    console.log('Meetings count:', validated.meetings.length);
    console.log('Goals count:', validated.goals.length);
    console.log('Emotions count:', validated.emotions.length);
    console.log('Mood:', validated.mood);
    console.log('Summary:', validated.summary);
    console.log('Full validated object:', JSON.stringify(validated, null, 2));
    console.log('=== AI ANALYSIS END ===\n');

    return validated;

  } catch (error) {
    console.error('\n=== AI ANALYSIS ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('=== AI ANALYSIS ERROR END ===\n');

    // Return empty structure on error
    return {
      tasks: [],
      meetings: [],
      goals: [],
      emotions: [],
      people: [],
      places: [],
      mood: 'neutral',
      key_themes: [],
      summary: '',
    };
  }
}

/**
 * Generates daily summary from multiple entries.
 */
async function generateDailySummary(transcripts) {
  const combinedText = transcripts.join('\n\n---\n\n');

  const prompt = `You are a compassionate journal assistant. Read these journal entries from today and create an insightful daily summary.

Today's journal entries:
"""
${combinedText}
"""

Write a summary that:
1. Highlights the most important moments and decisions
2. Identifies emotional patterns
3. Lists key tasks or goals mentioned
4. Offers a brief, supportive reflection

Keep it under 200 words. Write in second person ("You..."). Be warm and encouraging.`;

  try {
    const response = await ollama.chat({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    return response.message.content.trim();
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Summary generation failed.';
  }
}

/**
 * Generates weekly insights.
 */
async function generateWeeklyInsights(dailySummaries) {
  const summariesText = dailySummaries
    .map((s) => `${s.date}: ${s.summary}`)
    .join('\n\n');

  const prompt = `You are a personal growth coach reviewing a week of journal summaries. Provide insights and patterns.

This week's daily summaries:
"""
${summariesText}
"""

Provide:
1. Main themes of the week
2. Emotional patterns
3. Productivity insights
4. One actionable suggestion for next week

Keep it under 250 words. Be specific and supportive.`;

  try {
    const response = await ollama.chat({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: 0.7,
      },
    });

    return response.message.content.trim();
  } catch (error) {
    console.error('Weekly insights error:', error);
    return 'Weekly insights could not be generated.';
  }
}

module.exports = {
  analyzeJournalEntry,
  generateDailySummary,
  generateWeeklyInsights,
};