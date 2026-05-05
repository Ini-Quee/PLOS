import { useContext } from 'react';
import { ToastContext } from '../../hooks/useToast';
import { C } from '../layout/SidebarLayout';

const COLORS = {
  success: { border: C.teal,    bg: 'rgba(0,212,170,0.10)',   icon: '✓' },
  error:   { border: '#f87171', bg: 'rgba(248,113,113,0.10)', icon: '✕' },
  info:    { border: C.amber,   bg: 'rgba(200,149,92,0.10)',  icon: 'ℹ' },
};

export default function ToastStack() {
  const ctx = useContext(ToastContext);
  if (!ctx || ctx.toasts.length === 0) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(28px) scale(0.96) }
          to   { opacity:1; transform:translateX(0) scale(1) }
        }
      `}</style>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div
            key={t.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 16px',
              background: c.bg,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${c.border}40`,
              borderLeft: `3px solid ${c.border}`,
              borderRadius: 12,
              minWidth: 220, maxWidth: 340,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              animation: 'toastIn 0.2s ease both',
              pointerEvents: 'all',
            }}
          >
            <span style={{ fontSize: 13, color: c.border, fontWeight: 700, flexShrink: 0 }}>{c.icon}</span>
            <span style={{ flex: 1, fontSize: 13, color: '#e8e8f0', lineHeight: 1.4 }}>{t.message}</span>
            {t.type === 'error' && (
              <button
                onClick={() => dismiss(t.id)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0 }}
              >✕</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
