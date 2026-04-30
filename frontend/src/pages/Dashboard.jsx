import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarLayout, { C } from '../components/layout/SidebarLayout'
import { useLumi } from '../hooks/useLumi'

// ─── Design tokens are now imported from SidebarLayout ─────────────────────────

const SEASONS = {
  harmattan: { label: '☀️ Harmattan', bg: '#07070f' },
  rain: { label: '🌧 Rainy', bg: '#070d0f' },
  night: { label: '🌙 Night', bg: '#040408' },
  dawn: { label: '🌅 Dawn', bg: '#0f0a07' },
}

// ─── Static mock data (replace with real API calls) ───────────────────────────
const SCHEDULE = [
  // Empty schedule - user hasn't created any routines yet
]

const HABITS = [
  // Empty habits - user hasn't set up any habits yet
]

const GOALS = [
  // Empty goals - user hasn't created any goals yet
]

const JOURNAL_SPARK = []
const COMPLETED_DAYS = []
const TODAY_DATE = 27

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, badge, badgeType, accentColor, delay }) {
  const badgeColors = {
    up: { bg: 'rgba(0,212,170,0.12)', color: C.teal },
    down: { bg: 'rgba(244,114,182,0.12)', color: C.pink },
    warn: { bg: 'rgba(245,166,35,0.12)', color: C.amber },
  }
  const bc = badgeColors[badgeType] || badgeColors.warn

  return (
    <div style={{
      background: C.bg2,
      border: `1px solid ${C.border}`,
      borderTop: `1px solid ${accentColor}40`,
      borderRadius: 16,
      padding: 18,
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      animation: `fadeUp 0.5s ${delay}s ease both`,
    }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        {label}
      </div>
      <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 32, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</div>
      {badge && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '3px 7px', borderRadius: 20, marginTop: 8, fontWeight: 500, background: bc.bg, color: bc.color }}>
          {badge}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, width: '72%', borderRadius: '0 0 0 16px', background: accentColor }} />
    </div>
  )
}

function Calendar() {
  const startDay = 3
  const days = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= 30; d++) days.push(d)

  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.25s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>April 2026 — activity map</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['‹','›'].map(b => (
            <button key={b} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>{b}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} style={{ fontSize: 9, color: C.muted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {days.map((d, i) => {
          if (!d) return <div key={i} />
          const isToday = d === TODAY_DATE
          const isFilled = COMPLETED_DAYS.includes(d)
          return (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, cursor: 'pointer', position: 'relative',
              color: isToday ? '#000' : isFilled ? C.amber : C.muted,
              background: isToday ? C.amber : isFilled ? 'rgba(245,166,35,0.15)' : 'transparent',
              fontWeight: isToday ? 700 : isFilled ? 600 : 400,
              boxShadow: isToday ? '0 4px 12px rgba(245,166,35,0.4)' : 'none',
            }}>
              {d}
              {isFilled && !isToday && (
                <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: C.amber }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LumiCard() {
  const navigate = useNavigate()
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(245,166,35,0.08))',
      border: '1px solid rgba(139,92,246,0.2)', borderRadius: 16, padding: 18,
      animation: 'fadeUp 0.5s 0.3s ease both', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #ffbe4d, ${C.amber}, rgba(245,166,35,0.4))`,
        marginBottom: 12, animation: 'breathe 3s ease-in-out infinite',
        boxShadow: '0 0 20px rgba(245,166,35,0.3)',
      }} />
      <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Lumi says</div>
      <div style={{ fontSize: 12, lineHeight: 1.6, color: C.text, opacity: 0.85 }}>
        Welcome to PLOS, Erica. I'm your daily companion. Start by journaling or talking to me about your day. I'm here to help you build the life you want.
      </div>
      <div
        onClick={() => navigate('/talk-to-lumi')}
        style={{
          marginTop: 12,
          background: 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 8, padding: '7px 12px', fontSize: 11, color: C.purple,
          cursor: 'pointer', display: 'inline-block', transition: 'all 0.2s',
        }}
      >
        Talk to Lumi →
      </div>
    </div>
  )
}

function ScheduleCard() {
  const navigate = useNavigate()
  const [items, setItems] = useState(SCHEDULE)

  if (items.length === 0) {
    return (
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.35s ease both', gridColumn: 'span 2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Today's schedule</div>
          <div style={{ fontSize: 11, color: C.amber, cursor: 'pointer' }} onClick={() => navigate('/schedule')}>Set up →</div>
        </div>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>No schedule yet</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Add your daily routines and Lumi will guide you through your day</div>
          <button
            onClick={() => navigate('/schedule')}
            style={{
              padding: '10px 20px',
              background: C.amber,
              border: 'none',
              borderRadius: 10,
              color: '#0D0D0D',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create your first routine
          </button>
        </div>
      </div>
    )
  }

  const toggle = (i) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, done: !it.done } : it))
  }

  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.35s ease both', gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Today's schedule</div>
        <div style={{ fontSize: 11, color: C.amber, cursor: 'pointer' }}>See all →</div>
      </div>
      {items.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <span style={{ fontSize: 10, color: C.muted, width: 42, flexShrink: 0, textAlign: 'right' }}>{s.time}</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: s.done ? C.muted : C.text, textDecoration: s.done ? 'line-through' : 'none' }}>{s.name}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{s.cat}</div>
          </div>
          <div
            onClick={() => toggle(i)}
            style={{
              width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
              background: s.done ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
              border: s.done ? 'none' : `1px solid ${C.border}`,
              color: s.done ? C.teal : 'transparent',
            }}
          >✓</div>
        </div>
      ))}
    </div>
  )
}

function BudgetCard() {
  const navigate = useNavigate()
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.4s ease both' }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Monthly budget</div>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Track your spending and savings goals</div>
        <button
          onClick={() => navigate('/budget')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: `1px solid ${C.amber}`,
            borderRadius: 10,
            color: C.amber,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Set up budget
        </button>
      </div>
    </div>
  )
}

function HabitsCard() {
  const navigate = useNavigate()
  const hasHabits = HABITS.length > 0

  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.45s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
        Habits
        {hasHabits && <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>last 7 days</span>}
      </div>
      {!hasHabits ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔥</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Build consistency one day at a time</div>
          <button
            onClick={() => navigate('/habits')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${C.teal}`,
              borderRadius: 10,
              color: C.teal,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add first habit
          </button>
        </div>
      ) : (
        HABITS.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < HABITS.length - 1 ? 10 : 0 }}>
            <span style={{ fontSize: 14, width: 24 }}>{h.icon}</span>
            <span style={{ fontSize: 12, flex: 1 }}>{h.name}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {h.week.map((d, j) => (
                <div
                  key={j}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: j === 6 ? C.amber : d ? C.teal : 'rgba(255,255,255,0.08)',
                    animation: j === 6 ? 'pulse 2s infinite' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function GoalsCard() {
  const navigate = useNavigate()
  const hasGoals = GOALS.length > 0

  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.5s ease both' }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Life goals</div>
      {!hasGoals ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>No goals set yet</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Define what you want to achieve and track your progress</div>
          <button
            onClick={() => navigate('/goals')}
            style={{
              padding: '10px 20px',
              background: C.amber,
              border: 'none',
              borderRadius: 10,
              color: '#0D0D0D',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Set your first goal
          </button>
        </div>
      ) : (
        GOALS.map((g, i) => (
          <div key={i} style={{ marginBottom: i < GOALS.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
              <span>{g.name}</span>
              <span style={{ color: C.muted }}>{g.pct}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <div style={{ height: 5, width: `${g.pct}%`, background: g.color, borderRadius: 3, transition: 'width 1.4s ease' }} />
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function ReadingCard() {
  const navigate = useNavigate()
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.55s ease both' }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Reading</div>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Track your reading journey</div>
        <button
          onClick={() => navigate('/books')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: `1px solid ${C.purple}`,
            borderRadius: 10,
            color: C.purple,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Add your first book
        </button>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [season, setSeason] = useState('harmattan')
  const [showSeasonMenu, setShowSeasonMenu] = useState(false)
  const navigate = useNavigate()

  // Lumi hook
  const { 
    isListening, 
    isThinking, 
    lumiResponse, 
    savedRoute, 
    needsConfirmation, 
    pendingState,
    startListening, 
    stopListening, 
    sendText,
    confirmSave,
    declineSave 
  } = useLumi('dashboard')

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes breathe { 0%,100% { transform:scale(1); box-shadow:0 0 20px rgba(245,166,35,0.3) } 50% { transform:scale(1.08); box-shadow:0 0 35px rgba(245,166,35,0.5) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
      <SidebarLayout customStyles={{ background: 'transparent' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 0' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              Good morning, <span style={{ color: C.amber }}>Erica</span> ☀️
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Sunday, April 27 · {SEASONS[season].label} · 3 tasks remaining
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div
              onClick={() => navigate('/settings')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 12,
                cursor: 'pointer', color: C.muted
              }}
            >
              ⚙️ Settings
            </div>
            <div
              onClick={() => setShowSeasonMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 12,
                cursor: 'pointer', color: C.muted
              }}
            >
              🌤 Change season ▾
            </div>

            {/* Season dropdown */}
            {showSeasonMenu && (
              <div style={{
                position: 'absolute', top: 42, right: 44, background: C.bg3,
                border: `1px solid ${C.border}`, borderRadius: 12, padding: 8,
                zIndex: 100, minWidth: 160
              }}>
                {Object.entries(SEASONS).map(([key, s]) => (
                  <div
                    key={key}
                    onClick={() => { setSeason(key); setShowSeasonMenu(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      fontSize: 12, color: season === key ? C.amber : C.muted
                    }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            )}

            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative'
            }}>
              🔔
              <div style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: C.amber }} />
            </div>
          </div>
        </div>

        {/* Lumi Quick Capture Bar */}
        <div style={{
          margin: '16px 28px 0',
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.15)',
          borderRadius: 14,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          {/* Lumi orb */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ffbe4d, #F5A623)',
            animation: isListening ? 'breathe 0.8s infinite' : 'breathe 3s infinite',
            flexShrink: 0,
            boxShadow: isListening ? '0 0 20px rgba(245,166,35,0.6)' : 'none',
          }} />

          {/* Text input */}
          <input
            placeholder={
              isListening
                ? 'Listening...'
                : isThinking
                ? 'Lumi is thinking...'
                : 'Tell Lumi anything — she will save it to the right place...'
            }
            onKeyDown={e => {
              if (e.key === 'Enter') {
                sendText(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={isListening || isThinking}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#e8e0d0',
              fontSize: 13,
              outline: 'none',
            }}
          />

          {/* Voice button */}
          <div
            onClick={isListening ? stopListening : startListening}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isListening ? 'rgba(232,127,155,0.2)' : 'rgba(245,166,35,0.1)',
              border: `1px solid ${isListening ? '#e87f9b' : 'rgba(245,166,35,0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            {isListening ? '⏹' : '🎙'}
          </div>
        </div>

  {/* Show Lumi's response */}
      {lumiResponse && (
        <div style={{
          margin: '8px 28px 16px',
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 12,
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Lumi orb */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #ffbe4d, #F5A623)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#e8e0d0', lineHeight: 1.6 }}>
                {lumiResponse}
              </div>
              {/* Show confirmation buttons if needed */}
              {needsConfirmation && pendingState && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, width: '100%' }}>
                    Save to which journal?
                  </div>
                  {['personal', 'spiritual', 'business', 'goals', 'health'].map((journal) => (
                    <button
                      key={journal}
                      onClick={() => confirmSave(journal)}
                      disabled={isThinking}
                      style={{
                        padding: '6px 12px',
                        background: pendingState.suggestedJournal === journal ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${pendingState.suggestedJournal === journal ? C.amber : C.border}`,
                        borderRadius: 6,
                        fontSize: 11,
                        color: pendingState.suggestedJournal === journal ? C.amber : C.text,
                        cursor: 'pointer',
                      }}
                    >
                      {journal.charAt(0).toUpperCase() + journal.slice(1)}
                      {pendingState.suggestedJournal === journal && ' ✓'}
                    </button>
                  ))}
                  <button
                    onClick={declineSave}
                    disabled={isThinking}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 11,
                      color: C.muted,
                      cursor: 'pointer',
                    }}
                  >
                    Don't save
                  </button>
                </div>
              )}
              {/* Show saved confirmation */}
              {!needsConfirmation && savedRoute && (
                <div style={{ marginTop: 8, fontSize: 11, color: C.amber }}>
                  ✓ Saved to {savedRoute.replace('journal_', '')} journal
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '20px 28px 28px' }}>
          {/* Row 1: 4 stat cards */}
          <StatCard icon="📖" label="Journal streak" value="0" sub="days in a row" badge="Start journaling" badgeType="warn" accentColor={C.amber} delay={0.05} />
          <StatCard icon="💪" label="Workouts" value="0" sub="of 0 this month" badge="Log your first workout" badgeType="warn" accentColor={C.teal} delay={0.1} />
          <StatCard icon="💰" label="Savings goal" value="₦0" sub="of ₦0 target" badge="Set a savings goal" badgeType="warn" accentColor={C.purple} delay={0.15} />
          <StatCard icon="⚡" label="Habits today" value="0/0" sub="done · 0 set up" badge="Add your first habit" badgeType="warn" accentColor={C.pink} delay={0.2} />

          {/* Row 2: Calendar (2-wide) + Lumi + Reading */}
          <div style={{ gridColumn: 'span 2' }}><Calendar /></div>
          <LumiCard />
          <ReadingCard />

          {/* Row 3: Schedule (2-wide) + Budget + Habits */}
          <ScheduleCard />
          <BudgetCard />
          <HabitsCard />

          {/* Row 4: Goals (full width) */}
          <div style={{ gridColumn: 'span 4' }}><GoalsCard /></div>
        </div>
      </SidebarLayout>
    </>
  )
}
