import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarLayout, { C } from '../components/layout/SidebarLayout'
import { useAtmos } from '../components/Atmosphere'
import api from '../lib/api'
import { useIsMobile } from '../hooks/useIsMobile'
import ErrorBoundary from '../components/ErrorBoundary'
import { useToast } from '../hooks/useToast'

// ─── Grid helpers ────────────────────────────────────────────────────────────
const WEEKS_MINI = 1
const WEEKS_DETAIL = 14

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

function markSet(tracker) {
  return new Set((tracker.marks || []).map(d =>
    typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  ))
}

function isoDate(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// ─── Mini week grid (7 squares) ──────────────────────────────────────────────
function MiniWeekGrid({ tracker }) {
  const marks = markSet(tracker)
  const todayStr = isoDate(0)
  const grid = buildGrid(WEEKS_MINI)

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {grid.map(date => {
        const done = marks.has(date)
        const isToday = date === todayStr
        return (
          <div
            key={date}
            title={date}
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: done ? (tracker.color || C.amber) : 'rgba(255,255,255,0.06)',
              border: isToday ? `1.5px solid ${tracker.color || C.amber}` : 'none',
              opacity: done ? 1 : 0.5,
              transition: 'background 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Detail grid (big heatmap) ───────────────────────────────────────────────
function DetailGrid({ tracker, weeks = WEEKS_DETAIL }) {
  const marks = markSet(tracker)
  const todayStr = isoDate(0)
  const grid = buildGrid(weeks)
  const col = tracker.color || C.amber

  const weekRows = []
  for (let w = 0; w < weeks; w++) {
    weekRows.push(grid.slice(w * 7, w * 7 + 7))
  }

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
      {weekRows.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {week.map(date => {
            const done = marks.has(date)
            const isToday = date === todayStr
            const isFuture = date > todayStr
            return (
              <div
                key={date}
                title={date}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 3,
                  background: done
                    ? col
                    : isFuture
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255,255,255,0.06)',
                  border: isToday ? `2px solid ${col}` : 'none',
                  opacity: done ? 1 : isFuture ? 0.3 : 0.5,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── New tracker form ────────────────────────────────────────────────────────
function NewTrackerForm({ onCreate, onCancel }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('chain')
  const [targetDays, setTargetDays] = useState('')
  const [emoji, setEmoji] = useState('✅')
  const [color, setColor] = useState('#C8955C')

  const EMOJIS = ['✅', '💪', '🧘', '📚', '🥗', '💧', '🏃', '✍️', '🎯', '😴', '🚫', '🌱']
  const COLORS = ['#C8955C', '#4ade80', '#60a5fa', '#c084fc', '#fbbf24', '#f87171', '#94a3b8', '#00d4aa']

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      type,
      target_days: type === 'challenge' && targetDays ? parseInt(targetDays) : null,
      emoji,
      color,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        animation: 'fadeUp 0.22s ease both',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {EMOJIS.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            style={{
              width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer',
              background: emoji === e ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.04)',
              border: emoji === e ? `1.5px solid ${C.amber}` : '1px solid rgba(255,255,255,0.08)',
              color: C.text,
            }}
          >{e}</button>
        ))}
      </div>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
        placeholder="What are you tracking?"
        autoFocus
        style={{
          width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          padding: '9px 14px', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10,
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { value: 'chain', label: 'Open chain' },
          { value: 'challenge', label: 'Fixed challenge' },
          { value: 'count', label: 'Count toward goal' },
        ].map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              background: type === opt.value ? `${C.amber}22` : 'rgba(255,255,255,0.04)',
              border: type === opt.value ? `1.5px solid ${C.amber}` : '1px solid rgba(255,255,255,0.08)',
              color: type === opt.value ? C.amber : C.muted,
            }}
          >{opt.label}</button>
        ))}
      </div>

      {type === 'challenge' && (
        <input
          value={targetDays}
          onChange={e => setTargetDays(e.target.value)}
          type="number"
          min="1"
          placeholder="How many days? (e.g. 75)"
          style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            padding: '9px 14px', color: C.text, fontSize: 13, outline: 'none', marginBottom: 10,
          }}
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            style={{
              width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
              background: c,
              border: color === c ? '2px solid #fff' : '2px solid transparent',
              outline: color === c ? `2px solid ${c}` : 'none',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          style={{
            padding: '8px 20px', borderRadius: 10, background: C.amber,
            color: '#1a1008', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >Create tracker</button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)', color: C.muted, fontSize: 13, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
    </form>
  )
}

// ─── Tracker card ────────────────────────────────────────────────────────────
function TrackerCard({ tracker, onClick }) {
  const [hovering, setHovering] = useState(false)
  const col = tracker.color || C.amber

  const progressLabel = (() => {
    if (tracker.type === 'challenge' && tracker.target_days) {
      const marks = markSet(tracker)
      const done = marks.size
      return `${done} / ${tracker.target_days} days`
    }
    if (tracker.type === 'count' && tracker.target_count) {
      const marks = markSet(tracker)
      return `${marks.size} / ${tracker.target_count}`
    }
    return null
  })()

  const progressPct = (() => {
    if (tracker.type === 'challenge' && tracker.target_days) {
      return Math.min(100, Math.round((markSet(tracker).size / tracker.target_days) * 100))
    }
    if (tracker.type === 'count' && tracker.target_count) {
      return Math.min(100, Math.round((markSet(tracker).size / tracker.target_count) * 100))
    }
    return null
  })()

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        padding: '16px 18px', marginBottom: 12,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovering ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16, animation: 'fadeUp 0.28s ease both',
        cursor: 'pointer', transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{tracker.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{
              fontSize: 15, fontWeight: 600, color: C.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {tracker.title}
            </span>
            <span style={{
              fontSize: 9, borderRadius: 10, padding: '2px 8px',
              background: `${col}18`, color: col, flexShrink: 0, fontWeight: 600,
            }}>
              {tracker.type}
            </span>
          </div>
          {progressLabel && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{progressLabel}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{
            background: 'rgba(245,166,35,0.12)', color: C.amber,
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700,
          }}>
            🔥 {tracker.streak} day{tracker.streak !== 1 ? 's' : ''}
          </span>
          <MiniWeekGrid tracker={tracker} />
        </div>
      </div>

      {progressPct !== null && (
        <div style={{ marginTop: 10, height: 4, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPct}%`, height: '100%', background: col,
            borderRadius: 6, transition: 'width 0.4s ease',
          }} />
        </div>
      )}
    </div>
  )
}

// ─── Tracker detail view ─────────────────────────────────────────────────────
function TrackerDetail({ tracker, onBack, onMark, onRevive }) {
  const col = tracker.color || C.amber
  const marks = markSet(tracker)
  const todayStr = isoDate(0)
  const doneToday = marks.has(todayStr)

  const progressLabel = (() => {
    if (tracker.type === 'challenge' && tracker.target_days) {
      return `Day ${marks.size} of ${tracker.target_days}`
    }
    if (tracker.type === 'count' && tracker.target_count) {
      return `${marks.size} of ${tracker.target_count}`
    }
    return null
  })()

  const progressPct = (() => {
    if (tracker.type === 'challenge' && tracker.target_days) {
      return Math.min(100, Math.round((marks.size / tracker.target_days) * 100))
    }
    if (tracker.type === 'count' && tracker.target_count) {
      return Math.min(100, Math.round((marks.size / tracker.target_count) * 100))
    }
    return null
  })()

  return (
    <div style={{ animation: 'fadeUp 0.28s ease both' }}>
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px', borderRadius: 10, background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)', color: C.muted,
          fontSize: 13, cursor: 'pointer', marginBottom: 20,
        }}
      >← Back to trackers</button>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontSize: 40 }}>{tracker.emoji}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 28,
            color: '#f1f5ea', margin: 0, fontWeight: 500,
          }}>{tracker.title}</h1>
          {progressLabel && (
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{progressLabel}</div>
          )}
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'rgba(245,166,35,0.12)', borderRadius: 16, padding: '12px 20px',
        }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: C.amber, lineHeight: 1 }}>
            {tracker.streak}
          </span>
          <span style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>day streak</span>
        </div>
      </div>

      {/* Progress bar for challenges */}
      {progressPct !== null && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.text }}>Progress</span>
            <span style={{ fontSize: 13, color: col, fontWeight: 700 }}>{progressPct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`, height: '100%', background: col,
              borderRadius: 6, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => onMark(tracker.id)}
          style={{
            padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.18s',
            background: doneToday ? col : 'transparent',
            color: doneToday ? '#0a1a0a' : col,
            border: `1.5px solid ${col}`,
          }}
        >
          {doneToday ? '✓ Done today' : 'Mark today done'}
        </button>
        {tracker.revival_tokens > 0 && (
          <button
            onClick={() => onRevive(tracker.id)}
            style={{
              padding: '10px 18px', borderRadius: 12, fontSize: 13, cursor: 'pointer',
              background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
              border: '1px solid rgba(124,58,237,0.3)', fontWeight: 600,
            }}
          >
            🛡️ Revive ({tracker.revival_tokens} left)
          </button>
        )}
      </div>

      {/* Big grid */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Activity</span>
          <span style={{ fontSize: 11, color: C.muted }}>
            {marks.size} total mark{marks.size !== 1 ? 's' : ''}
          </span>
        </div>
        <DetailGrid tracker={tracker} />
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Trackers() {
  useAtmos()
  const isMobile = useIsMobile()
  const toast = useToast()
  const navigate = useNavigate()
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/trackers')
      .then(res => setTrackers(res.data.trackers || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function handleCreate(data) {
    api.post('/trackers', data)
      .then(res => {
        const created = res.data.tracker
        setTrackers(prev => [created, ...prev])
        setShowForm(false)
        toast.success(`${created.emoji} ${created.title} — tracker created!`)
      })
      .catch(() => {})
  }

  function handleMark(id) {
    setTrackers(prev => prev.map(t =>
      t.id === id ? { ...t, streak: t.streak + 1 } : t
    ))
    api.post(`/trackers/${id}/mark`)
      .then(() => load())
      .catch(() => {
        toast.error('Failed to mark — reverting')
        load()
      })
  }

  function handleRevive(id) {
    api.post(`/trackers/${id}/revive`)
      .then(() => {
        load()
        toast.success('🛡️ Revival used — streak protected!')
      })
      .catch(() => {})
  }

  const activeTrackers = selected ? trackers.find(t => t.id === selected) : null

  return (
    <ErrorBoundary>
    <SidebarLayout>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
      <div style={{ padding: isMobile ? '14px 14px' : '20px 28px', maxWidth: 1120 }}>

        {activeTrackers ? (
          <TrackerDetail
            tracker={activeTrackers}
            onBack={() => setSelected(null)}
            onMark={handleMark}
            onRevive={handleRevive}
          />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div onClick={() => navigate('/dashboard')} style={{ width:32, height:32, borderRadius:10, background:'rgba(200,149,92,0.10)', border:'1px solid rgba(200,149,92,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:C.muted, flexShrink:0 }} title="Back to Home">◈</div>
                <div>
                  <h1 style={{
                    fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 34,
                    color: '#f1f5ea', margin: 0, fontWeight: 500,
                  }}>Trackers</h1>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    Don't break the chain
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowForm(v => !v)}
                style={{
                  padding: '8px 18px', borderRadius: 20, background: 'transparent',
                  border: `1.5px solid ${C.amber}`, color: C.amber, fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >+ New tracker</button>
            </div>

            {showForm && (
              <NewTrackerForm
                onCreate={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            )}

            {loading && (
              <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
                Loading…
              </div>
            )}

            {!loading && trackers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeUp 0.3s ease both' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📊</div>
                <div style={{ color: C.muted, fontSize: 16, marginBottom: 8 }}>
                  Start your first tracker
                </div>
                <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
                  Track anything — workouts, sober nights, reading, water — and watch the chain grow.
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    padding: '10px 24px', borderRadius: 20, background: 'transparent',
                    border: `1.5px solid ${C.amber}`, color: C.amber, fontSize: 14,
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >Create a tracker</button>
              </div>
            )}

            {!loading && trackers.length > 0 && trackers.map(tracker => (
              <TrackerCard
                key={tracker.id}
                tracker={tracker}
                onClick={() => setSelected(tracker.id)}
              />
            ))}
          </>
        )}

      </div>
    </SidebarLayout>
    </ErrorBoundary>
  )
}
