import { useState, useEffect, useCallback } from 'react'
import SidebarLayout, { C } from '../components/layout/SidebarLayout'
import { useAtmos } from '../components/Atmosphere'
import api from '../lib/api'
import { useIsMobile } from '../hooks/useIsMobile'
import ErrorBoundary from '../components/ErrorBoundary'
import { useToast } from '../hooks/useToast'
import UpgradePrompt from '../components/ui/UpgradePrompt'

// ─── Heatmap helpers ──────────────────────────────────────────────────────────
const WEEKS_DESKTOP = 13
const WEEKS_MOBILE  = 4
function buildGrid(weeks) {
  const today = new Date()
  const days = []
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const CATEGORY_COLORS = {
  health:    '#4ade80',
  focus:     '#60a5fa',
  mindset:   '#c084fc',
  finance:   '#fbbf24',
  social:    '#f87171',
  personal:  '#94a3b8',
}
function colorFor(category) { return CATEGORY_COLORS[category] || C.teal }

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function Heatmap({ habit, isMobile }) {
  const numWeeks = isMobile ? WEEKS_MOBILE : WEEKS_DESKTOP
  const dotSize  = isMobile ? 8 : 10
  const grid = buildGrid(numWeeks)
  const doneSet = new Set((habit.recent_completions || []).map(d =>
    typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  ))
  const todayStr = new Date().toISOString().slice(0, 10)
  const col = colorFor(habit.category)

  const weeks = []
  for (let w = 0; w < numWeeks; w++) {
    weeks.push(grid.slice(w * 7, w * 7 + 7))
  }

  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {week.map(date => {
            const done = doneSet.has(date)
            const isToday = date === todayStr
            return (
              <div
                key={date}
                title={date}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: 2,
                  background: done ? col : 'rgba(255,255,255,0.06)',
                  border: isToday ? `1.5px solid ${col}` : 'none',
                  opacity: done ? 1 : 0.5,
                  transition: 'background 0.2s',
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Identity Vote modal ──────────────────────────────────────────────────────
function IdentityModal({ habit, onSubmit, onSkip }) {
  const [score, setScore] = useState(null)
  const label = habit.identity_label || `being the person who does "${habit.title}"`

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        padding: '32px 28px', width: 340, animation: 'fadeUp 0.22s ease both',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🗳️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>Identity Vote</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
          How much did this action prove you are committed to <span style={{ color: C.text }}>{label}</span>?
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button
              key={n}
              onClick={() => setScore(n)}
              style={{
                width: 30, height: 30, borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', border: '1.5px solid',
                background: score === n ? C.amber : 'transparent',
                borderColor: score === n ? C.amber : 'rgba(255,255,255,0.15)',
                color: score === n ? '#1a1008' : C.muted,
                transition: 'all 0.15s',
              }}
            >{n}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => score && onSubmit(score)}
            disabled={!score}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
              cursor: score ? 'pointer' : 'not-allowed',
              background: score ? C.amber : 'rgba(255,255,255,0.05)',
              color: score ? '#1a1008' : C.muted,
              border: 'none',
            }}
          >Cast Vote</button>
          <button
            onClick={onSkip}
            style={{
              padding: '10px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: C.muted,
            }}
          >Skip</button>
        </div>
      </div>
    </div>
  )
}

// ─── Reframe modal (skip guard) ───────────────────────────────────────────────
function ReframeModal({ habit, onStay, onSkip }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        padding: '32px 28px', width: 340, animation: 'fadeUp 0.22s ease both',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🌿</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          Taking a day for yourself?
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>
          You've shown up <span style={{ color: C.amber, fontWeight: 700 }}>{habit.streak} days in a row</span> for{' '}
          <span style={{ color: C.text }}>"{habit.title}"</span>. That's real.
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
          Rest days happen. If you need one, take it — the habit will be here tomorrow, and so will your progress.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onStay}
            style={{
              padding: '11px 0', borderRadius: 10, background: C.amber, color: '#1a1008',
              fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
            }}
          >I'll do it today</button>
          <button
            onClick={onSkip}
            style={{
              padding: '10px 0', borderRadius: 10, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)', color: C.muted,
              fontSize: 12, cursor: 'pointer',
            }}
          >Take a rest day</button>
        </div>
      </div>
    </div>
  )
}

// ─── Revival modal ────────────────────────────────────────────────────────────
function RevivalModal({ habit, onUse, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        padding: '32px 28px', width: 340, animation: 'fadeUp 0.22s ease both', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🧪</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Revival Potion</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 6 }}>
          Life happens. Use a Revival Potion to acknowledge yesterday — it counts your effort even when the day got away from you.
        </div>
        <div style={{ fontSize: 12, color: C.amber, marginBottom: 24 }}>
          {habit.revival_tokens} potion{habit.revival_tokens !== 1 ? 's' : ''} left this month
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onUse}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, background: '#7c3aed',
              color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
            }}
          >Use Potion</button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)', color: C.muted, fontSize: 13, cursor: 'pointer',
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ trend, color }) {
  const points = trend.filter(d => d.avg_score !== null)
  if (points.length < 2) return null

  const W = 100, H = 22
  const min = 1, max = 10

  const coords = trend.map((d, i) => {
    const x = (i / (trend.length - 1)) * W
    const y = d.avg_score == null
      ? null
      : H - ((d.avg_score - min) / (max - min)) * H
    return { x, y }
  }).filter(p => p.y !== null)

  if (coords.length < 2) return null

  return (
    <svg width={W} height={H} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline
        points={coords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.75"
      />
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r="2.5" fill={color}
      />
    </svg>
  )
}

// ─── Identity summary bar ─────────────────────────────────────────────────────
function IdentityBar({ habitId, identityLabel, categoryColor }) {
  const [data, setData]   = useState(null)
  const [trend, setTrend] = useState(null)
  const col = categoryColor || C.amber

  useEffect(() => {
    api.get(`/habits/${habitId}/identity`).then(r => setData(r.data)).catch(() => {})
    api.get(`/habits/${habitId}/identity/trend`).then(r => setTrend(r.data?.trend || [])).catch(() => {})
  }, [habitId])

  if (!data || Number(data.total_votes) === 0) return null

  // Trend direction: last 7 days avg vs previous 7
  let trendLabel = ''
  if (trend && trend.length >= 14) {
    const recent = trend.slice(-7).filter(d => d.avg_score).map(d => Number(d.avg_score))
    const prev   = trend.slice(-14, -7).filter(d => d.avg_score).map(d => Number(d.avg_score))
    if (recent.length && prev.length) {
      const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const pAvg = prev.reduce((a, b) => a + b, 0) / prev.length
      if (rAvg > pAvg + 0.5) trendLabel = ' · trending up ↑'
      else if (rAvg < pAvg - 0.5) trendLabel = ' · trending down ↓'
    }
  }

  const label = identityLabel || 'your identity'

  return (
    <div style={{
      marginTop: 8, padding: '7px 10px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {trend && trend.length >= 2 && (
        <Sparkline trend={trend} color={col} />
      )}
      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, flex: 1 }}>
        🗳️ <span style={{ color: C.amber, fontWeight: 700 }}>{data.strong_votes}×</span> strong
        {' '}· avg <span style={{ color: C.text }}>{data.avg_score}/10</span>
        {trendLabel && <span style={{ color: Number(data.avg_score) >= 7 ? C.teal : C.muted }}>{trendLabel}</span>}
      </div>
    </div>
  )
}

// ─── Streak card canvas export ────────────────────────────────────────────────
function downloadStreakCard(habit) {
  const canvas = document.createElement('canvas')
  canvas.width = 400; canvas.height = 200
  const ctx = canvas.getContext('2d')
  const col = CATEGORY_COLORS[habit.category] || '#C8955C'

  // Background
  ctx.fillStyle = '#0a0a14'
  ctx.fillRect(0, 0, 400, 200)

  // Amber border
  ctx.strokeStyle = `${col}55`
  ctx.lineWidth = 1.5
  ctx.strokeRect(1, 1, 398, 198)

  // Emoji
  ctx.font = '34px serif'
  ctx.fillText(habit.emoji || '✅', 22, 54)

  // Title
  ctx.fillStyle = '#e8e8f0'
  ctx.font = 'bold 17px sans-serif'
  ctx.fillText(habit.title.slice(0, 28), 66, 42)

  // Identity label
  if (habit.identity_label) {
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.font = '11px sans-serif'
    ctx.fillText(habit.identity_label.slice(0, 36), 66, 60)
  }

  // Streak number
  ctx.fillStyle = col
  ctx.font = 'bold 40px sans-serif'
  ctx.fillText(`🔥 ${habit.streak ?? 0}`, 22, 118)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '13px sans-serif'
  ctx.fillText('day streak', 22, 136)

  // 4-week dot grid
  const completions = new Set(
    (habit.recent_completions || []).map(d =>
      typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
    )
  )
  const today = new Date()
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const done = completions.has(dateStr)
    const idx = 27 - i
    const weekCol = idx % 7
    const weekRow = Math.floor(idx / 7)
    const x = 240 + weekCol * 18
    const y = 90 + weekRow * 18
    ctx.fillStyle = done ? col : 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // PLOS watermark
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('PLOS', 350, 188)

  const link = document.createElement('a')
  link.download = `${habit.title.replace(/\s+/g, '-')}-streak.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// ─── HabitCard ────────────────────────────────────────────────────────────────
function HabitCard({ habit, onToggle, onDelete, onRevive, isMobile }) {
  const [hovering, setHovering] = useState(false)
  const [showIdentity, setShowIdentity] = useState(false)
  const [showReframe, setShowReframe] = useState(false)
  const [showRevival, setShowRevival] = useState(false)
  const col = colorFor(habit.category)

  function handleMarkDone() {
    if (habit.completed_today) {
      onToggle(habit, null)
    } else {
      setShowIdentity(true)
    }
  }

  function handleIdentitySubmit(score) {
    setShowIdentity(false)
    onToggle(habit, score)
  }

  function handleSkipAttempt() {
    if (habit.streak >= 3) {
      setShowReframe(true)
    } else {
      onToggle(habit, null)
    }
  }

  const missedYesterday = (() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const ys = yesterday.toISOString().slice(0, 10)
    const doneSet = new Set((habit.recent_completions || []).map(d =>
      typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
    ))
    return !doneSet.has(ys) && habit.streak > 0
  })()

  return (
    <>
      {showIdentity && (
        <IdentityModal
          habit={habit}
          onSubmit={handleIdentitySubmit}
          onSkip={() => { setShowIdentity(false); onToggle(habit, null) }}
        />
      )}
      {showReframe && (
        <ReframeModal
          habit={habit}
          onStay={() => setShowReframe(false)}
          onSkip={() => { setShowReframe(false) }}
        />
      )}
      {showRevival && (
        <RevivalModal
          habit={habit}
          onUse={() => { setShowRevival(false); onRevive(habit) }}
          onClose={() => setShowRevival(false)}
        />
      )}

      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          padding: '16px 18px', marginBottom: 12,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${hovering ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 16, animation: 'fadeUp 0.28s ease both',
          position: 'relative', transition: 'border-color 0.2s',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>{habit.emoji}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {habit.title}
              </span>
              {habit.category && (
                <span style={{
                  fontSize: 9, borderRadius: 10, padding: '2px 8px',
                  background: `${col}18`, color: col, flexShrink: 0, fontWeight: 600,
                }}>
                  {habit.category}
                </span>
              )}
            </div>
            {habit.identity_label && (
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
                Identity: {habit.identity_label}
              </div>
            )}
          </div>

          {/* Streak + revival + partner badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ background: 'rgba(245,166,35,0.12)', color: C.amber, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
              🔥 {habit.streak ?? 0} days
            </span>
            {habit.has_partner && (
              <span style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(124,58,237,0.12)', borderRadius: 10, padding: '2px 8px', fontWeight: 600 }}>
                👥 Partner watching
              </span>
            )}
            {missedYesterday && habit.revival_tokens > 0 && (
              <button
                onClick={() => setShowRevival(true)}
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
                  border: '1px solid rgba(124,58,237,0.3)', fontWeight: 600,
                }}
              >
                🧪 {habit.revival_tokens} potions
              </button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 6 }}>
            {!habit.completed_today && (
              <button
                onClick={handleSkipAttempt}
                style={{
                  padding: '5px 10px', borderRadius: 16, fontSize: 11, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: C.muted,
                }}
              >Skip</button>
            )}
            <button
              onClick={handleMarkDone}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.18s',
                background: habit.completed_today ? col : 'transparent',
                color: habit.completed_today ? '#0a1a0a' : col,
                border: `1.5px solid ${col}`,
              }}
            >
              {habit.completed_today ? '✓ Done' : 'Mark done'}
            </button>
            {hovering && (
              <>
                <button
                  onClick={() => downloadStreakCard(habit)}
                  title="Share streak card"
                  style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)', color: C.muted, fontSize: 11,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, lineHeight: 1, flexShrink: 0,
                  }}
                >📤</button>
                <button
                  onClick={() => onDelete(habit.id)}
                  style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)', color: C.muted, fontSize: 13,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, lineHeight: 1, flexShrink: 0,
                  }}
                >✕</button>
              </>
            )}
          </div>
        </div>

        {/* 90-day heatmap */}
        <Heatmap habit={habit} isMobile={isMobile} />

        {/* Offline indicator */}
        {habit._offline && (
          <div style={{ marginTop: 6, fontSize: 10, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📶</span>
            <span>Saved offline · will sync when you reconnect</span>
          </div>
        )}

        {/* Identity votes summary */}
        <IdentityBar habitId={habit.id} identityLabel={habit.identity_label} categoryColor={colorFor(habit.category)} />
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const EMOJIS = ['✅','💪','🧘','📚','🥗','💧','🏃','✍️','🎯','😴','🚫','🌱']
const CATEGORIES = ['personal','health','focus','mindset','finance','social']

export default function Habits() {
  useAtmos()
  const isMobile = useIsMobile()
  const toast = useToast()
  const [showHabitsUpgrade, setShowHabitsUpgrade] = useState(false)
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState('✅')
  const [newCategory, setNewCategory] = useState('personal')
  const [newIdentity, setNewIdentity] = useState('')
  const [newPartnerEmail, setNewPartnerEmail] = useState('')
  const [newStake, setNewStake] = useState('')

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const load = useCallback(() => {
    setLoading(true)
    api.get('/habits')
      .then(res => setHabits(res.data.habits || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function handleToggle(habit, identityScore) {
    const wasCompleted = habit.completed_today
    setHabits(prev => prev.map(h =>
      h.id === habit.id ? { ...h, completed_today: !wasCompleted } : h
    ))
    const call = wasCompleted
      ? api.delete(`/habits/${habit.id}/complete`)
      : api.post(`/habits/${habit.id}/complete`, { identity_score: identityScore })
    call
      .then(res => {
        if (res?.data?.queued) {
          setHabits(prev => prev.map(h =>
            h.id === habit.id ? { ...h, _offline: true } : h
          ))
        }
        if (!wasCompleted) toast.success(`${habit.emoji || '✅'} ${habit.title} — done!`)
      })
      .catch(() => load())
  }

  function handleRevive(habit) {
    api.post(`/habits/${habit.id}/revive`)
      .then(() => load())
      .catch(() => {})
  }

  function handleDelete(id) {
    setHabits(prev => prev.filter(h => h.id !== id))
    api.delete(`/habits/${id}`).catch(load)
  }

  function handleAdd() {
    if (!newTitle.trim()) return
    api.post('/habits', {
      title: newTitle.trim(),
      emoji: newEmoji,
      category: newCategory,
      identity_label: newIdentity.trim(),
    }).then(res => {
      const created = res.data.habit || res.data
      // Add accountability partner if provided
      if (newPartnerEmail.trim() && created.id) {
        api.post(`/habits/${created.id}/partner`, {
          partner_email: newPartnerEmail.trim(),
          stake_description: newStake.trim(),
        }).catch(() => {})
        created.has_partner = true
      }
      setHabits(prev => [created, ...prev])
      setNewTitle(''); setNewEmoji('✅'); setNewCategory('personal')
      setNewIdentity(''); setNewPartnerEmail(''); setNewStake('')
      setShowAddForm(false)
      setShowHabitsUpgrade(false)
    }).catch(err => {
      if (err.response?.status === 403 && err.response?.data?.upgrade) {
        setShowAddForm(false)
        setShowHabitsUpgrade(true)
      }
    })
  }

  const completed = habits.filter(h => h.completed_today).length
  const total = habits.length

  return (
    <ErrorBoundary>
    <SidebarLayout>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
      <div style={{ padding: isMobile ? '14px 14px' : '20px 28px', maxWidth: 720 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 27, fontWeight: 700, color: '#e8f0e9', margin: 0 }}>Habits</h1>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{todayLabel}</div>
            {total > 0 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 4, width: 140, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(completed / total) * 100}%`, background: C.amber, borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: 11, color: C.muted }}>{completed}/{total} today</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            style={{
              padding: '8px 18px', borderRadius: 20, background: 'transparent',
              border: `1.5px solid ${C.amber}`, color: C.amber, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >+ Add habit</button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 20, marginBottom: 20, animation: 'fadeUp 0.22s ease both',
          }}>
            {/* Emoji picker */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)} style={{
                  width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                  background: newEmoji === e ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.04)',
                  border: newEmoji === e ? `1.5px solid ${C.amber}` : '1px solid rgba(255,255,255,0.08)',
                }}>{e}</button>
              ))}
            </div>

            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{
                width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                padding: '9px 14px', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10,
              }}
              placeholder="Habit name…"
              autoFocus
            />

            <input
              value={newIdentity}
              onChange={e => setNewIdentity(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                padding: '9px 14px', color: C.text, fontSize: 13, outline: 'none', marginBottom: 10,
              }}
              placeholder="Identity label (optional) — e.g. 'being an athlete'"
            />

            <input
              value={newPartnerEmail}
              onChange={e => setNewPartnerEmail(e.target.value)}
              type="email"
              style={{
                width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                padding: '9px 14px', color: C.text, fontSize: 13, outline: 'none', marginBottom: 8,
              }}
              placeholder="👥 Accountability partner email (optional)"
            />
            {newPartnerEmail.trim() && (
              <input
                value={newStake}
                onChange={e => setNewStake(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10,
                  padding: '9px 14px', color: C.text, fontSize: 12, outline: 'none', marginBottom: 10,
                }}
                placeholder="Your commitment — e.g. 'I'll donate ₦1000 if I miss 3 days'"
              />
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setNewCategory(cat)} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: newCategory === cat ? `${colorFor(cat)}22` : 'rgba(255,255,255,0.04)',
                  border: newCategory === cat ? `1.5px solid ${colorFor(cat)}` : '1px solid rgba(255,255,255,0.08)',
                  color: newCategory === cat ? colorFor(cat) : C.muted,
                }}>{cat}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAdd} style={{
                padding: '8px 20px', borderRadius: 10, background: C.amber,
                color: '#1a1008', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>Save</button>
              <button onClick={() => { setShowAddForm(false); setNewTitle(''); setNewEmoji('✅') }} style={{
                padding: '8px 16px', borderRadius: 10, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)', color: C.muted, fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
        )}

        {showHabitsUpgrade && (
          <div style={{ marginBottom: 16 }}>
            <UpgradePrompt feature="Free accounts are limited to 3 habits. Upgrade to Pro for unlimited habits." compact />
          </div>
        )}

        {!loading && habits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🌱</div>
            <div style={{ color: C.muted, fontSize: 16, marginBottom: 20 }}>Your habits live here</div>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '10px 24px', borderRadius: 20, background: 'transparent',
                border: `1.5px solid ${C.amber}`, color: C.amber, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >Start your first habit</button>
          </div>
        )}

        {!loading && habits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onRevive={handleRevive}
            isMobile={isMobile}
          />
        ))}

      </div>
    </SidebarLayout>
    </ErrorBoundary>
  )
}
