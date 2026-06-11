import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarLayout, { C } from '../components/layout/SidebarLayout'
import { useAtmos } from '../components/Atmosphere'
import LumiFace from '../components/lumi/LumiFace'
import { useLumi } from '../hooks/useLumi'
import api from '../lib/api'
import { useAuth } from '../lib/auth'
import OnboardingFlow from '../components/OnboardingFlow'
import OnboardingBanner from '../components/OnboardingBanner'
import SkeletonCard from '../components/ui/SkeletonCard'
import { useIsMobile } from '../hooks/useIsMobile'
import ErrorBoundary from '../components/ErrorBoundary'
import { usePushNotifications } from '../hooks/usePushNotifications'

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

// Glass style for cards — semi-transparent so the atmosphere shows through
const GLASS = {
  background: 'rgba(6,6,14,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.07)',
}

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
      ...GLASS,
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
      <div style={{ marginBottom: 12 }}><LumiFace mood="resting" size={44} /></div>
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

function ScheduleCard({ items: initialItems = [] }) {
  const navigate = useNavigate()
  const [items, setItems] = useState(initialItems)
  useEffect(() => { setItems(initialItems) }, [initialItems])

  if (items.length === 0) {
    return (
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.35s ease both', gridColumn: 'span 2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Today's schedule</div>
          <div style={{ fontSize: 11, color: C.amber, cursor: 'pointer' }} onClick={() => navigate('/schedule')}>Set up →</div>
        </div>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Your day is open</div>
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
    const item = items[i]
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, completed: !it.completed } : it))
    if (item) api.post(`/schedule/${item.id}/complete`).catch(() => {})
  }

  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.35s ease both', gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Today's schedule</div>
        <div style={{ fontSize: 11, color: C.amber, cursor: 'pointer' }}>See all →</div>
      </div>
      {items.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <span style={{ fontSize: 10, color: C.muted, width: 42, flexShrink: 0, textAlign: 'right' }}>{s.start_time}</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ({ spiritual:'#a5b4fc', health:'#6ee7b7', meal:'#fbbf24', work:'#2dd4bf', social:'#f9a8d4', sleep:'#93c5fd', personal:'#c4b5fd' }[s.category] || '#c4b5fd'), flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: s.completed ? C.muted : C.text, textDecoration: s.completed ? 'line-through' : 'none' }}>{s.title}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{s.category}</div>
          </div>
          <div
            onClick={() => toggle(i)}
            style={{
              width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
              background: s.completed ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
              border: s.completed ? 'none' : `1px solid ${C.border}`,
              color: s.completed ? C.teal : 'transparent',
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

// ─── Streaks Card (tracker peek) ─────────────────────────────────────────────
function StreaksCard({ trackers }) {
  const navigate = useNavigate()
  if (!trackers || trackers.length === 0) return null

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ gridColumn: 'span 2', ...GLASS, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.48s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Your streaks</div>
        <div style={{ fontSize: 11, color: C.amber, cursor: 'pointer' }} onClick={() => navigate('/trackers')}>See all →</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trackers.slice(0, 4).map(t => {
          const marks = new Set((t.marks || []).map(d => typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)))
          const col = t.color || C.amber
          const weekDays = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            weekDays.push(d.toISOString().slice(0, 10))
          }
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/trackers')}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{t.emoji}</span>
              <span style={{ fontSize: 12, flex: 1, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.amber, flexShrink: 0 }}>🔥 {t.streak}</span>
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {weekDays.map(date => {
                  const done = marks.has(date)
                  const isToday = date === todayStr
                  return (
                    <div key={date} style={{
                      width: 10, height: 10, borderRadius: 2,
                      background: done ? col : 'rgba(255,255,255,0.06)',
                      border: isToday ? `1.5px solid ${col}` : 'none',
                      opacity: done ? 1 : 0.5,
                    }} />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
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
          <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Your goals live here</div>
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

// ─── Insight Card (monthly review) ───────────────────────────────────────────
function InsightCard() {
  const navigate  = useNavigate()
  const [review, setReview]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [generating, setGen]    = useState(false)
  const [error, setError]       = useState('')

  const today        = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 7) + '-01'
  const monthLabel   = new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })

  useEffect(() => {
    api.get('/journal/pages', {
      params: { journal_type: 'lumi_monthly_review', from: firstOfMonth, to: today, limit: 1 }
    })
      .then(r => {
        const entry = r.data?.entries?.[0]
        if (entry?.fields?.review) setReview(entry.fields)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function generate() {
    setGen(true)
    setError('')
    try {
      const r = await api.post('/lumi/monthly-review')
      if (r.data?.review) setReview(r.data.review)
    } catch {
      setError('Could not generate review right now. Try again later.')
    }
    setGen(false)
  }

  return (
    <div style={{
      ...GLASS, borderRadius: 16, padding: 18,
      animation: 'fadeUp 0.5s 0.5s ease both',
      borderTop: '1px solid rgba(139,92,246,0.3)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flexShrink: 0 }}><LumiFace mood="resting" size={28} /></div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{monthLabel} in Review</div>
          <div style={{ fontSize: 10, color: C.muted }}>Lumi's analysis of your month</div>
        </div>
      </div>

      {loading && (
        <div style={{ fontSize: 11, color: C.muted }}>Loading…</div>
      )}

      {!loading && !review && (
        <>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            Lumi will look at your habits, savings, and journal pages this month and write you an honest, personalised reflection.
          </div>
          {error && <div style={{ fontSize: 11, color: '#f87171' }}>{error}</div>}
          <button
            onClick={generate}
            disabled={generating}
            style={{
              padding: '9px 0', borderRadius: 10, border: 'none',
              background: generating ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.85)',
              color: generating ? C.muted : '#fff',
              fontSize: 12, fontWeight: 700, cursor: generating ? 'wait' : 'pointer',
            }}
          >
            {generating ? 'Lumi is thinking…' : 'Generate Month in Review'}
          </button>
        </>
      )}

      {!loading && review && (review.review || review.paragraphs?.length > 0) && (
        <>
          {(review.paragraphs?.length > 0 ? review.paragraphs : [review.review])
            .filter(Boolean)
            .slice(0, 2)
            .map((para, i) => (
              <p key={i} style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                {para}
              </p>
            ))}
          {(review.paragraphs?.length > 2) && (
            <div
              onClick={() => navigate('/journal')}
              style={{ fontSize: 11, color: C.purple, cursor: 'pointer', fontWeight: 600 }}
            >
              Read full review in Journal →
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [season, setSeason] = useState('harmattan')
  const [showSeasonMenu, setShowSeasonMenu] = useState(false)
  const navigate = useNavigate()
  const { palette } = useAtmos()
  const AC = palette.accent
  const isMobile = useIsMobile()
  const { supported: pushSupported, subscribed: pushSubscribed, permission: pushPermission, subscribe: subscribePush } = usePushNotifications()
  const [showPushPrompt, setShowPushPrompt] = useState(() => {
    if (typeof window === 'undefined') return false
    const sessions = Number(localStorage.getItem('plos_sessions') || 0) + 1
    localStorage.setItem('plos_sessions', sessions)
    return sessions >= 3 && !localStorage.getItem('plos_push_dismissed')
  })

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

  const { user } = useAuth()
  const [scheduleItems, setScheduleItems] = useState([])
  const [savingsGoals, setSavingsGoals] = useState([])
  const [hasLifeAudit, setHasLifeAudit] = useState(false)
  const [journalStreak, setJournalStreak] = useState(0)
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const sessions = typeof window !== 'undefined'
    ? Number(localStorage.getItem('plos_sessions') || 0)
    : 0
  const onboarded = typeof window !== 'undefined' && !!localStorage.getItem('plos_onboarded')
  const bannerDismissed = typeof window !== 'undefined' && !!localStorage.getItem('plos_banner_dismissed')
  // Show full flow for first 3 sessions; after that show persistent banner only
  const [showOnboarding, setShowOnboarding] = useState(() => !onboarded && sessions < 3)
  const showBanner = !onboarded && sessions >= 3 && !bannerDismissed

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.allSettled([
      api.get('/schedule/today', { signal }),
      api.get('/savings', { signal }),
      api.get('/lumi/life-audit/preview', { signal }),
      api.get('/journal/pages?limit=60', { signal }),
      api.get('/trackers', { signal }),
    ]).then(([schedRes, savingsRes, auditRes, journalRes, trackersRes]) => {
      if (signal.aborted) return;
      if (schedRes.status === 'fulfilled')
        setScheduleItems(schedRes.value.data?.schedules || []);
      if (savingsRes.status === 'fulfilled')
        setSavingsGoals(savingsRes.value.data?.goals || []);
      setHasLifeAudit(auditRes.status === 'fulfilled');
      if (journalRes.status === 'fulfilled') {
        const entries = journalRes.value.data?.entries || [];
        const dates = new Set(entries.map(e => e.entry_date));
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 60; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          if (dates.has(d.toISOString().slice(0, 10))) streak++;
          else if (i > 0) break;
        }
        setJournalStreak(streak);
      }
      if (trackersRes.status === 'fulfilled')
        setTrackers(trackersRes.value.data?.trackers || []);
      setLoading(false);
    });

    return () => controller.abort();
  }, [])

  const topGoal = savingsGoals.find(g => !g.is_complete)

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
              Good morning, <span style={{ color: AC }}>{user?.name?.split(' ')[0] || 'there'}</span> ☀️
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })} · {SEASONS[season].label} · {scheduleItems.filter(t => !t.completed).length} tasks remaining
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
          {/* Lumi logo */}
          <div style={{ flexShrink: 0 }}><LumiFace mood={isListening ? 'listening' : 'resting'} size={36} /></div>

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

        {/* Push notification prompt — shown after 3 sessions, once */}
        {showPushPrompt && pushSupported && !pushSubscribed && pushPermission !== 'denied' && (
          <div style={{
            margin: isMobile ? '0 14px 12px' : '0 28px 14px',
            padding: '14px 18px',
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            animation: 'fadeUp 0.4s ease both',
          }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Never miss a habit reminder</div>
              <div style={{ fontSize: 11, color: C.muted }}>Get notified when it's time for your scheduled habits</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={async () => {
                  await subscribePush()
                  setShowPushPrompt(false)
                  localStorage.setItem('plos_push_dismissed', '1')
                }}
                style={{
                  padding: '7px 16px', borderRadius: 20, border: 'none',
                  background: 'rgba(139,92,246,0.85)', color: '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >Turn on</button>
              <button
                onClick={() => {
                  setShowPushPrompt(false)
                  localStorage.setItem('plos_push_dismissed', '1')
                }}
                style={{
                  padding: '7px 12px', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent', color: C.muted,
                  fontSize: 12, cursor: 'pointer',
                }}
              >Later</button>
            </div>
          </div>
        )}

        {/* Onboarding banner — shown after 3+ sessions if not yet onboarded */}
        {showBanner && <OnboardingBanner />}

        {/* Dashboard Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? 10 : 14,
          padding: isMobile ? '12px 14px 20px' : '20px 28px 28px',
        }}>
          {/* Row 1: stat cards — skeleton while loading */}
          {loading ? (
            [0,1,2,3].map(i => <SkeletonCard key={i} height={90} lines={2} />)
          ) : scheduleItems.length === 0 && journalStreak === 0 && savingsGoals.length === 0 ? (
            // Zero state hero — warm, teaching first screen for a brand-new user
            <div style={{ gridColumn: isMobile ? 'span 2' : 'span 4', background:'linear-gradient(160deg,rgba(200,149,92,0.10),rgba(139,92,246,0.07))', border:'1px solid rgba(200,149,92,0.22)', borderRadius:20, padding: isMobile ? '24px 16px' : '32px 28px', animation:'fadeUp 0.4s ease both' }}>
              {/* Greeting */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', marginBottom:26 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✨</div>
                <div style={{ fontSize:12, color:'#DBA870', letterSpacing:'0.14em', textTransform:'uppercase' }}>Welcome to PLOS</div>
                <div style={{ fontFamily:'Georgia, serif', fontSize: isMobile ? 22 : 26, fontWeight:500, color:'#f6f2ea', marginTop:10, lineHeight:1.3 }}>
                  {user?.name ? `Hi ${user.name.split(' ')[0]}` : 'Hi there'} — your space is blank on purpose.
                </div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginTop:12, maxWidth:420, lineHeight:1.65 }}>We'll fill it together, one small thing at a time. Pick wherever feels easy — there's no wrong start.</div>
              </div>

              {/* Four doors */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
                <div onClick={() => navigate('/talk-to-lumi?mode=onboarding')} style={{ background:'rgba(10,12,8,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:18, cursor:'pointer' }}>
                  <div style={{ fontSize:22, marginBottom:9 }}>✨</div>
                  <div style={{ fontSize:15, fontWeight:500, color:'#f0ece2' }}>Let Lumi plan your life</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)', marginTop:5, lineHeight:1.55 }}>A 10-min chat → your whole week, built for you.</div>
                </div>
                <div onClick={() => navigate('/trackers')} style={{ background:'rgba(10,12,8,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:18, cursor:'pointer' }}>
                  <div style={{ fontSize:22, marginBottom:9 }}>🔥</div>
                  <div style={{ fontSize:15, fontWeight:500, color:'#f0ece2' }}>Start a streak</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)', marginTop:5, lineHeight:1.55 }}>Workout, water, reading — watch the chain grow.</div>
                </div>
                <div onClick={() => navigate('/journal')} style={{ background:'rgba(10,12,8,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:18, cursor:'pointer' }}>
                  <div style={{ fontSize:22, marginBottom:9 }}>📖</div>
                  <div style={{ fontSize:15, fontWeight:500, color:'#f0ece2' }}>Write a line</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)', marginTop:5, lineHeight:1.55 }}>A quick journal entry. How's today going?</div>
                </div>
                <div onClick={() => navigate('/budget')} style={{ background:'rgba(10,12,8,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:18, cursor:'pointer' }}>
                  <div style={{ fontSize:22, marginBottom:9 }}>💰</div>
                  <div style={{ fontSize:15, fontWeight:500, color:'#f0ece2' }}>Log an expense</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)', marginTop:5, lineHeight:1.55 }}>Start your money picture in one tap.</div>
                </div>
              </div>

              {/* Catch-all */}
              <div onClick={() => navigate('/talk-to-lumi')} style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.22)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                <div style={{ fontSize:20 }}>💬</div>
                <div style={{ flex:1, fontSize:13, color:'#c4b4ee', lineHeight:1.5 }}>Not sure? Just talk to Lumi — say anything about your day and she'll take it from there.</div>
                <div style={{ fontSize:16, color:'#8b5cf6' }}>→</div>
              </div>
            </div>
          ) : (
            <>
              <StatCard icon="📖" label="Journal streak" value={String(journalStreak)} sub="days in a row" badge={journalStreak > 0 ? undefined : "Start journaling"} badgeType="warn" accentColor={C.amber} delay={0.05} />
              <StatCard icon="💪" label="Workouts" value={String(scheduleItems.filter(t => t.category === 'health' && t.completed).length)} sub={`of ${scheduleItems.filter(t => t.category === 'health').length} today`} badge={scheduleItems.filter(t => t.category === 'health').length > 0 ? undefined : "Log your first workout"} badgeType="warn" accentColor={C.teal} delay={0.1} />
              <StatCard icon="💰" label="Savings goal" value={topGoal ? topGoal.emoji + ' ' + Math.round((topGoal.saved_amount / topGoal.target_amount) * 100) + '%' : '₦0'} sub={topGoal ? topGoal.name : 'of ₦0 target'} badge={topGoal ? undefined : "Set a savings goal"} badgeType="warn" accentColor={C.purple} delay={0.15} />
              <StatCard icon="⚡" label="Habits today" value={scheduleItems.filter(t => t.completed).length + '/' + scheduleItems.length} sub="done today" badge={scheduleItems.length > 0 ? undefined : "Add your first habit"} badgeType="warn" accentColor={C.pink} delay={0.2} />
            </>
          )}

          {/* Row 2: Calendar + Lumi + Reading */}
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 2' }}>
            <ErrorBoundary compact label="Calendar"><Calendar /></ErrorBoundary>
          </div>
          <ErrorBoundary compact label="Lumi"><LumiCard /></ErrorBoundary>
          <ErrorBoundary compact label="Reading"><ReadingCard /></ErrorBoundary>

          {/* Row 3: Schedule + Budget + Habits */}
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 2' }}>
            <ErrorBoundary compact label="Schedule"><ScheduleCard items={scheduleItems} /></ErrorBoundary>
          </div>
          <ErrorBoundary compact label="Budget"><BudgetCard /></ErrorBoundary>
          <ErrorBoundary compact label="Habits"><HabitsCard /></ErrorBoundary>

          {/* Row 3b: Streaks (trackers) — full width if present */}
          <ErrorBoundary compact label="Streaks"><StreaksCard trackers={trackers} /></ErrorBoundary>

          {/* Row 4: Today's data — content, journal, life audit, savings */}
          <ErrorBoundary compact label="Content"><ContentTodayCard /></ErrorBoundary>
          <ErrorBoundary compact label="Journal Today"><JournalTodayCard /></ErrorBoundary>
          <ErrorBoundary compact label="Life Audit"><LifeAuditCard /></ErrorBoundary>
          <ErrorBoundary compact label="Savings"><SavingsCard /></ErrorBoundary>

          {/* Row 5: Insight card (monthly review) */}
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 2' }}>
            <ErrorBoundary compact label="Insights"><InsightCard /></ErrorBoundary>
          </div>

          {!hasLifeAudit && (
            <div style={{ gridColumn: isMobile ? 'span 2' : 'span 4', background:'linear-gradient(135deg,rgba(200,149,92,0.1),rgba(139,92,246,0.08))', border:'1px solid rgba(200,149,92,0.25)', borderRadius:16, padding: isMobile ? '16px 14px' : '20px 24px', display:'flex', alignItems:'center', gap:12, animation:'fadeUp 0.5s 0.6s ease both', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ fontSize:28 }}>✨</div>
              <div style={{ flex:1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight:700, color:'#e8f0e9', marginBottom:4 }}>Let Lumi plan your life</div>
                <div style={{ fontSize: isMobile ? 11 : 12, color:'rgba(255,255,255,0.45)' }}>A 10-minute interview across 8 areas of your life.</div>
              </div>
              <button onClick={() => navigate('/talk-to-lumi')} style={{ padding:'9px 16px', borderRadius:24, border:'none', background:'rgba(200,149,92,0.85)', color:'#000', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>Start →</button>
            </div>
          )}

          {/* Goals — full width */}
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 4' }}><GoalsCard /></div>

          {/* Affirmations — full width */}
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 4' }}>
            <ErrorBoundary compact label="Affirmations"><AffirmationsWidget /></ErrorBoundary>
          </div>

          {/* Discovery Panel — billing, connections, quick settings */}
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 4' }}>
            <ErrorBoundary compact label="Account"><DiscoveryPanel /></ErrorBoundary>
          </div>
        </div>
      </SidebarLayout>
      {showOnboarding && (
        <OnboardingFlow
          userName={user?.name}
          onDone={() => setShowOnboarding(false)}
        />
      )}
    </>
  )
}

// ─── Affirmations Widget ───────────────────────────────────────────────────────
function AffirmationsWidget() {
  const { palette } = useAtmos()
  const AC = palette.accent
  const [affirmations, setAffirmations] = useState([])
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    api.get('/users/settings').then(res => {
      const list = res.data?.settings?.affirmations || []
      setAffirmations(list)
      if (list.length > 0) {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
        setActiveIndex(dayOfYear % list.length)
      }
    }).catch(() => {})
  }, [])

  function save(list) {
    setAffirmations(list)
    api.put('/users/settings', { affirmations: list }).catch(() => {})
  }

  function addAffirmation() {
    const text = newText.trim()
    if (!text || affirmations.length >= 20) return
    save([...affirmations, text])
    setNewText('')
    setAdding(false)
  }

  function remove(i) {
    save(affirmations.filter((_, idx) => idx !== i))
  }

  const current = affirmations[activeIndex]

  return (
    <div style={{ background: 'rgba(6,6,14,0.30)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: `1px solid ${AC}22`, borderRadius: 16, padding: '20px 22px', animation: 'fadeUp 0.5s 0.7s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✨</span> Today's Affirmation
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {affirmations.length > 1 && (
            <>
              <button onClick={() => setActiveIndex(i => (i - 1 + affirmations.length) % affirmations.length)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>‹</button>
              <span style={{ fontSize: 11, color: C.muted }}>{activeIndex + 1}/{affirmations.length}</span>
              <button onClick={() => setActiveIndex(i => (i + 1) % affirmations.length)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>›</button>
            </>
          )}
          <button onClick={() => setAdding(a => !a)} style={{ background: `${AC}18`, border: `1px solid ${AC}30`, borderRadius: 8, color: AC, fontSize: 12, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {adding ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {current ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <p style={{ flex: 1, margin: 0, fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 18, color: C.cream, lineHeight: 1.6 }}>
            "{current}"
          </p>
          <button onClick={() => remove(activeIndex)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, padding: '4px 8px', flexShrink: 0, fontFamily: 'inherit' }}>✕</button>
        </div>
      ) : (
        <p style={{ margin: 0, color: C.muted, fontSize: 13, fontStyle: 'italic' }}>No affirmations yet — add one to get started.</p>
      )}

      {adding && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <input
            autoFocus
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addAffirmation() }}
            placeholder="Write your affirmation…"
            maxLength={200}
            style={{ flex: 1, padding: '9px 13px', borderRadius: 10, border: `1px solid ${AC}30`, background: 'rgba(20,12,6,0.6)', color: C.cream, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
          <button onClick={addAffirmation} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: AC, color: '#080503', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      )}
    </div>
  )
}

// ─── Journal type accent colours ──────────────────────────────────────────────
const JOURNAL_COLORS = {
  personal:  '#C8955C',
  spiritual: '#9B7FD4',
  budget:    '#5BA88A',
  wellness:  '#7ABFB8',
  goals:     '#7AAEE8',
  business:  '#D4A06A',
}

// ─── Platform emojis ──────────────────────────────────────────────────────────
const PLATFORM_EMOJI = {
  twitter: '𝕏', instagram: '📸', linkedin: '💼', facebook: '👥',
  tiktok: '🎵', youtube: '▶️', threads: '🧵', default: '📢',
}

// ─── Content Today Card ───────────────────────────────────────────────────────
function ContentTodayCard() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/content/posts/today')
      .then(r => setPosts(r.data?.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: C.bg2, border: '1px solid ' + C.border, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.35s ease both' }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📢</span> Content Today
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: C.muted }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>No posts scheduled today</div>
          <button onClick={() => navigate('/content-planner')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + C.teal + '44', background: 'transparent', color: C.teal, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Go to Content Planner →</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.teal, lineHeight: 1, marginBottom: 8 }}>{posts.length}</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>post{posts.length !== 1 ? 's' : ''} due today</div>
          {posts.slice(0, 3).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i > 0 ? '1px solid ' + C.border : 'none' }}>
              <span style={{ fontSize: 14 }}>{PLATFORM_EMOJI[p.platform] || PLATFORM_EMOJI.default}</span>
              <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Journal Today Card ───────────────────────────────────────────────────────
function JournalTodayCard() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/journal/pages/today')
      .then(r => setEntries(r.data?.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: C.bg2, border: '1px solid ' + C.border, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.40s ease both' }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📖</span> Journal Today
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: C.muted }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Nothing written today</div>
          <button onClick={() => navigate('/journal')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + C.amber + '44', background: 'transparent', color: C.amber, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Open Journal →</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.amber, lineHeight: 1, marginBottom: 8 }}>{entries.length}</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>entr{entries.length !== 1 ? 'ies' : 'y'} today</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {entries.map((e, i) => (
              <span key={i} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: (JOURNAL_COLORS[e.journal_type] || C.amber) + '22', color: JOURNAL_COLORS[e.journal_type] || C.amber, fontWeight: 500 }}>
                {e.journal_type}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Life Audit Card ──────────────────────────────────────────────────────────
function LifeAuditCard() {
  const navigate = useNavigate()
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/lumi/life-audit/preview')
      .then(r => { if (r.data?.timeAudit) setAudit(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: C.bg2, border: '1px solid ' + C.border, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.45s ease both' }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>✨</span> Life Plan
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: C.muted }}>Loading…</div>
      ) : !audit ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>No life plan yet</div>
          <button onClick={() => navigate('/talk-to-lumi')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + C.purple + '44', background: 'transparent', color: C.purple, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Start with Lumi →</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.purple, lineHeight: 1, marginBottom: 4 }}>{audit.timeAudit.scheduledHours}h</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>scheduled · {audit.timeAudit.freeHours}h free · {audit.timeAudit.totalBlocks} blocks</div>
          {audit.timeAudit.isOverScheduled && (
            <div style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(224,82,82,0.15)', color: '#E05252', display: 'inline-block' }}>Over-scheduled</div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Savings Card ─────────────────────────────────────────────────────────────
function SavingsCard() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/savings')
      .then(r => setGoals((r.data?.goals || []).filter(g => !g.is_complete)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: C.bg2, border: '1px solid ' + C.border, borderRadius: 16, padding: 18, animation: 'fadeUp 0.5s 0.50s ease both' }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🏦</span> Savings Goals
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: C.muted }}>Loading…</div>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>No active savings goals</div>
          <button onClick={() => navigate('/budget')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + C.teal + '44', background: 'transparent', color: C.teal, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Set a goal →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {goals.slice(0, 3).map((g, i) => {
            const pct = Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100)) || 0
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.text }}>{g.emoji} {g.name}</span>
                  <span style={{ fontSize: 11, color: C.teal, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: C.teal, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Discovery Panel ─────────────────────────────────────────────────────────
function DiscoveryPanel() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const isPro      = user?.subscription_tier === 'pro'

  const [googleStatus, setGoogleStatus] = useState(null)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    api.get('/oauth/google/status').then(r => setGoogleStatus(r.data)).catch(() => setGoogleStatus({ connected: false }))
  }, [])

  const SAGE = 'var(--color-primary)'
  const cardStyle = {
    background: 'rgba(20,12,6,0.55)',
    border: '1px solid rgba(200,149,92,0.15)',
    borderRadius: 14,
    padding: '16px 18px',
    flex: 1,
    minWidth: 0,
  }

  return (
    <div style={{
      ...GLASS,
      borderRadius: 16,
      padding: '20px 22px',
      animation: 'fadeUp 0.5s 0.8s ease both',
      borderTop: '1px solid rgba(200,149,92,0.2)',
    }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>⚡</span> Account &amp; Connections
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Card 1: Plan */}
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Plan</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isPro ? '#00d4aa' : C.text }}>
                {isPro ? '✨ Pro' : 'Free'}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {isPro ? 'All features unlocked' : '10 Lumi msgs/day · 3 habits'}
              </div>
            </div>
            {isPro ? (
              <button
                onClick={async () => { try { const r = await api.post('/billing/portal'); window.location.href = r.data.url; } catch {} }}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,212,170,0.3)', background: 'transparent', color: '#00d4aa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >Manage →</button>
            ) : (
              <button
                onClick={() => navigate('/upgrade')}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(200,149,92,0.85)', color: '#080503', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >Upgrade →</button>
            )}
          </div>
        </div>

        {/* Card 2: Gmail */}
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Gmail</div>
          {googleStatus === null ? (
            <div style={{ fontSize: 12, color: C.muted }}>Checking…</div>
          ) : googleStatus.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, color: '#00d4aa', fontWeight: 600 }}>Connected</div>
                <div style={{ fontSize: 11, color: C.muted }}>Ready to send emails</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 12, color: C.muted }}>Not connected</div>
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/oauth/google`}
                style={{ padding: '6px 14px', borderRadius: 8, background: '#fff', color: '#333', fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >Connect →</a>
            </div>
          )}
        </div>

        {/* Card 3: Notifications */}
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Notifications</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 12, color: notifPermission === 'granted' ? '#00d4aa' : C.muted }}>
              {notifPermission === 'granted' ? '✅ Enabled' : notifPermission === 'denied' ? '🚫 Blocked in browser' : '⭕ Not set up'}
            </div>
            {notifPermission === 'default' && (
              <button
                onClick={async () => { const r = await Notification.requestPermission(); setNotifPermission(r); }}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(200,149,92,0.4)', background: 'rgba(200,149,92,0.1)', color: SAGE, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >Enable →</button>
            )}
          </div>
        </div>

        {/* Card 4: Quick settings chips */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 0 }}>Quick settings</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'Theme', section: 'appearance' },
              { label: 'Lumi voice', section: 'voice' },
              { label: 'Notif time', section: 'notifications' },
            ].map(({ label, section }) => (
              <button
                key={section}
                onClick={() => navigate(`/settings?section=${section}`)}
                style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(200,149,92,0.25)', background: 'rgba(200,149,92,0.08)', color: C.text, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
