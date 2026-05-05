import { useNavigate } from 'react-router-dom';
import { C } from '../layout/SidebarLayout';

/**
 * Soft inline upgrade gate — NOT a hard block.
 * Shows when free user hits a feature limit.
 * feature: short description of what's locked
 */
export default function UpgradePrompt({ feature, compact = false }) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(200,149,92,0.08)',
        border: '1px solid rgba(200,149,92,0.22)',
        animation: 'fadeUp 0.25s ease both',
      }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
          {feature} — <span style={{ color: C.amber }}>Pro feature</span>
        </span>
        <button
          onClick={() => navigate('/upgrade')}
          style={{
            padding: '6px 14px', borderRadius: 16, border: 'none',
            background: 'rgba(200,149,92,0.85)', color: '#0a0a14',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px 20px', borderRadius: 16, textAlign: 'center',
      background: 'linear-gradient(135deg, rgba(200,149,92,0.1), rgba(139,92,246,0.07))',
      border: '1px solid rgba(200,149,92,0.25)',
      animation: 'fadeUp 0.3s ease both',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f0', marginBottom: 8 }}>
        Upgrade to Pro
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        {feature}
      </div>
      <button
        onClick={() => navigate('/upgrade')}
        style={{
          padding: '11px 28px', borderRadius: 24, border: 'none',
          background: 'rgba(200,149,92,0.85)', color: '#0a0a14',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        See Pro plans →
      </button>
    </div>
  );
}
