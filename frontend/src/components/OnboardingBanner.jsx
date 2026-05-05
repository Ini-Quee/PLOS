import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from './layout/SidebarLayout';

export default function OnboardingBanner() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(200,149,92,0.12), rgba(139,92,246,0.08))',
      border: '1px solid rgba(200,149,92,0.25)',
      borderRadius: 12,
      padding: '12px 16px',
      margin: '16px 28px 0',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>✨</span>
      <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
        Your life plan is waiting.{' '}
        <span style={{ color: C.amber }}>Let Lumi set up your week in 10 minutes.</span>
      </div>
      <button
        onClick={() => navigate('/talk-to-lumi?mode=onboarding')}
        style={{
          padding: '7px 16px', borderRadius: 20, border: 'none',
          background: 'rgba(200,149,92,0.85)', color: '#0a0a14',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        Start →
      </button>
      <button
        onClick={() => { setDismissed(true); localStorage.setItem('plos_banner_dismissed', 'true'); }}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
      >
        ✕
      </button>
    </div>
  );
}
