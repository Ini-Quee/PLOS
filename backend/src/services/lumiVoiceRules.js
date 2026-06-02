const FORBIDDEN_REPLACEMENTS = [
  [/I understand how you feel/gi, 'I hear you'],
  [/Processing your request/gi, "I'm looking at that"],
  [/\bProcessing\b/gi, 'Looking at this'],
  [/\bError:\s*/gi, 'Hmm, '],
  [/\bYou failed\b/gi, "This hasn't landed yet"],
  [/\bYou should\b/gi, 'Want to'],
  [/\bdiagnosis\b/gi, 'pattern'],
];

function trimExcessQuestions(text) {
  const parts = String(text || '').split(/(?<=[?])/);
  let seenQuestion = false;
  return parts.map(part => {
    if (!part.includes('?')) return part;
    if (!seenQuestion) {
      seenQuestion = true;
      return part;
    }
    return part.replace(/[^.?!]*\?/g, '').trimStart();
  }).join('').replace(/\s{2,}/g, ' ').trim();
}

function softenPrescriptiveLanguage(text) {
  return String(text || '')
    .replace(/\bmust\b/gi, 'can')
    .replace(/\bhave to\b/gi, 'can')
    .replace(/\bneed to\b/gi, 'might want to')
    .replace(/\bjust\b\s+/gi, '');
}

function applyLumiVoice(rawResponse, emotionalContext = {}) {
  let refined = String(rawResponse || '').trim();
  if (!refined) return "I'm here. Tell me what's on your mind.";

  for (const [pattern, replacement] of FORBIDDEN_REPLACEMENTS) {
    refined = refined.replace(pattern, replacement);
  }

  refined = softenPrescriptiveLanguage(refined);
  refined = refined.replace(/\s+/g, ' ').trim();
  refined = trimExcessQuestions(refined);

  if (emotionalContext.primaryEmotion === 'anxiety' && !/^I hear you\b/i.test(refined)) {
    refined = `I hear you. ${refined}`;
  }

  return refined;
}

function buildPatternMessage(pattern) {
  const title = pattern?.pattern_title || pattern?.title || 'this';
  const evidence = pattern?.evidence || {};
  switch (pattern?.pattern_type || pattern?.type) {
    case 'stuck_task':
      return `I notice you've moved "${evidence.taskTitle || title}" ${evidence.count || 3} times. Is this still important, or should we let it go?`;
    case 'habit_gap':
      return `I noticed you haven't tracked "${evidence.habitTitle || title}" in a few days. Everything okay, or are you taking a break?`;
    case 'budget_spike':
      return `I see spending in ${evidence.category || title} is higher than usual this week. Want to look at what's happening?`;
    default:
      return `I noticed a pattern: ${pattern?.pattern_description || title}. Want to talk about it, or should I save it for later?`;
  }
}

module.exports = {
  applyLumiVoice,
  buildPatternMessage,
  trimExcessQuestions,
};
