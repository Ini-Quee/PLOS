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

// Recording configuration
const MAX_RECORDING_DURATION = 5 * 60 * 1000; // 5 minutes max
const SILENCE_TIMEOUT = 4000; // 4 seconds of silence before auto-stop

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

      // Configure recognition - IMPROVED: continuous mode with longer timeout
      recognition.continuous = true; // Keep listening until manually stopped
      recognition.interimResults = options.interimResults ?? true;
      recognition.lang = options.language ?? currentLanguage;
      recognition.maxAlternatives = options.maxAlternatives ?? 1;

      // Track accumulated transcript
      let finalTranscript = '';
      let interimTranscript = '';
      let silenceTimer = null;
      let maxDurationTimer = null;
      let lastSpeechTime = Date.now();

      // Clear any existing timers
      const clearTimers = () => {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        if (maxDurationTimer) {
          clearTimeout(maxDurationTimer);
          maxDurationTimer = null;
        }
      };

      // Reset silence timer when speech is detected
      const resetSilenceTimer = () => {
        lastSpeechTime = Date.now();
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }
        silenceTimer = setTimeout(() => {
          // 4 seconds of silence - stop recording
          if (isListening && finalTranscript.trim()) {
            stopListening();
            if (callbacks.onSilenceTimeout) {
              callbacks.onSilenceTimeout(finalTranscript.trim());
            }
          }
        }, SILENCE_TIMEOUT);
      };

      // Event handlers
      recognition.onstart = () => {
        isListening = true;
        finalTranscript = '';
        interimTranscript = '';
        lastSpeechTime = Date.now();
        
        // Start silence detection timer
        resetSilenceTimer();
        
        // Set maximum duration timer (5 minutes safety limit)
        maxDurationTimer = setTimeout(() => {
          if (isListening) {
            stopListening();
            if (callbacks.onMaxDurationReached) {
              callbacks.onMaxDurationReached(finalTranscript.trim());
            }
          }
        }, MAX_RECORDING_DURATION);
        
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

        // Reset silence timer on any speech
        if (interimTranscript || finalTranscript) {
          resetSilenceTimer();
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
          // No speech detected — not a critical error during recording
          if (callbacks.onNoSpeech) callbacks.onNoSpeech();
          return;
        }

        if (error === 'audio-capture') {
          clearTimers();
          reject(new Error('No microphone found or microphone is not working'));
          return;
        }

        if (error === 'not-allowed') {
          clearTimers();
          reject(new Error('Microphone permission denied'));
          return;
        }

        if (error === 'network') {
          clearTimers();
          reject(new Error('Network error — check your connection'));
          return;
        }

        if (error === 'aborted') {
          // Recognition was aborted — not an error
          clearTimers();
          return;
        }

        // For other errors, try to continue if we have content
        if (error === 'network' || error === 'no-speech') {
          // Try to recover - don't reject immediately
          if (finalTranscript.trim()) {
            // We have content, continue recording
            return;
          }
        }

        clearTimers();
        reject(new Error(`Speech recognition error: ${error}`));
      };

      recognition.onend = () => {
        clearTimers();
        isListening = false;

        // If we have a final transcript, send it
        if (finalTranscript.trim() && callbacks.onEnd) {
          callbacks.onEnd({
            transcript: finalTranscript.trim(),
          });
        } else if (callbacks.onEnd) {
          callbacks.onEnd({ transcript: '' });
        }
      };

      recognition.start();
    } catch (error) {
      clearTimers();
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
  initLumiListen,
};
