import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import LumiOrb from '../components/lumi/LumiOrb';
import * as lumiVoice from '../lib/lumi-voice';
import * as lumiListen from '../lib/lumi-listen';
import api from '../lib/api';

/**
 * TalkToLumi — Full voice + text AI companion
 * Voice mic, speech synthesis, text input, backend save routing
 */
export default function TalkToLumi() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const aiName = localStorage.getItem('lumi_name') || 'Lumi';

  // Core state
  const [lumiState, setLumiState]     = useState('idle'); // idle | listening | processing | speaking
  const [transcript, setTranscript]   = useState('');
  const [lumiMessage, setLumiMessage] = useState('');
  const [isMuted, setIsMuted]         = useState(false);
  const [showText, setShowText]       = useState(false);
  const [textInput, setTextInput]     = useState('');
  const [error, setError]             = useState('');
  const [pendingState, setPending]          = useState(null);
  const [pendingJournalPage, setPendingJournalPage] = useState(null);
  const [planDraft, setPlanDraft]           = useState(null);
  const [lifeAudit, setLifeAudit]           = useState(null);
  const [showClaudePanel, setShowClaudePanel] = useState(false);
  const [importText, setImportText]         = useState('');
  const [importBlocks, setImportBlocks]     = useState(null);
  const [pendingEmail, setPendingEmail]     = useState(null);    // email preview state
  const [memoryCount, setMemoryCount]       = useState(0);

  // Context
  const [tasks, setTasks]           = useState([]);
  const [recentJournal, setRecent]  = useState('');

  // Conversation history (persisted in sessionStorage)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lumi_conv') || '[]'); } catch { return []; }
  });

  // Refs for guard flags
  const speakingRef    = useRef(false);
  const listeningRef   = useRef(false);
  const processingRef  = useRef(false);
  const bottomRef      = useRef(null);
  const textRef        = useRef(null);
  const hasGreetedRef  = useRef(false);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    lumiVoice.initLumiVoice();
    lumiListen.initLumiListen();
    fetchContext();
    api.get('/lumi/memories').then(r => setMemoryCount(r.data?.memories?.length || 0)).catch(() => {});

    if (history.length === 0 && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      setTimeout(() => greet(), 800);
    }

    return () => {
      lumiVoice.stop();
      lumiListen.stopListening();
    };
  }, []);

  // Persist history
  useEffect(() => {
    try { sessionStorage.setItem('lumi_conv', JSON.stringify(history.slice(-40))); } catch {}
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, lumiMessage]);

  // ── Context fetch ─────────────────────────────────────────────────────────────
  async function fetchContext() {
    try {
      const [schedRes, journRes] = await Promise.all([
        api.get('/schedule/today').catch(() => ({ data: { schedules: [] } })),
        api.get('/journal/entries?limit=1').catch(() => ({ data: { entries: [] } })),
      ]);
      setTasks(schedRes.data?.schedules?.slice(0, 5) || []);
      const entries = journRes.data?.entries || [];
      if (entries.length > 0) {
        setRecent(`Last entry on ${new Date(entries[0].recorded_at).toLocaleDateString()}`);
      }
    } catch {}
  }

  // ── Greeting ──────────────────────────────────────────────────────────────────
  async function greet() {
    if (speakingRef.current || processingRef.current) return;
    const hour = new Date().getHours();
    const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = user?.name?.split(' ')[0] || 'there';

    // If Lumi has memories, ask backend to generate a personalised greeting
    try {
      const memoriesRes = await api.get('/lumi/memories');
      const storedMemories = memoriesRes.data?.memories || [];
      if (storedMemories.length > 0) {
        setMemoryCount(storedMemories.length);
        const res = await api.post('/lumi/message', {
          text: `Greet me warmly with "${time}, ${name}". Reference one specific thing you remember about me — a goal, fear, or pattern. Keep it short, one sentence max after the greeting. Don't list everything you know.`,
          source: 'greeting',
        });
        if (res.data?.message) { await speak(res.data.message); return; }
      }
    } catch {}

    // Fallback to generic greeting
    const msg = `${time}, ${name}! I'm ${aiName}. I can help you plan your day, log expenses, write journal entries, and more. What's on your mind?`;
    await speak(msg);
  }

  // ── Core speak helper ──────────────────────────────────────────────────────────
  async function speak(text) {
    setLumiMessage(text);
    setLumiState('speaking');
    speakingRef.current = true;

    if (!isMuted) {
      await lumiVoice.speakResponse(text, {
        onStart: () => setLumiState('speaking'),
        onEnd:   () => { speakingRef.current = false; setLumiState('idle'); },
        onError: () => { speakingRef.current = false; setLumiState('idle'); },
      });
    } else {
      speakingRef.current = false;
      setLumiState('idle');
    }
  }

  // ── Handle any message (voice or text) ────────────────────────────────────────
  // ── Plan interview answer handler ─────────────────────────────────────────────
  const handlePlanAnswer = useCallback(async (answer) => {
    if (processingRef.current || !planDraft) return;
    processingRef.current = true;
    setLumiState('processing');

    const userMsg = { role: 'user', content: answer, timestamp: new Date().toISOString() };
    setHistory(prev => [...prev.slice(-18), userMsg]);

    try {
      const res = await api.patch('/lumi/plan-interview', { planDraft, answer });
      const data = res.data;
      setPlanDraft({ ...data.planDraft, done: data.done || false });

      let aiText = data.message || '';

      if (data.done) {
        // Show final plan + "Create Schedule" CTA in the message
        const schedule = data.planDraft?.defaultSchedule || [];
        const scheduleLines = schedule.map(s => `• ${s.day} ${s.time} — ${s.focus} (${s.duration} min)`).join('\n');
        aiText += `\n\nYour personalised plan:\n${scheduleLines}\n\nTap "Create Schedule" to add this to your planner.`;
      }

      const aiMsg = { role: 'model', content: aiText, timestamp: new Date().toISOString() };
      setHistory(prev => [...prev, aiMsg]);
      processingRef.current = false;
      await speak(aiText);
    } catch {
      processingRef.current = false;
      setPlanDraft(null);
      await speak("I had trouble with that. Want to try setting up your plan again?");
    }
  }, [planDraft, speak]);

  // ── Confirm and create the recurring schedule ─────────────────────────────────
  const createRecurringSchedule = useCallback(async () => {
    if (!planDraft?.defaultSchedule?.length) return;
    processingRef.current = true;
    setLumiState('processing');

    try {
      const blocks = planDraft.defaultSchedule.map(s => ({
        title: `${planDraft.activity.charAt(0).toUpperCase() + planDraft.activity.slice(1)} — ${s.focus}`,
        description: s.description || s.focus,
        start_time: s.time || '07:00',
        duration_minutes: s.duration || 45,
        repeat_pattern: 'weekly',
        repeat_days: [s.dayNum ?? 1],
        category: s.category || planDraft.category || 'wellness',
        colour: '#00d4aa',
      }));

      await api.post('/lumi/execute', { actions: [{ type: 'create_schedule_batch', payload: { blocks } }] });

      setPlanDraft(null);
      const msg = `Done! I've added ${blocks.length} ${planDraft.activity} sessions to your weekly planner. You'll see them in your schedule. 💪`;
      const aiMsg = { role: 'model', content: msg, timestamp: new Date().toISOString(), saved: true,
        savedItems: blocks.map(b => ({ label: b.title, destination: 'Planner' })) };
      setHistory(prev => [...prev, aiMsg]);
      processingRef.current = false;
      await speak(msg);
    } catch {
      processingRef.current = false;
      await speak("I couldn't create the schedule. Want to try again?");
    }
  }, [planDraft, speak]);

  // ── Life audit answer handler ─────────────────────────────────────────────────
  const handleLifeAuditAnswer = useCallback(async (answer) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLumiState('processing');

    const userMsg = { role: 'user', content: answer, timestamp: new Date().toISOString() };
    setHistory(prev => [...prev.slice(-30), userMsg]);

    try {
      const res = await api.post('/lumi/life-audit/answer', { answer });
      const data = res.data;

      let aiText = '';
      if (data.ack) aiText += data.ack + ' ';
      if (data.newCategory) aiText += `\n\n${data.newCategory.emoji} Now let's talk about your ${data.newCategory.label.toLowerCase()}.\n\n`;
      if (data.currentQuestion) aiText += data.currentQuestion.question;
      if (data.status === 'complete') {
        aiText = data.message;
        setLifeAudit({ ...lifeAudit, done: true, schedule: data.schedule, timeAudit: data.timeAudit });
      } else {
        setLifeAudit(prev => ({ ...prev, progress: data.progress, currentQuestion: data.currentQuestion }));
      }

      const progress = data.progress;
      const aiMsg = {
        role: 'model', content: aiText.trim(), timestamp: new Date().toISOString(),
        progress: progress ? `${progress.pct}% complete` : null,
      };
      setHistory(prev => [...prev, aiMsg]);
      processingRef.current = false;
      await speak(aiText.trim());
    } catch {
      processingRef.current = false;
      await speak("I had trouble with that answer. Could you say it again?");
    }
  }, [lifeAudit, speak]);

  // ── Start life audit ──────────────────────────────────────────────────────────
  const startLifeAudit = useCallback(async (restart = false) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLumiState('processing');

    try {
      const res = await api.post('/lumi/life-audit/start', { restart });
      const data = res.data;
      setLifeAudit({ active: true, done: data.status === 'complete', progress: data.progress, currentQuestion: data.currentQuestion, schedule: data.schedule || [] });

      const intro = data.message + (data.currentQuestion ? `\n\n${data.currentQuestion.question}` : '');
      const aiMsg = { role: 'model', content: intro, timestamp: new Date().toISOString() };
      setHistory(prev => [...prev, aiMsg]);
      processingRef.current = false;
      await speak(intro);
    } catch {
      processingRef.current = false;
      await speak("I couldn't start the life planning session. Are you connected to the internet?");
    }
  }, [speak]);

  // ── Confirm life audit schedule ───────────────────────────────────────────────
  const confirmLifeAuditSchedule = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLumiState('processing');

    try {
      const res = await api.post('/lumi/life-audit/confirm', {});
      const data = res.data;
      setLifeAudit(null);
      // Refresh memory count — life audit completion triggers memory extraction on backend
      setTimeout(() => {
        api.get('/lumi/memories').then(r => setMemoryCount(r.data?.memories?.length || 0)).catch(() => {});
      }, 4000);
      const aiMsg = { role: 'model', content: data.message, timestamp: new Date().toISOString(), saved: true,
        savedItems: [{ label: `${data.created} schedule entries`, destination: 'Planner' }] };
      setHistory(prev => [...prev, aiMsg]);
      processingRef.current = false;
      await speak(data.message);
    } catch {
      processingRef.current = false;
      await speak("I couldn't save the schedule. Please try again.");
    }
  }, [speak]);

  // ── Import plan from pasted text ──────────────────────────────────────────────
  const importPlan = useCallback(async () => {
    if (!importText.trim() || processingRef.current) return;
    processingRef.current = true;
    setLumiState('processing');

    try {
      const res = await api.post('/lumi/life-audit/import-plan', { text: importText });
      const data = res.data;
      if (data.success && data.blocks?.length) {
        setImportBlocks(data.blocks);
      }
      processingRef.current = false;
      const aiMsg = { role: 'model', content: data.message, timestamp: new Date().toISOString() };
      setHistory(prev => [...prev, aiMsg]);
      await speak(data.message);
    } catch {
      processingRef.current = false;
      await speak("I couldn't parse that plan. Could you paste it in a different format?");
    }
  }, [importText, speak]);

  const confirmImportedPlan = useCallback(async () => {
    if (!importBlocks?.length || processingRef.current) return;
    processingRef.current = true;
    setLumiState('processing');

    try {
      await api.post('/lumi/execute', { actions: [{ type: 'create_schedule_batch', payload: { blocks: importBlocks } }] });
      setImportBlocks(null);
      setImportText('');
      setShowClaudePanel(false);
      const msg = `Done! I've added ${importBlocks.length} entries from your plan to the planner. 🎉`;
      const aiMsg = { role: 'model', content: msg, timestamp: new Date().toISOString(), saved: true,
        savedItems: importBlocks.slice(0, 5).map(b => ({ label: b.title, destination: 'Planner' })) };
      setHistory(prev => [...prev, aiMsg]);
      processingRef.current = false;
      await speak(msg);
    } catch {
      processingRef.current = false;
      await speak("I couldn't import the schedule. Please try again.");
    }
  }, [importBlocks, speak]);

  // ── Email preview confirm ─────────────────────────────────────────────────────
  async function confirmSendEmail(yes) {
    if (!pendingEmail) return;
    const pe = pendingEmail;
    setPendingEmail(null);

    if (!yes) {
      const aiMsg = { role: 'model', content: "No problem — I won't send that email.", timestamp: new Date().toISOString() };
      setHistory(prev => [...prev, aiMsg]);
      await speak(aiMsg.content);
      return;
    }

    try {
      processingRef.current = true;
      setLumiState('processing');
      const res = await api.post('/gmail/send', pe);
      processingRef.current = false;
      const msg = res.data.message || `Email sent to ${pe.to} ✓`;
      const aiMsg = { role: 'model', content: msg, timestamp: new Date().toISOString(), saved: true,
        savedItems: [{ label: `Email to ${pe.to}`, destination: 'Gmail' }] };
      setHistory(prev => [...prev, aiMsg]);
      await speak(msg);
    } catch (err) {
      processingRef.current = false;
      const errMsg = err.response?.data?.error || "I couldn't send that email. Check your Google account is connected in Settings.";
      await speak(errMsg);
    }
  }

  const handleMessage = useCallback(async (message) => {
    // If life audit is active and not done, route as audit answer
    if (lifeAudit?.active && !lifeAudit?.done) {
      return handleLifeAuditAnswer(message);
    }

    // If a recurring plan interview is active, route the message as an interview answer
    if (planDraft && planDraft.currentQuestion < (planDraft.interviewQuestions?.length || 0)) {
      return handlePlanAnswer(message);
    }

    // Detect "plan my life" intent
    const lower = message.toLowerCase();
    if (/(plan my (entire |whole |full )?life|plan my week|life planning|set up my schedule|build my schedule|plan everything)/i.test(lower)) {
      return startLifeAudit();
    }

    if (processingRef.current || !message.trim()) return;
    processingRef.current = true;

    setTranscript('');
    setLumiState('processing');
    setLumiMessage('');
    setError('');

    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setHistory(prev => [...prev.slice(-18), userMsg]);

    try {
      // 1. Route through backend Lumi (saves budget/schedule/journal as needed)
      let backendResponse = null;
      try {
        const res = await api.post('/lumi/message', { text: message, source: 'talk' });
        backendResponse = res.data;

        if (backendResponse.needsConfirmation && backendResponse.pendingState) {
          setPending(backendResponse.pendingState);
        } else {
          setPending(null);
        }

        if (backendResponse.needsJournalPreview && backendResponse.pendingJournalPage) {
          setPendingJournalPage(backendResponse.pendingJournalPage);
        } else {
          setPendingJournalPage(null);
        }

        if (backendResponse.needsEmailPreview && backendResponse.pendingEmail) {
          setPendingEmail(backendResponse.pendingEmail);
        } else {
          setPendingEmail(null);
        }

        // Recurring plan: trigger the interview flow
        if (backendResponse.needsRecurringPlan && backendResponse.recurringPlanText) {
          try {
            const planRes = await api.post('/lumi/recurring-plan', { text: backendResponse.recurringPlanText });
            if (planRes.data?.needsPlanInterview) {
              setPlanDraft(planRes.data.planDraft);
              // Override the AI message with the plan kick-off message + first question
              const firstQ = planRes.data.planDraft?.interviewQuestions?.[0] || '';
              backendResponse.message = planRes.data.message + (firstQ ? `\n\n${firstQ}` : '');
            }
          } catch { /* non-fatal */ }
        }

        // Append structured save receipt when multiple items logged
        if ((backendResponse.savedItems?.length || 0) > 1) {
          const receipt = backendResponse.savedItems.map(s => `• ${s.label}`).join('\n');
          backendResponse.message = (backendResponse.message || '') + `\n\nLogged:\n${receipt}`;
        }
      } catch (backendErr) {
        console.warn('Backend Lumi unavailable, falling back to Groq:', backendErr.message);
      }

      // 2. Get conversational response — prefer backend message, fallback to Groq
      let aiResponse = backendResponse?.message;

      if (!aiResponse) {
        aiResponse = `I'm having trouble connecting right now. Please try again in a moment.`;
      }

      // 3. Add to history and display
      const aiMsg = {
        role: 'model',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        saved: backendResponse?.saved,
        savedItems: backendResponse?.savedItems || [],
        route: backendResponse?.route,
      };
      setHistory(prev => [...prev, aiMsg]);

      processingRef.current = false;
      await speak(aiResponse);

      // Refresh memory count silently — extraction runs async on the backend
      setTimeout(() => {
        api.get('/lumi/memories').then(r => setMemoryCount(r.data?.memories?.length || 0)).catch(() => {});
      }, 3000);

    } catch (err) {
      console.error('Lumi error:', err);
      processingRef.current = false;
      const fallback = `Sorry ${user?.name?.split(' ')[0] || 'there'}, I had trouble with that. Could you try again?`;
      await speak(fallback);
    }
  }, [history, tasks, recentJournal, user, aiName, isMuted, planDraft, handlePlanAnswer, lifeAudit, handleLifeAuditAnswer, startLifeAudit]);

  // ── Voice ─────────────────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (speakingRef.current || listeningRef.current || processingRef.current) return;

    if (!lumiListen.isSpeechRecognitionAvailable()) {
      setShowText(true);
      setError('Voice not available in this browser. Use the text input below.');
      return;
    }

    setLumiState('listening');
    setTranscript('');
    setError('');
    listeningRef.current = true;

    try {
      await lumiListen.startListening({
        onStart:  () => setLumiState('listening'),
        onResult: ({ fullText }) => setTranscript(fullText),
        onEnd:    ({ transcript: t }) => {
          listeningRef.current = false;
          if (t.trim()) handleMessage(t.trim());
          else setLumiState('idle');
        },
        onNoSpeech: () => { listeningRef.current = false; setLumiState('idle'); },
        onMaxDurationReached: (t) => { listeningRef.current = false; if (t.trim()) handleMessage(t.trim()); },
      }, { continuous: true });
    } catch (err) {
      listeningRef.current = false;
      setLumiState('idle');
      setShowText(true);
      setError(err.message || 'Could not start mic. Use text input instead.');
    }
  }, [handleMessage]);

  function stopAll() {
    lumiVoice.stop();
    lumiListen.stopListening();
    speakingRef.current    = false;
    listeningRef.current   = false;
    processingRef.current  = false;
    setLumiState('idle');
  }

  function handleOrbClick() {
    if (lumiState === 'idle')     startListening();
    else                           stopAll();
  }

  // ── Text submit ────────────────────────────────────────────────────────────────
  function handleTextSubmit(e) {
    e.preventDefault();
    if (!textInput.trim() || processingRef.current) return;
    const msg = textInput.trim();
    setTextInput('');
    handleMessage(msg);
  }

  // ── Confirmation (save journal draft) ─────────────────────────────────────────
  async function confirmSave(yes) {
    if (!pendingState) return;
    const ps = pendingState;
    setPending(null);

    if (!yes) {
      handleMessage("No thanks, don't save that");
      return;
    }

    try {
      processingRef.current = true;
      setLumiState('processing');
      const res = await api.post('/lumi/confirm', {
        journalType: ps.suggestedJournal || 'personal',
        content: ps.content,
        summary: ps.summary || '',
      });
      processingRef.current = false;
      await speak(res.data.message || `Saved to your ${ps.suggestedJournal || 'personal'} journal ✓`);
    } catch {
      processingRef.current = false;
      await speak("I couldn't save that. Want to try again?");
    }
  }

  // ── Journal page preview confirm ────────────────────────────────────────────
  async function confirmJournalPage(yes) {
    if (!pendingJournalPage) return;
    const pjp = pendingJournalPage;
    setPendingJournalPage(null);

    if (!yes) {
      const aiMsg = { role: 'model', content: "No problem — I won't save that to your journal.", timestamp: new Date().toISOString() };
      setHistory(prev => [...prev, aiMsg]);
      await speak(aiMsg.content);
      return;
    }

    try {
      processingRef.current = true;
      setLumiState('processing');
      const res = await api.post('/lumi/confirm-journal-page', { pendingJournalPage: pjp });
      processingRef.current = false;
      const msg = res.data.message || `Saved to your ${pjp.template_name} page ✓`;
      const aiMsg = {
        role: 'model', content: msg, timestamp: new Date().toISOString(), saved: true,
        savedItems: [{ label: `${pjp.template_name} — ${pjp.journal_type} journal`, destination: `Journal → ${pjp.journal_type} → ${pjp.template_name}` }],
      };
      setHistory(prev => [...prev, aiMsg]);
      await speak(msg);
    } catch {
      processingRef.current = false;
      await speak("I couldn't save that. Want to try again?");
    }
  }

  function clearChat() {
    if (!window.confirm(`Clear this conversation with ${aiName}?`)) return;
    setHistory([]);
    setPending(null);
    setPendingJournalPage(null);
    setPlanDraft(null);
    setLifeAudit(null);
    setImportBlocks(null);
    setImportText('');
    setPendingEmail(null);
    setLumiMessage('');
    sessionStorage.removeItem('lumi_conv');
    // Clear server-side Redis memory too
    api.delete('/lumi/memory').catch(() => {});
  }

  // ── Status text ────────────────────────────────────────────────────────────────
  const statusText = {
    idle:       `Tap to talk to ${aiName}`,
    listening:  '🔴 Listening… tap to stop',
    processing: `⏳ ${aiName} is thinking…`,
    speaking:   `🔊 ${aiName} is speaking…`,
  }[lumiState];

  // ── Colours (warm palette) ────────────────────────────────────────────────────
  const C = {
    bg:      'transparent',
    surf:    'rgba(20,12,6,0.55)',
    brd:     'rgba(255,220,160,0.08)',
    accent:  '#C8955C',
    amber:   '#C8955C',
    teal:    '#00d4aa',
    muted:   'rgba(255,255,255,0.38)',
    text:    '#F0EAE0',
    purple:  '#a5b4fc',
  };

  const formatTime = ts => { try { return new Date(ts).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }); } catch { return ''; } };

  return (
    <div style={{ minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column', fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 28px', borderBottom:`1px solid ${C.brd}`, backdropFilter:'blur(16px)', background:'rgba(14,10,6,0.45)', flexShrink:0 }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ background:'none', border:`1px solid ${C.brd}`, borderRadius:9, padding:'7px 14px', color: C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          ← Back
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:`radial-gradient(circle,#ffbe4d,${C.accent})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✨</div>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color: C.text }}>{aiName}</div>
            <div style={{ fontSize:11, color: C.muted }}>
              {lumiState === 'processing' ? 'Thinking…'
                : lumiState === 'speaking' ? 'Speaking…'
                : memoryCount > 0 ? `Remembers ${memoryCount} thing${memoryCount !== 1 ? 's' : ''} about you`
                : 'Ready'}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setIsMuted(!isMuted)}
            style={{ background:'none', border:`1px solid ${C.brd}`, borderRadius:9, padding:'7px 12px', color: isMuted ? '#f87171' : C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}
            title={isMuted ? 'Unmute' : 'Mute voice'}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button onClick={() => { setShowText(!showText); setTimeout(() => textRef.current?.focus(), 50); }}
            style={{ background:'none', border:`1px solid ${showText ? C.accent+'66' : C.brd}`, borderRadius:9, padding:'7px 12px', color: showText ? C.accent : C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            ⌨️
          </button>
          <button onClick={() => setShowClaudePanel(!showClaudePanel)}
            style={{ background: showClaudePanel ? 'rgba(139,92,246,0.2)' : 'none', border:`1px solid ${showClaudePanel ? 'rgba(139,92,246,0.5)' : C.brd}`, borderRadius:9, padding:'7px 12px', color: showClaudePanel ? '#a5b4fc' : C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}
            title="Plan with Claude AI">
            ✨ Claude
          </button>
          <button onClick={clearChat}
            style={{ background:'none', border:`1px solid ${C.brd}`, borderRadius:9, padding:'7px 12px', color: C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            Clear
          </button>
        </div>
      </div>

      {/* ── Claude affiliate panel ── */}
      {showClaudePanel && (
        <div style={{ padding:'16px 28px', borderBottom:`1px solid rgba(139,92,246,0.2)`, background:'rgba(139,92,246,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#a5b4fc', marginBottom:8 }}>
            ✨ Plan with Claude AI — the most powerful life planner
          </div>
          <div style={{ fontSize:12, color: C.muted, lineHeight:1.7, marginBottom:12 }}>
            For the deepest, most intelligent planning session — use Claude AI on claude.ai.
            It will interview you on every part of your life, write out your full weekly schedule in detail, and help you think through decisions.
            Then come back here and paste your plan to import it into PLOS.
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <a
              href={`https://claude.ai/new?q=${encodeURIComponent('I want to plan my entire life and weekly schedule. Please interview me across 8 areas: morning routine, work/study, meals, health & exercise, faith & spiritual life, family & social, creative work & content, and evening/sleep. After the interview, produce a full structured weekly schedule I can import into my planner app. Start with mornings: what time do I wake up?')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding:'9px 18px', borderRadius:10, background:'rgba(139,92,246,0.25)', border:'1px solid rgba(139,92,246,0.5)', color:'#a5b4fc', fontSize:12, fontWeight:600, textDecoration:'none', fontFamily:'inherit', display:'inline-block' }}
            >
              Open Claude AI →
            </a>
            <button onClick={() => startLifeAudit()}
              style={{ padding:'9px 18px', borderRadius:10, background:'rgba(200,149,92,0.15)', border:`1px solid ${C.amber}44`, color: C.amber, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Plan with Lumi instead
            </button>
          </div>
          <div style={{ fontSize:11, color: C.muted, marginBottom:8 }}>After your Claude session, paste the plan here to import it:</div>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Paste your Claude plan here… (e.g. '6:00am Wake up, 6:15am Devotions 30min, 7:00am Gym 45min…')"
            style={{ width:'100%', minHeight:90, padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.brd}`, color: C.text, fontSize:12, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', outline:'none' }}
          />
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={importPlan} disabled={!importText.trim()}
              style={{ padding:'8px 18px', borderRadius:10, border:'none', background: importText.trim() ? '#a5b4fc' : 'rgba(255,255,255,0.08)', color: importText.trim() ? '#000' : C.muted, fontSize:12, fontWeight:600, cursor: importText.trim() ? 'pointer' : 'default', fontFamily:'inherit' }}>
              Parse Plan
            </button>
            {importBlocks?.length > 0 && (
              <button onClick={confirmImportedPlan}
                style={{ padding:'8px 18px', borderRadius:10, border:'none', background: C.amber, color:'#000', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Import {importBlocks.length} entries ✓
              </button>
            )}
          </div>
          {importBlocks?.length > 0 && (
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4 }}>
              <div style={{ fontSize:10, color: C.muted, marginBottom:4 }}>Preview:</div>
              {importBlocks.slice(0, 8).map((b, i) => (
                <div key={i} style={{ display:'flex', gap:8, fontSize:11, color: C.text }}>
                  <span style={{ color: C.amber, minWidth:40 }}>{b.start_time}</span>
                  <span>{b.title}</span>
                  <span style={{ color: C.muted }}>{b.duration_minutes}min</span>
                </div>
              ))}
              {importBlocks.length > 8 && <div style={{ fontSize:10, color: C.muted }}>…and {importBlocks.length - 8} more</div>}
            </div>
          )}
        </div>
      )}

      {/* ── Chat history ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:14 }}>

        {history.length === 0 && lumiState === 'idle' && !lumiMessage && (
          <div style={{ textAlign:'center', paddingTop:60 }}>
            <div style={{ fontSize:13, color: C.muted, lineHeight:1.8 }}>
              Tap the orb to start talking, or use the ⌨️ button to type.<br/>
              {aiName} can log expenses, plan your day, and save journal entries.
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginTop:20 }}>
              {['Plan my entire life', 'Plan my day', 'I spent ₦2,500 on food', "How am I doing?"].map(q => (
                <button key={q} onClick={() => handleMessage(q)}
                  style={{ padding:'7px 14px', borderRadius:20, border:`1px solid ${C.brd}`, background:'rgba(255,255,255,0.04)', color: C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} style={{ display:'flex', flexDirection: msg.role==='user' ? 'row-reverse' : 'row', alignItems:'flex-end', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background: msg.role==='user' ? `linear-gradient(135deg,${C.accent},#9b7fe8)` : 'rgba(165,180,252,0.15)', border:`1px solid ${msg.role==='user' ? C.accent+'55' : 'rgba(165,180,252,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color: msg.role==='user' ? '#fff' : '#a5b4fc' }}>
              {msg.role === 'user' ? (user?.name?.[0]?.toUpperCase() || 'Y') : '✨'}
            </div>
            <div style={{ maxWidth:'72%', padding:'12px 16px', borderRadius: msg.role==='user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.role==='user' ? `linear-gradient(135deg,rgba(200,149,92,0.2),rgba(155,127,234,0.15))` : C.surf, border:`1px solid ${msg.role==='user' ? C.accent+'30' : C.brd}`, fontSize:14, color: C.text, lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word', backdropFilter:'blur(12px)' }}>
              {msg.content}
              {msg.savedItems?.length > 0 && (
                <div style={{ marginTop:8, padding:'8px 12px', background:'rgba(0,212,170,0.07)', borderRadius:10, border:'1px solid rgba(0,212,170,0.18)' }}>
                  <div style={{ fontSize:10, color: C.teal, fontWeight:700, marginBottom:6, letterSpacing:'0.6px', textTransform:'uppercase' }}>Saved to your app</div>
                  {msg.savedItems.map((s, si) => (
                    <div key={si} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', fontSize:12, color: C.teal, lineHeight:1.7 }}>
                      <span>✓ {s.label}</span>
                      {s.destination && <span style={{ fontSize:10, color:'rgba(0,212,170,0.55)', marginLeft:8 }}>→ {s.destination}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize:10, color: C.muted, marginTop:4, textAlign: msg.role==='user' ? 'right' : 'left' }}>{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {lumiState === 'processing' && (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(165,180,252,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✨</div>
            <div style={{ display:'flex', gap:4, padding:'12px 16px', background: C.surf, border:`1px solid ${C.brd}`, borderRadius:'4px 16px 16px 16px', backdropFilter:'blur(12px)' }}>
              {[0,1,2].map(j => <div key={j} style={{ width:7, height:7, borderRadius:'50%', background:'rgba(200,149,92,0.6)', animation:`lumidot 1.2s ${j*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}

        {/* Current Lumi message (big display) */}
        {lumiMessage && lumiState === 'speaking' && (
          <div style={{ margin:'8px 0', padding:'20px 24px', background: C.surf, border:`1px solid ${C.brd}`, borderRadius:16, backdropFilter:'blur(16px)', fontSize:15, fontStyle:'italic', color: C.text, lineHeight:1.7, textAlign:'center' }}>
            {lumiMessage}
            <div style={{ fontSize:11, color: C.muted, marginTop:8 }}>🔊 Speaking…</div>
          </div>
        )}

        {/* Transcript while listening */}
        {transcript && lumiState === 'listening' && (
          <div style={{ padding:'12px 16px', background:`rgba(200,149,92,0.08)`, border:`1px solid ${C.accent}33`, borderRadius:12, fontSize:14, color: C.text, fontStyle:'italic' }}>
            {transcript}
          </div>
        )}

        {/* Journal draft confirmation buttons */}
        {pendingState && lumiState === 'idle' && !pendingJournalPage && (
          <div style={{ display:'flex', gap:8, padding:'4px 0 4px 42px' }}>
            <button onClick={() => confirmSave(true)}
              style={{ padding:'9px 20px', borderRadius:20, border:`1px solid ${C.teal}`, background:'rgba(0,212,170,0.1)', color: C.teal, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Yes, save it
            </button>
            <button onClick={() => confirmSave(false)}
              style={{ padding:'9px 20px', borderRadius:20, border:`1px solid ${C.brd}`, background:'rgba(255,255,255,0.04)', color: C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              No thanks
            </button>
          </div>
        )}

        {/* Journal page preview card — shows fields Lumi filled before saving */}
        {pendingJournalPage && lumiState === 'idle' && (
          <div style={{ margin:'4px 0 4px 42px', padding:'14px 16px', borderRadius:14, background:'rgba(165,180,252,0.07)', border:'1px solid rgba(165,180,252,0.2)' }}>
            <div style={{ fontSize:11, color:'rgba(165,180,252,0.9)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
              ✨ {pendingJournalPage.template_name} — {pendingJournalPage.journal_type} journal
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:12 }}>
              {Object.entries(pendingJournalPage.fields).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                const displayVal = Array.isArray(value)
                  ? value.filter(Boolean).join(' / ')
                  : typeof value === 'object'
                    ? JSON.stringify(value).slice(0, 120)
                    : String(value).slice(0, 200);
                if (!displayVal) return null;
                return (
                  <div key={key} style={{ fontSize:12 }}>
                    <span style={{ color:'rgba(165,180,252,0.6)', textTransform:'capitalize', marginRight:6 }}>
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span style={{ color: C.text }}>{displayVal}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => confirmJournalPage(true)}
                style={{ padding:'9px 20px', borderRadius:20, border:'1px solid rgba(165,180,252,0.5)', background:'rgba(165,180,252,0.12)', color:'#a5b4fc', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Save to journal ✓
              </button>
              <button onClick={() => confirmJournalPage(false)}
                style={{ padding:'9px 20px', borderRadius:20, border:`1px solid ${C.brd}`, background:'rgba(255,255,255,0.04)', color: C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Don't save
              </button>
            </div>
          </div>
        )}

        {/* Life audit: show full weekly schedule card when interview is done */}
        {lifeAudit?.done && lifeAudit.schedule?.length > 0 && lumiState === 'idle' && (
          <div style={{ margin:'8px 0 4px 0', padding:'16px 18px', borderRadius:14, background:'rgba(200,149,92,0.07)', border:'1px solid rgba(200,149,92,0.25)' }}>
            <div style={{ fontSize:12, color: C.amber, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
              📅 Your Weekly Life Plan — {lifeAudit.schedule.length} schedule blocks
            </div>
            {lifeAudit.timeAudit && (
              <div style={{ fontSize:12, color: C.muted, marginBottom:12, lineHeight:1.6 }}>
                📊 {lifeAudit.timeAudit.scheduledHours}h scheduled daily · {lifeAudit.timeAudit.freeHours}h flex time
                {lifeAudit.timeAudit.isOverScheduled && <span style={{ color:'#f87171', marginLeft:8 }}>⚠️ You may be over-scheduled</span>}
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14, maxHeight:260, overflowY:'auto' }}>
              {lifeAudit.schedule.map((s, i) => (
                <div key={i} style={{ display:'flex', gap:10, fontSize:12, color: C.text, alignItems:'center' }}>
                  <span style={{ color: C.amber, fontWeight:600, minWidth:44, fontVariantNumeric:'tabular-nums' }}>{s.start_time}</span>
                  <span style={{ flex:1 }}>{s.title}</span>
                  <span style={{ color: C.muted, fontSize:11 }}>{s.duration_minutes}min</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={confirmLifeAuditSchedule}
                style={{ padding:'10px 22px', borderRadius:20, border:'none', background: C.amber, color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Create My Schedule ✓
              </button>
              <button onClick={() => startLifeAudit(false)}
                style={{ padding:'10px 16px', borderRadius:20, border:`1px solid ${C.brd}`, background:'transparent', color: C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                Edit something
              </button>
              <button onClick={() => startLifeAudit(true)}
                style={{ padding:'10px 16px', borderRadius:20, border:`1px solid ${C.brd}`, background:'transparent', color: C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Life audit in-progress progress bar */}
        {lifeAudit?.active && !lifeAudit?.done && lifeAudit.progress && (
          <div style={{ margin:'4px 0', padding:'8px 12px', borderRadius:8, background:'rgba(200,149,92,0.06)', border:`1px solid rgba(200,149,92,0.15)` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:10, color: C.muted }}>Life plan progress</span>
              <span style={{ fontSize:10, color: C.amber }}>{lifeAudit.progress.pct}%</span>
            </div>
            <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.08)' }}>
              <div style={{ height:'100%', borderRadius:2, background: C.amber, width:`${lifeAudit.progress.pct}%`, transition:'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* Email preview card — shows draft before sending */}
        {pendingEmail && lumiState === 'idle' && (
          <div style={{ margin:'4px 0 4px 42px', padding:'14px 16px', borderRadius:14, background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.25)' }}>
            <div style={{ fontSize:11, color:'#93c5fd', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
              📧 Email draft — preview before sending
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12, fontSize:12 }}>
              <div><span style={{ color:'rgba(147,197,253,0.6)' }}>To: </span><span style={{ color: C.text }}>{pendingEmail.to}</span></div>
              <div><span style={{ color:'rgba(147,197,253,0.6)' }}>Subject: </span><span style={{ color: C.text }}>{pendingEmail.subject}</span></div>
              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 12px', color: C.text, lineHeight:1.7, whiteSpace:'pre-wrap', marginTop:4 }}>{pendingEmail.body}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => confirmSendEmail(true)}
                style={{ padding:'9px 20px', borderRadius:20, border:'1px solid rgba(147,197,253,0.5)', background:'rgba(59,130,246,0.15)', color:'#93c5fd', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Send ✓
              </button>
              <button onClick={() => confirmSendEmail(false)}
                style={{ padding:'9px 20px', borderRadius:20, border:`1px solid ${C.brd}`, background:'rgba(255,255,255,0.04)', color: C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Don't send
              </button>
            </div>
          </div>
        )}

        {/* Recurring plan: show schedule card + "Create Schedule" when interview is done */}
        {planDraft?.done && planDraft.defaultSchedule?.length > 0 && lumiState === 'idle' && (
          <div style={{ margin:'4px 0 4px 42px', padding:'14px 16px', borderRadius:14, background:'rgba(0,212,170,0.07)', border:'1px solid rgba(0,212,170,0.2)' }}>
            <div style={{ fontSize:11, color: C.teal, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
              📅 {planDraft.activity} — weekly plan
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
              {planDraft.defaultSchedule.map((s, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color: C.text }}>
                  <span style={{ color: C.teal, fontWeight:500, minWidth:36 }}>{s.day}</span>
                  <span style={{ flex:1, marginLeft:8 }}>{s.focus}</span>
                  <span style={{ color: C.muted, fontSize:12 }}>{s.time} · {s.duration}min</span>
                </div>
              ))}
            </div>
            <button onClick={createRecurringSchedule}
              style={{ padding:'10px 22px', borderRadius:20, border:'none', background: C.teal, color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Create Schedule ✓
            </button>
            <button onClick={() => setPlanDraft(null)}
              style={{ marginLeft:8, padding:'10px 16px', borderRadius:20, border:`1px solid ${C.brd}`, background:'transparent', color: C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Controls ── */}
      <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 28px 32px', backdropFilter:'blur(16px)', background:'rgba(14,10,6,0.35)' }}>

        {/* Status */}
        <div style={{ fontSize:13, color: lumiState==='listening' ? '#f87171' : C.muted, marginBottom:20, fontWeight:500 }}>
          {statusText}
        </div>

        {/* Orb */}
        <div style={{ marginBottom:20 }}>
          <LumiOrb state={lumiState} size="xl" onClick={handleOrbClick} />
        </div>

        {/* Text input */}
        {(showText || !lumiListen.isSpeechRecognitionAvailable()) && (
          <form onSubmit={handleTextSubmit} style={{ width:'100%', maxWidth:520, display:'flex', gap:10 }}>
            <input
              ref={textRef}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={`Message ${aiName}…`}
              disabled={processingRef.current}
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.brd}`, borderRadius:12, padding:'13px 16px', color: C.text, fontSize:14, fontFamily:'inherit', outline:'none' }}
              onFocus={e => e.target.style.borderColor = C.accent+'88'}
              onBlur={e  => e.target.style.borderColor = C.brd}
            />
            <button type="submit" disabled={!textInput.trim() || processingRef.current}
              style={{ padding:'13px 22px', borderRadius:12, border:'none', background: textInput.trim() ? `linear-gradient(135deg,${C.accent},#9b7fe8)` : 'rgba(255,255,255,0.06)', color: textInput.trim() ? '#fff' : C.muted, fontSize:14, fontWeight:600, fontFamily:'inherit', cursor: textInput.trim() ? 'pointer' : 'default', transition:'all 0.15s' }}>
              {processingRef.current ? '…' : 'Send'}
            </button>
          </form>
        )}

        {!showText && lumiListen.isSpeechRecognitionAvailable() && (
          <button onClick={() => { setShowText(true); setTimeout(() => textRef.current?.focus(), 50); }}
            style={{ marginTop:12, padding:'6px 14px', background:'transparent', border:`1px solid ${C.brd}`, borderRadius:8, color: C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            ⌨️ Type instead
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', padding:'11px 22px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:10, color:'#f87171', fontSize:13, fontFamily:'inherit', zIndex:50 }}>
          {error}
        </div>
      )}

      <style>{`
        @keyframes lumidot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
