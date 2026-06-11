import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from './layout/SidebarLayout';
import LumiFace from './lumi/LumiFace';

const STEP_KEY = 'plos_onboarding_step';
const INTENT_KEY = 'plos_intent';
const ONBOARDED_KEY = 'plos_onboarded';

const INTENTS = [
  { id: 'consistent', icon: '🔥', label: 'Stay consistent', sub: 'Build habits that actually stick' },
  { id: 'money',      icon: '💰', label: 'Manage money',    sub: 'Track spending, hit savings goals' },
  { id: 'habits',     icon: '🌱', label: 'Build good habits', sub: 'Morning routines, daily rituals' },
  { id: 'focus',      icon: '🎯', label: 'Stay focused',    sub: 'ADHD-friendly planning that works' },
];

function complete(navigate, onDone) {
  localStorage.setItem(ONBOARDED_KEY, 'true');
  localStorage.removeItem(STEP_KEY);
  onDone();
}

export default function OnboardingFlow({ userName, onDone }) {
  const navigate = useNavigate();
  const savedStep = parseInt(localStorage.getItem(STEP_KEY) || '0', 10);
  const [step, setStep] = useState(savedStep);
  const [selectedIntent, setSelectedIntent] = useState(localStorage.getItem(INTENT_KEY) || '');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in after mount
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    localStorage.setItem(STEP_KEY, String(step));
  }, [step]);

  function next() {
    setVisible(false);
    setTimeout(() => { setStep(s => s + 1); setVisible(true); }, 220);
  }

  function goToLumi() {
    complete(navigate, onDone);
    navigate('/talk-to-lumi?mode=onboarding');
  }

  function defer() {
    complete(navigate, onDone);
  }

  const firstName = userName?.split(' ')[0] || 'there';

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(4,4,12,0.96)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.22s ease',
  };

  const card = {
    background: 'rgba(10,10,24,0.98)',
    border: `1px solid rgba(200,149,92,0.18)`,
    borderRadius: 28,
    padding: '52px 44px 44px',
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
  };

  const primaryBtn = {
    padding: '13px 32px', borderRadius: 28, border: 'none',
    background: 'rgba(200,149,92,0.9)', color: '#0a0a14',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', letterSpacing: '0.01em',
    transition: 'all 0.15s',
  };

  const ghostBtn = {
    padding: '13px 24px', borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent', color: 'rgba(255,255,255,0.4)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div style={overlay}>
      <style>{`
        @keyframes breathe {
          0%,100% { transform:scale(1); box-shadow:0 0 24px rgba(200,149,92,0.35) }
          50%      { transform:scale(1.1); box-shadow:0 0 48px rgba(200,149,92,0.55) }
        }
        @keyframes orbFadeIn {
          from { opacity:0; transform:translateY(12px) scale(0.9) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        .intent-card:hover { background: rgba(200,149,92,0.12) !important; border-color: rgba(200,149,92,0.4) !important; }
      `}</style>

      {/* ── Step 0: Splash ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div style={card}>
          <div style={{ margin: '0 auto 28px', display: 'flex', justifyContent: 'center', animation: 'orbFadeIn 0.6s ease both' }}>
            <LumiFace mood="resting" size={64} />
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', color: C.amber, textTransform: 'uppercase', marginBottom: 14, opacity: 0.8 }}>
            Personal Life OS
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#e8e8f0', lineHeight: 1.2, marginBottom: 14 }}>
            Welcome to IniQ,<br />{firstName} 👋
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 36 }}>
            IniQ is your personal life operating system.<br />
            Lumi — your AI companion — turns your daily<br />
            routines, habits, and goals into one living plan.
          </div>
          <button style={primaryBtn} onClick={next}>Let's go →</button>
        </div>
      )}

      {/* ── Step 1: Intent ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ ...card, maxWidth: 520 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
            What brings you here?
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
            Lumi will personalise your experience based on this.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {INTENTS.map(intent => (
              <div
                key={intent.id}
                className="intent-card"
                onClick={() => {
                  setSelectedIntent(intent.id);
                  localStorage.setItem(INTENT_KEY, intent.id);
                }}
                style={{
                  padding: '16px 14px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                  background: selectedIntent === intent.id ? 'rgba(200,149,92,0.14)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedIntent === intent.id ? 'rgba(200,149,92,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{intent.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedIntent === intent.id ? C.amber : '#e8e8f0', marginBottom: 4 }}>
                  {intent.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                  {intent.sub}
                </div>
              </div>
            ))}
          </div>
          <button
            style={{ ...primaryBtn, opacity: selectedIntent ? 1 : 0.5, cursor: selectedIntent ? 'pointer' : 'default' }}
            onClick={() => { if (selectedIntent) next(); }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Lumi intro ────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={card}>
          <div style={{ margin: '0 auto 24px', display: 'flex', justifyContent: 'center', animation: 'orbFadeIn 0.5s ease both' }}>
            <LumiFace mood="happy" size={72} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#e8e8f0', marginBottom: 14 }}>
            Hi {firstName}, I'm Lumi ✨
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 32 }}>
            {selectedIntent === 'consistent' && 'I\'ll help you build a routine that works with your energy, not against it.'}
            {selectedIntent === 'money' && 'I\'ll track your spending and help you hit your savings goals — just tell me what you spend.'}
            {selectedIntent === 'habits' && 'I\'ll build habits around your real life — no rigid schedules, just small wins every day.'}
            {selectedIntent === 'focus' && 'I\'m built for ADHD brains. I plan your day so you don\'t have to hold it all in your head.'}
            {!selectedIntent && 'I\'m your AI companion. I plan your life, remember your patterns, and show up every day.'}
            <br /><br />
            The best way to start is a <strong style={{ color: C.amber }}>10-minute life audit</strong> — I'll ask you about your morning, work, meals, health, and routines, then build your full weekly schedule.
          </div>
          <button style={primaryBtn} onClick={next}>Start Life Audit →</button>
        </div>
      )}

      {/* ── Step 3: Decision ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={card}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🗓️</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#e8e8f0', marginBottom: 12 }}>
            Ready to plan your life?
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 36 }}>
            Lumi will interview you across 8 areas of your life —<br />
            morning, work, meals, health, faith, family, creativity, and sleep.<br />
            <span style={{ color: C.amber }}>Takes about 10 minutes.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <button style={{ ...primaryBtn, width: '100%', fontSize: 15 }} onClick={goToLumi}>
              ✨ Start Life Audit with Lumi
            </button>
            <button style={ghostBtn} onClick={defer}>
              I'll set up manually later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
