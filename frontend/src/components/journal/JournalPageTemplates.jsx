/**
 * JournalPageTemplates - Beautiful page layouts for each journal type
 * Based on the designs from plos_journal_page_designs.html
 */

import { useState } from 'react';
import { C } from '../layout/SidebarLayout';

// Template data for each journal type
export const JOURNAL_TEMPLATES = {
  personal: {
    color: '#5a7a5a',
    washi: '#a8c4a8',
    accent: '#7fb87f',
    stickers: ['🌿','🍃','☕','🌙','✨','💫','🌸','🦋','📸','🎵','💭','🌈','🕯️','📚'],
    templates: ['Lined diary','Daily reflection','Mood + memories','Scrapbook spread'],
  },
  spiritual: {
    color: '#7a5a3a',
    washi: '#d4a870',
    accent: '#F5A623',
    stickers: ['✝️','🙏','✨','🕊️','📖','🌅','💛','🌟','☀️','🕯️','🌾','💐','🌿','📿'],
    templates: ['SOAP method','Prayer requests','Verse & reflection','Gratitude log'],
  },
  budget: {
    color: '#3a7a6a',
    washi: '#80c4b4',
    accent: '#00c9a7',
    stickers: ['💰','📊','💳','🛒','🏠','🚗','💊','✈️','📱','🍔','💡','🎯','📈','💎'],
    templates: ['Expense tracker','50/30/20 split','Savings goal','Monthly overview'],
  },
  goals: {
    color: '#3a4a7a',
    washi: '#8090d0',
    accent: '#9b7fe8',
    stickers: ['🎯','🏆','⭐','🚀','💪','🌟','🔥','✅','📌','🗓️','💡','🧠','🌱','🏅'],
    templates: ['Vision board','Goal breakdown','Weekly wins','Quarterly review'],
  },
  wellness: {
    color: '#7a3a5a',
    washi: '#e090b0',
    accent: '#e87f9b',
    stickers: ['🌸','💧','🥗','🏃','🧘','😴','💊','🫀','🌺','🍎','🏋️','🌙','🧠','🫁'],
    templates: ['Daily check-in','Sleep & water','Mood calendar','Body scan'],
  },
  business: {
    color: '#7a6a3a',
    washi: '#c4a850',
    accent: '#ffbe4d',
    stickers: ['💡','🚀','📱','💻','📊','🎯','📝','🤝','💬','⚡','🔧','📣','💰','🌍'],
    templates: ['Build log','Ideas dump','Wins & lessons','Weekly sprint'],
  },
};

// Section Label Component
function SectionLabel({ children, accent }) {
  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#9b8060',
      margin: '14px 0 6px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      {children}
      <div style={{ flex: 1, height: '1px', background: 'rgba(160,120,80,0.2)' }} />
    </div>
  );
}

// Scripture Box Component
function ScriptureBox({ children, reference, accent }) {
  return (
    <div style={{
      background: '#fff8ee',
      border: '1px solid #e8d4a8',
      borderRadius: '6px',
      padding: '12px 14px',
      borderLeft: `3px solid ${accent}`,
      fontFamily: "'Georgia', serif",
      fontSize: '13px',
      color: '#5a3a1a',
      fontStyle: 'italic',
      lineHeight: 1.7,
      margin: '10px 0',
    }}>
      {children}
      {reference && (
        <div style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: accent,
          fontStyle: 'normal',
          textAlign: 'right',
          marginTop: '4px',
        }}>
          {reference}
        </div>
      )}
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ width, color }) {
  return (
    <div style={{ height: '8px', background: '#e8dcc8', borderRadius: '4px', overflow: 'hidden', margin: '4px 0 12px' }}>
      <div style={{ height: '8px', borderRadius: '4px', width, background: color, transition: 'width 0.5s ease' }} />
    </div>
  );
}

// Mood Chip Component
function MoodChip({ emoji, label, bg, color }) {
  return (
    <div style={{
      padding: '5px 12px',
      borderRadius: '20px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      cursor: 'pointer',
      border: `1px solid ${color}`,
      background: bg,
      color: color,
      transition: 'all 0.15s',
    }}>
      {emoji} {label}
    </div>
  );
}

// Sticky Note Component
function StickyNote({ children, bg = '#fef3cd', rotate = -1.5 }) {
  return (
    <div style={{
      background: bg,
      borderRadius: '2px',
      padding: '10px 12px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      lineHeight: 1.6,
      transform: `rotate(${rotate}deg)`,
      boxShadow: '2px 3px 8px rgba(0,0,0,0.12)',
      position: 'relative',
    }}>
      <div style={{
        content: "''",
        position: 'absolute',
        top: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.15)',
      }} />
      {children}
    </div>
  );
}

// Ruled Lines Component
function RuledLines({ count = 3, placeholder = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={{
          height: '28px',
          borderBottom: '1px solid rgba(160,120,80,0.12)',
          width: '100%',
          position: 'relative',
        }}>
          {i === 0 && placeholder && (
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
              color: '#9b8060',
              fontStyle: 'italic',
              position: 'absolute',
              left: 0,
              top: '4px',
            }}>
              {placeholder}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Template Renderers
const PERSONAL_TEMPLATES = {
  'Lined diary': () => (
    <div style={styles.page}>
      <div style={styles.spine('#e8dcc8')} />
      <div style={{ marginLeft: '36px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '12px',
          background: 'repeating-linear-gradient(90deg,#c8e8c8 0,#c8e8c8 30px,#a8c4a8 30px,#a8c4a8 32px,transparent 32px,transparent 60px)',
          opacity: 0.5,
        }} />
        <div style={styles.date}>Monday · April 28, 2026</div>
        <div style={styles.title}>My Day</div>
        <div style={styles.subtitle}>Personal · Everyday Life Journal</div>
        <RuledLines count={12} placeholder="Today I woke up feeling..." />
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <StickyNote bg="#fef3cd" style={{ flex: 1 }}>
            📌 Don't forget<br />
            <span style={{ color: '#9b8060' }}>Write 3 things you're grateful for today</span>
          </StickyNote>
          <PhotoFrame width="100px" height="80px">📸<span>Add a memory photo</span></PhotoFrame>
        </div>
        <SectionLabel>How I feel today</SectionLabel>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            ['😊', 'Happy', '#fef3cd', '#e8c830'],
            ['😔', 'Low', '#e8f0ff', '#6080d0'],
            ['💪', 'Strong', '#e8fff0', '#40b870'],
            ['😰', 'Anxious', '#ffe8f0', '#d06080'],
            ['😌', 'Peaceful', '#f0e8ff', '#8060d0'],
            ['🔥', 'Motivated', '#fff0e8', '#e87040'],
          ].map(([e, l, bg, c]) => (
            <MoodChip key={l} emoji={e} label={l} bg={bg} color={c} />
          ))}
        </div>
      </div>
    </div>
  ),

  'Daily reflection': () => (
    <div style={{ ...styles.page, background: '#f5f8f2' }}>
      <div style={styles.spine('#d4e8d4')} />
      <div style={{ marginLeft: '36px' }}>
        <div style={styles.date}>Monday · April 28, 2026</div>
        <div style={{ ...styles.title, color: '#2a4a2a' }}>Evening Reflection</div>
        <div style={styles.subtitle}>3 prompts · 10 minutes · Personal Journal</div>
        {[
          ['🌅 This morning I intended to...', '#e8f4e8'],
          ['🌞 What actually happened was...', '#f0faf0'],
          ['🌙 Tomorrow I will...', '#e4f0e4'],
        ].map(([prompt, bg]) => (
          <div key={prompt} style={{
            background: bg,
            borderRadius: '8px',
            padding: '12px 14px',
            margin: '10px 0',
            borderLeft: '3px solid #7fb87f',
          }}>
            <div style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '11px',
              color: '#4a6a4a',
              fontWeight: 500,
              marginBottom: '8px',
            }}>{prompt}</div>
            <RuledLines count={3} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', alignItems: 'center' }}>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#9b8060' }}>Gratitude · name 3 things</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} style={{
                width: '80px', height: '24px', borderRadius: '4px',
                border: '1px dashed #c9b99a', background: 'transparent',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),

  'Mood + memories': () => (
    <div style={{ ...styles.page, background: '#fdf8f2' }}>
      <div style={styles.spine()} />
      <div style={{ marginLeft: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={styles.date}>April 2026 · Memory Log</div>
            <div style={styles.title}>Mood Calendar</div>
          </div>
          <div style={{
            background: '#1a1208',
            borderRadius: '8px',
            padding: '8px 12px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontWeight: 700, color: '#F5A623' }}>14</div>
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#9b8060' }}>day streak</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', margin: '12px 0' }}>
          {['S','M','T','W','T','F','S'].map(d => (
            <div key={d} style={{ fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#9b8060', textAlign: 'center' }}>{d}</div>
          ))}
          {[null,null,null,...Array.from({length:27},(_,i)=>i+1)].map((d,i) => {
            if(!d) return <div key={i} />;
            const moods = ['😊','😌','💪','😔','🔥','😴','✨'];
            const m = d < 27 ? moods[d%7] : '📝';
            const isToday = d === 27;
            return (
              <div key={i} style={{
                aspectRatio: '1',
                borderRadius: '6px',
                background: isToday ? '#1a1208' : '#f0e8d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                border: isToday ? '1px solid #F5A623' : '1px solid transparent',
              }}>{m}</div>
            );
          })}
        </div>
        <SectionLabel>Pin a memory</SectionLabel>
        <div style={{ display: 'flex', gap: '10px' }}>
          <PhotoFrame style={{ flex: 1, height: '70px' }}>📸 <span>Tap to add photo</span></PhotoFrame>
          <PhotoFrame style={{ flex: 1, height: '70px' }}>📸 <span>Tap to add photo</span></PhotoFrame>
          <StickyNote bg="#d4edda" style={{ flex: 1, height: '70px', fontSize: '10px' }}>
            Best moment today:<br /><br />
          </StickyNote>
        </div>
      </div>
    </div>
  ),

  'Scrapbook spread': () => (
    <div style={{ ...styles.page, background: '#faf5ec', minHeight: '520px' }}>
      <div style={styles.spine('#e8d8c0')} />
      <div style={{ marginLeft: '36px', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '-4px', left: '20px', right: 0, height: '10px',
          background: 'repeating-linear-gradient(90deg,#e8c87040 0,#e8c87040 40px,transparent 40px,transparent 80px)',
        }} />
        <div style={{ ...styles.date, marginTop: '12px' }}>Monday · April 28, 2026</div>
        <div style={{ ...styles.title, fontSize: '28px' }}>Today's Story</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <PhotoFrame style={{ height: '100px', marginBottom: '10px', borderWidth: '3px', borderColor: '#c9b99a' }}>
              📸<span>Morning photo</span>
            </PhotoFrame>
            <StickyNote bg="#fff3b0" rotate={1}>What I'm grateful for:<br />1.<br />2.<br />3.</StickyNote>
          </div>
          <div>
            <RuledLines count={6} />
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                ['health', '#ffe0e0', '#c04040'],
                ['work', '#e0f0ff', '#4060c0'],
                ['joy', '#e0ffe0', '#408040'],
                ['+ add tag', '#fff0e0', '#c07040'],
              ].map(([tag, bg, color]) => (
                <div key={tag} style={{
                  background: bg,
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontFamily: 'system-ui, sans-serif',
                  color: color,
                }}>{tag}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

const SPIRITUAL_TEMPLATES = {
  'SOAP method': () => (
    <div style={{ ...styles.page, background: '#fffbf3' }}>
      <div style={styles.spine('#ecdcc0')} />
      <div style={{ marginLeft: '36px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '12px',
          background: 'repeating-linear-gradient(90deg,#f0d08060 0,#f0d08060 20px,transparent 20px,transparent 40px)',
        }} />
        <div style={{ ...styles.date, marginTop: '10px' }}>Monday · April 28, 2026</div>
        <div style={{ ...styles.title, color: '#5a3a1a' }}>Scripture Study</div>
        <div style={styles.subtitle}>SOAP Method · Bible & Faith Journal</div>
        <ScriptureBox reference="Jeremiah 29:11" accent="#F5A623">
          "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."
        </ScriptureBox>
        {[
          ['S — Scripture', 'Write out the verse in full'],
          ['O — Observation', 'What does this passage say?'],
          ['A — Application', 'How does this apply to my life?'],
          ['P — Prayer', 'Write your prayer response'],
        ].map(([header, prompt], i) => (
          <div key={header} style={{ margin: '8px 0' }}>
            <SectionLabel>{header}</SectionLabel>
            <div style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '9px',
              color: '#c9a070',
              marginBottom: '4px',
              fontStyle: 'italic',
            }}>{prompt}</div>
            <RuledLines count={i === 3 ? 4 : 3} />
          </div>
        ))}
      </div>
    </div>
  ),

  'Prayer requests': () => (
    <div style={{ ...styles.page, background: '#fffbf3' }}>
      <div style={styles.spine('#ecdcc0')} />
      <div style={{ marginLeft: '36px' }}>
        <div style={styles.date}>April 2026</div>
        <div style={{ ...styles.title, color: '#5a3a1a' }}>Prayer Board</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <SectionLabel style={{ color: '#c07020' }}>🙏 Praying for</SectionLabel>
            {[
              ['My family', 'Health & peace', 'Unanswered'],
              ['PLOS app', 'Breakthrough', 'Trusting'],
              ['My city', 'Revival', 'Ongoing'],
            ].map(([name, prayer, status]) => (
              <div key={name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 0',
                borderBottom: '1px solid rgba(160,120,80,0.12)',
              }}>
                <div style={{
                  width: '14px', height: '14px',
                  border: '1.5px solid #d4a060',
                  borderRadius: '3px',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#3a2a1a' }}>{name}</div>
                <div style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '9px',
                  color: '#c9a070',
                  background: '#fff8ee',
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}>{status}</div>
              </div>
            ))}
            <div style={{ marginTop: '8px' }}>
              <div style={{
                height: '26px',
                borderBottom: '1px dashed #d4c5a9',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{
                  width: '14px', height: '14px',
                  border: '1.5px dashed #d4a060',
                  borderRadius: '3px',
                  flexShrink: 0,
                }} />
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#c9b99a' }}>+ Add request</span>
              </div>
            </div>
          </div>
          <div>
            <SectionLabel style={{ color: '#c07020' }}>🌟 Answered prayers</SectionLabel>
            {['Got the app working again ✓', 'Feeling better after illness ✓', 'New idea for PLOS budget ✓'].map(answer => (
              <div key={answer} style={{
                background: '#fff8ee',
                borderRadius: '6px',
                padding: '8px 10px',
                marginBottom: '6px',
                borderLeft: '2px solid #F5A623',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '11px',
                color: '#5a3a1a',
              }}>{answer}</div>
            ))}
            <SectionLabel style={{ color: '#c07020', marginTop: '12px' }}>Today's verse</SectionLabel>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '12px',
              color: '#9b6030',
              lineHeight: 1.7,
            }}>Philippians 4:13 — I can do all things through Christ who strengthens me</div>
          </div>
        </div>
      </div>
    </div>
  ),

  'Verse & reflection': () => (
    <div style={{ ...styles.page, background: '#fffbf3', minHeight: '480px' }}>
      <div style={styles.spine('#ecdcc0')} />
      <div style={{ marginLeft: '36px' }}>
        <div style={{
          textAlign: 'center',
          padding: '16px 0 10px',
          borderBottom: '1px solid rgba(200,150,80,0.2)',
        }}>
          <div style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '9px',
            color: '#c9a070',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>Today's Word</div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            fontWeight: 700,
            color: '#5a3a1a',
            margin: '6px 0',
          }}>"Be still and know that I am God"</div>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#F5A623' }}>Psalm 46:10</div>
        </div>
        <SectionLabel>Word study — what stands out</SectionLabel>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {['Be still', 'Know', 'God'].map(word => (
            <div key={word} style={{
              background: '#fff8ee',
              border: '1px solid #e8c890',
              borderRadius: '6px',
              padding: '6px 12px',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '13px',
              color: '#5a3a1a',
            }}>{word}</div>
          ))}
        </div>
        <RuledLines count={4} />
        <SectionLabel>How God spoke to me today</SectionLabel>
        <RuledLines count={4} />
        <div style={{
          marginTop: '14px',
          background: '#fff8ee',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #e8d4a8',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>🕯️</div>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#9b6030' }}>
            Voice your prayer · tap the mic to speak to Lumi
          </div>
        </div>
      </div>
    </div>
  ),

  'Gratitude log': () => (
    <div style={{ ...styles.page, background: '#fffbf3' }}>
      <div style={styles.spine('#ecdcc0')} />
      <div style={{ marginLeft: '36px' }}>
        <div style={styles.date}>Week of April 28</div>
        <div style={{ ...styles.title, color: '#5a3a1a' }}>Gratitude Altar</div>
        <div style={styles.subtitle}>Count your blessings · Spiritual Journal</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '12px 0' }}>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day, i) => (
            <div key={day} style={{
              background: '#fff8ee',
              border: '1px solid #e8d4a8',
              borderRadius: '8px',
              padding: '10px',
              opacity: i >= 5 ? 0.5 : 1,
            }}>
              <div style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: '9px',
                color: '#c9a070',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px',
              }}>{day}</div>
              {i < 5 ? (
                Array(3).fill(0).map((_, j) => (
                  <div key={j} style={{
                    fontSize: '10px',
                    color: '#3a2a1a',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '2px 0',
                    borderBottom: '1px solid rgba(160,120,80,0.1)',
                  }}>{j === 0 && i === 0 ? 'Woke up healthy' : '...'}</div>
                ))
              ) : (
                <div style={{ fontSize: '10px', color: '#c9a070', fontFamily: 'system-ui, sans-serif' }}>upcoming</div>
              )}
            </div>
          ))}
        </div>
        <SectionLabel>This week I am most thankful for</SectionLabel>
        <ScriptureBox accent="#F5A623" style={{ fontStyle: 'normal', fontFamily: 'system-ui, sans-serif', fontSize: '12px' }}>
          "Give thanks in all circumstances; for this is God's will for you in Christ Jesus." — 1 Thess 5:18
        </ScriptureBox>
      </div>
    </div>
  ),
};

// Helper Components
function PhotoFrame({ children, style = {} }) {
  return (
    <div style={{
      border: '2px solid #d4c5a9',
      background: '#e8dcc8',
      borderRadius: '3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#9b8060',
      textAlign: 'center',
      padding: '8px',
      gap: '4px',
      flexDirection: 'column',
      ...style,
    }}>
      {children}
    </div>
  );
}

// Common styles
const styles = {
  page: {
    background: '#faf7f2',
    border: '1px solid #d4c5a9',
    borderRadius: '4px',
    padding: '28px 32px',
    position: 'relative',
    boxShadow: '2px 4px 12px rgba(0,0,0,0.08)',
    maxWidth: '720px',
    minHeight: '500px',
    overflow: 'hidden',
    fontFamily: "'Georgia', serif",
  },
  spine: (bg = '#e8dcc8') => ({
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '28px',
    background: `linear-gradient(90deg,${bg},#f0e8d8)`,
  }),
  date: {
    fontFamily: "'Georgia', serif",
    fontSize: '11px',
    color: '#9b8060',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '4px',
  },
  title: {
    fontFamily: "'Georgia', serif",
    fontSize: '22px',
    fontWeight: 700,
    color: '#2a1e0f',
    marginBottom: '2px',
    lineHeight: 1.2,
  },
  subtitle: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '11px',
    color: '#9b8060',
    marginBottom: '16px',
  },
};

// Main export - get template by type and name
export function getTemplate(journalType, templateName) {
  const templates = {
    personal: PERSONAL_TEMPLATES,
    spiritual: SPIRITUAL_TEMPLATES,
    // Add more as we implement them
    budget: {},
    goals: {},
    wellness: {},
    business: {},
  };

  const typeTemplates = templates[journalType] || templates.personal;
  const templateFn = typeTemplates[templateName] || typeTemplates[Object.keys(typeTemplates)[0]];
  
  return templateFn ? templateFn() : null;
}

// Get available templates for a journal type
export function getTemplatesForType(journalType) {
  return JOURNAL_TEMPLATES[journalType]?.templates || ['Lined diary'];
}

// Get journal config
export function getJournalConfig(journalType) {
  return JOURNAL_TEMPLATES[journalType] || JOURNAL_TEMPLATES.personal;
}

// Template Selector Component
export function TemplateSelector({ journalType, selectedTemplate, onSelect }) {
  const config = getJournalConfig(journalType);
  const templates = config.templates;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: C.warm,
        marginBottom: '12px',
      }}>
        Choose a template
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {templates.map((template) => (
          <button
            key={template}
            onClick={() => onSelect(template)}
            style={{
              background: selectedTemplate === template ? `${config.accent}20` : C.bg3,
              border: `1px solid ${selectedTemplate === template ? config.accent : C.border2}`,
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: selectedTemplate === template ? config.accent : C.warm,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {template}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sticker Tray Component
export function StickerTray({ journalType }) {
  const config = getJournalConfig(journalType);
  const [selectedSticker, setSelectedSticker] = useState(null);

  return (
    <div style={{
      background: '#f0e8d0',
      border: '1px solid #d4c5a9',
      borderRadius: '8px',
      padding: '10px 12px',
      marginTop: '12px',
    }}>
      <div style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#9b8060',
        marginBottom: '8px',
      }}>
        Sticker tray — tap to add to page
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {config.stickers.map((sticker) => (
          <span
            key={sticker}
            onClick={() => setSelectedSticker(sticker)}
            style={{
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'transform 0.15s',
              display: 'inline-block',
              transform: selectedSticker === sticker ? 'scale(1.3)' : 'scale(1)',
            }}
            title="Tap to add to journal"
          >
            {sticker}
          </span>
        ))}
      </div>
    </div>
  );
}

export default { getTemplate, getTemplatesForType, getJournalConfig, TemplateSelector, StickerTray };
