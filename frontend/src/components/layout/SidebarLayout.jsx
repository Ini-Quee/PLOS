import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCachedSeason, SEASONS, setSeasonOverride } from '../../lib/seasonDetection';
import { useAtmos } from '../Atmosphere';

// ─── Base design tokens (palette values get layered on top via useAtmos) ───────
export const C = {
  bg: 'rgba(6,6,14,0.0)',       // transparent — atmosphere shows through
  bg2: 'rgba(6,6,14,0.30)',     // glass panels
  bg3: 'rgba(10,10,20,0.38)',
  bg4: 'rgba(14,14,28,0.48)',
  amber: '#C8955C',             // warm wood, not harsh orange
  amber2: '#DBA870',
  cream: '#f5f0e8',
  warm: '#c9b99a',
  muted: '#7a7a8a',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.05)',
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

// ─── Season Widget Component ────────────────────────────────────────────────────
function SeasonWidget() {
  const [seasonInfo, setSeasonInfo] = useState(null);
  const [showOverride, setShowOverride] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(null);

  useEffect(() => {
    const season = getCachedSeason();
    setSeasonInfo(season);
    setCurrentSeason(localStorage.getItem('currentSeason') || SEASONS.HARMATTAN);
  }, []);

  const handleSeasonChange = (newSeason) => {
    setCurrentSeason(newSeason);
    const newInfo = setSeasonOverride(newSeason);
    setSeasonInfo(newInfo);
    window.location.reload();
  };

  const seasonOptions = [
    { value: SEASONS.HARMATTAN, label: '🌾 Harmattan', desc: 'Dry, dusty' },
    { value: SEASONS.RAINY, label: '🌧️ Rainy', desc: 'Wet, tropical' },
    { value: SEASONS.SPRING, label: '🌸 Spring', desc: 'Fresh growth' },
    { value: SEASONS.SUMMER, label: '☀️ Summer', desc: 'Warm, vibrant' },
    { value: SEASONS.FALL, label: '🍂 Fall', desc: 'Harvest, cozy' },
    { value: SEASONS.WINTER, label: '❄️ Winter', desc: 'Quiet, snow' },
    { value: SEASONS.WET, label: '🌴 Wet', desc: 'Tropical rains' },
    { value: SEASONS.DRY, label: '☀️ Dry', desc: 'Clear, sunny' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div
        onClick={() => setShowOverride(!showOverride)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '10px 12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{seasonInfo?.emoji || '🌾'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>
              Current Season
            </div>
            <div style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>
              {seasonInfo?.name || 'Harmattan'}
            </div>
          </div>
          <div style={{ fontSize: 10, color: C.muted }}>{showOverride ? '▲' : '▼'}</div>
        </div>
      </div>

      {showOverride && (
        <div
          style={{
            marginTop: 8,
            background: C.bg3,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '8px',
          }}
        >
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
            Override season:
          </div>
          <select
            value={currentSeason}
            onChange={(e) => handleSeasonChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: C.bg4,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.text,
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {seasonOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.desc}
              </option>
            ))}
          </select>
        </div>
      )}
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
  const { palette } = useAtmos();

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
        background: palette.surface,
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderRight: `1px solid ${palette.border}`,
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
          color: palette.accent,
          letterSpacing: '-0.5px',
          padding: '4px 12px 20px',
          borderBottom: `1px solid ${palette.border}`,
          marginBottom: 12,
        }}
      >
        PLOS<span style={{ color: palette.text, opacity: 0.3 }}>.</span>
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

      {/* Season Widget */}
      <SectionHeader label="Atmosphere" />
      <SeasonWidget />

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
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px }
      `}</style>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: 'transparent',
          color: C.text,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          position: 'relative',
          zIndex: 1,
          ...customStyles,
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    </>
  );
}
