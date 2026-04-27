import { useState, useRef, useCallback } from 'react';
import api from '../lib/api';

/**
 * useLumi - Universal Lumi AI hook for conversation and saving
 * Lumi is a conversational companion first - she talks, asks questions, analyzes
 * Only after conversation does she help save things
 * 
 * @param {string} source - Where Lumi is being called from (dashboard, journal, budget, etc.)
 * @returns {object} Lumi states and functions
 */
export function useLumi(source = 'dashboard') {
  // States
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lumiResponse, setLumiResponse] = useState('');
  const [savedRoute, setSavedRoute] = useState(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingState, setPendingState] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null);

  // Refs for audio recording
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      audioChunks.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        sendVoice(audioBlob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please check permissions.');
      setIsListening(false);
    }
  }, []);

  /**
   * Stop listening and process audio
   */
  const stopListening = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsListening(false);
    }
  }, []);

  /**
   * Send text to Lumi for conversation
   * @param {string} text - User input text
   */
  const sendText = useCallback(
    async (text) => {
      if (!text.trim()) return;

      setIsThinking(true);
      setError(null);
      setTranscript(text);

      try {
        const response = await api.post('/lumi/message', {
          text: text.trim(),
          source,
        });

        setLumiResponse(response.data.message || "I'm here and listening.");
        setSavedRoute(response.data.route || null);
        setNeedsConfirmation(response.data.needsConfirmation || false);
        setPendingState(response.data.pendingState || null);

        // Add to conversation history
        setConversation((prev) => [
          ...prev,
          { role: 'user', content: text },
          { role: 'lumi', content: response.data.message },
        ]);

        setIsThinking(false);
      } catch (err) {
        console.error('Lumi text error:', err);
        setError(err.response?.data?.error || 'Failed to send message');
        setIsThinking(false);
      }
    },
    [source]
  );

  /**
   * Send voice audio to Lumi
   * @param {Blob} audioBlob - Recorded audio blob
   */
  const sendVoice = useCallback(
    async (audioBlob) => {
      setIsThinking(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('source', source);

        const response = await api.post('/lumi/voice', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setTranscript(response.data.transcript || '');
        setLumiResponse(response.data.message || "I'm here and listening.");
        setSavedRoute(response.data.route || null);
        setNeedsConfirmation(response.data.needsConfirmation || false);
        setPendingState(response.data.pendingState || null);

        // Add to conversation history
        setConversation((prev) => [
          ...prev,
          { role: 'user', content: response.data.transcript || '(voice)' },
          { role: 'lumi', content: response.data.message },
        ]);

        setIsThinking(false);
      } catch (err) {
        console.error('Lumi voice error:', err);
        setError(err.response?.data?.error || 'Failed to process voice');
        setIsThinking(false);
      }
    },
    [source]
  );

  /**
   * Confirm saving to a specific journal
   * @param {string} journalType - Type of journal to save to
   */
  const confirmSave = useCallback(
    async (journalType) => {
      if (!pendingState) return;

      setIsThinking(true);
      try {
        const response = await api.post('/lumi/confirm', {
          journalType: journalType || pendingState.suggestedJournal,
          content: pendingState.content,
          summary: pendingState.summary,
        });

        setLumiResponse(response.data.message);
        setSavedRoute(journalType || pendingState.suggestedJournal);
        setNeedsConfirmation(false);
        setPendingState(null);
        setIsThinking(false);
      } catch (err) {
        console.error('Confirm save error:', err);
        setError('Failed to save');
        setIsThinking(false);
      }
    },
    [pendingState]
  );

  /**
   * Decline saving (just continue conversation)
   */
  const declineSave = useCallback(() => {
    setNeedsConfirmation(false);
    setPendingState(null);
    setLumiResponse("No problem at all — our conversation stays between us. What else is on your mind?");
  }, []);

  /**
   * Clear all states
   */
  const clear = useCallback(() => {
    setTranscript('');
    setLumiResponse('');
    setSavedRoute(null);
    setNeedsConfirmation(false);
    setPendingState(null);
    setError(null);
    setIsListening(false);
    setIsThinking(false);
    setConversation([]);
    audioChunks.current = [];
  }, []);

  return {
    // States
    isListening,
    isThinking,
    transcript,
    lumiResponse,
    savedRoute,
    needsConfirmation,
    pendingState,
    conversation,
    error,
    // Functions
    startListening,
    stopListening,
    sendText,
    confirmSave,
    declineSave,
    clear,
  };
}

export default useLumi;
