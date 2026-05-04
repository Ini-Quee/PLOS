import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SidebarLayout, { C } from '../components/layout/SidebarLayout';
import SeasonalBookBackground from '../components/journal/SeasonalBookBackground';
import CreateBookWizard from '../components/journal/CreateBookWizard';
import { initializeSeasonDetection, getCachedSeason, SEASONS } from '../lib/seasonDetection';
import { getBookTheme, BOOK_TYPES } from '../lib/bookThemes';
import api from '../lib/api';

// ─── Default journal book definitions (visual templates — no fake entry counts) ──
const JOURNAL_TEMPLATES = [
  { id: 'personal',  title: 'Everyday Life',  subtitle: 'Thoughts & moments',   emoji: '🌿', color: '#5a7a5a', spine: '#3d5c3d', accent: '#7fb87f',  type: 'personal'  },
  { id: 'spiritual', title: 'Bible & Faith',   subtitle: 'Scripture & reflection',emoji: '✝️', color: '#7a5a3a', spine: '#5c3d1e', accent: '#F5A623',  type: 'spiritual' },
  { id: 'goals',     title: 'Goals & Vision',  subtitle: 'Dreams I am building',  emoji: '🎯', color: '#3a4a7a', spine: '#1e2d5c', accent: '#9b7fe8',  type: 'goals'     },
  { id: 'business',  title: 'My Business',     subtitle: 'Build journal',          emoji: '💡', color: '#7a6a3a', spine: '#5c4e1e', accent: '#ffbe4d',  type: 'business'  },
  { id: 'wellness',  title: 'Mental Health',   subtitle: 'How I really feel',      emoji: '🌸', color: '#7a3a5a', spine: '#5c1e3d', accent: '#e87f9b',  type: 'wellness'  },
  { id: 'budget',    title: 'Budget Diary',    subtitle: 'Money & spending',       emoji: '💰', color: '#3a7a6a', spine: '#1e5c4e', accent: '#00c9a7',  type: 'budget'    },
];

const filters = ['all', 'personal', 'spiritual', 'goals', 'business', 'wellness', 'budget'];

// ─── Mini Calendar Component ────────────────────────────────────────────────────
function MiniCal({ completedDays, accent }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayNum = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const monthLabel = now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ aspectRatio: '1' }} />;
          const done = completedDays.includes(d);
          const isToday = d === todayNum;
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 2,
                background: isToday ? accent : done ? `${accent}40` : 'rgba(255,255,255,0.04)',
                border: isToday ? `1px solid ${accent}` : 'none',
              }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: C.muted, marginTop: 5, textAlign: 'right' }}>{monthLabel}</div>
    </div>
  );
}

// ─── Book Card Component ────────────────────────────────────────────────────────
function BookCard({ journal, onClick, delay, currentSeason }) {
  const [hovered, setHovered] = useState(false);

  // Get theme for this book card
  const cardTheme = currentSeason ? getBookTheme(journal.type, currentSeason) : null;

  return (
    <motion.div
      onClick={() => onClick(journal)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        animation: `fadeUp 0.5s ${delay}s ease both`,
        position: 'relative',
      }}
      whileHover={{ y: -8, scale: 1.02, rotate: -1.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Themed glow on hover */}
      <AnimatePresence>
        {hovered && cardTheme && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: -30,
              background: `radial-gradient(circle, ${cardTheme.gradient1} 0%, transparent 70%)`,
              filter: 'blur(40px)',
              zIndex: -1,
              borderRadius: '50%',
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          background: journal.color,
          borderRadius: '4px 12px 12px 4px',
          padding: '20px 16px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: hovered
            ? `0 20px 40px rgba(0,0,0,0.5),-4px 0 0 ${journal.spine}${cardTheme ? `, 0 0 60px ${cardTheme.accentColor}40` : ''}`
            : `0 8px 24px rgba(0,0,0,0.3),-4px 0 0 ${journal.spine}`,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 24px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{journal.emoji}</span>
          {journal.streak > 0 && (
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 20,
                padding: '3px 8px',
                fontSize: 10,
                color: journal.accent,
                fontWeight: 600,
              }}
            >
              🔥 {journal.streak}d
            </div>
          )}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
          {journal.title}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 'auto' }}>{journal.subtitle}</div>
        <MiniCal completedDays={journal.completedDays} accent={journal.accent} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{journal.entries} entries</div>
          <div style={{ fontSize: 10, color: journal.accent, fontWeight: 500 }}>{journal.lastActive}</div>
        </div>
        {/* Seasonal badge */}
        {cardTheme && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: `${cardTheme.gradient1}`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${cardTheme.accentColor}40`,
              borderRadius: 20,
              padding: '4px 8px',
              fontSize: 9,
              color: cardTheme.accentColor,
              fontWeight: 600,
              opacity: hovered ? 1 : 0.7,
              transition: 'opacity 0.2s',
            }}
          >
            {cardTheme.ambience.split('-')[0]}
          </div>
        )}
      </div>
      {hovered && cardTheme && (
        <div
          style={{
            position: 'absolute',
            bottom: -32,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            color: cardTheme.accentColor,
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {cardTheme.description} →
        </div>
      )}
    </motion.div>
  );
}

// ─── New Journal Card Component ─────────────────────────────────────────────────
function NewJournalCard({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.25s ease',
        animation: 'fadeUp 0.5s 0.5s ease both',
      }}
    >
      <div
        style={{
          background: C.bg3,
          border: `2px dashed ${hovered ? C.amber : C.border2}`,
          borderRadius: '4px 12px 12px 4px',
          padding: '20px 16px',
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          transition: 'border-color 0.2s',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: hovered ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            transition: 'background 0.2s',
          }}
        >
          +
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: hovered ? C.amber : C.warm }}>New Journal</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Create your own book</div>
        </div>
      </div>
    </div>
  );
}

// ─── Week browser helper ──────────────────────────────────────────────────────
function weekStart(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}
function weekEnd(offset = 0) {
  const d = weekStart(offset);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
function isoDate(d) { return d.toISOString().slice(0, 10); }

function WeekBrowser({ journal }) {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!journal?.type) return;
    setLoading(true);
    const from = isoDate(weekStart(weekOffset));
    const to   = isoDate(weekEnd(weekOffset));
    api.get(`/journal/pages?journal_type=${journal.type}&from=${from}&to=${to}&limit=50`)
      .then(res => setEntries(res.data?.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [weekOffset, journal?.type]);

  const ws = weekStart(weekOffset);
  const we = weekEnd(weekOffset);
  const weekLabel = weekOffset === 0 ? 'This week'
    : weekOffset === 1 ? 'Last week'
    : `${ws.toLocaleDateString('en-NG', { day:'numeric', month:'short' })} – ${we.toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}`;

  // Group by entry_date
  const grouped = {};
  entries.forEach(e => {
    if (!grouped[e.entry_date]) grouped[e.entry_date] = [];
    grouped[e.entry_date].push(e);
  });
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {/* Week navigator */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button
          onClick={() => setWeekOffset(v => v + 1)}
          style={{ padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`, color:C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}
        >← Older</button>
        <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{weekLabel}</span>
        <button
          onClick={() => setWeekOffset(v => Math.max(0, v - 1))}
          disabled={weekOffset === 0}
          style={{ padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`, color: weekOffset === 0 ? 'rgba(255,255,255,0.15)' : C.muted, fontSize:12, cursor: weekOffset === 0 ? 'default' : 'pointer', fontFamily:'inherit' }}
        >Newer →</button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:'32px 0', color:C.muted, fontSize:12 }}>Loading…</div>}

      {!loading && days.length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 0' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🌿</div>
          <div style={{ fontSize:13, color:C.muted }}>A quiet week — nothing written here yet</div>
        </div>
      )}

      {!loading && days.map(date => (
        <div key={date} style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:700, color:journal.accent, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            {new Date(date + 'T00:00:00').toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long' })}
          </div>
          {grouped[date].map((e, i) => {
            const snippet = JSON.stringify(e.fields || {}).replace(/[{}"]/g, '').replace(/:/g, ': ').slice(0, 140);
            return (
              <div
                key={e.id || i}
                onClick={() => navigate(`/journal/page?type=${e.journal_type}&template=${encodeURIComponent(e.template_name)}&date=${e.entry_date}`)}
                style={{ background:C.bg3, border:`1px solid ${C.border2}`, borderRadius:10, padding:'12px 14px', marginBottom:8, cursor:'pointer' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:journal.accent }}>{e.template_name}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{new Date(e.updated_at).toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' })}</span>
                </div>
                <div style={{ fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{snippet || 'Entry saved'}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Open Journal Modal Component ───────────────────────────────────────────────
function OpenJournal({ journal, onClose }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('entries');
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  if (!journal) return null;

  useEffect(() => {
    setLoadingEntries(true);
    api.get('/journal/entries?limit=20')
      .then(res => {
        const all = res.data?.entries || [];
        setEntries(all);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  }, [journal.type]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayNum = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const monthLabel = now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

  const writtenDays = entries.map(e => new Date(e.recorded_at).getDate());
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          background: C.bg2,
          border: `1px solid ${journal.accent}30`,
          borderRadius: 20,
          width: '85%',
          maxWidth: 800,
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: journal.color,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
          }}
        >
          <span style={{ fontSize: 40 }}>{journal.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{journal.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{journal.subtitle}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                `${journal.entries} entries`,
                `🔥 ${journal.streak} day streak`,
                `Last: ${journal.lastActive}`,
              ].map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    color: i === 0 ? journal.accent : 'rgba(255,255,255,0.5)',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border2}`, padding: '0 28px' }}>
          {['entries', 'browse', 'calendar', 'ai-insights'].map((t) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 16px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                color: tab === t ? journal.accent : C.muted,
                borderBottom: tab === t ? `2px solid ${journal.accent}` : '2px solid transparent',
                marginBottom: -1,
                textTransform: 'capitalize',
              }}
            >
              {t === 'ai-insights' ? '✨ AI Insights' : t === 'browse' ? '📅 Browse' : t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          {tab === 'entries' && (
            <div>
              <div
                onClick={() => navigate(`/journal/page?type=${journal.type}`)}
                style={{
                  background: `${journal.color}20`,
                  border: `1px solid ${journal.accent}30`,
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20 }}>✍️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.warm }}>Write today&apos;s entry...</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Tap to write · or use voice 🎙</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${C.border2}`,
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 11,
                      color: C.muted,
                      cursor: 'pointer',
                    }}
                  >
                    🎙 Voice
                  </div>
                  <div
                    style={{
                      background: `${journal.accent}20`,
                      border: `1px solid ${journal.accent}40`,
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 11,
                      color: journal.accent,
                      cursor: 'pointer',
                    }}
                  >
                    + Write
                  </div>
                </div>
              </div>
              {loadingEntries ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 12 }}>Loading entries…</div>
              ) : entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✍️</div>
                  <div style={{ fontSize: 13, color: C.warm, marginBottom: 4 }}>This is your space</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Write when you're ready. There's no pressure.</div>
                </div>
              ) : entries.map((e, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/journal/page?id=${e.id}`)}
                  style={{
                    background: C.bg3,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    marginBottom: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: journal.accent }}>
                      {new Date(e.recorded_at).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {e.word_count > 0 && <span style={{ fontSize: 10, color: C.muted }}>{e.word_count} words</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Entry is encrypted — tap to read</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'browse' && <WeekBrowser journal={journal} />}

          {tab === 'calendar' && (
            <div>
              <div style={{ fontSize: 13, color: C.warm, marginBottom: 16 }}>{monthLabel} — your writing activity</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 8 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} style={{ fontSize: 10, color: C.muted, textAlign: 'center' }}>
                    {d}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
                {cells.map((d, i) => {
                  if (!d) return <div key={i} style={{ aspectRatio: '1' }} />;
                  const done = writtenDays.includes(d);
                  const isToday = d === todayNum;
                  return (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 8,
                        background: isToday ? journal.accent : done ? `${journal.accent}35` : C.bg4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: isToday ? '#000' : done ? journal.accent : C.muted,
                        fontWeight: isToday ? 700 : done ? 600 : 400,
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  [writtenDays.length, 'days written this month'],
                  [entries.length, 'total entries loaded'],
                  [entries.filter(e => {
                    const d = new Date(e.recorded_at);
                    return d.getMonth() === month && d.getFullYear() === year;
                  }).length, 'entries this month'],
                ].map(([v, l], i) => (
                  <div
                    key={i}
                    style={{
                      background: C.bg3,
                      border: `1px solid ${C.border2}`,
                      borderRadius: 10,
                      padding: '14px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 700, color: journal.accent }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ai-insights' && (
            <div>
              <div
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle,#ffbe4d,#F5A623)',
                      animation: 'breathe 3s infinite',
                    }}
                  />
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9b7fe8' }}>Lumi&apos;s analysis</div>
                </div>
                <div style={{ fontSize: 12, color: C.warm, lineHeight: 1.7 }}>
                  {entries.length === 0
                    ? 'Write a few entries and Lumi will start surfacing patterns in your writing — consistency, mood trends, and what topics energise you most.'
                    : `You have ${entries.length} entries loaded. Keep writing — Lumi learns your patterns over time and will share insights here.`}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['📝', 'Total entries', entries.length || '—'],
                  ['📅', 'Days written this month', writtenDays.length || '—'],
                  ['🔥', 'Recent streak', entries.length > 0 ? 'Check History' : '—'],
                  ['✍️', 'Latest entry', entries[0] ? new Date(entries[0].recorded_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—'],
                ].map(([icon, label, value], i) => (
                  <div
                    key={i}
                    style={{
                      background: C.bg3,
                      border: `1px solid ${C.border2}`,
                      borderRadius: 10,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: journal.accent }}>{value}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Journal Dashboard ─────────────────────────────────────────────────────
export default function JournalDashboard() {
  const navigate = useNavigate();
  const [openJournal, setOpenJournal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showWizard, setShowWizard] = useState(false);
  const [customJournals, setCustomJournals] = useState([]);

  // Load custom journal types created by the user
  useEffect(() => {
    api.get('/journal/pages/types').then(res => setCustomJournals(res.data?.types || [])).catch(() => {});
  }, []);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef(null);

  const runSearch = useCallback(async (q, date) => {
    if (!q && !date) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (q) params.set('q', q);
      if (date) params.set('date', date);
      const res = await api.get(`/journal/pages?${params}`);
      setSearchResults(res.data?.entries || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => runSearch(searchQuery, searchDate), 400);
  }, [searchQuery, searchDate, runSearch]);

  // Daily entries from Lumi — the cross-posted narrative of each day
  const [dailyEntries, setDailyEntries] = useState([]);
  const [showDailyEntry, setShowDailyEntry] = useState(null);

  useEffect(() => {
    api.get('/lumi/daily-entries?limit=14')
      .then(res => setDailyEntries(res.data?.entries || []))
      .catch(() => {});
  }, []);

  // Real stats loaded from API — merged onto the visual templates
  const [journalStats, setJournalStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api.get('/journal/entries?limit=200')
      .then(res => {
        const allEntries = res.data?.entries || [];
        const now = new Date();
        const stats = {};
        allEntries.forEach(e => {
          const d = new Date(e.recorded_at);
          const daysAgo = Math.floor((now - d) / (1000 * 60 * 60 * 24));
          // We don't have journal_type per entry in the encrypted schema;
          // count everything toward the library total
          if (!stats._total) stats._total = { count: 0, days: new Set(), latestDaysAgo: null };
          stats._total.count++;
          stats._total.days.add(d.toDateString());
          if (stats._total.latestDaysAgo === null || daysAgo < stats._total.latestDaysAgo) {
            stats._total.latestDaysAgo = daysAgo;
          }
        });
        setJournalStats(stats);
      })
      .catch(() => setJournalStats({}))
      .finally(() => setStatsLoading(false));
  }, []);

  // Season detection state
  const [currentSeason, setCurrentSeason] = useState(null);
  const [userCountry, setUserCountry] = useState(null);
  const [seasonInfo, setSeasonInfo] = useState(null);
  const [seasonInitialized, setSeasonInitialized] = useState(false);

  // Initialize season detection ONCE
  useEffect(() => {
    if (seasonInitialized) return;

    async function loadSeason() {
      const { season, countryCode, seasonInfo: info } = await initializeSeasonDetection();
      setCurrentSeason(season);
      setUserCountry(countryCode);
      setSeasonInfo(info);
      setSeasonInitialized(true);
      console.log(`📍 Season loaded: ${countryCode}, ${info.name} ${info.emoji}`);
    }
    loadSeason();
  }, []); // Empty array - run once only

  // Memoize active book type to prevent recalculation
  const activeBookType = useMemo(() => {
    if (openJournal?.type) return openJournal.type;
    if (filter !== 'all') return filter;
    return BOOK_TYPES.PERSONAL;
  }, [openJournal, filter]);

  // Memoize theme to prevent unnecessary recalculation
  const theme = useMemo(() => {
    if (!currentSeason) return null;
    return getBookTheme(activeBookType, currentSeason);
  }, [activeBookType, currentSeason]);

  // Merge visual templates with real stats
  const JOURNALS = JOURNAL_TEMPLATES.map(t => ({
    ...t,
    entries: journalStats._total?.count || 0,
    streak: 0,
    lastActive: journalStats._total?.latestDaysAgo === 0 ? 'Today' : journalStats._total?.latestDaysAgo === 1 ? 'Yesterday' : journalStats._total?.latestDaysAgo != null ? `${journalStats._total.latestDaysAgo} days ago` : 'Ready when you are',
    completedDays: [],
  }));

  const filtered = filter === 'all' ? JOURNALS : JOURNAL_TEMPLATES.filter((j) => j.type === filter).map(t => ({
    ...t,
    entries: journalStats._total?.count || 0,
    streak: 0,
    lastActive: journalStats._total?.latestDaysAgo === 0 ? 'Today' : journalStats._total?.latestDaysAgo === 1 ? 'Yesterday' : journalStats._total?.latestDaysAgo != null ? `${journalStats._total.latestDaysAgo} days ago` : 'Ready when you are',
    completedDays: [],
  }));

  return (
    <>
      <style>{`
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }
  @keyframes breathe { 0%,100% { transform:scale(1) } 50% { transform:scale(1.08) } }
      `}</style>

      <SidebarLayout>
        {/* Dynamic seasonal background - inside layout, behind content */}
        {theme && currentSeason && (
          <SeasonalBookBackground
            key={`background-${activeBookType}-${currentSeason}`}
            bookType={activeBookType}
            season={currentSeason}
            theme={theme}
          />
        )}
        {/* Header Section */}
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              📖 Your journals
              {seasonInfo && (
                <span
                  style={{
                    fontSize: 10,
                    color: theme?.accentColor || C.amber,
                    background: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                  title={seasonInfo.description}
                >
                  {seasonInfo.emoji} {seasonInfo.name}
                </span>
              )}
            </div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>My Library</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                {JOURNAL_TEMPLATES.length} journals · {statsLoading ? '…' : (journalStats._total?.count || 0)} total entries
                {journalStats._total?.latestDaysAgo === 0 ? ' · updated today' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                style={{
                  background: C.bg3,
                  border: `1px solid ${C.border2}`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 11,
                  color: C.muted,
                  cursor: 'pointer',
                }}
              >
                🎙 Quick voice entry
              </div>
              <div
                onClick={() => setShowWizard(true)}
                style={{
                  background: 'rgba(245,166,35,0.12)',
                  border: `1px solid ${C.amber}40`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 11,
                  color: C.amber,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + New Journal
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 20,
              paddingBottom: 20,
              borderBottom: `1px solid ${C.border}`,
              flexWrap: 'wrap',
            }}
          >
            {filters.map((f) => (
              <div
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: filter === f ? 'rgba(245,166,35,0.15)' : C.bg3,
                  border: `1px solid ${filter === f ? C.amber + '50' : C.border2}`,
                  color: filter === f ? C.amber : C.muted,
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>

      {/* Search bar + date picker */}
      <div style={{ padding: '12px 32px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search your journals…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border2}`,
            color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <input
          type="date"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          style={{
            padding: '9px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border2}`,
            color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
            colorScheme: 'dark',
          }}
        />
        {(searchQuery || searchDate) && (
          <button
            onClick={() => { setSearchQuery(''); setSearchDate(''); setSearchResults([]); }}
            style={{
              padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border2}`,
              background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Search results */}
      {(searchQuery || searchDate) && (
        <div style={{ padding: '12px 32px 0' }}>
          {searching ? (
            <div style={{ fontSize: 12, color: C.muted }}>Searching…</div>
          ) : searchResults.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted }}>No entries found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              {searchResults.map((entry, i) => {
                const snippet = JSON.stringify(entry.fields || {})
                  .replace(/[{}"]/g, '').replace(/:/g, ': ').slice(0, 120);
                return (
                  <div
                    key={entry.id || i}
                    onClick={() => navigate(`/journal/page?type=${entry.journal_type}&template=${encodeURIComponent(entry.template_name)}&date=${entry.entry_date}`)}
                    style={{
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border2}`,
                      display: 'flex', alignItems: 'baseline', gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, color: C.amber, fontWeight: 600, flexShrink: 0 }}>
                      {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, flexShrink: 0, textTransform: 'capitalize' }}>
                      {entry.journal_type} · {entry.template_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {snippet}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Daily Life entries from Lumi — shown when filter is 'all' or 'personal' */}
      {!searchQuery && !searchDate && (filter === 'all' || filter === 'personal') && dailyEntries.length > 0 && (
        <div style={{ padding: '0 32px 4px' }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            📖 Daily Life — Lumi's log of your days
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
            {dailyEntries.map((entry, i) => {
              const d = new Date(entry.entry_date + 'T00:00:00');
              const isToday = entry.entry_date === new Date().toISOString().slice(0, 10);
              const secs = entry.sections || {};
              const expCount = (secs.expenses || []).length;
              const workoutCount = (secs.workouts || []).length;
              const lifeCount = (secs.life_notes || []).length;
              return (
                <div key={entry.id || i}
                  onClick={() => setShowDailyEntry(entry)}
                  style={{
                    flexShrink: 0, width: 160, background: isToday ? 'rgba(200,149,92,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isToday ? 'rgba(200,149,92,0.3)' : C.border}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? C.amber : C.text, marginBottom: 4 }}>
                    {isToday ? 'Today' : d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  {entry.mood && <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, fontStyle: 'italic' }}>{entry.mood}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {expCount > 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(232,164,80,0.15)', color: C.amber }}>₦ {expCount} item{expCount > 1 ? 's' : ''}</span>}
                    {workoutCount > 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(0,212,170,0.12)', color: '#00d4aa' }}>💪</span>}
                    {lifeCount > 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(165,180,252,0.12)', color: '#a5b4fc' }}>📝 {lifeCount}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {entry.narrative?.split('\n')[0] || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bookshelf grid — hidden during search */}
      {!searchQuery && !searchDate && <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
          gap: 24,
          padding: '28px 32px 40px',
        }}
      >
        {filtered.map((j, i) => (
          <BookCard key={j.id} journal={j} onClick={setOpenJournal} delay={i * 0.06} currentSeason={currentSeason} />
        ))}
        {customJournals.map((cj, i) => (
          <BookCard
            key={cj.id}
            journal={{
              id: cj.type_key,
              title: cj.label,
              subtitle: `${(cj.templates || []).length} section${(cj.templates || []).length !== 1 ? 's' : ''}`,
              emoji: cj.emoji || '📓',
              color: cj.color || '#7C3AED',
              spine: cj.color ? cj.color + 'bb' : '#5a3aed',
              accent: cj.color || '#a5b4fc',
              type: cj.type_key,
              entries: 0, streak: 0, lastActive: 'Ready when you are', completedDays: [],
            }}
            onClick={(j) => navigate(`/journal/page?type=${j.type}`)}
            delay={(filtered.length + i) * 0.06}
            currentSeason={currentSeason}
          />
        ))}
        <NewJournalCard onClick={() => setShowWizard(true)} />
      </div>}

      {/* Daily Entry Modal */}
      {showDailyEntry && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target===e.currentTarget && setShowDailyEntry(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {new Date(showDailyEntry.entry_date + 'T00:00:00').toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </div>
                {showDailyEntry.mood && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Mood: {showDailyEntry.mood}</div>}
              </div>
              <button onClick={() => setShowDailyEntry(null)} style={{ background:'none', border:'none', color: C.muted, fontSize:20, cursor:'pointer', padding:'2px 6px' }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {showDailyEntry.narrative?.split('\n').filter(Boolean).map((line, i) => (
                <div key={i} style={{ fontSize: 13, color: C.text, lineHeight: 1.8, marginBottom: 6, padding: '6px 0', borderBottom: `1px solid ${C.border2}` }}>
                  {line}
                </div>
              ))}
              {/* Structured data */}
              {(showDailyEntry.sections?.expenses || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Expenses</div>
                  {showDailyEntry.sections.expenses.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${C.border2}` }}>
                      <span>{e.category}{e.note ? ` — ${e.note}` : ''}</span>
                      <span style={{ color: C.amber, fontWeight: 600 }}>{e.currency || '₦'}{Number(e.amount).toLocaleString('en-NG')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Active theme indicator */}
        {theme && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'fixed',
              top: 20,
              right: 32,
              background: `${theme.gradient1}`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.accentColor}40`,
              borderRadius: 12,
              padding: '8px 14px',
              fontSize: 11,
              color: theme.accentColor,
              fontWeight: 600,
              zIndex: 100,
              boxShadow: `0 4px 12px ${theme.accentColor}20`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>{seasonInfo?.emoji}</span>
            {theme.ambience.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Theme
          </motion.div>
        )}

        {/* Stats bar */}
        <div
          style={{
            margin: '0 32px 32px',
            background: C.bg2,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '16px 24px',
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {[
            [statsLoading ? '…' : (journalStats._total?.days?.size || 0), 'days written total', C.amber],
            [statsLoading ? '…' : (journalStats._total?.count || 0), 'total entries written', C.teal],
            [journalStats._total?.latestDaysAgo === 0 ? '✓' : '—', 'written today', C.purple],
            [JOURNAL_TEMPLATES.length, 'books in library', C.rose],
          ].map(([v, l, c], i) => (
            <div key={i}>
              <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
            </div>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <div
              style={{
                background: 'rgba(245,166,35,0.08)',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11,
                color: C.amber,
                cursor: 'pointer',
              }}
            >
              ✨ Ask Lumi about my journals →
            </div>
          </div>
        </div>
      </SidebarLayout>

      {/* Journal detail modal */}
      {openJournal && <OpenJournal journal={openJournal} onClose={() => setOpenJournal(null)} />}

      {/* Create book wizard */}
      {showWizard && (
        <CreateBookWizard
          onClose={() => setShowWizard(false)}
          onCreated={(newType) => {
            setCustomJournals(prev => [...prev, newType]);
            setShowWizard(false);
          }}
        />
      )}
    </>
  );
}
