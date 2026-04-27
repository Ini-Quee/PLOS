import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout, { C } from '../components/layout/SidebarLayout';

// ─── Journal Data ───────────────────────────────────────────────────────────────
const JOURNALS = [
  {
    id: 1,
    title: 'Everyday Life',
    subtitle: 'Thoughts & moments',
    emoji: '🌿',
    color: '#5a7a5a',
    spine: '#3d5c3d',
    accent: '#7fb87f',
    entries: 47,
    lastActive: 'Today',
    streak: 14,
    type: 'personal',
    completedDays: [1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 26],
  },
  {
    id: 2,
    title: 'Bible & Faith',
    subtitle: 'Scripture & reflection',
    emoji: '✝️',
    color: '#7a5a3a',
    spine: '#5c3d1e',
    accent: '#F5A623',
    entries: 31,
    lastActive: 'Yesterday',
    streak: 9,
    type: 'spiritual',
    completedDays: [1, 3, 5, 7, 9, 11, 13, 14, 15, 16, 17, 19, 21, 22, 24, 26],
  },
  {
    id: 3,
    title: 'Goals & Vision',
    subtitle: 'Dreams I am building',
    emoji: '🎯',
    color: '#3a4a7a',
    spine: '#1e2d5c',
    accent: '#9b7fe8',
    entries: 18,
    lastActive: '3 days ago',
    streak: 3,
    type: 'goals',
    completedDays: [2, 5, 9, 12, 15, 17, 19, 22, 24, 26],
  },
  {
    id: 4,
    title: 'My Business',
    subtitle: 'PLOS build journal',
    emoji: '💡',
    color: '#7a6a3a',
    spine: '#5c4e1e',
    accent: '#ffbe4d',
    entries: 22,
    lastActive: 'Today',
    streak: 7,
    type: 'business',
    completedDays: [1, 2, 4, 5, 7, 8, 9, 11, 14, 15, 17, 18, 20, 22, 23, 24, 26],
  },
  {
    id: 5,
    title: 'Mental Health',
    subtitle: 'How I really feel',
    emoji: '🌸',
    color: '#7a3a5a',
    spine: '#5c1e3d',
    accent: '#e87f9b',
    entries: 12,
    lastActive: '1 week ago',
    streak: 0,
    type: 'wellness',
    completedDays: [3, 7, 10, 14, 17, 19, 22],
  },
  {
    id: 6,
    title: 'Budget Diary',
    subtitle: 'Money & spending',
    emoji: '💰',
    color: '#3a7a6a',
    spine: '#1e5c4e',
    accent: '#00c9a7',
    entries: 34,
    lastActive: 'Today',
    streak: 11,
    type: 'budget',
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  },
];

const filters = ['all', 'personal', 'spiritual', 'goals', 'business', 'wellness', 'budget'];

// ─── Mini Calendar Component ────────────────────────────────────────────────────
function MiniCal({ completedDays, accent }) {
  const cells = [...Array(3).fill(null), ...Array.from({ length: 27 }, (_, i) => i + 1)];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ aspectRatio: '1' }} />;
          const done = completedDays.includes(d);
          const isToday = d === 27;
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
      <div style={{ fontSize: 9, color: C.muted, marginTop: 5, textAlign: 'right' }}>April 2026</div>
    </div>
  );
}

// ─── Book Card Component ────────────────────────────────────────────────────────
function BookCard({ journal, onClick, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(journal)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        animation: `fadeUp 0.5s ${delay}s ease both`,
        transform: hovered ? 'translateY(-6px) rotate(-1deg)' : 'translateY(0)',
        transition: 'transform 0.25s ease',
        position: 'relative',
      }}
    >
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
            ? `0 20px 40px rgba(0,0,0,0.5),-4px 0 0 ${journal.spine}`
            : `0 8px 24px rgba(0,0,0,0.3),-4px 0 0 ${journal.spine}`,
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
      </div>
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            color: journal.accent,
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          Tap to open →
        </div>
      )}
    </div>
  );
}

// ─── New Journal Card Component ─────────────────────────────────────────────────
function NewJournalCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
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

// ─── Open Journal Modal Component ───────────────────────────────────────────────
function OpenJournal({ journal, onClose }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('entries');

  const entries = [
    {
      date: 'Today, Apr 27',
      preview: 'Feeling a lot better today. Got back to working on PLOS and made real progress...',
      words: 312,
      mood: '😊',
    },
    {
      date: 'Apr 25',
      preview: 'Been sick for a few days. Hard to focus but I am still thinking about the app...',
      words: 188,
      mood: '😔',
    },
    {
      date: 'Apr 23',
      preview: 'Fixed the PostgreSQL bug today. 63 locations across 8 files. Unbelievable.',
      words: 445,
      mood: '💪',
    },
  ];

  const cells = [...Array(3).fill(null), ...Array.from({ length: 27 }, (_, i) => i + 1)];

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
          {['entries', 'calendar', 'ai-insights'].map((t) => (
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
              {t === 'ai-insights' ? '✨ AI Insights' : t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          {tab === 'entries' && (
            <div>
              <div
                onClick={() => navigate(`/journal/write/${journal.type}`)}
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
              {entries.map((e, i) => (
                <div
                  key={i}
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: journal.accent }}>{e.date}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 14 }}>{e.mood}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{e.words} words</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.warm, lineHeight: 1.6, opacity: 0.8 }}>{e.preview}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'calendar' && (
            <div>
              <div style={{ fontSize: 13, color: C.warm, marginBottom: 16 }}>April 2026 — your writing activity</div>
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
                  const done = journal.completedDays.includes(d);
                  const isToday = d === 27;
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
                  [journal.completedDays.length, 'days written'],
                  [journal.streak, 'day streak'],
                  [journal.entries, 'total entries'],
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
                  You write most consistently in the mornings, especially on weekdays. Your entries are longer when
                  you have had a breakthrough or solved a problem. This month you skipped 6 days — all were weekends.
                  Your mood scores are higher in entries where you mention building or creating.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['📝', 'Avg. entry length', '287 words'],
                  ['⏰', 'Most active time', '9–11am'],
                  ['😊', 'Top mood', 'Determined 💪'],
                  ['🔤', 'Most used word', '"Build"'],
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

  const filtered = filter === 'all' ? JOURNALS : JOURNALS.filter((j) => j.type === filter);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }
        @keyframes breathe { 0%,100% { transform:scale(1) } 50% { transform:scale(1.08) } }
      `}</style>
      <SidebarLayout>
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
                }}
              >
                📖 Your journals
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>My Library</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                {JOURNALS.length} journals · {JOURNALS.reduce((a, j) => a + j.entries, 0)} total entries ·{' '}
                {JOURNALS.filter((j) => j.lastActive === 'Today').length} updated today
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

        {/* Bookshelf grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
            gap: 24,
            padding: '28px 32px 40px',
          }}
        >
          {filtered.map((j, i) => (
            <BookCard key={j.id} journal={j} onClick={setOpenJournal} delay={i * 0.06} />
          ))}
          <NewJournalCard />
        </div>

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
            [JOURNALS.reduce((a, j) => a + j.streak, 0), 'combined streak days', C.amber],
            [JOURNALS.reduce((a, j) => a + j.entries, 0), 'total entries written', C.teal],
            [JOURNALS.filter((j) => j.lastActive === 'Today').length, 'journals active today', C.purple],
            [JOURNALS.length, 'books in library', C.rose],
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

      {/* Modal */}
      {openJournal && <OpenJournal journal={openJournal} onClose={() => setOpenJournal(null)} />}
    </>
  );
}
