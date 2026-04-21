/**
 * Lumi Voice — SpeechSynthesis wrapper
 * Makes Lumi speak text using the browser's built-in SpeechSynthesis API
 * Free, no external services required
 */

// Default voice settings - IMPROVED: warmer, clearer
const DEFAULT_SETTINGS = {
  rate: 0.9,  // Slightly slower = clearer
  pitch: 1.1, // Slightly higher = warmer
  volume: 1.0, // Full volume
};

// Available voices cache
let cachedVoices = [];
let voiceLoadPromise = null;

/**
 * Load and cache available voices
 * Browsers load voices asynchronously, so we need to wait
 */
export function loadVoices() {
  if (voiceLoadPromise) return voiceLoadPromise;

  voiceLoadPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;

    // Get voices immediately if already loaded
    cachedVoices = synth.getVoices();

    if (cachedVoices.length > 0) {
      resolve(cachedVoices);
      return;
    }

    // Wait for voices to load
    const handleVoicesChanged = () => {
      cachedVoices = synth.getVoices();
      resolve(cachedVoices);
      synth.removeEventListener('voiceschanged', handleVoicesChanged);
    };

    synth.addEventListener('voiceschanged', handleVoicesChanged);

    // Timeout fallback after 3 seconds
    setTimeout(() => {
      cachedVoices = synth.getVoices();
      if (cachedVoices.length > 0) {
        resolve(cachedVoices);
      }
    }, 3000);
  });

  return voiceLoadPromise;
}

/**
 * Get the best voice for Lumi
 * Prefers: Google UK English Female, Microsoft Zira, Samantha, then any English female
 */
export function getBestVoice(preferredVoiceName = null) {
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }

  if (preferredVoiceName) {
    const preferred = cachedVoices.find(v =>
      v.name.toLowerCase().includes(preferredVoiceName.toLowerCase())
    );
    if (preferred) return preferred;
  }

  // Priority order for Lumi's voice - prioritize female voices
  const preferredVoices = [
    'Google UK English Female',
    'Samantha',
    'Microsoft Zira',
    'Microsoft Zira Desktop',
    'Victoria',
    'Google US English',
    'Alex',
  ];

  for (const name of preferredVoices) {
    const voice = cachedVoices.find(v => v.name.includes(name));
    if (voice) return voice;
  }

  // Fallback to any English voice
  const englishVoice = cachedVoices.find(v => v.lang.startsWith('en'));
  if (englishVoice) return englishVoice;

  // Last resort — first available voice
  return cachedVoices[0] || null;
}

/**
 * Get all available voices
 */
export function getAvailableVoices() {
  return cachedVoices.length > 0
    ? cachedVoices
    : window.speechSynthesis.getVoices();
}

/**
 * Check if speech synthesis is available
 */
export function isSpeechSynthesisAvailable() {
  return 'speechSynthesis' in window;
}

// Current speaking state
let currentUtterance = null;
let isSpeaking = false;

/**
 * Speak text as Lumi
 * @param {string} text — The text to speak
 * @param {Object} options — Voice options
 * @returns {Promise} — Resolves when speaking finishes
 */
export function speak(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisAvailable()) {
      reject(new Error('Speech synthesis not available'));
      return;
    }

    const synth = window.speechSynthesis;

    // Cancel any current speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const settings = { ...DEFAULT_SETTINGS, ...options };

    // Set voice
    const voice = getBestVoice(options.voiceName);
    if (voice) {
      utterance.voice = voice;
    }

    // Apply settings
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Event handlers
    utterance.onstart = () => {
      isSpeaking = true;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      isSpeaking = false;
      currentUtterance = null;
      if (options.onEnd) options.onEnd();
      resolve();
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      currentUtterance = null;
      if (options.onError) options.onError(event);
      reject(event);
    };

    utterance.onpause = () => {
      if (options.onPause) options.onPause();
    };

    utterance.onresume = () => {
      if (options.onResume) options.onResume();
    };

    currentUtterance = utterance;
    synth.speak(utterance);
  });
}

/**
 * Speak response with status tracking
 * This is the main function to use when Lumi responds to user
 * @param {string} text — The text to speak
 * @param {Object} callbacks — Callbacks for status tracking
 * @returns {Promise}
 */
export function speakResponse(text, callbacks = {}) {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisAvailable()) {
      // Just show text if speech not available
      if (callbacks.onStart) callbacks.onStart();
      if (callbacks.onEnd) callbacks.onEnd();
      resolve();
      return;
    }

    // Cancel any current speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice();
    
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = DEFAULT_SETTINGS.rate;
    utterance.pitch = DEFAULT_SETTINGS.pitch;
    utterance.volume = DEFAULT_SETTINGS.volume;

    utterance.onstart = () => {
      isSpeaking = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    utterance.onend = () => {
      isSpeaking = false;
      currentUtterance = null;
      if (callbacks.onEnd) callbacks.onEnd();
      resolve();
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      currentUtterance = null;
      if (callbacks.onError) callbacks.onError(event);
      // Don't reject on error - just continue
      resolve();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop speaking
 */
export function stop() {
  if (!isSpeechSynthesisAvailable()) return;

  const synth = window.speechSynthesis;

  if (synth.speaking) {
    synth.cancel();
  }

  isSpeaking = false;
  currentUtterance = null;
}

/**
 * Pause speaking
 */
export function pause() {
  if (!isSpeechSynthesisAvailable()) return;
  window.speechSynthesis.pause();
}

/**
 * Resume speaking
 */
export function resume() {
  if (!isSpeechSynthesisAvailable()) return;
  window.speechSynthesis.resume();
}

/**
 * Check if currently speaking
 */
export function getIsSpeaking() {
  return isSpeaking && window.speechSynthesis?.speaking;
}

/**
 * Pre-load voices on app startup
 * Call this when the app initializes
 */
export async function initLumiVoice() {
  if (!isSpeechSynthesisAvailable()) {
    console.warn('Speech synthesis not available in this browser');
    return false;
  }

  await loadVoices();
  return true;
}

/**
 * Generate morning greeting text
 * @param {string} name — User's name
 * @param {Array} tasks — Today's tasks
 * @returns {string} — Greeting text
 */
export function generateMorningGreeting(name, tasks = []) {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  let greeting = `Good morning ${name}. Today is ${dateString}. `;

  if (tasks.length === 0) {
    greeting += "You have a clean slate today. What would you like to focus on?";
  } else {
    greeting += `You have ${tasks.length} thing${tasks.length > 1 ? 's' : ''} planned. `;
    const firstTask = tasks[0];
    greeting += `Let's start with ${firstTask.title}. `;
    if (firstTask.time) {
      greeting += `You said ${firstTask.time}. `;
    }
    greeting += "Ready to go?";
  }

  return greeting;
}

/**
 * Generate task completion celebration
 * @param {string} taskTitle — Completed task title
 * @param {number} streak — Current streak
 * @returns {string} — Celebration text
 */
export function generateTaskCelebration(taskTitle, streak = 0) {
  const celebrations = [
    `Great job completing ${taskTitle}.`,
    `${taskTitle} — done. That's one more win.`,
    `You finished ${taskTitle}. Keep the momentum going.`,
  ];

  let text = celebrations[Math.floor(Math.random() * celebrations.length)];

  if (streak > 1) {
    text += ` That's ${streak} days in a row.`;
  }

  return text;
}

/**
 * Generate accountability message for missed tasks
 * @param {string} taskTitle — Missed task
 * @param {number} missedCount — Consecutive misses
 * @returns {string} — Accountability text
 */
export function generateAccountabilityMessage(taskTitle, missedCount) {
  if (missedCount === 1) {
    return `You missed ${taskTitle} today. That's okay — one day doesn't break the chain. What's the plan for tomorrow?`;
  }

  return `Hey. You said you wouldn't skip ${taskTitle} twice in a row. Today makes ${missedCount}. What happened? Do you want to talk about it or reschedule?`;
}

export default {
  speak,
  speakResponse,
  stop,
  pause,
  resume,
  getIsSpeaking,
  loadVoices,
  getBestVoice,
  getAvailableVoices,
  isSpeechSynthesisAvailable,
  initLumiVoice,
  generateMorningGreeting,
  generateTaskCelebration,
  generateAccountabilityMessage,
};
