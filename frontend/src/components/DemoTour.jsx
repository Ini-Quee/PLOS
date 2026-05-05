import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from './layout/SidebarLayout';

const TOUR_KEY = 'plos_demo_tour_step';

const STEPS = [
  {
    target: 'dashboard-stats',
    title: 'Your life at a glance',
    body: 'Journal streak, habits done, savings progress — all in one place. Updated live as Alex moves through the day.',
    path: '/dashboard',
    position: 'bottom',
  },
  {
    target: 'schedule-week',
    title: 'AI-generated weekly plan',
    body: 'Lumi interviewed Alex across 8 life areas and built this entire schedule in one 10-minute session. No manual planning needed.',
    path: '/schedule',
    position: 'bottom',
  },
  {
    target: 'lumi-chat',
    title: 'Lumi remembers you',
    body: 'Ask Lumi anything. She knows Alex has ADHD, wants to raise investment, and just hit a 7-day running streak. She references it naturally.',
    path: '/talk-to-lumi',
    position: 'center',
  },
  {
    target: 'habits-list',
    title: 'Identity-based habits',
    body: 'Not "did the task" — "who am I becoming?" Each completion reinforces identity. Streaks, heatmaps, accountability partners.',
    path: '/habits',
    position: 'bottom',
  },
  {
    target: 'upgrade-cta',
    title: 'Free → Pro in one tap',
    body: 'Free users get 10 Lumi messages/day and 3 habits. Pro is $9/month — unlimited everything. This is the monetization layer.',
    path: '/upgrade',
    position: 'center',
  },
];

export default function DemoTour({ onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    const saved = parseInt(localStorage.getItem(TOUR_KEY) || '0', 10);
    return isNaN(saved) ? 0 : Math.min(saved, STEPS.length - 1);
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    localStorage.setItem(TOUR_KEY, String(step));
    if (STEPS[step]?.path) navigate(STEPS[step].path);
  }, [step]);

  function next() {
    if (step < STEPS.length - 1) {
      setVisible(false);
      setTimeout(() => { setStep(s => s + 1); setVisible(true); }, 180);
    } else {
      finish();
    }
  }

  function prev() {
    if (step > 0) {
      setVisible(false);
      setTimeout(() => { setStep(s => s - 1); setVisible(true); }, 180);
    }
  }

  function finish() {
    localStorage.removeItem(TOUR_KEY);
    onClose?.();
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isCenter = current.position === 'center';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={finish}
        style={{
          position: 'fixed', inset: 0, zIndex: 8000,
          background: 'rgba(4,4,12,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Tour card */}
      <div style={{
        position: 'fixed',
        zIndex: 8001,
        ...(isCenter
          ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
          : { bottom: 100, left: '50%', transform: 'translateX(-50%)' }),
        width: 340,
        background: 'rgba(10,10,24,0.98)',
        border: `1px solid rgba(200,149,92,0.3)`,
        borderRadius: 20,
        padding: '28px 24px 22px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        opacity: visible ? 1 : 0,
        transform: visible
          ? (isCenter ? 'translate(-50%,-50%)' : 'translateX(-50%) translateY(0)')
          : (isCenter ? 'translate(-50%,-48%)' : 'translateX(-50%) translateY(12px)'),
        transition: 'opacity 0.18s ease, transform 0.18s ease',
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 18 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? C.amber : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 13, color: C.amber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          {step + 1} of {STEPS.length}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#e8e8f0', marginBottom: 10, lineHeight: 1.3 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 22 }}>
          {current.body}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {step > 0 && (
            <button
              onClick={prev}
              style={{ padding: '9px 16px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.12)`, background: 'transparent', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={next}
            style={{ flex: 1, padding: '10px 20px', borderRadius: 20, border: 'none', background: 'rgba(200,149,92,0.88)', color: '#0a0a14', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isLast ? 'Finish tour ✓' : 'Next →'}
          </button>
          <button
            onClick={finish}
            style={{ padding: '9px 12px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.08)`, background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Skip
          </button>
        </div>
      </div>
    </>
  );
}
