import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Design Tokens (Shared across all pages) ───────────────────────────────────
export const C = {
  bg: '#07070f',
  bg2: '#0f0f1c',
  bg3: '#141428',
  bg4: '#1a1a35',
  amber: '#F5A623',
  amber2: '#ffbe4d',
  cream: '#f5f0e8',
  warm: '#c9b99a',
  muted: '#6b6b8a',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.06)',
  teal: '#00d4aa',
  purple: '#8b5cf6',
  rose: '#f472b6',
  sage: '#7fb87f',
  text: '#e8e8f0',
};

// ─── Navigation Items ──────────────────────────────────────────────────────────
export const NAV_ITEMS = {
  main: [
    { icon: '◈', label: 'Dashboard', path: '/dashboard' },
    { icon: '📅', label: "Today's Plan", path: '/schedule' },
    { icon: '📖', label: 'Journal', path: '/journal' },
  ],
  life: [
    { icon: '💰', label: 'Budget', path: '/budget' },
    { icon: '🔥', label: 'Habits', path: '/habits' },
    { icon: '🎯', label: 'Goals', path: '/goals' },
    { icon: '📚', label: 'Reading', path: '/books' },
  ],
  pro: [
    { icon: '✨', label: 'Talk to Lumi', path: '/talk-to-lumi' },
    { icon: '🩺', label: 'Health', path: '/health' },
  ],
  security: [
    { icon: '🔐', label: 'Privacy settings', path: '/settings/privacy' },
    { icon: '🛡️', label: 'Encryption: ON', path: null },
  ],
};

// ─── MFA Widget Component ──────────────────────────────────────────────────────
function MFAWidget() {
  const [expanded, setExpanded] = useState(false);
  const [enabled, setEnabled] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: enabled ? 'rgba(0,212,170,0.08)' : 'rgba(245,166,35,0.08)',
        border: `1px solid ${enabled ? 'rgba(0,212,170,0.2)' : 'rgba(245,166,35,0.2)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{enabled ? '🔒' : '⚠️'}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: enabled ? C.teal : C.amber,
            }}
          >
            {enabled ? 'MFA Active' : 'MFA Off'}
          </div>
          <div style={{ fontSize: 9, color: C.muted }}>
            {enabled ? 'Multi-factor authentication on' : 'Tap to enable MFA'}
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${C.border2}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              marginBottom: 8,
              lineHeight: 1.5,
            }}
          >
            Multi-factor authentication adds an extra layer of security to protect your journals and private data.
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEnabled(!enabled);
            }}
            style={{
              background: enabled ? 'rgba(0,212,170,0.15)' : 'rgba(245,166,35,0.15)',
              border: `1px solid ${enabled ? C.teal : C.amber}`,
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 10,
              color: enabled ? C.teal : C.amber,
              textAlign: 'center',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            {enabled ? 'Disable MFA' : 'Enable MFA →'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Navigation Item ─────────────────────────────────────────────────────
function NavItem({ icon, label, path, isActive, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        cursor: path ? 'pointer' : 'default',
        fontSize: 13,
        fontWeight: 500,
        color: isActive ? C.amber : C.muted,
        background: isActive ? 'rgba(245,166,35,0.12)' : 'transparent',
        marginBottom: 2,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (path && !isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = C.text;
        }
      }}
      onMouseLeave={(e) => {
        if (path && !isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = C.muted;
        }
      }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
      {label}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: C.muted,
        padding: '14px 12px 6px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        opacity: 0.5,
      }}
    >
      {label}
    </div>
  );
}

// ─── User Profile Card ─────────────────────────────────────────────────────────
function UserProfile() {
  return (
    <div
      style={{
        marginTop: 'auto',
        paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: `linear-gradient(135deg,${C.amber},${C.purple})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 12,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          EI
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Erica Inno.</div>
          <div style={{ fontSize: 10, color: C.muted }}>Free plan</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar Component ──────────────────────────────────────────────────────
export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine active item based on current path
  const isActive = (path) => {
    if (path === '/dashboard' && currentPath === '/dashboard') return true;
    if (path === '/journal' && currentPath.startsWith('/journal')) return true;
    if (path === '/schedule' && currentPath === '/schedule') return true;
    if (path === '/budget' && currentPath === '/budget') return true;
    if (path === '/habits' && currentPath === '/habits') return true;
    if (path === '/goals' && currentPath === '/goals') return true;
    if (path === '/books' && currentPath === '/books') return true;
    if (path === '/talk-to-lumi' && currentPath === '/talk-to-lumi') return true;
    if (path === '/health' && currentPath === '/health') return true;
    return false;
  };

  return (
    <div
      style={{
        width: 220,
        background: C.bg2,
        borderRight: `1px solid ${C.border}`,
        padding: '24px 14px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 180,
          height: 180,
          background: 'radial-gradient(circle,rgba(245,166,35,0.12) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: C.amber,
          letterSpacing: '-0.5px',
          padding: '4px 12px 20px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 12,
        }}
      >
        PLOS<span style={{ color: C.text, opacity: 0.3 }}>.</span>
      </div>

      {/* Main Navigation */}
      {NAV_ITEMS.main.map((item) => (
        <NavItem
          key={item.label}
          {...item}
          isActive={isActive(item.path)}
        />
      ))}

      {/* Life Section */}
      <SectionHeader label="Life" />
      {NAV_ITEMS.life.map((item) => (
        <NavItem
          key={item.label}
          {...item}
          isActive={isActive(item.path)}
        />
      ))}

      {/* Pro Section */}
      <SectionHeader label="Pro" />
      {NAV_ITEMS.pro.map((item) => (
        <NavItem
          key={item.label}
          {...item}
          isActive={isActive(item.path)}
        />
      ))}

      {/* Security Section */}
      <SectionHeader label="Security" />
      <MFAWidget />
      {NAV_ITEMS.security.map((item) => (
        <NavItem
          key={item.label}
          {...item}
          isActive={isActive(item.path)}
        />
      ))}

      {/* User Profile */}
      <UserProfile />
    </div>
  );
}

// ─── Layout Wrapper ─────────────────────────────────────────────────────────────
export default function SidebarLayout({ children, customStyles = {} }) {
  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }
        @keyframes breathe { 0%,100% { transform:scale(1) } 50% { transform:scale(1.08) } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px }
      `}</style>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: C.bg,
          color: C.text,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          ...customStyles,
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </>
  );
}
