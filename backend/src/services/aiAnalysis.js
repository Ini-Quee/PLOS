const { Ollama } = require('ollama');

// Get Ollama host from environment variable
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
console.log('🦆 Ollama host:', OLLAMA_HOST);

const ollama = new Ollama({ host: OLLAMA_HOST });

/**
 * Analyzes a journal entry conversationally.
 */
async function analyzeJournalEntry(transcript) {
  console.log('\n=== AI ANALYSIS START ===');
  console.log('Input transcript:', transcript.substring(0, 100) + '...');

  const prompt = `You are Quackers 🦆, the user's journal companion. You're like their best friend who actually reads what they write and gives real responses.

Your personality:
- Warm but real — not a therapist, not a life coach, just a good friend
- Slightly cheeky when appropriate (gentle teasing is okay)
- You use "we" language ("okay but how stressed are WE about this?")
- You reference specific things they wrote, using their words
- You're honest, not generic — no textbook advice
- Emojis feel natural, not corporate

Journal entry:
"""
${transcript}
"""

Respond with ONLY valid JSON (no markdown):
{
  "reaction": "Your genuine first reaction to what they said (1-2 sentences, casual tone)",
  "question": "One real question a friend would actually ask (casual, specific to what they wrote)",
  "suggestions": [
    {
      "type": "calendar",
      "icon": "📅",
      "text": "Short, specific suggestion based on what they actually said",
      "action": "add_to_calendar",
      "data": {
        "title": "exact thing they mentioned",
        "when": "time if they said one",
        "details": "specific context from their entry"
      }
    }
  ],
  "encouragement": "Quick genuine encouragement (short, real, emoji okay)",
  "detected": {
    "tasks": ["word-for-word tasks they mentioned"],
    "meetings": [{"title": "exact wording", "when": "exact time they said", "with": "person's name"}],
    "goals": ["aspirations in their own words"],
    "emotions": ["emotions implied, not stated"],
    "people": ["names mentioned"],
    "places": ["places mentioned"]
  },
  "summary": "One sentence summary"
}

Examples:

User: "I need to finish my report by Friday. Meeting with Sarah at 2pm tomorrow."
Response:
{
  "reaction": "okay that's a LOT — report AND Sarah meeting all at once 😰",
  "question": "which one is stressing you out most right now? be honest",
  "suggestions": [
    {"type": "calendar", "icon": "📅", "text": "add Sarah meeting to calendar (tomorrow 2pm)?", "action": "add_to_calendar", "data": {"title": "Meeting with Sarah", "when": "tomorrow at 2pm"}},
    {"type": "task", "icon": "✓", "text": "block Thursday afternoon to finish that report?", "action": "create_task", "data": {"title": "finish report", "details": "due Friday"}}
  ],
  "encouragement": "you've handled worse weeks than this 🦆",
  "detected": {"tasks": ["finish report"], "meetings": [{"title": "Meeting with Sarah", "when": "tomorrow at 2pm", "with": "Sarah"}], "goals": [], "emotions": ["stressed"], "people": ["Sarah"], "places": []},
  "summary": "Has a report due Friday and meeting with Sarah tomorrow."
}

Now respond to the actual journal entry.`;

  try {
    console.log('Calling Ollama...');
    
    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    const content = response.message.content.trim();
    console.log('Response length:', content.length);
    console.log('First 300 chars:', content.substring(0, 300));

    // Extract JSON
    let jsonString = content;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
      console.log('Extracted from code block');
    } else {
      // Try to find JSON object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
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
      throw new Error('AI returned invalid JSON');
    }

    // Validate structure
    const validated = {
      reaction: analysis.reaction || 'Thanks for sharing!',
      question: analysis.question || 'How are you feeling about this?',
      detected: {
        tasks: Array.isArray(analysis.detected?.tasks) ? analysis.detected.tasks : [],
        meetings: Array.isArray(analysis.detected?.meetings) ? analysis.detected.meetings : [],
        goals: Array.isArray(analysis.detected?.goals) ? analysis.detected.goals : [],
        emotions: Array.isArray(analysis.detected?.emotions) ? analysis.detected.emotions : [],
        people: Array.isArray(analysis.detected?.people) ? analysis.detected.people : [],
        places: Array.isArray(analysis.detected?.places) ? analysis.detected.places : [],
      },
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      encouragement: analysis.encouragement || "You've got this! 🦆",
      summary: analysis.summary || '',
    };

    console.log('Reaction:', validated.reaction);
    console.log('Question:', validated.question);
    console.log('Suggestions count:', validated.suggestions.length);
    console.log('=== AI ANALYSIS END ===\n');

    return validated;

  } catch (error) {
    console.error('\n=== AI ANALYSIS ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== ERROR END ===\n');

    // Friendly fallback
    return {
      reaction: 'Thanks for sharing your thoughts today!',
      question: 'How are you feeling right now?',
      detected: {
        tasks: [],
        meetings: [],
        goals: [],
        emotions: [],
        people: [],
        places: [],
      },
      suggestions: [],
      encouragement: "Keep journaling — you're doing great! 🦆",
      summary: '',
    };
  }
}

/**
 * Generates daily summary
 */
async function generateDailySummary(transcripts) {
  const combinedText = transcripts.join('\n\n---\n\n');

  const prompt = `You are Quackers, a compassionate journal companion. Review today's journal entries and create a warm, insightful summary.

Today's entries:
"""
${combinedText}
"""

Write a caring summary that highlights meaningful moments, acknowledges emotions, celebrates wins, and ends with warm encouragement. Under 200 words. Write in second person ("You...").`;

  try {
    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.7 },
    });
    return response.message.content.trim();
  } catch (error) {
    console.error('Summary generation error:', error);
    return "Your journal entries are safely saved. Keep up the great work! 🦆";
  }
}

/**
 * Generates weekly insights
 */
async function generateWeeklyInsights(dailySummaries) {
  const summariesText = dailySummaries
    .map((s) => `${s.date}: ${s.summary}`)
    .join('\n\n');

  const prompt = `You are Quackers, reviewing a week of journal entries. Provide warm, actionable insights.

This week's summaries:
"""
${summariesText}
"""

Share key themes, emotional journey, wins to celebrate, and one caring suggestion for next week. Under 250 words.`;

  try {
    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.7 },
    });
    return response.message.content.trim();
  } catch (error) {
    console.error('Weekly insights error:', error);
    return "Great week of journaling! Keep it up! 🦆";
  }
}

module.exports = {
  analyzeJournalEntry,
  generateDailySummary,
  generateWeeklyInsights,
};