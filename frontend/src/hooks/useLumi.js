import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../lib/api';

// ─── Global event bus so Lumi can signal any page to refresh ─────────────────
export function emitLumiRefresh(sections) {
  window.dispatchEvent(new CustomEvent('lumi-refresh', { detail: { sections } }));
}

export function useLumiRefresh(sections, callback) {
  useEffect(() => {
    function handler(e) {
      const refreshed = e.detail?.sections || [];
      if (sections.some(s => refreshed.includes(s))) callback();
    }
    window.addEventListener('lumi-refresh', handler);
    return () => window.removeEventListener('lumi-refresh', handler);
  }, [sections, callback]);
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useLumi(source = 'dashboard') {
  const [isListening,  setIsListening]  = useState(false);
  const [isThinking,   setIsThinking]   = useState(false);
  const [lumiResponse, setLumiResponse] = useState('');
  const [savedRoute,   setSavedRoute]   = useState(null);
  const [conversation, setConversation] = useState([]);
  const [error,        setError]        = useState(null);

  // Confirmation flow states
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingState,      setPendingState]      = useState(null);

  // Orchestration states — cross-app action proposals
  const [pendingActions,   setPendingActions]   = useState(null);  // { lumiMessage, confirmPrompt, actions, needsJournalConfirmation, journalDraft }
  const [isExecuting,      setIsExecuting]      = useState(false);
  const [achievements,     setAchievements]     = useState([]);    // unlocked goals

  // Post-completion follow-up states
  const [completionFollowUp, setCompletionFollowUp] = useState(null); // { followUp, quickPrompts, scheduleTitle }

  const mediaRecorder  = useRef(null);
  const audioChunks    = useRef([]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    try {
      setError(null);
      audioChunks.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        sendVoice(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (err) {
      setError('Microphone access denied.');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
      setIsListening(false);
    }
  }, []);

  // ── Text message (conversation mode) ─────────────────────────────────────
  const sendText = useCallback(async (text) => {
    if (!text.trim()) return;
    setIsThinking(true);
    setError(null);
    try {
      const res = await api.post('/lumi/message', { text: text.trim(), source });
      setLumiResponse(res.data.message || "I'm here.");
      setSavedRoute(res.data.route || null);
      setNeedsConfirmation(res.data.needsConfirmation || false);
      setPendingState(res.data.pendingState || null);
      setConversation(prev => [...prev,
        { role: 'user',  content: text },
        { role: 'lumi',  content: res.data.message },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reach Lumi');
    } finally {
      setIsThinking(false);
    }
  }, [source]);

  // ── Voice message ─────────────────────────────────────────────────────────
  const sendVoice = useCallback(async (blob) => {
    setIsThinking(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('audio', blob, 'recording.webm');
      form.append('source', source);
      const res = await api.post('/lumi/voice', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLumiResponse(res.data.message || "I'm here.");
      setSavedRoute(res.data.route || null);
      setNeedsConfirmation(res.data.needsConfirmation || false);
      setPendingState(res.data.pendingState || null);
      setConversation(prev => [...prev,
        { role: 'user', content: res.data.transcript || '(voice)' },
        { role: 'lumi', content: res.data.message },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Voice processing failed');
    } finally {
      setIsThinking(false);
    }
  }, [source]);

  // ── Plan mode — Lumi proposes cross-app actions, shows them for review ────
  const askLumiToPlan = useCallback(async (text) => {
    if (!text.trim()) return;
    setIsThinking(true);
    setError(null);
    setPendingActions(null);
    try {
      const res = await api.post('/lumi/plan', { text: text.trim(), source });
      setPendingActions({
        lumiMessage:             res.data.lumiMessage,
        confirmPrompt:           res.data.confirmPrompt,
        actions:                 res.data.actions || [],
        needsJournalConfirmation: res.data.needsJournalConfirmation || false,
        journalDraft:            res.data.journalDraft || null,
      });
      setConversation(prev => [...prev,
        { role: 'user', content: text },
        { role: 'lumi', content: res.data.lumiMessage },
      ]);
    } catch (err) {
      setError('Could not build plan right now.');
    } finally {
      setIsThinking(false);
    }
  }, [source]);

  // ── Execute confirmed actions ─────────────────────────────────────────────
  const executeActions = useCallback(async (actions) => {
    if (!actions?.length) return;
    setIsExecuting(true);
    setError(null);
    try {
      const res = await api.post('/lumi/execute', { actions });
      setLumiResponse(res.data.summaryMessage || 'Done!');
      setPendingActions(null);

      // Announce achievements (unlocked goals)
      if (res.data.achievements?.length) {
        setAchievements(res.data.achievements);
      }

      // Signal relevant pages to refresh their data
      if (res.data.refresh?.length) {
        emitLumiRefresh(res.data.refresh);
      }

      return res.data;
    } catch (err) {
      setError('Execution failed. Your data is safe.');
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const confirmActions  = useCallback(() => executeActions(pendingActions?.actions), [pendingActions, executeActions]);
  const dismissActions  = useCallback(() => setPendingActions(null), []);
  const dismissAchievement = useCallback(() => setAchievements([]), []);

  // ── Mark a task complete + get Lumi follow-up ─────────────────────────────
  const completeTask = useCallback(async ({ scheduleId, title, category }) => {
    try {
      const res = await api.post('/lumi/complete-task', {
        schedule_id: scheduleId,
        title,
        category,
      });
      setCompletionFollowUp({
        followUp:    res.data.followUp,
        quickPrompts: res.data.quickPrompts,
        title,
        category,
      });
      emitLumiRefresh(['schedule']);
    } catch {
      // Silently ignore — completion still happened
    }
  }, []);

  const dismissCompletionFollowUp = useCallback(() => setCompletionFollowUp(null), []);

  // ── Journal confirmation (legacy) ─────────────────────────────────────────
  const confirmSave = useCallback(async (journalType) => {
    if (!pendingState) return;
    setIsThinking(true);
    try {
      const res = await api.post('/lumi/confirm', {
        journalType: journalType || pendingState.suggestedJournal,
        content: pendingState.content,
        summary: pendingState.summary,
      });
      setLumiResponse(res.data.message);
      setSavedRoute(journalType || pendingState.suggestedJournal);
      setNeedsConfirmation(false);
      setPendingState(null);
      emitLumiRefresh(['journal']);
    } catch {
      setError('Failed to save');
    } finally {
      setIsThinking(false);
    }
  }, [pendingState]);

  const declineSave = useCallback(() => {
    setNeedsConfirmation(false);
    setPendingState(null);
    setLumiResponse("No problem — stays between us. What else is on your mind?");
  }, []);

  const clear = useCallback(() => {
    setLumiResponse('');
    setSavedRoute(null);
    setNeedsConfirmation(false);
    setPendingState(null);
    setPendingActions(null);
    setAchievements([]);
    setCompletionFollowUp(null);
    setError(null);
    setIsListening(false);
    setIsThinking(false);
    setConversation([]);
    audioChunks.current = [];
  }, []);

  return {
    // Base states
    isListening, isThinking, isExecuting,
    lumiResponse, savedRoute, conversation, error,
    // Journal confirmation
    needsConfirmation, pendingState,
    // Cross-app orchestration
    pendingActions, achievements,
    // Post-completion follow-up
    completionFollowUp,
    // Functions
    startListening, stopListening,
    sendText, sendVoice,
    askLumiToPlan,
    confirmActions, dismissActions,
    executeActions,
    dismissAchievement,
    completeTask, dismissCompletionFollowUp,
    confirmSave, declineSave,
    clear,
  };
}

export default useLumi;
