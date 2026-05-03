/**
 * AlarmBar — Fixed top banner that fires alarms for today's schedule.
 * Mounts once in SidebarLayout so it runs on every page.
 * Requests browser notification permission on first render.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { scheduleAlarms, clearAlarms, requestNotificationPermission } from '../lib/alarmScheduler';

export default function AlarmBar() {
  const [activeAlarm, setActiveAlarm] = useState(null); // { id, title, type, minutesBefore, category }
  const [contentAlert, setContentAlert] = useState(null); // pending content post
  const [dismissed, setDismissed]     = useState(new Set());
  const scheduledRef = useRef(false);

  const handleAlarm = useCallback((alarm) => {
    if (dismissed.has(alarm.id + alarm.type)) return;
    setActiveAlarm(alarm);
  }, [dismissed]);

  useEffect(() => {
    requestNotificationPermission();

    if (scheduledRef.current) return;
    scheduledRef.current = true;

    // Schedule reminders for today's schedule entries
    api.get('/schedule/today')
      .then(res => {
        const schedules = res.data?.schedules || res.data?.today || [];
        scheduleAlarms(schedules, handleAlarm);
      })
      .catch(() => {});

    // Check for content posts due today
    api.get('/content/posts/today')
      .then(res => {
        const posts = res.data?.posts || [];
        if (posts.length > 0) {
          // Show the first upcoming post that hasn't been dismissed
          const upcoming = posts[0];
          if (!dismissed.has('content-' + upcoming.id)) {
            setContentAlert(upcoming);
          }
        }
      })
      .catch(() => {});

    return () => clearAlarms();
  }, [handleAlarm, dismissed]);

  const [showContentModal, setShowContentModal] = useState(false);

  async function markContentPosted() {
    if (!contentAlert) return;
    try { await api.post(`/content/posts/${contentAlert.id}/mark-posted`, {}); } catch {}
    setDismissed(prev => new Set([...prev, 'content-' + contentAlert.id]));
    setContentAlert(null);
    setShowContentModal(false);
  }

  function dismissContent() {
    if (!contentAlert) return;
    setDismissed(prev => new Set([...prev, 'content-' + contentAlert.id]));
    setContentAlert(null);
  }

  // Schedule alarm takes priority; content alert shows when no schedule alarm
  const showContent = !activeAlarm && contentAlert;

  if (!activeAlarm && !contentAlert) return null;

  function dismiss() {
    setDismissed(prev => new Set([...prev, activeAlarm.id + activeAlarm.type]));
    setActiveAlarm(null);
  }

  async function markDone() {
    try { await api.post(`/schedule/${activeAlarm.id}/complete`, {}); } catch {}
    dismiss();
  }

  const catColors = {
    spiritual: '#8B5CF6', wellness: '#00d4aa', work: '#F59E0B',
    personal:  '#C8955C', learning: '#3B82F6',
  };

  if (showContent) {
    const platformIcons = { instagram:'📸', twitter:'🐦', linkedin:'💼', facebook:'👥', tiktok:'🎵', email:'📧', blog:'✍️' };
    const icon = platformIcons[contentAlert.platform] || '📣';
    const scheduledTime = new Date(contentAlert.scheduled_for).toLocaleTimeString('en-NG', { hour:'numeric', minute:'2-digit', hour12:true });
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'rgba(139,92,246,0.15)', borderBottom:'2px solid rgba(139,92,246,0.4)', backdropFilter:'blur(16px)', padding:'10px 20px', display:'flex', alignItems:'center', gap:12, animation:'slideDown 0.3s ease', fontFamily:"'DM Sans',sans-serif" }}>
        <style>{`@keyframes slideDown { from { transform:translateY(-100%) } to { transform:translateY(0) } }`}</style>
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#a5b4fc', flexShrink:0 }} />
        <div style={{ flex:1, fontSize:13, fontWeight:600, color:'#f0ead8' }}>
          {icon} {contentAlert.title || contentAlert.platform + ' post'} — due {scheduledTime}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowContentModal(true)} style={{ padding:'5px 14px', borderRadius:8, border:'none', background:'#a5b4fc', color:'#000', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>View & Copy</button>
          <button onClick={dismissContent} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid rgba(165,180,252,0.3)', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Later</button>
        </div>

        {showContentModal && (
          <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={e => e.target===e.currentTarget && setShowContentModal(false)}>
            <div style={{ background:'rgba(14,12,26,0.95)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:16, width:'100%', maxWidth:500, padding:24 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{icon} {contentAlert.title || 'Scheduled post'}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:16 }}>{contentAlert.platform} · {scheduledTime}</div>
              <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'14px 16px', fontSize:13, color:'#f0ead8', lineHeight:1.7, marginBottom:16, whiteSpace:'pre-wrap', maxHeight:200, overflowY:'auto' }}>
                {contentAlert.content}
              </div>
              {contentAlert.media_url && (
                <div style={{ fontSize:12, color:'#a5b4fc', marginBottom:14 }}>📎 Media: <a href={contentAlert.media_url} target="_blank" rel="noopener noreferrer" style={{ color:'#a5b4fc' }}>{contentAlert.media_url.slice(0, 60)}</a></div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { navigator.clipboard?.writeText(contentAlert.content); }} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid rgba(165,180,252,0.4)', background:'rgba(165,180,252,0.1)', color:'#a5b4fc', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Copy Text</button>
                <button onClick={markContentPosted} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:'#a5b4fc', color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Mark as Posted ✓</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Schedule alarm banner
  const accent = catColors[activeAlarm.category] || '#C8955C';
  const label  = activeAlarm.type === 'reminder'
    ? `${activeAlarm.title} in ${activeAlarm.minutesBefore} min`
    : `Now: ${activeAlarm.title}`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: `linear-gradient(90deg, ${accent}22, ${accent}11)`,
      borderBottom: `2px solid ${accent}66`,
      backdropFilter: 'blur(16px)',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideDown 0.3s ease',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes slideDown { from { transform:translateY(-100%) } to { transform:translateY(0) } }
        @keyframes alarmPulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
      `}</style>

      <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, flexShrink: 0, animation: activeAlarm.type === 'start' ? 'alarmPulse 0.8s infinite' : 'none' }} />
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f0ead8' }}>⏰ {label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {activeAlarm.type === 'start' && (
          <button onClick={markDone} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: accent, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Done ✓</button>
        )}
        <button onClick={dismiss} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${accent}44`, background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss</button>
      </div>
    </div>
  );
}
