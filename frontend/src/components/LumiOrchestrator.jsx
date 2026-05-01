import { useState, useRef, useEffect } from 'react';
import { useAtmos } from './Atmosphere';
import { useLumi } from '../hooks/useLumi';

/**
 * LumiOrchestrator
 * Global overlay — mounts once in App.jsx.
 * Shows Lumi's proposed action plans anywhere in the app
 * and handles achievement celebrations.
 *
 * The user triggers it by clicking the floating Lumi button.
 */

const ACTION_ICONS = {
  create_schedule:       '📅',
  create_schedule_batch: '📋',
  save_journal:          '📖',
  complete_habit:        '🔥',
  achieve_goal:          '🏆',
  update_goal_progress:  '📈',
};

const ACHIEVEMENT_EMOJIS = ['🏆','✨','🎉','🌟','💫','🎊','🥇','🦋','🚀'];

function ActionCard({ action, index }) {
  const icon = ACTION_ICONS[action.type] || '⚡';
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      animation: `fadeUp 0.3s ${index * 0.06}s ease both`,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, color: '#e8e8f0', fontWeight: 500, lineHeight: 1.3 }}>{action.summary}</div>
        {action.payload?.target_date && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>📆 {action.payload.target_date}</div>
        )}
        {action.payload?.start_time && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>🕐 {action.payload.start_time}</div>
        )}
      </div>
    </div>
  );
}

function PlanReviewPanel({ plan, onConfirm, onDismiss, isExecuting, palette }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{
        width: '90%', maxWidth: 520, maxHeight: '85vh',
        background: 'rgba(9,12,20,0.97)', backdropFilter: 'blur(24px)',
        border: `1px solid ${palette.border}`,
        borderRadius: 18, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${palette.border}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✨</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#a5b4fc', marginBottom: 4 }}>Lumi's Plan</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{plan.lumiMessage}</div>
          </div>
        </div>

        {/* Actions list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>
            {plan.actions.length} action{plan.actions.length !== 1 ? 's' : ''} proposed
          </div>
          {plan.actions.map((a, i) => <ActionCard key={i} action={a} index={i} />)}

          {plan.needsJournalConfirmation && plan.journalDraft && (
            <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(76,63,145,0.15)', border: '1px solid rgba(165,180,252,0.15)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, marginBottom: 6 }}>📖 Journal entry draft</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{plan.journalDraft}</div>
            </div>
          )}
        </div>

        {/* Footer prompt + buttons */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${palette.border}` }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.4 }}>{plan.confirmPrompt}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onConfirm}
              disabled={isExecuting}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: palette.accent, color: '#0a0a0a', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                opacity: isExecuting ? 0.6 : 1, transition: 'opacity 0.2s',
              }}
            >
              {isExecuting ? 'Setting up…' : 'Yes, set this up ✓'}
            </button>
            <button
              onClick={onDismiss}
              disabled={isExecuting}
              style={{
                padding: '11px 20px', borderRadius: 10, background: 'transparent',
                border: `1px solid ${palette.border}`, color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementCelebration({ achievements, onDismiss, palette }) {
  const a = achievements[0]; // Show first
  const emoji = a?.milestone_emoji || ACHIEVEMENT_EMOJIS[Math.floor(Math.random() * ACHIEVEMENT_EMOJIS.length)];
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(0.7) } to { opacity:1; transform:scale(1) } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
      `}</style>
      <div style={{
        width: '90%', maxWidth: 400, textAlign: 'center',
        background: 'rgba(9,12,20,0.97)', border: `1px solid ${palette.accent}44`,
        borderRadius: 22, padding: '36px 28px',
        animation: 'popIn 0.4s ease',
      }}>
        <div style={{ fontSize: 72, animation: 'float 2s ease-in-out infinite', marginBottom: 16 }}>{emoji}</div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: palette.accent, marginBottom: 10 }}>Goal Achieved!</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 10, lineHeight: 1.3 }}>{a?.title || 'Milestone reached'}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
          {a?.achievement_label || "You did it! This milestone is now saved in your achievements."}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '11px 28px', borderRadius: 10, border: 'none',
              background: palette.accent, color: '#0a0a0a', fontWeight: 700,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Celebrate 🎉
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletionFollowUpPanel({ followUp, onRespond, onDismiss, palette }) {
  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 24, width: 340, zIndex: 300,
      background: 'rgba(9,12,20,0.97)', backdropFilter: 'blur(20px)',
      border: `1px solid ${palette.border}`,
      borderRadius: 16, overflow: 'hidden',
      animation: 'fadeUp 0.3s ease',
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${palette.border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✨</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.5, flex: 1 }}>{followUp.followUp}</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', fontSize: 16, flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>✕</button>
      </div>
      <div style={{ padding: '10px 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {(followUp.quickPrompts || []).map((p, i) => (
          <button
            key={i}
            onClick={() => onRespond(p)}
            style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 20,
              background: p.toLowerCase().includes('skip') ? 'transparent' : 'rgba(165,180,252,0.1)',
              border: p.toLowerCase().includes('skip') ? `1px solid ${palette.border}` : '1px solid rgba(165,180,252,0.22)',
              color: p.toLowerCase().includes('skip') ? 'rgba(255,255,255,0.35)' : '#a5b4fc',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{p}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Floating Lumi button + input ─────────────────────────────────────────────
function LumiInputBar({ onSend, onPlan, isThinking, palette }) {
  const [open, setOpen]   = useState(false);
  const [mode, setMode]   = useState('chat');   // 'chat' | 'plan'
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  function submit() {
    const msg = input.trim();
    if (!msg) return;
    setInput('');
    setOpen(false);
    if (mode === 'plan') onPlan(msg);
    else onSend(msg);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 250,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? 'rgba(76,63,145,1)' : 'rgba(76,63,145,0.85)',
          border: '1px solid rgba(165,180,252,0.35)',
          color: '#a5b4fc', fontSize: 22, cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(76,63,145,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        title="Ask Lumi"
      >✨</button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 24, width: 340, zIndex: 250,
          background: 'rgba(9,12,20,0.97)', backdropFilter: 'blur(20px)',
          border: `1px solid ${palette.border}`, borderRadius: 14,
          overflow: 'hidden', animation: 'fadeUp 0.22s ease',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        }}>
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

          {/* Mode toggle */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${palette.border}` }}>
            {[['chat','💬 Chat'],['plan','⚡ Build Plan']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '10px 0', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                color: mode === m ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                borderBottom: mode === m ? '2px solid #a5b4fc' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          <div style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginBottom: 8 }}>
              {mode === 'plan'
                ? 'Describe what you want to plan — Lumi will propose actions across your app before doing anything.'
                : 'Talk to Lumi about anything — your day, goals, feelings, tasks.'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder={mode === 'plan' ? 'e.g. Plan my anniversary prep Mon, Fri, Sat...' : 'Tell Lumi anything...'}
                disabled={isThinking}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${palette.border}`,
                  borderRadius: 8, padding: '9px 11px', color: '#e8e8f0', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              <button onClick={submit} disabled={isThinking || !input.trim()} style={{
                background: mode === 'plan' ? palette.accent : 'rgba(76,63,145,0.6)',
                border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
                color: mode === 'plan' ? '#0a0a0a' : '#a5b4fc', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                opacity: (!input.trim() || isThinking) ? 0.5 : 1, transition: 'opacity 0.15s',
              }}>
                {isThinking ? '…' : mode === 'plan' ? '▶' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LumiOrchestrator() {
  const { palette } = useAtmos();
  const {
    isThinking, isExecuting,
    pendingActions, achievements, completionFollowUp,
    sendText, askLumiToPlan,
    confirmActions, dismissActions,
    dismissAchievement, dismissCompletionFollowUp,
  } = useLumi('orchestrator');

  function handleCompletionResponse(prompt) {
    dismissCompletionFollowUp();
    if (prompt.toLowerCase().includes('skip') || prompt.toLowerCase() === 'no thanks') return;
    // Open the plan builder with the chosen follow-up
    askLumiToPlan(`After completing ${completionFollowUp?.title}: "${prompt}"`);
  }

  return (
    <>
      {/* Plan review modal */}
      {pendingActions && (
        <PlanReviewPanel
          plan={pendingActions}
          onConfirm={confirmActions}
          onDismiss={dismissActions}
          isExecuting={isExecuting}
          palette={palette}
        />
      )}

      {/* Achievement celebration */}
      {achievements.length > 0 && (
        <AchievementCelebration
          achievements={achievements}
          onDismiss={dismissAchievement}
          palette={palette}
        />
      )}

      {/* Post-completion follow-up */}
      {completionFollowUp && !pendingActions && (
        <CompletionFollowUpPanel
          followUp={completionFollowUp}
          onRespond={handleCompletionResponse}
          onDismiss={dismissCompletionFollowUp}
          palette={palette}
        />
      )}

      {/* Floating input bar */}
      <LumiInputBar
        onSend={sendText}
        onPlan={askLumiToPlan}
        isThinking={isThinking || isExecuting}
        palette={palette}
      />
    </>
  );
}
