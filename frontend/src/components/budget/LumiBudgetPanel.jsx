import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../lib/api';
import BudgetVoiceInput from './BudgetVoiceInput';
import LumiFace from '../lumi/LumiFace';

const CELEBRATIONS = [
  'Every naira tracked is clarity.',
  'That awareness adds up.',
  'Your picture is getting clearer.',
  'Honesty about spending is the first step.',
  'Logged. That matters.',
];

function pickCelebration(savedItems) {
  if (!savedItems?.length) return null;
  const item = savedItems[0];
  if (item?.data?.type === 'income') return 'Income captured. Your month is taking shape.';
  if (item?.data?.amount < 1000) return 'Small but counted. Every naira tracked is clarity.';
  return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
}

export default function LumiBudgetPanel({ open, onClose, onEntryLogged }) {
  const [history, setHistory]   = useState([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const thinkingRef             = useRef(false);
  const scrollRef               = useRef(null);
  const inputRef                = useRef(null);

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // First-open greeting
  useEffect(() => {
    if (open && history.length === 0) {
      setHistory([{
        role: 'lumi',
        content: "No judgment — just patterns. Want to log what you spent today, or see how the month's going?",
        timestamp: new Date().toISOString(),
        savedItems: [],
      }]);
    }
  }, [open]);

  // Scroll to bottom whenever history or thinking changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [history, thinking]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  const handleLumiMessage = useCallback(async (text) => {
    if (thinkingRef.current || !text.trim()) return;
    thinkingRef.current = true;
    setThinking(true);

    setHistory(prev => [...prev, {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      savedItems: [],
    }]);
    setInput('');

    try {
      const res = await api.post('/lumi/message', { text, source: 'budget_page' });
      const data = res.data;

      const celebration = (data.saved && data.route === 'budget')
        ? pickCelebration(data.savedItems)
        : null;

      setHistory(prev => [...prev, {
        role: 'lumi',
        content: data.message || "I'm here — what's going on?",
        timestamp: new Date().toISOString(),
        savedItems: data.savedItems || [],
        saved: data.saved || false,
        celebration,
      }]);

      if (data.saved) onEntryLogged?.();
    } catch (err) {
      const is429 = err.response?.status === 429;
      setHistory(prev => [...prev, {
        role: 'lumi',
        content: is429
          ? (err.response.data?.error || "You've used today's limit. I'll be back tomorrow!")
          : "I had trouble with that — could you try again?",
        timestamp: new Date().toISOString(),
        savedItems: [],
      }]);
    } finally {
      thinkingRef.current = false;
      setThinking(false);
    }
  }, [onEntryLogged]);

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim()) handleLumiMessage(input.trim());
  }

  // Panel transform
  const transform = open
    ? (isMobile ? 'translateY(0)' : 'translateX(0)')
    : (isMobile ? 'translateY(100%)' : 'translateX(100%)');

  const panelStyle = isMobile
    ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '62vh', borderRadius: '16px 16px 0 0',
        transform, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
      }
    : {
        position: 'fixed', top: 0, right: 0,
        width: 320, height: '100vh',
        transform, transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      };

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobile && open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 199,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <div
        style={{
          ...panelStyle,
          zIndex: 200,
          background: 'rgba(14, 8, 3, 0.97)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderLeft: isMobile ? 'none' : '1px solid rgba(200,149,92,0.1)',
          borderTop: isMobile ? '1px solid rgba(200,149,92,0.1)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(200,149,92,0.08)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LumiFace mood="resting" size={26} tint="green" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#EAE0D5', fontFamily: "'Inter', sans-serif" }}>
              Lumi
            </span>
            <span style={{ fontSize: 11, color: '#5E5048', fontFamily: "'Inter', sans-serif" }}>
              — budget
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#5E5048',
              fontSize: 18, cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
              borderRadius: 6, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.target.style.color = '#EAE0D5'; }}
            onMouseLeave={e => { e.target.style.color = '#5E5048'; }}
          >
            ×
          </button>
        </div>

        {/* Chat history */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          {history.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4,
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

              <div style={{
                maxWidth: '85%',
                padding: '10px 13px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user'
                  ? 'rgba(200,149,92,0.18)'
                  : 'rgba(30,18,8,0.85)',
                border: msg.role === 'user'
                  ? '1px solid rgba(200,149,92,0.25)'
                  : '1px solid rgba(200,149,92,0.08)',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontFamily: msg.role === 'lumi' ? "'DM Serif Display', serif" : "'Inter', sans-serif",
                  fontStyle: msg.role === 'lumi' ? 'italic' : 'normal',
                  color: msg.role === 'user' ? '#C8955C' : '#EAE0D5',
                }}>
                  {msg.content}
                </p>

                {/* Celebration line */}
                {msg.celebration && (
                  <p style={{
                    margin: '6px 0 0', fontSize: 11,
                    color: 'rgba(200,149,92,0.7)',
                    fontFamily: "'Inter', sans-serif",
                    fontStyle: 'normal',
                  }}>
                    {msg.celebration}
                  </p>
                )}
              </div>

              {/* Saved item badges */}
              {msg.savedItems?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '85%' }}>
                  {msg.savedItems.map((item, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(91,168,138,0.15)',
                      border: '1px solid rgba(91,168,138,0.3)',
                      color: '#5BA88A',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      ✓ {item.label || 'Logged'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {thinking && (
            <div style={{ display: 'flex', gap: 5, padding: '10px 13px', alignSelf: 'flex-start' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#C8955C',
                  animation: `lumiPulse 1.2s ${i * 0.2}s ease-in-out infinite`,
                  opacity: 0.6,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(200,149,92,0.08)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {/* Voice input */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <BudgetVoiceInput onTranscript={handleLumiMessage} disabled={thinking} />
          </div>

          {/* Text input */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="or type — 'spent 2k on food'…"
              style={{
                flex: 1, padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid rgba(200,149,92,0.2)',
                background: 'rgba(20,12,6,0.7)',
                color: '#EAE0D5',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(200,149,92,0.5)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(200,149,92,0.2)'; }}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              style={{
                padding: '9px 14px', borderRadius: 10, border: 'none',
                background: input.trim() && !thinking ? '#C8955C' : 'rgba(200,149,92,0.2)',
                color: input.trim() && !thinking ? '#080503' : '#5E5048',
                fontSize: 13, fontWeight: 600, cursor: input.trim() && !thinking ? 'pointer' : 'default',
                transition: 'all 0.15s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
