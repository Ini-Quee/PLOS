/**
 * Lumi Listen — SpeechRecognition wrapper
 * Captures user speech using the browser's built-in SpeechRecognition API
 * Free, no external services required
 * Chrome/Edge only — Firefox/Safari will show text input fallback
 */

// Check if SpeechRecognition is available
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * Check if speech recognition is available
 */
export function isSpeechRecognitionAvailable() {
  return !!SpeechRecognition;
}

// Current listening state
let recognition = null;
let isListening = false;
let currentLanguage = 'en-US';

/**
 * Start listening for speech
 * @param {Object} callbacks — Event callbacks
 * @param {Object} options — Recognition options
 * @returns {Promise} — Resolves when recognition starts
 */
export function startListening(callbacks = {}, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionAvailable()) {
      reject(new Error('Speech recognition not available in this browser'));
      return;
    }

    // Stop any existing recognition
    stopListening();

    try {
      recognition = new SpeechRecognition();

      // Configure recognition
      recognition.continuous = options.continuous ?? true;
      recognition.interimResults = options.interimResults ?? true;
      recognition.lang = options.language ?? currentLanguage;
      recognition.maxAlternatives = options.maxAlternatives ?? 1;

      // Track accumulated transcript
      let finalTranscript = '';
      let interimTranscript = '';

      // Event handlers
      recognition.onstart = () => {
        isListening = true;
        finalTranscript = '';
        interimTranscript = '';
        if (callbacks.onStart) callbacks.onStart();
        resolve();
      };

      recognition.onresult = (event) => {
        interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (callbacks.onResult) {
          callbacks.onResult({
            final: finalTranscript.trim(),
            interim: interimTranscript,
            fullText: (finalTranscript + interimTranscript).trim(),
          });
        }
      };

      recognition.onerror = (event) => {
        const error = event.error;

        // Handle specific errors
        if (error === 'no-speech') {
          // No speech detected — not a critical error
          if (callbacks.onNoSpeech) callbacks.onNoSpeech();
          return;
        }

        if (error === 'audio-capture') {
          reject(new Error('No microphone found or microphone is not working'));
          return;
        }

        if (error === 'not-allowed') {
          reject(new Error('Microphone permission denied'));
          return;
        }

        if (error === 'network') {
          reject(new Error('Network error — check your connection'));
          return;
        }

        if (error === 'aborted') {
          // Recognition was aborted — not an error
          return;
        }

        reject(new Error(`Speech recognition error: ${error}`));
      };

      recognition.onend = () => {
        isListening = false;

        // If we have a final transcript, send it
        if (finalTranscript.trim() && callbacks.onEnd) {
          callbacks.onEnd({
            transcript: finalTranscript.trim(),
          });
        } else if (callbacks.onEnd) {
          callbacks.onEnd({ transcript: '' });
        }

        // Auto-restart if continuous mode
        if (options.continuous && !options.manualStop) {
          // Small delay before restarting
          setTimeout(() => {
            if (isListening) {
              try {
                recognition.start();
              } catch (e) {
                // Ignore restart errors
              }
            }
          }, 100);
        }
      };

      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stop listening
 */
export function stopListening() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Ignore stop errors
    }
    recognition = null;
  }
  isListening = false;
}

/**
 * Abort listening immediately
 */
export function abortListening() {
  if (recognition) {
    try {
      recognition.abort();
    } catch (e) {
      // Ignore abort errors
    }
    recognition = null;
  }
  isListening = false;
}

/**
 * Check if currently listening
 */
export function getIsListening() {
  return isListening;
}

/**
 * Set the recognition language
 * @param {string} language — BCP 47 language tag (e.g., 'en-US', 'en-GB')
 */
export function setLanguage(language) {
  currentLanguage = language;
}

/**
 * Get supported languages
 * Returns a list of commonly supported languages
 */
export function getSupportedLanguages() {
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'en-CA', name: 'English (Canada)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
  ];
}

/**
 * Request microphone permission
 * Useful to call early so the browser prompts the user
 */
export async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (error) {
    return { granted: false, error: error.message };
  }
}

/**
 * Simple listen for a single utterance
 * @param {number} timeout — Max time to listen in ms
 * @returns {Promise<string>} — Resolves with transcript
 */
export function listenOnce(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionAvailable()) {
      reject(new Error('Speech recognition not available'));
      return;
    }

    let transcript = '';
    let timeoutId = null;

    const callbacks = {
      onResult: ({ fullText }) => {
        transcript = fullText;
      },
      onEnd: ({ transcript: finalTranscript }) => {
        clearTimeout(timeoutId);
        stopListening();
        resolve(finalTranscript || transcript);
      },
    };

    startListening(callbacks, { continuous: false })
      .then(() => {
        timeoutId = setTimeout(() => {
          stopListening();
          resolve(transcript);
        }, timeout);
      })
      .catch(reject);
  });
}

/**
 * Voice command parser
 * Extracts commands from natural speech
 * @param {string} transcript — Raw speech transcript
 * @returns {Object} — Parsed command
 */
export function parseVoiceCommand(transcript) {
  const text = transcript.toLowerCase().trim();

  // Task completion patterns
  const donePatterns = [
    /i(?:'m| am)? done (?:with )?(.+)/i,
    /i (?:just )?finished (.+)/i,
    /completed (.+)/i,
    /done with (.+)/i,
  ];

  for (const pattern of donePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'task_complete',
        task: match[1].trim(),
        raw: transcript,
      };
    }
  }

  // Skip task patterns
  const skipPatterns = [
    /skip (.+)/i,
    /i(?:'m| am)? (?:gonna |going to )?skip (.+)/i,
    /pass on (.+)/i,
    /not (?:doing |gonna do )?(.+) (?:today|now)/i,
  ];

  for (const pattern of skipPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'task_skip',
        task: match[1].trim(),
        raw: transcript,
      };
    }
  }

  // Reminder patterns
  const reminderPatterns = [
    /remind me (?:tomorrow |later |to )?(.+)/i,
    /remind me (?:that )?(.+) tomorrow/i,
    /set a reminder (?:for )?(.+)/i,
  ];

  for (const pattern of reminderPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'reminder',
        reminder: match[1].trim(),
        raw: transcript,
      };
    }
  }

  // Schedule patterns
  const schedulePatterns = [
    /add (.+?) to my schedule(?: on)? (.+)/i,
    /schedule (.+?) for (.+)/i,
    /i have (.+?) (?:at|on) (.+)/i,
  ];

  for (const pattern of schedulePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'schedule_add',
        event: match[1].trim(),
        datetime: match[2].trim(),
        raw: transcript,
      };
    }
  }

  // Query patterns
  if (/what(?:'s| is) next/i.test(text)) {
    return { type: 'query_next', raw: transcript };
  }

  if (/how am i doing/i.test(text)) {
    return { type: 'query_progress', raw: transcript };
  }

  if (/what(?:'s| is) (?:on |my )?schedule/i.test(text)) {
    return { type: 'query_schedule', raw: transcript };
  }

  // Journal patterns
  if (/i want to (?:write |create )?(?:a )?journal/i.test(text) || /open (?:my )?journal/i.test(text)) {
    return { type: 'open_journal', raw: transcript };
  }

  // Affirmation patterns
  if (/read (?:me )?my affirmations/i.test(text)) {
    return { type: 'read_affirmations', raw: transcript };
  }

  // Book suggestion patterns
  if (/what (?:book|should i read)/i.test(text)) {
    return { type: 'suggest_book', raw: transcript };
  }

  // Emotion patterns
  const emotionMatch = text.match(/i feel (\w+)/i);
  if (emotionMatch) {
    return {
      type: 'emotion',
      emotion: emotionMatch[1],
      raw: transcript,
    };
  }

  // Default — just a message
  return {
    type: 'message',
    message: transcript,
    raw: transcript,
  };
}

/**
 * Initialize Lumi Listen
 * Call this when the app initializes
 */
export function initLumiListen() {
  if (!isSpeechRecognitionAvailable()) {
    console.warn('Speech recognition not available — will use text input fallback');
    return false;
  }

  return true;
}

export default {
  startListening,
  stopListening,
  abortListening,
  getIsListening,
  isSpeechRecognitionAvailable,
  setLanguage,
  getSupportedLanguages,
  requestMicrophonePermission,
  listenOnce,
  parseVoiceCommand,
  initLumiListen,
};
