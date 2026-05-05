import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout, { C } from '../components/layout/SidebarLayout';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

const FEATURES = [
  { free: '10 messages / day',      pro: 'Unlimited Lumi messages',      icon: '✨' },
  { free: 'Personal journal only',  pro: 'All 6 journal types',           icon: '📖' },
  { free: '3 habits max',           pro: 'Unlimited habits',              icon: '🔥' },
  { free: 'Today view only',        pro: 'Full week + life audit',        icon: '📅' },
  { free: '—',                      pro: 'AI insights & Lumi memory',     icon: '🧠' },
  { free: '—',                      pro: 'Push notifications',            icon: '🔔' },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isPro = user?.subscription_tier === 'pro';

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/billing/checkout');
      window.location.href = res.data.url;
    } catch {
      setError('Could not start checkout. Please try again.');
      setLoading(false);
    }
  }

  const GLASS = {
    background: 'rgba(6,6,14,0.40)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: `1px solid rgba(255,255,255,0.07)`,
    borderRadius: 20,
  };

  return (
    <SidebarLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40, animation: 'fadeUp 0.3s ease' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
            {isPro ? 'You\'re on Pro' : 'Upgrade to PLOS Pro'}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            {isPro
              ? 'You have full access to every feature in PLOS.'
              : 'Unlock unlimited Lumi, all journals, and every feature built for your life.'}
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ ...GLASS, padding: '8px 0', marginBottom: 28, animation: 'fadeUp 0.35s ease' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '12px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div />
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Free</div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pro</div>
          </div>

          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                padding: '13px 24px',
                borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#e8e8f0' }}>
                <span>{f.icon}</span>
                <span>{f.pro}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
                {f.free === '—' ? <span style={{ opacity: 0.3 }}>—</span> : f.free}
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, color: C.teal, fontWeight: 600 }}>✓</div>
            </div>
          ))}
        </div>

        {/* Pricing + CTA */}
        {!isPro && (
          <div style={{ ...GLASS, padding: '28px 32px', textAlign: 'center', borderColor: 'rgba(200,149,92,0.25)', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Monthly subscription</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#e8e8f0', marginBottom: 4 }}>
              $9 <span style={{ fontSize: 16, fontWeight: 400, color: C.muted }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Cancel anytime · No commitment</div>

            {error && (
              <div style={{ fontSize: 13, color: '#f87171', marginBottom: 16 }}>{error}</div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 28, border: 'none',
                background: loading ? 'rgba(200,149,92,0.4)' : 'rgba(200,149,92,0.9)',
                color: '#0a0a14', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Opening checkout…' : 'Get Pro → $9/month'}
            </button>

            <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              Secured by Stripe · Your card is never stored here
            </div>
          </div>
        )}

        {isPro && (
          <div style={{ ...GLASS, padding: '24px 32px', textAlign: 'center', borderColor: 'rgba(0,212,170,0.25)', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.teal, marginBottom: 8 }}>Pro active</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Manage your subscription or cancel anytime.</div>
            <button
              onClick={async () => {
                try {
                  const res = await api.post('/billing/portal');
                  window.location.href = res.data.url;
                } catch { setError('Could not open billing portal.'); }
              }}
              style={{ padding: '11px 28px', borderRadius: 24, border: `1px solid ${C.teal}40`, background: 'transparent', color: C.teal, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Manage Subscription →
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span
            onClick={() => navigate(-1)}
            style={{ fontSize: 13, color: C.muted, cursor: 'pointer' }}
          >
            ← Back
          </span>
        </div>
      </div>
    </SidebarLayout>
  );
}
