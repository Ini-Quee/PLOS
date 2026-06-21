import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

function isoDate(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function dateLabel(dateStr) {
  const today = isoDate(0)
  const yesterday = isoDate(-1)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}

function completionSet(habit) {
  return new Set((habit.recent_completions || []).map(d =>
    typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  ))
}

function countCompletions(habits, startOffset, endOffset) {
  let count = 0
  for (let i = startOffset; i <= endOffset; i++) {
    const date = isoDate(i)
    habits.forEach(h => {
      if (completionSet(h).has(date)) count += 1
    })
  }
  return count
}

function consistencyScore(habits) {
  if (!habits.length) return 0
  const today = new Date()
  const dayOfMonth = today.getDate()
  let possible = 0
  let completed = 0
  for (let i = dayOfMonth - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const day = d.getDay()
    habits.forEach(h => {
      const targetDays = Array.isArray(h.target_days) ? h.target_days : [0, 1, 2, 3, 4, 5, 6]
      if (!targetDays.includes(day)) return
      possible += 1
      if (completionSet(h).has(dateStr)) completed += 1
    })
  }
  return possible ? Math.round((completed / possible) * 100) : 0
}

function habitConsistency(habit, days = 30) {
  const done = completionSet(habit)
  let possible = 0
  let completed = 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const day = d.getDay()
    const targetDays = Array.isArray(habit.target_days) ? habit.target_days : [0, 1, 2, 3, 4, 5, 6]
    if (!targetDays.includes(day)) continue
    possible += 1
    if (done.has(d.toISOString().slice(0, 10))) completed += 1
  }
  return possible ? Math.round((completed / possible) * 100) : 0
}

function monthlyIntensity(habits) {
  const today = new Date()
  const days = []
  for (let day = 1; day <= today.getDate(); day++) {
    const d = new Date(today.getFullYear(), today.getMonth(), day)
    const dateStr = d.toISOString().slice(0, 10)
    const done = habits.filter(h => completionSet(h).has(dateStr)).length
    const ratio = habits.length ? done / habits.length : 0
    days.push({ date: dateStr, done, ratio })
  }
  return days
}

function buildHistory(habits, days = 4) {
  return Array.from({ length: days }, (_, i) => {
    const date = isoDate(-i)
    const items = habits.map(h => ({
      id: h.id,
      title: h.title,
      done: completionSet(h).has(date),
      partial: !completionSet(h).has(date) && i === 0 && !h.completed_today,
    })).filter(item => item.done || i < 2).slice(0, 4)
    return { date, items }
  })
}

function recommendationFor(habits) {
  const categories = habits.map(h => h.category)
  if (categories.includes('mindset') || habits.some(h => /journal|morning|routine/i.test(h.title))) {
    return {
      title: 'Atomic Habits',
      author: 'James Clear',
      reason: "Based on your routine work, you're already building the systems Clear writes about.",
    }
  }
  if (categories.includes('health') || habits.some(h => /walk|run|gym|sleep|water/i.test(h.title))) {
    return {
      title: 'The Power of Habit',
      author: 'Charles Duhigg',
      reason: 'A useful lens for noticing cues, routines, and rewards in your health patterns.',
    }
  }
  return {
    title: 'Tiny Habits',
    author: 'BJ Fogg',
    reason: 'A gentle fit for building consistency without relying on pressure or perfection.',
  }
}

function lumiHabitInsight(habits, score) {
  if (!habits.length) return 'Start with one small habit. A tiny repeatable action beats a perfect plan you never touch.'
  const completedToday = habits.filter(h => h.completed_today).length
  if (completedToday === habits.length) return 'You are caught up today. Notice what made it easier, because that is the part worth repeating.'
  if (score >= 75) return 'Your month still has strong momentum. One missed check-in does not erase the pattern you are building.'
  if (completedToday > 0) return 'You already touched the system today. Choose one more small action only if it would support you, not punish you.'
  return 'Pick the easiest habit first. The goal is to re-enter gently, not prove anything the hard way.'
}

function ProgressRing({ value, color = C.teal, size = 54 }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" style={{ flexShrink: 0 }}>
      <circle cx="27" cy="27" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
      <circle
        cx="27" cy="27" r={radius} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round" transform="rotate(-90 27 27)"
      />
    </svg>
  )
}

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
          Your recent consistency is <span style={{ color: C.amber, fontWeight: 700 }}>{habitConsistency(habit)}%</span> for{' '}
          <span style={{ color: C.text }}>"{habit.title}"</span>. That progress still counts.
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
          Rest days happen. If you need one, take it. The habit will be here tomorrow, and so will your progress.
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

  // Consistency number
  ctx.fillStyle = col
  ctx.font = 'bold 40px sans-serif'
  ctx.fillText(`${habitConsistency(habit)}%`, 22, 118)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '13px sans-serif'
  ctx.fillText('30-day consistency', 22, 136)

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
  link.download = `${habit.title.replace(/\s+/g, '-')}-consistency.png`
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

          {/* Consistency + revival + partner badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ background: 'rgba(245,166,35,0.12)', color: C.amber, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
              {habitConsistency(habit)}% consistent
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
                  title="Share consistency card"
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

function SectionTitle({ children }) {
  return (
    <div style={{
      color: C.muted, fontSize: 12, letterSpacing: '0.14em',
      textTransform: 'uppercase', margin: '18px 0 10px', fontWeight: 700,
    }}>{children}</div>
  )
}

function MetricCard({ value, label, sub, positive }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.045)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '16px 18px', minHeight: 86,
    }}>
      <div style={{ color: positive ? C.teal : C.amber, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>{label}</div>
      <div style={{ color: positive ? C.teal : C.amber, fontSize: 12, marginTop: 6 }}>{sub}</div>
    </div>
  )
}

function HabitDashboard({ habits, onToggle, onAddHabit, isMobile }) {
  const score = consistencyScore(habits)
  const completedToday = habits.filter(h => h.completed_today).length
  const focusHabits = [
    ...habits.filter(h => !h.completed_today),
    ...habits.filter(h => h.completed_today),
  ].slice(0, 3)
  const thisWeek = countCompletions(habits, -6, 0)
  const lastWeek = countCompletions(habits, -13, -7)
  const weekDelta = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0)
  const moodScore = habits.length ? Math.min(9.4, 6.2 + (score / 100) * 2.2).toFixed(1) : '0.0'
  const rec = recommendationFor(habits)
  const history = buildHistory(habits)
  const monthDays = monthlyIntensity(habits)
  const panel = {
    background: 'rgba(255,255,255,0.045)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
  }

  return (
    <div style={{ animation: 'fadeUp 0.28s ease both' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 14, marginBottom: 22, paddingBottom: 20,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 34,
            lineHeight: 1.05, color: '#f1f5ea', margin: 0, fontWeight: 500,
          }}>Good morning</h1>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 7 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(224,242,205,0.95)', color: '#2f5d14',
          borderRadius: 999, padding: isMobile ? '7px 10px' : '8px 16px',
          minWidth: isMobile ? 104 : 142, justifyContent: 'center',
        }}>
          <ProgressRing value={score} color="#16a878" size={44} />
          <div>
            <div style={{ fontSize: 20, lineHeight: 1, fontWeight: 800 }}>{score}%</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>consistent</div>
          </div>
        </div>
      </div>

      <SectionTitle>Daily Momentum</SectionTitle>
      <div style={{ ...panel, padding: isMobile ? 18 : 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ color: C.text, fontSize: 18, fontWeight: 650, marginBottom: 4 }}>
              {completedToday === habits.length && habits.length ? 'All caught up' : 'Morning check-in'}
            </div>
            <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.45 }}>
              {completedToday === habits.length && habits.length
                ? 'You have done what needed doing today.'
                : 'Choose the smallest useful check-in for today.'}
            </div>
          </div>
          <button onClick={onAddHabit} style={{
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)',
            background: 'transparent', color: C.text, padding: '10px 18px',
            fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Log now</button>
        </div>

        {focusHabits.length === 0 ? (
          <button onClick={onAddHabit} style={{
            width: '100%', borderRadius: 12, border: `1px dashed ${C.amber}`,
            background: 'rgba(245,166,35,0.08)', color: C.amber,
            padding: '16px 18px', cursor: 'pointer', fontWeight: 700,
          }}>Start with one habit</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {focusHabits.map((habit, index) => {
              const col = habit.completed_today ? C.teal : (index === 0 ? C.amber : 'rgba(255,255,255,0.32)')
              return (
                <div key={habit.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 86px', gap: 12, alignItems: 'center' }}>
                  <button
                    onClick={() => onToggle(habit, null)}
                    aria-label={habit.completed_today ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                      border: `1.5px solid ${habit.completed_today ? C.teal : 'rgba(255,255,255,0.22)'}`,
                      background: habit.completed_today ? 'rgba(34,197,160,0.8)' : 'transparent',
                      color: '#10231c', fontWeight: 900,
                    }}
                  >{habit.completed_today ? '✓' : ''}</button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>{habit.title}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      {habit.completed_today ? 'done today' : index === 0 ? 'suggested next' : habit.category || 'today'}
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 6, background: 'rgba(0,0,0,0.24)', overflow: 'hidden' }}>
                    <div style={{ width: `${habit.completed_today ? 100 : index === 0 ? 62 : 38}%`, height: '100%', background: col, borderRadius: 6 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <SectionTitle>This Week vs Last</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <MetricCard value={thisWeek} label="Check-ins" sub={`${weekDelta >= 0 ? '+' : ''}${weekDelta}% vs last week`} positive={weekDelta >= 0} />
        <MetricCard value={moodScore} label="Avg mood score" sub={score >= 60 ? 'tracking with habit momentum' : 'ready for a gentler week'} positive={score >= 60} />
      </div>

      <SectionTitle>Lumi Insight</SectionTitle>
      <div style={{
        ...panel, borderColor: 'rgba(34,197,160,0.75)',
        boxShadow: '0 0 0 1px rgba(34,197,160,0.15)',
        padding: isMobile ? 18 : 22, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e8fff4', color: '#167a5c', display: 'grid', placeItems: 'center', fontWeight: 800 }}>L</div>
          <div style={{ color: C.teal, fontWeight: 700, fontSize: 14 }}>Lumi</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.78)', fontFamily: "'Georgia', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.65, marginBottom: 16 }}>
          "{lumiHabitInsight(habits, score)}"
        </div>
        <button style={{
          borderRadius: 10, border: '1px solid rgba(255,255,255,0.22)',
          background: 'transparent', color: C.text, padding: '9px 16px',
          fontSize: 13, cursor: 'pointer',
        }}>See my patterns</button>
      </div>

      <SectionTitle>Consistency This Month</SectionTitle>
      <div style={{ ...panel, padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ color: C.text, fontSize: 13 }}>{new Date().toLocaleDateString('en-US', { month: 'long' })}</div>
          <div style={{ display: 'flex', gap: 12, color: C.muted, fontSize: 11 }}>
            <span><span style={{ color: '#5fa51d' }}>■</span> Strong</span>
            <span><span style={{ color: C.amber }}>■</span> Partial</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {monthDays.map(day => (
            <div key={day.date} title={`${day.date}: ${day.done} completed`} style={{
              width: 20, height: 20, borderRadius: 4,
              background: day.ratio >= 0.75 ? '#5fa51d' : day.ratio > 0 ? C.amber : 'rgba(255,255,255,0.07)',
              opacity: day.ratio >= 0.75 ? 1 : day.ratio > 0 ? 0.9 : 0.65,
            }} />
          ))}
        </div>
      </div>

      <SectionTitle>Recommended For You</SectionTitle>
      <div style={{ ...panel, padding: 20, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 54, height: 72, borderRadius: 6, background: 'linear-gradient(135deg,#5b4cc4,#7a68e8)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, flexShrink: 0 }}>
          B
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>{rec.title}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{rec.author}</div>
          <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 1.45, marginTop: 8 }}>{rec.reason}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: C.text, padding: '8px 14px', cursor: 'pointer' }}>Read summary</button>
            <button style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: C.text, padding: '8px 14px', cursor: 'pointer' }}>Save</button>
          </div>
        </div>
      </div>

      <div style={{ ...panel, overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: C.text, fontWeight: 700 }}>Recent history</div>
          <button style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: C.text, padding: '8px 14px', cursor: 'pointer' }}>View all</button>
        </div>
        {history.map(row => (
          <div key={row.date} style={{ display: 'grid', gridTemplateColumns: '82px 1fr', gap: 14, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: C.muted, fontSize: 13 }}>{dateLabel(row.date)}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {row.items.length ? row.items.map(item => (
                <span key={item.id} style={{
                  borderRadius: 999, padding: '5px 11px', fontSize: 12,
                  background: item.done ? 'rgba(224,242,205,0.95)' : 'rgba(245,166,35,0.18)',
                  color: item.done ? '#2f5d14' : '#8a5a12',
                }}>{item.title}{item.done ? '' : ' · pending'}</span>
              )) : <span style={{ color: C.muted, fontSize: 12 }}>quiet day</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const EMOJIS = ['✅','💪','🧘','📚','🥗','💧','🏃','✍️','🎯','😴','🚫','🌱']
const CATEGORIES = ['personal','health','focus','mindset','finance','social']

export default function Habits() {
  useAtmos()
  const isMobile = useIsMobile()
  const toast = useToast()
  const navigate = useNavigate()
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

  return (
    <ErrorBoundary>
    <SidebarLayout>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
      <div style={{ padding: isMobile ? '14px 14px' : '20px 28px', maxWidth: 1120 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={() => navigate('/dashboard')} style={{ width:32, height:32, borderRadius:10, background:'rgba(200,149,92,0.10)', border:'1px solid rgba(200,149,92,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:C.muted, flexShrink:0 }} title="Back to Home">◈</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Habits</span>
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

        {!loading && habits.length > 0 && (
          <HabitDashboard
            habits={habits}
            onToggle={handleToggle}
            onAddHabit={() => setShowAddForm(true)}
            isMobile={isMobile}
          />
        )}

        {!loading && habits.length === 0 && (
          <div style={{ padding: '40px 8px 60px', animation: 'fadeUp 0.3s ease both', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🌱</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 500, color: C.text, marginBottom: 8 }}>Small habits, repeated, change everything</div>
              <div style={{ color: C.muted, fontSize: 14, marginBottom: 26, lineHeight: 1.6 }}>Pick one tiny thing to do each day. Lumi will help you keep the streak alive — even on hard days.</div>
            </div>

            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Popular starts — tap to begin</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
              {[
                { emoji: '💧', title: 'Drink water' },
                { emoji: '🏃', title: 'Move my body' },
                { emoji: '📖', title: 'Read 10 minutes' },
                { emoji: '🧘', title: 'Breathe / meditate' },
              ].map(s => (
                <div key={s.title}
                  onClick={() => { setNewEmoji(s.emoji); setNewTitle(s.title); setShowAddForm(true) }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11 }}
                >
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <span style={{ fontSize: 14, color: C.text }}>{s.title}</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '11px 26px', borderRadius: 22, background: C.amber,
                  border: 'none', color: '#1a1205', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >+ Create your own</button>
            </div>
          </div>
        )}

        {!loading && habits.length > 0 && (
          <>
            <SectionTitle>All Habits</SectionTitle>
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onRevive={handleRevive}
                isMobile={isMobile}
              />
            ))}
          </>
        )}

      </div>
    </SidebarLayout>
    </ErrorBoundary>
  )
}
