import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout, { C } from '../components/layout/SidebarLayout';
import { useAtmos } from '../components/Atmosphere';
import api from '../lib/api';

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

const DEMO_TASKS = [
  { id:1,  hour:5,  min:0,  dur:30,  title:'Bible Reading',         sub:'Open your heart. 2 chapters today.',            cat:'spiritual', locked:true,  done:false, section:'Morning Routine' },
  { id:2,  hour:5,  min:35, dur:15,  title:'Morning Prayer',        sub:'Gratitude + intention setting.',                cat:'spiritual', locked:true,  done:false, section:'Morning Routine' },
  { id:3,  hour:6,  min:0,  dur:20,  title:'Meditation',            sub:'Breathwork · mindfulness · silence.',           cat:'health',    locked:true,  done:false, section:'Morning Routine' },
  { id:4,  hour:7,  min:0,  dur:30,  title:'Breakfast',             sub:'Oats + banana + black coffee. Log food.',       cat:'meal',      locked:false, done:false, section:'Morning Routine' },
  { id:5,  hour:8,  min:0,  dur:120, title:'Deep Work Block',       sub:'High-priority tasks. Notifications off.',       cat:'work',      locked:false, done:false, section:'Morning'         },
  { id:6,  hour:10, min:0,  dur:5,   title:'Hydration Check',       sub:'500ml water. Log in tracker.',                 cat:'health',    locked:false, done:false, section:'Mid-Morning'     },
  { id:7,  hour:10, min:0,  dur:45,  title:'Reading',               sub:'⚠️ Conflict with Hydration Check.',             cat:'conflict',  locked:false, done:false, section:'Mid-Morning'     },
  { id:8,  hour:13, min:0,  dur:45,  title:'Lunch',                 sub:'Brown rice + grilled chicken + salad.',         cat:'meal',      locked:false, done:false, section:'Afternoon'       },
  { id:9,  hour:14, min:0,  dur:90,  title:'Workout',               sub:'Strength — Upper Body. Prep gear at 1:50 PM.', cat:'health',    locked:false, done:false, section:'Afternoon'       },
  { id:10, hour:16, min:0,  dur:30,  title:'Budget Review',         sub:'Update expense log. Check savings goal.',       cat:'work',      locked:false, done:false, section:'Late Afternoon'  },
  { id:11, hour:17, min:0,  dur:30,  title:'Reading (rescheduled)', sub:'Personal development. 20 pages min.',           cat:'work',      locked:false, done:false, section:'Late Afternoon'  },
  { id:12, hour:19, min:0,  dur:30,  title:'Dinner',                sub:'Sweet potato + salmon + broccoli.',             cat:'meal',      locked:false, done:false, section:'Evening'         },
  { id:13, hour:20, min:0,  dur:20,  title:'Family / Social Time',  sub:'Be present. Put phone down.',                  cat:'social',    locked:false, done:false, section:'Evening'         },
  { id:14, hour:21, min:30, dur:15,  title:'Turn Off Wi-Fi',        sub:'Digital detox. Prepare mind for rest.',        cat:'health',    locked:true,  done:false, section:'Night'           },
  { id:15, hour:22, min:0,  dur:0,   title:'Sleep',                 sub:'Target 8 hours. Bedtime protected.',           cat:'sleep',     locked:true,  done:false, section:'Night'           },
];

const WORKOUT_PLAN = [
  { day:'MON', type:'Strength', detail:'Upper Body — Chest, Shoulders, Triceps', time:'2:00 PM', cls:'str', done:false },
  { day:'TUE', type:'Cardio',   detail:'30min run — moderate pace',              time:'7:00 AM', cls:'car', done:false },
  { day:'WED', type:'Strength', detail:'Lower Body — Quads, Glutes, Hamstrings', time:'2:00 PM', cls:'str', done:true  },
  { day:'THU', type:'HIIT',     detail:'25min circuit — full body',              time:'7:00 AM', cls:'hit', done:true  },
  { day:'FRI', type:'Strength', detail:'Upper Body — Back, Biceps, Core',       time:'2:00 PM', cls:'str', done:false },
  { day:'SAT', type:'Yoga',     detail:'Flexibility + mobility, 40min',          time:'8:00 AM', cls:'yog', done:false },
  { day:'SUN', type:'Rest',     detail:'Active recovery — light walk',           time:'—',       cls:'rst', done:false },
];

const MEALS = [
  { time:'Breakfast', food:'Oats with banana + peanut butter, black coffee', cals:'420 kcal'  },
  { time:'Snack',     food:'Apple + almond butter (2 tbsp)',                  cals:'190 kcal'  },
  { time:'Lunch',     food:'Brown rice + grilled chicken breast + green salad',cals:'550 kcal' },
  { time:'Snack 2',   food:'Greek yogurt + honey + walnuts',                  cals:'220 kcal'  },
  { time:'Dinner',    food:'Sweet potato + baked salmon + steamed broccoli',  cals:'480 kcal'  },
];

const MEDS_DEFAULT = [
  { name:'Vitamin D3',          time:'8:00 AM',  dose:'1 capsule',  color:'#fbbf24', done:false },
  { name:'Omega 3 Fish Oil',    time:'8:00 AM',  dose:'2 capsules', color:'#6ee7b7', done:false },
  { name:'Magnesium Glycinate', time:'10:00 PM', dose:'1 tablet',   color:'#a5b4fc', done:false },
];

const WEEK_DAYS = [
  { name:'Mon', num:27, pct:82,   dots:['#6ee7b7','#a5b4fc','#fbbf24','#6ee7b7'], today:false },
  { name:'Tue', num:28, pct:65,   dots:['#fbbf24','#6ee7b7','#2dd4bf'],           today:false },
  { name:'Wed', num:29, pct:91,   dots:['#6ee7b7','#a5b4fc','#fbbf24','#2dd4bf'], today:false },
  { name:'Thu', num:30, pct:78,   dots:['#a5b4fc','#6ee7b7','#fbbf24'],           today:false },
  { name:'Fri', num:1,  pct:null, dots:['#a5b4fc','#6ee7b7','#fbbf24'],           today:true  },
  { name:'Sat', num:2,  pct:null, dots:[],                                         today:false },
  { name:'Sun', num:3,  pct:null, dots:[],                                         today:false },
];

const GOALS = [
  { title:'Read 24 books this year',        pct:62, color:'#6ee7b7' },
  { title:'Daily Bible reading — 365 days', pct:34, color:'#a5b4fc' },
  { title:'Lose 8kg by June',               pct:45, color:'#C8955C' },
  { title:'Save ₦50,000',                   pct:30, color:'#2dd4bf' },
];

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
function ProgressRing({ pct, done, total, palette }) {
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
          [`${done} / ${total} done`, 'rgba(230,168,23,0.3)',  palette.accent],
          ['3 locked',                'rgba(110,231,183,0.3)', '#6ee7b7'     ],
          ['6 streak days',           'rgba(165,180,252,0.3)', '#a5b4fc'     ],
          ['1 conflict',              'rgba(248,113,113,0.3)', '#f87171'     ],
        ].map(([label, bc, tc]) => (
          <div key={label} style={{ background:'rgba(0,0,0,0.18)', border:`1px solid ${bc}`, borderRadius:20, padding:'5px 11px', fontSize:11, color:tc }}><b>{label}</b></div>
        ))}
      </div>
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggleDone, onToggleLock, onSelect }) {
  const cat = CAT[task.cat] || CAT.personal;
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
        transition:'all 0.18s',
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
            <span
              onClick={e => { e.stopPropagation(); onToggleLock(task.id); }}
              style={{ fontSize:11, cursor:'pointer', opacity:0.5, transition:'opacity 0.15s' }}
            >{task.locked ? '🔒' : '🔓'}</span>
          </div>
        </div>
        {task.sub && <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)', marginTop:4, lineHeight:1.4 }}>{task.sub}</div>}
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ tasks, onToggleDone, onToggleLock, onSelect }) {
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
                      <TaskCard task={t} onToggleDone={onToggleDone} onToggleLock={onToggleLock} onSelect={onSelect} />
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
function WeekTab({ palette }) {
  const G = { background:'rgba(0,0,0,0.22)', backdropFilter:'blur(16px)', border:`1px solid ${palette.border}`, borderRadius:14 };
  return (
    <div style={{ animation:'fadeUp 0.35s ease' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:12 }}>Week of April 27 – May 3, 2026</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:24 }}>
        {WEEK_DAYS.map(d => (
          <div key={d.name} style={{ ...G, borderRadius:12, padding:'12px 8px', textAlign:'center', borderColor: d.today ? palette.accent : palette.border }}>
            <div style={{ fontSize:10, fontWeight:700, color: d.today ? palette.accent : 'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{d.name}</div>
            <div style={{ fontSize:22, fontWeight:600, color:'#e8f0e9', margin:'4px 0 2px' }}>{d.num}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{d.pct ? `${d.pct}%` : d.today ? 'In prog' : '—'}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:3, marginTop:7, flexWrap:'wrap' }}>
              {d.dots.map((c, i) => <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:c }} />)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:'#e8f0e9', marginBottom:12 }}>Workout Plan</div>
      <div style={{ ...G, padding:'14px 18px', marginBottom:20 }}>
        {WORKOUT_PLAN.map((w, i) => {
          const wt = WTYPE[w.cls] || WTYPE.rst;
          return (
            <div key={w.day} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < WORKOUT_PLAN.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width:30, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', flexShrink:0 }}>{w.day}</div>
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:wt.bg, color:wt.color, fontWeight:500, whiteSpace:'nowrap' }}>{wt.label}</span>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', flex:1 }}>{w.detail}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{w.time}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:'#e8f0e9', marginBottom:12 }}>Goals Progress</div>
      <div style={{ ...G, padding:'14px 18px' }}>
        {GOALS.map(g => (
          <div key={g.title} style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:13, color:'#e8f0e9' }}>{g.title}</span>
              <span style={{ fontSize:12, fontWeight:600, color:g.color }}>{g.pct}%</span>
            </div>
            <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, background:g.color, width:`${g.pct}%`, transition:'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Plans tab ────────────────────────────────────────────────────────────────
function PlansTab({ meds, onToggleMed, workout, onToggleWorkout, palette }) {
  const G   = { background:'rgba(0,0,0,0.22)', backdropFilter:'blur(16px)', border:`1px solid ${palette.border}`, borderRadius:14, overflow:'hidden', marginBottom:14 };
  const HDR = { padding:'14px 18px 12px', borderBottom:`1px solid ${palette.border}`, display:'flex', alignItems:'center', gap:10 };
  const heatData = [0,0.3,0.6,1,0.8,0.9,1,0.7,1,1,0.5,0.8,1,1,0.3,0.6,0.9,1,0.8,0.7,1];

  return (
    <div style={{ animation:'fadeUp 0.35s ease' }}>
      {/* Workout */}
      <div style={G}>
        <div style={HDR}>
          <span style={{ fontSize:20 }}>🏋️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#e8f0e9' }}>Workout Plan</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Weekly training schedule</div>
          </div>
          <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:'rgba(110,231,183,0.15)', color:'#6ee7b7', fontWeight:500 }}>Active</span>
        </div>
        <div style={{ padding:'14px 18px' }}>
          {workout.map((w, i) => {
            const wt = WTYPE[w.cls] || WTYPE.rst;
            return (
              <div key={w.day} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < workout.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ width:30, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', flexShrink:0 }}>{w.day}</div>
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:wt.bg, color:wt.color, fontWeight:500 }}>{wt.label}</span>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', flex:1 }}>{w.detail}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{w.time}</div>
                <span onClick={() => onToggleWorkout(i)} style={{ fontSize:15, cursor:'pointer' }}>{w.done ? '✅' : '⬜'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meals */}
      <div style={G}>
        <div style={HDR}>
          <span style={{ fontSize:20 }}>🍽️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#e8f0e9' }}>Today's Meal Plan</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Calories · Macros · Hydration</div>
          </div>
          <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:'rgba(200,149,92,0.12)', color:'#C8955C', fontWeight:500 }}>1,860 kcal</span>
        </div>
        <div style={{ padding:'14px 18px' }}>
          {MEALS.map((m, i) => (
            <div key={m.time} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom: i < MEALS.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems:'flex-start' }}>
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(124,90,10,0.22)', color:'#fbbf24', fontWeight:500, whiteSpace:'nowrap', flexShrink:0, marginTop:1 }}>{m.time}</span>
              <div>
                <div style={{ fontSize:12, color:'#e8f0e9' }}>{m.food}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:2 }}>{m.cals}</div>
              </div>
            </div>
          ))}
          <div style={{ display:'flex', gap:20, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {[['1,860','total kcal','#fbbf24'],['145g','protein','#6ee7b7'],['8','glasses water','#93c5fd']].map(([v,l,c]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meds */}
      <div style={G}>
        <div style={HDR}>
          <span style={{ fontSize:20 }}>💊</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#e8f0e9' }}>Medication Schedule</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Daily medication tracker</div>
          </div>
          <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:'rgba(76,63,145,0.2)', color:'#a5b4fc', fontWeight:500 }}>{meds.filter(m=>m.done).length}/{meds.length} today</span>
        </div>
        <div style={{ padding:'14px 18px' }}>
          {meds.map((m, i) => (
            <div key={m.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < meds.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:m.color, flexShrink:0 }} />
              <div style={{ fontSize:13, color:'#e8f0e9', flex:1 }}>{m.name}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{m.time}</div>
              <div style={{ fontSize:11, background:'rgba(255,255,255,0.08)', padding:'2px 8px', borderRadius:8, color:'rgba(255,255,255,0.5)' }}>{m.dose}</div>
              <span onClick={() => onToggleMed(i)} style={{ fontSize:16, cursor:'pointer' }}>{m.done ? '✅' : '⬜'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div style={G}>
        <div style={HDR}>
          <span style={{ fontSize:20 }}>🌙</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#e8f0e9' }}>Sleep Schedule</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Target 8h · Bedtime 10:00 PM</div>
          </div>
          <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:'rgba(15,45,82,0.22)', color:'#93c5fd', fontWeight:500 }}>6-day streak</span>
        </div>
        <div style={{ padding:'14px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.28)', marginBottom:4 }}>
            <span>Bedtime</span><span style={{ color:'#93c5fd', fontWeight:500 }}>10:00 PM</span>
          </div>
          <div style={{ height:7, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden', margin:'6px 0' }}>
            <div style={{ height:'100%', borderRadius:4, background:'#93c5fd', width:'75%' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.28)' }}>
            <span>Wake up</span><span style={{ color:'#93c5fd', fontWeight:500 }}>5:00 AM · 7h target</span>
          </div>
          <div style={{ display:'flex', gap:20, margin:'14px 0 10px' }}>
            {[['6','streak days','#93c5fd'],['7.2h','avg this week','#6ee7b7'],['82%','quality score','#C8955C']].map(([v,l,c]) => (
              <div key={l}>
                <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginBottom:6 }}>Last 21 nights</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {heatData.map((v, i) => (
              <div key={i} style={{ height:10, borderRadius:2, background:`rgba(147,197,253,${v===0?0.08:0.15+v*0.7})` }} />
            ))}
          </div>
        </div>
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

  const QUICK = ['Fix 10AM conflict','Plan my evening','What did I do yesterday?','Plan tomorrow night'];

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
  const [tasks, setTasks]             = useState(DEMO_TASKS);
  const [workout, setWorkout]         = useState(WORKOUT_PLAN.map(w => ({ ...w })));
  const [meds, setMeds]               = useState(MEDS_DEFAULT.map(m => ({ ...m })));
  const [lumiOpen, setLumiOpen]       = useState(false);
  const [lumiLoading, setLumiLoading] = useState(false);
  const [lumiMsgs, setLumiMsgs]       = useState([
    { from:'lumi', text:"Good morning! You have 15 blocks today. Your Workout starts at 2:00 PM — prep gear at 1:50 PM. You also have a conflict at 10 AM I can fix in one tap." }
  ]);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const showNightBanner = now.getHours() >= 21;

  // Try API, fall back to demo silently
  useEffect(() => {
    api.get('/schedule/today').then(res => {
      const rows = res.data?.schedules || [];
      if (rows.length > 0) {
        setTasks(rows.map(r => ({
          id: r.id,
          hour: parseInt((r.start_time || '08:00').split(':')[0]),
          min:  parseInt((r.start_time || '08:00').split(':')[1]),
          dur:  r.duration_minutes || 60,
          title: r.title,
          sub:   r.notes || '',
          cat:   r.category || 'personal',
          locked: r.is_high_priority || false,
          done:   r.completed || false,
          section: 'Morning',
        })));
      }
    }).catch(() => {});
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
              <div style={{ fontSize:27, fontWeight:700, color:'#e8f0e9', letterSpacing:'-0.5px' }}>Today's Plan</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.38)', marginTop:3 }}>{dateLabel}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ ...GLASS, borderRadius:20, padding:'5px 12px', fontSize:12, color:'rgba(255,255,255,0.42)' }}>
                Yesterday: <span style={{ color:'#6ee7b7', fontWeight:500 }}>78%</span> ✓
              </div>
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
                    Almost bedtime. <strong style={{ color:'#93c5fd' }}>Plan tomorrow with Lumi</strong> before you sleep — 2 minutes.
                  </div>
                  <button onClick={() => openLumi("Let's plan tomorrow")} style={{ background:'rgba(147,197,253,0.12)', border:'1px solid rgba(147,197,253,0.28)', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontSize:12, color:'#93c5fd', fontFamily:'inherit', whiteSpace:'nowrap' }}>Plan Tomorrow ↗</button>
                </div>
              )}

              <div onClick={() => openLumi('Fix my 10:00 AM conflict')} style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(248,113,113,0.22)', borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#f87171', cursor:'pointer' }}>
                ⚠️ Conflict at <strong style={{ margin:'0 4px' }}>10:00 AM</strong> — Reading overlaps Hydration Check. Tap to fix with Lumi ↗
              </div>

              <ProgressRing pct={pct} done={done} total={total} palette={palette} />

              <div onClick={() => openLumi('')} style={{ background:'linear-gradient(135deg,rgba(76,63,145,0.18),rgba(15,94,94,0.18))', border:'1px solid rgba(165,180,252,0.18)', borderRadius:14, padding:'14px 16px', marginBottom:18, display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(165,180,252,0.15)', border:'1px solid rgba(165,180,252,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>✨</div>
                <div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.62)', lineHeight:1.55 }}>
                    <strong style={{ color:'#a5b4fc' }}>Good morning!</strong> You have <span style={{ color:palette.accent }}>{total} blocks</span> today.
                    Your <span style={{ color:palette.accent }}>Workout</span> starts at 2:00 PM — prep at 1:50 PM.
                    Conflict at 10 AM — one tap to fix.
                  </div>
                  <div style={{ fontSize:11, color:'rgba(165,180,252,0.55)', marginTop:6 }}>Tap to talk to Lumi → plan your day, fix conflicts, reschedule tasks</div>
                </div>
              </div>

              <Timeline tasks={tasks} onToggleDone={toggleDone} onToggleLock={toggleLock} onSelect={selectTask} />
            </div>
          )}

          {activeTab === 'week'  && <WeekTab palette={palette} />}

          {activeTab === 'plans' && (
            <PlansTab
              meds={meds}
              onToggleMed={i => setMeds(prev => prev.map((m, mi) => mi===i ? { ...m, done:!m.done } : m))}
              workout={workout}
              onToggleWorkout={i => setWorkout(prev => prev.map((w, wi) => wi===i ? { ...w, done:!w.done } : w))}
              palette={palette}
            />
          )}
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
  );
}
