import { useNavigate } from 'react-router-dom';
import { C } from '../layout/SidebarLayout';

export default function EmptyState({ icon, headline, body, cta, lumiNudge }) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
      animation: 'fadeUp 0.3s ease both',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#e8e8f0', marginBottom: 8 }}>
        {headline}
      </div>
      {body && (
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 24, maxWidth: 320 }}>
          {body}
        </div>
      )}
      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            padding: '11px 28px', borderRadius: 24, border: 'none',
            background: 'rgba(200,149,92,0.85)', color: '#0a0a14',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: lumiNudge ? 16 : 0,
          }}
        >
          {cta.label}
        </button>
      )}
      {lumiNudge && (
        <div
          onClick={() => navigate(lumiNudge.path || '/talk-to-lumi')}
          style={{
            fontSize: 12, color: C.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.amber}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          <span>✨</span>
          <span>{lumiNudge.text}</span>
        </div>
      )}
    </div>
  );
}
