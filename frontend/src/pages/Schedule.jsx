import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout, { C } from '../components/layout/SidebarLayout';
import { useAtmos } from '../components/Atmosphere';
import api from '../lib/api';
import { useIsMobile } from '../hooks/useIsMobile';
import ErrorBoundary from '../components/ErrorBoundary';

// ─── Category tokens ──────────────────────────────────────────────────────────
const CAT = {
  spiritual: { bg:'rgba(76,63,145,0.22)',  border:'#a5b4fc', label:'Spiritual' },
  health:    { bg:'rgba(26,92,56,0.22)',   border:'#6ee7b7', label:'Health'    },
  meal:      { bg:'rgba(124,90,10,0.22)',  border:'#fbbf24', label:'Meal'      },
  work:      { bg:'rgba(15,94,94,0.22)',   border:'#2dd4bf', label:'Work'      },
  social:    { bg:'rgba(107,18,64,0.22)',  border:'#f9a8d4', label:'Social'    },
  sleep:     { bg:'rgba(15,45,82,0.22)',   border:'#93c5fd', label:'Sleep'     },
  conflict:  { bg:'rgba(239,68,68,0.12)',  border:'#f87171', label:'Conflict'  },
  personal:  { bg:'rgba(139,92,246,0.15)', border:'#c4b5fd', label:'Personal'  },
};

// No hardcoded demo data — all content comes from the API

const SECTIONS_ORDER = ['Morning Routine','Morning','Mid-Morning','Afternoon','Late Afternoon','Evening','Night'];

const WTYPE = {
  str: { bg:'rgba(110,231,183,0.15)', color:'#6ee7b7', label:'Strength' },
  car: { bg:'rgba(251,191,36,0.15)',  color:'#fbbf24', label:'Cardio'   },
  hit: { bg:'rgba(249,168,212,0.15)', color:'#f9a8d4', label:'HIIT'     },
  yog: { bg:'rgba(165,180,252,0.15)', color:'#a5b4fc', label:'Yoga'     },
  rst: { bg:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.3)', label:'Rest' },
};

function fmtH(h, m) {
  const ap = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 || 12;
  return `${hh}:${m < 10 ? '0' + m : m} ${ap}`;
}

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, done, total, locked = 0, palette }) {
  const circ = 182.2;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, background:'rgba(0,0,0,0.22)', backdropFilter:'blur(16px)', border:`1px solid ${palette.border}`, borderRadius:14, padding:'14px 18px', marginBottom:16 }}>
      <div style={{ position:'relative', width:68, height:68, flexShrink:0 }}>
        <svg style={{ transform:'rotate(-90deg)' }} width="68" height="68" viewBox="0 0 68 68">
          <circle fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" cx="34" cy="34" r="29" />
          <circle fill="none" stroke={palette.accent} strokeWidth="5" strokeLinecap="round"
            cx="34" cy="34" r="29"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition:'stroke-dashoffset 0.7s ease' }}
          />
        </svg>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
          <div style={{ fontSize:17, fontWeight:700, color:palette.accent }}>{pct}%</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:-2 }}>done</div>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, flex:1 }}>
        {[
          [`${done} / ${total} done`,                          'rgba(230,168,23,0.3)',  palette.accent],
          [`${locked} locked`,       'rgba(110,231,183,0.3)', '#6ee7b7'     ],
        ].map(([label, bc, tc]) => (
          <div key={label} style={{ background:'rgba(0,0,0,0.18)', border:`1px solid ${bc}`, borderRadius:20, padding:'5px 11px', fontSize:11, color:tc }}><b>{label}</b></div>
        ))}
      </div>
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────
const REMINDER_OPTIONS = [
  { label: 'Off', value: null },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
];

function TaskCard({ task, onToggleDone, onToggleLock, onSelect, onReminderChange }) {
  const cat = CAT[task.cat] || CAT.personal;
  const [showBell, setShowBell] = useState(false);
  const [saving, setSaving] = useState(false);

  async function setReminder(minutes) {
    setShowBell(false);
    setSaving(true);
    try {
      await api.patch(`/schedule/${task.id}/reminder`, { reminder_minutes: minutes });
      onReminderChange(task.id, minutes);
    } catch {}
    setSaving(false);
  }

  const hasReminder = task.reminder_minutes != null;

  return (
    <div
      onClick={() => onSelect(task)}
      style={{
        background: cat.bg, backdropFilter:'blur(12px)',
        borderRadius:12, padding:'11px 14px',
        border:'1px solid rgba(255,255,255,0.07)',
        borderLeft:`3px solid ${cat.border}`,
        display:'flex', alignItems:'flex-start', gap:10,
        cursor:'pointer', opacity: task.done ? 0.42 : 1,
        transition:'all 0.18s', position:'relative',
      }}
    >
      <div
        onClick={e => { e.stopPropagation(); onToggleDone(task.id); }}
        style={{
          width:22, height:22, borderRadius:'50%',
          border: task.done ? 'none' : '2px solid rgba(255,255,255,0.22)',
          background: task.done ? cat.border : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', flexShrink:0, marginTop:1, transition:'all 0.18s',
        }}
      >
        {task.done && <span style={{ color:'#000', fontSize:11, fontWeight:800 }}>✓</span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
          <div style={{ fontSize:14, fontWeight:500, color: task.done ? 'rgba(255,255,255,0.3)' : '#e8f0e9', textDecoration: task.done ? 'line-through' : 'none', lineHeight:1.3 }}>
            {task.title}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            {task.dur > 0 && <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:6 }}>{task.dur}m</span>}
            {/* Bell reminder button */}
            <span
              onClick={e => { e.stopPropagation(); setShowBell(v => !v); }}
              title={hasReminder ? `Reminder: ${task.reminder_minutes} min before` : 'Set reminder'}
              style={{ fontSize:12, cursor:'pointer', opacity: saving ? 0.3 : hasReminder ? 1 : 0.35, transition:'opacity 0.15s', position:'relative' }}
            >
              {hasReminder ? '🔔' : '🔕'}
              {hasReminder && (
                <span style={{ position:'absolute', top:-5, right:-5, fontSize:8, background:'#F5A623', color:'#000', borderRadius:10, padding:'0 3px', fontWeight:700, lineHeight:'12px' }}>
                  {task.reminder_minutes >= 60 ? `${task.reminder_minutes/60}h` : `${task.reminder_minutes}m`}
                </span>
              )}
            </span>
            <span
              onClick={e => { e.stopPropagation(); onToggleLock(task.id); }}
              style={{ fontSize:11, cursor:'pointer', opacity:0.5, transition:'opacity 0.15s' }}
            >{task.locked ? '🔒' : '🔓'}</span>
          </div>
        </div>
        {task.sub && <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)', marginTop:4, lineHeight:1.4 }}>{task.sub}</div>}
      </div>

      {/* Bell dropdown */}
      {showBell && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position:'absolute', top:36, right:12, zIndex:50,
            background:'#111', border:'1px solid rgba(255,255,255,0.15)',
            borderRadius:10, padding:'6px 4px', minWidth:110,
            boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {REMINDER_OPTIONS.map(o => (
            <div
              key={String(o.value)}
              onClick={() => setReminder(o.value)}
              style={{
                padding:'7px 12px', fontSize:12, cursor:'pointer', borderRadius:6,
                color: task.reminder_minutes === o.value ? '#F5A623' : 'rgba(255,255,255,0.65)',
                background: task.reminder_minutes === o.value ? 'rgba(245,166,35,0.1)' : 'transparent',
                fontWeight: task.reminder_minutes === o.value ? 700 : 400,
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ tasks, onToggleDone, onToggleLock, onSelect, onReminderChange }) {
  const now = new Date();
  const nowH = now.getHours(), nowM = now.getMinutes();
  let nowInserted = false;
  const nowStr = fmtH(nowH, nowM);

  return (
    <div>
      {SECTIONS_ORDER.map(sec => {
        const secTasks = tasks.filter(t => t.section === sec);
        if (!secTasks.length) return null;
        return (
          <div key={sec}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', margin:'20px 0 10px' }}>{sec}</div>
            {secTasks.map(t => {
              const isPast = t.hour < nowH || (t.hour === nowH && t.min < nowM);
              let showNow = false;
              if (!nowInserted && (t.hour > nowH || (t.hour === nowH && t.min >= nowM)) && sec !== 'Morning Routine') {
                showNow = true;
                nowInserted = true;
              }
              return (
                <div key={t.id}>
                  {showNow && (
                    <div style={{ display:'flex', alignItems:'center', margin:'4px 0', paddingLeft:56 }}>
                      <div style={{ flex:1, height:1.5, background:'#ef4444' }} />
                      <span style={{ fontSize:10, color:'#ef4444', background:'rgba(239,68,68,0.14)', padding:'2px 8px', borderRadius:10, marginLeft:8, whiteSpace:'nowrap' }}>Now — {nowStr}</span>
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:46, textAlign:'right', flexShrink:0, paddingTop:15 }}>
                      <span style={{ fontSize:10, color: isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)', fontVariantNumeric:'tabular-nums' }}>{fmtH(t.hour, t.min)}</span>
                    </div>
                    <div style={{ width:14, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background: isPast ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)', border:'2px solid transparent', marginTop:13 }} />
                      <div style={{ width:1, background:'rgba(255,255,255,0.07)', flex:1, minHeight:20 }} />
                    </div>
                    <div style={{ flex:1, padding:'4px 0 8px' }}>
                      <TaskCard task={t} onToggleDone={onToggleDone} onToggleLock={onToggleLock} onSelect={onSelect} onReminderChange={onReminderChange} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Week tab ─────────────────────────────────────────────────────────────────
function WeekTab({ palette, openLumi }) {
  const isMobile = useIsMobile();
  const G = { background:'rgba(0,0,0,0.22)', backdropFilter:'blur(16px)', border:`1px solid ${palette.border}`, borderRadius:14 };
  const now = new Date();
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Build the 7 calendar dates for this week (Sun–Sat)
  const weekDays = Array.from({ length:7 }, (_, i) => {
    const d = new Date(now);
    const diff = i - now.getDay();
    d.setDate(now.getDate() + diff);
    return {
      name: dayNames[d.getDay()],
      num: d.getDate(),
      today: d.toDateString() === now.toDateString(),
      dateStr: d.toISOString().slice(0, 10), // YYYY-MM-DD
      dayIndex: i,
    };
  });

  const weekLabel = (() => {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    const end   = new Date(start); end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-NG',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'})}`;
  })();

  const [weekSchedules, setWeekSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/schedule')
      .then(res => { setWeekSchedules(res.data?.schedules || []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Returns true if entry should appear on the calendar grid
  function isCalendarItem(entry) {
    if (entry.is_high_priority === true) return true;
    if (entry.repeat_pattern === 'none')     return true;
    if (entry.repeat_pattern === 'weekly')   return true;
    if (entry.repeat_pattern === 'custom')   return true;
    if (entry.repeat_pattern === 'weekdays') return true;
    // daily && !is_high_priority → reminder-only, hide from calendar
    return false;
  }

  // Returns entries that belong on a specific day of the week grid
  function getEntriesForDay(entries, dayIndex, dateStr) {
    const filtered = entries.filter(entry => {
      if (!isCalendarItem(entry)) return false;
      const p = entry.repeat_pattern;
      if (p === 'daily')    return true; // already excluded by isCalendarItem unless high-priority
      if (p === 'weekdays') return dayIndex >= 1 && dayIndex <= 5;
      if (p === 'weekly' || p === 'custom') {
        return Array.isArray(entry.repeat_days) && entry.repeat_days.includes(dayIndex);
      }
      if (p === 'none') return entry.target_date === dateStr;
      return false;
    });
    // Sort by start_time ascending
    return filtered.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }

  // Count reminder-only (daily && !is_high_priority) entries
  const reminderCount = weekSchedules.filter(e => e.repeat_pattern === 'daily' && !e.is_high_priority).length;

  return (
    <div style={{ animation:'fadeUp 0.35s ease' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:12 }}>Week of {weekLabel}</div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
          {Array.from({length:7}).map((_,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, height:120, animation:'shimmer 1.4s infinite',
              backgroundImage:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',
              backgroundSize:'200% 100%' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
          Couldn't load your week. <span style={{ color:'#C8955C', cursor:'pointer' }} onClick={() => window.location.reload()}>Retry</span>
        </div>
      ) : weekSchedules.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 24px', animation:'fadeUp 0.3s ease' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📅</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#e8e8f0', marginBottom:8 }}>Your week is open</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:24, lineHeight:1.6 }}>
            Let Lumi interview you across 8 areas of your life<br />and build your complete weekly schedule.
          </div>
          <button
            onClick={() => navigate('/talk-to-lumi?mode=onboarding')}
            style={{ padding:'11px 28px', borderRadius:24, border:'none', background:'rgba(200,149,92,0.85)', color:'#0a0a14', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
          >
            ✨ Start Life Audit with Lumi
          </button>
        </div>
      ) : (
        <>
          <div style={{ overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch', marginBottom: 8 }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(7, minmax(96px, 1fr))' : 'repeat(7,1fr)', gap:8, minWidth: isMobile ? 672 : 'unset' }}>
            {weekDays.map(d => {
              const dayEntries = getEntriesForDay(weekSchedules, d.dayIndex, d.dateStr);
              const visible    = dayEntries.slice(0, 4);
              const overflow   = dayEntries.length - visible.length;
              return (
                <div
                  key={d.name + d.num}
                  style={{ ...G, borderRadius:12, padding:'10px 7px 10px', textAlign:'center', borderColor: d.today ? palette.accent : palette.border, display:'flex', flexDirection:'column', gap:4 }}
                >
                  {/* Day header */}
                  <div style={{ fontSize:10, fontWeight:700, color: d.today ? palette.accent : 'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{d.name}</div>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:600, color:'#e8f0e9', margin:'2px 0 4px', lineHeight:1 }}>{d.num}</div>

                  {/* Chips */}
                  {visible.length === 0 ? (
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.15)', textAlign:'center', marginTop:4 }}>—</div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {visible.map(entry => {
                        const [hh, mm] = (entry.start_time || '00:00').split(':').map(Number);
                        const timeLabel = fmtH(hh, mm);
                        const bg     = CAT[entry.category]?.bg     || 'rgba(139,92,246,0.15)';
                        const border = CAT[entry.category]?.border || '#c4b5fd';
                        return (
                          <div
                            key={entry.id}
                            onClick={() => openLumi(`Tell me about "${entry.title}" on my schedule`)}
                            title={`${timeLabel} · ${entry.title}`}
                            style={{
                              background: bg,
                              borderLeft: `3px solid ${border}`,
                              borderRadius: 6,
                              padding: '4px 7px',
                              fontSize: 10,
                              color: '#e8f0e9',
                              textAlign: 'left',
                              cursor: 'pointer',
                              lineHeight: 1.35,
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {timeLabel} · {entry.title}
                          </div>
                        );
                      })}
                      {overflow > 0 && (
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.06)', borderRadius:6, padding:'3px 6px', textAlign:'center', cursor:'default' }}>
                          +{overflow} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>{/* end scroll wrapper */}

          {/* Reminders-only callout */}
          {reminderCount > 0 && (
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', display:'flex', gap:6, alignItems:'center', marginTop:16 }}>
              <span>🔔</span>
              <span>{reminderCount} daily habit{reminderCount !== 1 ? 's' : ''} will remind you — {reminderCount !== 1 ? "they're" : "it's"} not shown above to keep your calendar clean.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Plans tab ────────────────────────────────────────────────────────────────
function PlansTab({ palette, onLifeAudit }) {
  const navigate = useNavigate();
  const G = { background:'rgba(0,0,0,0.22)', backdropFilter:'blur(16px)', border:`1px solid ${palette.border}`, borderRadius:14, overflow:'hidden', marginBottom:14 };
  return (
    <div style={{ animation:'fadeUp 0.35s ease' }}>
      {/* Life audit CTA */}
      <div style={{ ...G, padding:'28px 24px', borderColor:'rgba(200,149,92,0.3)', background:'linear-gradient(135deg,rgba(200,149,92,0.08),rgba(139,92,246,0.06))', marginBottom:14 }}>
        <div style={{ fontSize:24, marginBottom:10 }}>✨</div>
        <div style={{ fontSize:15, fontWeight:700, color:'#e8f0e9', marginBottom:6 }}>Plan your entire life with Lumi</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.65, maxWidth:340, marginBottom:18 }}>
          Lumi will interview you across 8 areas — morning routine, work, meals, health, faith, family, creative work, and sleep — then build your complete weekly schedule in one session.
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button
            onClick={() => navigate('/talk-to-lumi')}
            style={{ padding:'10px 20px', borderRadius:24, border:'none', background:'rgba(200,149,92,0.85)', color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Start Life Audit →
          </button>
          <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
            style={{ padding:'10px 20px', borderRadius:24, border:'1px solid rgba(165,180,252,0.3)', background:'rgba(139,92,246,0.12)', color:'#a5b4fc', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textDecoration:'none', display:'inline-block' }}>
            ✨ Plan with Claude AI
          </a>
        </div>
      </div>

      <div style={{ ...G, padding:'24px', textAlign:'center' }}>
        <div style={{ fontSize:28, marginBottom:10 }}>📋</div>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f0e9', marginBottom:6 }}>Recurring Plans</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.6, maxWidth:320, margin:'0 auto 16px' }}>
          Tell Lumi about your workout routine, meals, Bible study, or anything you do regularly — it'll appear here.
        </div>
        <button onClick={() => navigate('/talk-to-lumi')}
          style={{ padding:'9px 20px', borderRadius:20, border:'1px solid rgba(165,180,252,0.22)', background:'rgba(165,180,252,0.08)', cursor:'pointer', fontSize:12, color:'#a5b4fc', fontFamily:'inherit' }}>
          ✨ Ask Lumi to set up a routine
        </button>
      </div>
    </div>
  );
}

// ─── Lumi side panel ──────────────────────────────────────────────────────────
function LumiPanel({ open, onClose, messages, onSend, loading, palette }) {
  const chatRef = useRef(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, open]);

  const QUICK = ['Plan my entire week','Fix a conflict','Plan my evening','What\'s next?'];

  function submit() {
    const msg = input.trim();
    if (!msg) return;
    setInput('');
    onSend(msg);
  }

  return (
    <div style={{
      position:'fixed', top:0, right:0, width:320, height:'100vh',
      background:'rgba(9,21,16,0.97)', backdropFilter:'blur(20px)',
      borderLeft:`1px solid ${palette.border}`,
      display:'flex', flexDirection:'column', zIndex:200,
      transform: open ? 'translateX(0)' : 'translateX(100%)',
      transition:'transform 0.3s ease',
    }}>
      <div style={{ padding:'20px 20px 14px', borderBottom:`1px solid ${palette.border}`, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(165,180,252,0.15)', border:'1px solid rgba(165,180,252,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✨</div>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'#a5b4fc' }}>Lumi</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{loading ? 'Thinking…' : 'Ready to help'}</div>
        </div>
        <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.28)', fontSize:18, lineHeight:1 }}>✕</button>
      </div>

      <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            padding:'10px 13px', fontSize:13, lineHeight:1.55, maxWidth:'90%',
            alignSelf: m.from === 'lumi' ? 'flex-start' : 'flex-end',
            background: m.from === 'lumi' ? 'rgba(76,63,145,0.22)' : 'rgba(255,255,255,0.08)',
            color: m.from === 'lumi' ? 'rgba(255,255,255,0.72)' : '#e8f0e9',
            border: m.from === 'lumi' ? '1px solid rgba(165,180,252,0.12)' : `1px solid ${palette.border}`,
            borderRadius: m.from === 'lumi' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
          }}>{m.text}</div>
        ))}
        {messages.length === 1 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => onSend(q)} style={{ fontSize:11, padding:'5px 10px', border:'1px solid rgba(165,180,252,0.22)', borderRadius:20, background:'none', cursor:'pointer', color:'#a5b4fc', fontFamily:'inherit' }}>{q}</button>
            ))}
          </div>
        )}
        {loading && (
          <div style={{ alignSelf:'flex-start', padding:'10px 13px', borderRadius:'4px 12px 12px 12px', background:'rgba(76,63,145,0.22)', fontSize:13, color:'rgba(255,255,255,0.35)', border:'1px solid rgba(165,180,252,0.12)' }}>…</div>
        )}
      </div>

      <div style={{ display:'flex', gap:8, padding:'12px 16px', borderTop:`1px solid ${palette.border}` }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Tell Lumi what you need…"
          style={{ flex:1, background:'rgba(255,255,255,0.05)', border:`1px solid ${palette.border}`, borderRadius:10, padding:'9px 12px', color:'#e8f0e9', fontFamily:'inherit', fontSize:13, outline:'none' }}
        />
        <button onClick={submit} style={{ background:'rgba(76,63,145,0.4)', border:'1px solid rgba(165,180,252,0.25)', borderRadius:10, padding:'9px 14px', cursor:'pointer', color:'#a5b4fc', fontSize:13, fontFamily:'inherit' }}>Send</button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Schedule() {
  const { palette } = useAtmos();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]     = useState('today');
  const [tasks, setTasks]             = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [lumiOpen, setLumiOpen]       = useState(false);
  const [lumiLoading, setLumiLoading] = useState(false);
  const [lumiMsgs, setLumiMsgs]       = useState([]);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const showNightBanner = now.getHours() >= 21;

  // Load schedule from API
  useEffect(() => {
    api.get('/schedule/today')
      .then(res => {
        const rows = res.data?.schedules || [];
        setTasks(rows.map(r => {
          const h = parseInt((r.start_time || '08:00').split(':')[0]);
          let section;
          if (h < 7)        section = 'Morning Routine';
          else if (h < 9)   section = 'Morning';
          else if (h < 12)  section = 'Mid-Morning';
          else if (h < 14)  section = 'Afternoon';
          else if (h < 17)  section = 'Late Afternoon';
          else if (h < 20)  section = 'Evening';
          else              section = 'Night';
          return {
            id: r.id,
            hour: h,
            min:  parseInt((r.start_time || '08:00').split(':')[1] || '0'),
            dur:  r.duration_minutes || 60,
            title: r.title,
            sub:   r.description || '',
            cat:   r.category || 'personal',
            locked: r.is_high_priority || false,
            done:   r.completed || false,
            reminder_minutes: r.reminder_minutes ?? 10,
            section,
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingTasks(false));

    // Load a real Lumi greeting based on current context
    api.post('/lumi/message', { text: "What's on my schedule today? Give me a quick briefing.", source: 'planner' })
      .then(res => {
        if (res.data?.message) {
          setLumiMsgs([{ from: 'lumi', text: res.data.message }]);
        }
      })
      .catch(() => {
        setLumiMsgs([{ from: 'lumi', text: "Hey! Tell me what you want to work on today and I'll help you plan it." }]);
      });
  }, []);

  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  function addMsg(msg) { setLumiMsgs(prev => [...prev, msg]); }

  function toggleDone(id) {
    const t = tasks.find(x => x.id === id);
    setTasks(prev => prev.map(x => x.id === id ? { ...x, done: !x.done } : x));
    if (t && !t.done) addMsg({ from:'lumi', text:`Great job completing "${t.title}" ✓ Keep going — you're building momentum!` });
  }

  function toggleLock(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if (t.locked && !window.confirm(`Unlock "${t.title}"? This is a priority anchor.`)) return;
    setTasks(prev => prev.map(x => x.id === id ? { ...x, locked: !x.locked } : x));
  }

  function selectTask(task) { openLumi(`Tell me about my task: "${task.title}". Should I adjust anything?`); }

  function handleReminderChange(id, minutes) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, reminder_minutes: minutes } : t));
  }

  async function openLumi(prompt) {
    setLumiOpen(true);
    if (!prompt?.trim()) return;
    addMsg({ from:'user', text: prompt });
    setLumiLoading(true);
    try {
      const res = await api.post('/lumi/message', { text: prompt, source: 'planner' });
      addMsg({ from:'lumi', text: res.data.message });
    } catch {
      addMsg({ from:'lumi', text: `Let me check your schedule on that — "${prompt}"` });
    } finally { setLumiLoading(false); }
  }

  async function sendLumi(msg) {
    if (!msg?.trim()) return;
    addMsg({ from:'user', text: msg });
    setLumiLoading(true);
    try {
      const res = await api.post('/lumi/message', { text: msg, source: 'planner' });
      addMsg({ from:'lumi', text: res.data.message });
    } catch {
      addMsg({ from:'lumi', text:"I'm here! Tell me more and I'll help you plan, fix conflicts, or reschedule." });
    } finally { setLumiLoading(false); }
  }

  const GLASS = { background:'rgba(0,0,0,0.22)', backdropFilter:'blur(16px)', border:`1px solid ${palette.border}` };
  const TABS = [['today','Today'],['week','This Week'],['plans','My Plans']];

  return (
    <ErrorBoundary>
    <SidebarLayout>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .planner-scroll::-webkit-scrollbar { width:4px }
        .planner-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>

        {/* ── Header ── */}
        <div style={{ padding:'20px 28px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:27, fontWeight:700, color:'#e8f0e9', letterSpacing:'-0.5px' }}>Planner</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.38)', marginTop:3 }}>{dateLabel}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {pct > 0 && (
                <div style={{ ...GLASS, borderRadius:20, padding:'5px 12px', fontSize:12, color:'rgba(255,255,255,0.42)' }}>
                  Today: <span style={{ color:'#6ee7b7', fontWeight:500 }}>{pct}%</span>
                </div>
              )}
              <div style={{ background:'rgba(200,149,92,0.12)', border:'1px solid rgba(200,149,92,0.25)', borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:500, color:palette.accent }}>
                Day {now.getDate()} of {now.toLocaleDateString('en-US',{month:'long'})}
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${palette.border}`, marginTop:4 }}>
            {TABS.map(([id, label]) => (
              <div key={id} onClick={() => setActiveTab(id)} style={{ padding:'9px 18px', cursor:'pointer', fontSize:13, fontWeight:500, color: activeTab===id ? palette.accent : 'rgba(255,255,255,0.28)', borderBottom: activeTab===id ? `2px solid ${palette.accent}` : '2px solid transparent', transition:'all 0.18s', marginBottom:-1 }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="planner-scroll" style={{ flex:1, overflowY:'auto', padding:'20px 28px 100px' }}>

          {activeTab === 'today' && (
            <div style={{ animation:'fadeUp 0.35s ease' }}>
              {showNightBanner && (
                <div style={{ background:'linear-gradient(135deg,rgba(15,45,82,0.5),rgba(76,63,145,0.25))', border:'1px solid rgba(147,197,253,0.18)', borderRadius:13, padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:20 }}>🌙</span>
                  <div style={{ flex:1, fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>
                    Almost bedtime. <strong style={{ color:'#93c5fd' }}>Plan tomorrow with Lumi</strong> before you sleep.
                  </div>
                  <button onClick={() => openLumi("Let's plan tomorrow")} style={{ background:'rgba(147,197,253,0.12)', border:'1px solid rgba(147,197,253,0.28)', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontSize:12, color:'#93c5fd', fontFamily:'inherit', whiteSpace:'nowrap' }}>Plan Tomorrow ↗</button>
                </div>
              )}

              {total > 0 && <ProgressRing pct={pct} done={done} total={total} locked={tasks.filter(t=>t.locked).length} palette={palette} />}

              <div onClick={() => openLumi('')} style={{ background:'linear-gradient(135deg,rgba(76,63,145,0.18),rgba(15,94,94,0.18))', border:'1px solid rgba(165,180,252,0.18)', borderRadius:14, padding:'14px 16px', marginBottom:18, display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(165,180,252,0.15)', border:'1px solid rgba(165,180,252,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>✨</div>
                <div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.62)', lineHeight:1.55 }}>
                    <strong style={{ color:'#a5b4fc' }}>Lumi is ready.</strong>{' '}
                    {total > 0
                      ? <>You have <span style={{ color:palette.accent }}>{total} tasks</span> today — {done} done so far.</>
                      : <>Your day is open. Ask Lumi to help you plan it.</>}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(165,180,252,0.55)', marginTop:6 }}>Tap to talk to Lumi → plan your day, fix conflicts, reschedule</div>
                </div>
              </div>

              {loadingTasks ? (
                <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.28)', fontSize:13 }}>Loading your plan…</div>
              ) : total === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px' }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#e8f0e9', marginBottom:8 }}>Your day is open</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginBottom:20 }}>Ask Lumi to build your day, or add a task below.</div>
                  <button onClick={() => openLumi('Plan my day')} style={{ background:'rgba(165,180,252,0.12)', border:'1px solid rgba(165,180,252,0.28)', borderRadius:24, padding:'10px 24px', cursor:'pointer', fontSize:13, color:'#a5b4fc', fontFamily:'inherit', fontWeight:500 }}>✨ Plan my day with Lumi</button>
                </div>
              ) : (
                <Timeline tasks={tasks} onToggleDone={toggleDone} onToggleLock={toggleLock} onSelect={selectTask} onReminderChange={handleReminderChange} />
              )}
            </div>
          )}

          {activeTab === 'week'  && <WeekTab palette={palette} openLumi={openLumi} />}

          {activeTab === 'plans' && <PlansTab palette={palette} onLifeAudit={() => openLumi('Lumi, let\'s plan my entire life and weekly schedule.')} />}
        </div>
      </div>

      <LumiPanel open={lumiOpen} onClose={() => setLumiOpen(false)} messages={lumiMsgs} onSend={sendLumi} loading={lumiLoading} palette={palette} />

      {/* FABs */}
      <div style={{ position:'fixed', bottom:24, right:24, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', zIndex:99 }}>
        <button onClick={() => openLumi('')} style={{ display:'flex', alignItems:'center', gap:8, borderRadius:28, padding:'11px 18px', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:500, background:'rgba(76,63,145,0.85)', border:'1px solid rgba(165,180,252,0.3)', color:'#a5b4fc', transition:'all 0.2s' }}>
          ✨ Ask Lumi
        </button>
        <button onClick={() => openLumi('I want to add a task: ')} style={{ display:'flex', alignItems:'center', gap:8, borderRadius:28, padding:'11px 18px', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:500, background:'rgba(0,0,0,0.28)', border:`1px solid ${palette.border}`, color:'rgba(255,255,255,0.5)', transition:'all 0.2s' }}>
          🎙 Add via voice
        </button>
      </div>
    </SidebarLayout>
    </ErrorBoundary>
  );
}
