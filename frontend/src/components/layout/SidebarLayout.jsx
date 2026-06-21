import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCachedSeason, SEASONS, setSeasonOverride } from '../../lib/seasonDetection';
import { useAtmos } from '../Atmosphere';
import AlarmBar from '../AlarmBar';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import LumiFace from '../lumi/LumiFace';

// ─── Base design tokens (palette values get layered on top via useAtmos) ───────
export const C = {
  bg: 'rgba(8,5,3,0.0)',         // transparent — atmosphere shows through
  bg2: 'rgba(20,12,6,0.30)',     // glass panels
  bg3: 'rgba(30,18,8,0.38)',
  bg4: 'rgba(52,32,16,0.48)',
  amber: '#C8955C',              // warm wood accent
  amber2: '#DBA870',
  cream: '#F5EDE2',
  warm: '#C4A882',
  muted: '#7A6450',
  border: 'rgba(200,149,92,0.09)',
  border2: 'rgba(200,149,92,0.06)',
  teal: '#5BA88A',
  purple: '#9B7FD4',
  rose: '#E05252',
  pink: '#D4789A',
  sage: '#7ABFB8',
  text: '#EAE0D5',
};

// ─── Navigation Items ──────────────────────────────────────────────────────────
// Tier 1 (Today) — always visible, highest priority
// Tier 2 (Life) — core feature modules
// Tier 3 (More) — settings only
// Hidden from nav: Projects, Contacts, Books, Content, Goals, Calendar, Jobs
export const NAV_ITEMS = {
  today: [
    { icon: '◈',  label: 'Dashboard',    path: '/dashboard'    },
    { icon: '📅', label: 'Planner',      path: '/schedule'     },
    { icon: '✨', label: 'Talk to Lumi', path: '/talk-to-lumi', lumi: true },
  ],
  life: [
    { icon: '📖', label: 'Journal',      path: '/journal'      },
    { icon: '🔥', label: 'Habits',       path: '/habits'       },
    { icon: '💰', label: 'Budget',       path: '/budget'       },
    { icon: '📆', label: 'Calendar',     path: '/calendar'     },
    { icon: '📊', label: 'Trackers',     path: '/trackers'     },
    { icon: '🗓️', label: 'Year Plan',    path: '/year-plan'    },
  ],
  more: [
    { icon: '📧', label: 'Email',        path: '/email'        },
    { icon: '⚙️', label: 'Settings',    path: '/settings'     },
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
function NavItem({ icon, label, path, isActive, onClick, lumi = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) navigate(path);
    if (onClick) onClick();
  };

  // Lumi item gets a distinct amber-tinted background regardless of active state
  const lumiBase = lumi
    ? { background: 'rgba(200,149,92,0.14)', border: '1px solid rgba(200,149,92,0.25)', color: C.amber }
    : {};
  const activeStyle = isActive
    ? { background: lumi ? 'rgba(200,149,92,0.22)' : 'rgba(245,166,35,0.12)', color: C.amber }
    : {};

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
        fontWeight: lumi ? 600 : 500,
        color: isActive ? C.amber : (lumi ? C.amber : C.muted),
        background: 'transparent',
        marginBottom: 2,
        transition: 'all 0.15s ease',
        ...lumiBase,
        ...activeStyle,
      }}
      onMouseEnter={(e) => {
        if (path && !isActive && !lumi) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = C.text;
        }
      }}
      onMouseLeave={(e) => {
        if (path && !isActive && !lumi) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = C.muted;
        }
      }}
    >
      {lumi
        ? <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><LumiFace mood="resting" size={22} showOrb={false} subtle /></span>
        : <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>}
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

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/journal') return currentPath.startsWith('/journal');
    return currentPath === path;
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

      {/* Logo — Lumi's face */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px 20px',
          borderBottom: `1px solid ${palette.border}`,
          marginBottom: 12,
        }}
      >
        <LumiFace mood="resting" size={28} showOrb={false} subtle />
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: palette.accent,
          letterSpacing: '-0.3px',
          fontFamily: "'DM Serif Display', serif",
        }}>
          Lumi
        </span>
      </div>

      {/* Today — Dashboard, Planner, Lumi */}
      {NAV_ITEMS.today.map((item) => (
        <NavItem key={item.label} {...item} isActive={isActive(item.path)} />
      ))}

      {/* Life — Journal, Habits, Budget */}
      <SectionHeader label="Life" />
      {NAV_ITEMS.life.map((item) => (
        <NavItem key={item.label} {...item} isActive={isActive(item.path)} />
      ))}

      {/* More — Settings */}
      <SectionHeader label="More" />
      {NAV_ITEMS.more.map((item) => (
        <NavItem key={item.label} {...item} isActive={isActive(item.path)} />
      ))}

      {/* User Profile */}
      <UserProfile />
    </div>
  );
}

// ─── Mobile bottom nav (5 items: Home | Planner | Lumi center | Journal | Habits)
const BOTTOM_NAV = [
  { icon: '◈',  label: 'Home',    path: '/dashboard',    lumi: false },
  { icon: '📅', label: 'Planner', path: '/schedule',     lumi: false },
  { icon: '✨', label: 'Lumi',    path: '/talk-to-lumi', lumi: true  },
  { icon: '📖', label: 'Journal', path: '/journal',      lumi: false },
  { icon: '🔥', label: 'Habits',  path: '/habits',       lumi: false },
];

function BottomNav({ palette }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const current   = location.pathname;

  function active(path) {
    if (path === '/dashboard') return current === '/dashboard';
    if (path === '/journal')   return current.startsWith('/journal');
    return current === path;
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      minHeight: 60,
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'rgba(6,6,14,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${palette.border}`,
      display: 'flex',
      alignItems: 'center',
    }}>
      {BOTTOM_NAV.map(item => {
        const isAct = active(item.path);
        if (item.lumi) {
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2, height: '100%',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: isAct ? 'rgba(200,149,92,0.35)' : 'rgba(200,149,92,0.18)',
                border: `1.5px solid rgba(200,149,92,0.45)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 1,
                marginBottom: 2,
              }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}><LumiFace mood="resting" size={22} showOrb={false} subtle /></span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-primary)' }}>{item.label}</span>
            </button>
          );
        }
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2, height: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isAct ? palette.accent : C.muted,
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: isAct ? 700 : 400 }}>{item.label}</span>
            {isAct && (
              <div style={{
                position: 'absolute', bottom: 0,
                width: 28, height: 2, borderRadius: 2,
                background: palette.accent,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, palette }) {
  const location = useLocation();
  const current  = location.pathname;
  function isActive(path) {
    if (!path) return false;
    if (path === '/dashboard') return current === '/dashboard';
    if (path === '/journal')   return current.startsWith('/journal');
    return current === path;
  }
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:299, background:'rgba(0,0,0,0.5)' }}
      />
      <div style={{
        position:'fixed', top:0, left:0, bottom:0, width:260, zIndex:300,
        background:'rgba(6,6,14,0.97)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderRight:`1px solid ${palette.border}`,
        padding:'24px 14px',
        display:'flex', flexDirection:'column',
        overflowY:'auto',
        animation:'slideInLeft 0.22s ease',
      }}>
        <style>{`@keyframes slideInLeft { from { transform:translateX(-100%) } to { transform:translateX(0) } }`}</style>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <LumiFace mood="resting" size={24} showOrb={false} subtle />
            <span style={{ fontSize:18, fontWeight:700, color:palette.accent, fontFamily:"'DM Serif Display', serif" }}>Lumi</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
        {NAV_ITEMS.today.map(item => (
          <NavItem key={item.label} {...item} isActive={isActive(item.path)} onClick={onClose} />
        ))}
        <SectionHeader label="Life" />
        {NAV_ITEMS.life.map(item => (
          <NavItem key={item.label} {...item} isActive={isActive(item.path)} onClick={onClose} />
        ))}
        <SectionHeader label="More" />
        {NAV_ITEMS.more.map(item => (
          <NavItem key={item.label} {...item} isActive={isActive(item.path)} onClick={onClose} />
        ))}
      </div>
    </>
  );
}

// ─── Layout Wrapper ─────────────────────────────────────────────────────────────
export default function SidebarLayout({ children, customStyles = {} }) {
  const isMobile = useIsMobile();
  const { palette } = useAtmos();
  const isOnline = useOnlineStatus();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          fontFamily: "'Inter', system-ui, sans-serif",
          position: 'relative',
          zIndex: 1,
          ...customStyles,
        }}
      >
        {/* Offline banner */}
        {!isOnline && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
            background: 'rgba(251,191,36,0.1)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(251,191,36,0.25)',
            padding: '7px 20px',
            fontSize: 11, color: '#fbbf24', textAlign: 'center',
            letterSpacing: '0.02em',
          }}>
            You're offline — your changes are saved and will sync when you reconnect
          </div>
        )}

        {/* Sidebar — desktop only */}
        {!isMobile && <Sidebar />}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              position: 'fixed', top: 14, left: 14, zIndex: 150,
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(6,6,14,0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${palette.border}`,
              color: C.muted, fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ☰
          </button>
        )}

        {/* Mobile slide-over drawer */}
        {isMobile && (
          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} palette={palette} />
        )}

        <div style={{
          flex: 1, overflow: 'auto', position: 'relative', zIndex: 1,
          paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : 0,
          overscrollBehavior: isMobile ? 'none' : 'auto',
        }}>
          <AlarmBar />
          {children}
        </div>

        {/* Bottom nav — mobile only */}
        {isMobile && <BottomNav palette={palette} />}
      </div>
    </>
  );
}
