const EMOTION_MARKERS = {
  anxiety: ['anxious', 'worried', 'panic', 'stressed', 'stress', 'overwhelmed', 'nervous', 'afraid'],
  exhaustion: ['tired', 'exhausted', 'drained', 'burnt out', 'burned out', 'worn out', "can't even"],
  frustration: ['frustrated', 'annoyed', 'stuck', "can't", 'blocked', 'irritated'],
  hope: ['hopeful', 'excited', 'looking forward', 'trying', 'ready', 'proud', 'grateful'],
  guilt: ['should have', 'failed', 'behind', 'lazy', 'messed up', 'my fault', 'guilty'],
};

const CRISIS_PATTERNS = [
  /\b(kill myself|end my life|suicide|suicidal)\b/i,
  /\b(don't want to live|do not want to live|no reason to live)\b/i,
  /\b(nothing matters|i don't see the point anymore|i do not see the point anymore)\b/i,
  /\b(hurt myself|harm myself|self[-\s]?harm)\b/i,
];

function countMatches(text, markers) {
  const lower = String(text || '').toLowerCase();
  return markers.reduce((count, marker) => count + (lower.includes(marker) ? 1 : 0), 0);
}

function detectPrimaryEmotion(text) {
  let best = { emotion: 'neutral', score: 0 };
  for (const [emotion, markers] of Object.entries(EMOTION_MARKERS)) {
    const score = countMatches(text, markers);
    if (score > best.score) best = { emotion, score };
  }
  return best.emotion;
}

function calculateIntensity(text) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  let score = 1;
  if (/[!]{2,}/.test(raw)) score += 1;
  if (/\b(very|really|so|extremely|completely|totally)\b/i.test(raw)) score += 1;
  if (/\b(overwhelmed|panic|exhausted|can't even|nothing matters)\b/i.test(lower)) score += 1;
  return Math.min(5, score);
}

function isCrisisSignal(text) {
  return CRISIS_PATTERNS.some(pattern => pattern.test(String(text || '')));
}

function determineResponseStyle(primaryEmotion, intensity) {
  if (primaryEmotion === 'neutral') return 'acknowledge';
  if (intensity >= 4) return 'validate';
  if (['anxiety', 'exhaustion', 'guilt'].includes(primaryEmotion)) return 'ground';
  return 'explore';
}

function analyzeEmotionalContext(userInput, conversationHistory = []) {
  const primaryEmotion = detectPrimaryEmotion(userInput);
  const intensity = calculateIntensity(userInput);
  const crisis = isCrisisSignal(userInput);
  return {
    primaryEmotion: crisis ? 'crisis' : primaryEmotion,
    intensity,
    crisis,
    responseStyle: crisis ? 'redirect' : determineResponseStyle(primaryEmotion, intensity),
    recentTone: Array.isArray(conversationHistory) && conversationHistory.length ? 'ongoing' : 'new',
  };
}

function createCrisisResponse() {
  return [
    "I hear you, and I'm concerned.",
    "What you're feeling sounds really heavy, and I'm not equipped to handle this alone.",
    "Please reach out to someone you trust right now, or contact a local crisis line or emergency service if you might hurt yourself.",
    "Can you message or call someone nearby?"
  ].join(' ');
}

module.exports = {
  EMOTION_MARKERS,
  analyzeEmotionalContext,
  calculateIntensity,
  createCrisisResponse,
  detectPrimaryEmotion,
  isCrisisSignal,
};
