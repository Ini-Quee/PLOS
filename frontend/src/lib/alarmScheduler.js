/**
 * alarmScheduler.js — In-app + browser notification alarm system
 *
 * Usage:
 *   import { scheduleAlarms, clearAlarms, requestNotificationPermission } from './alarmScheduler';
 *   scheduleAlarms(todaySchedule, onAlarm);
 */

let timers = [];
let chimeCtx = null;

// ─── Browser notification permission ───────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// ─── Schedule alarms for today's entries ───────────────────────────────────────
// schedules: array of { id, title, start_time "HH:MM", duration_minutes, reminder_minutes, category }
// onAlarm: function({ id, title, type: 'reminder'|'start', minutesBefore })
export function scheduleAlarms(schedules, onAlarm) {
  clearAlarms();

  const now = new Date();
  const todayPrefix = now.toISOString().slice(0, 10); // YYYY-MM-DD

  for (const item of schedules) {
    if (!item.start_time) continue;

    const [h, m] = item.start_time.split(':').map(Number);
    const startMs = new Date(`${todayPrefix}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`).getTime();

    const reminderMins = item.reminder_minutes ?? 10;

    // Reminder alarm (N minutes before)
    if (reminderMins > 0) {
      const reminderMs = startMs - reminderMins * 60_000;
      const reminderDelay = reminderMs - Date.now();

      if (reminderDelay > 0) {
        timers.push(setTimeout(() => {
          triggerAlarm({
            id: item.id,
            title: item.title,
            type: 'reminder',
            minutesBefore: reminderMins,
            category: item.category,
          }, onAlarm);
        }, reminderDelay));
      }
    }

    // Start-time alarm
    const startDelay = startMs - Date.now();
    if (startDelay > 0 && startDelay < 24 * 60 * 60_000) {
      timers.push(setTimeout(() => {
        triggerAlarm({
          id: item.id,
          title: item.title,
          type: 'start',
          minutesBefore: 0,
          category: item.category,
        }, onAlarm);
      }, startDelay));
    }
  }
}

// ─── Clear all pending alarms ───────────────────────────────────────────────────
export function clearAlarms() {
  timers.forEach(clearTimeout);
  timers = [];
}

// ─── Fire a single alarm ────────────────────────────────────────────────────────
function triggerAlarm(alarm, onAlarm) {
  playChime(alarm.category);
  speakAlarm(alarm);
  showBrowserNotification(alarm);
  if (onAlarm) onAlarm(alarm);
}

// ─── Web Audio chime ────────────────────────────────────────────────────────────
function playChime(category) {
  try {
    if (!chimeCtx) chimeCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = chimeCtx;
    const now = ctx.currentTime;

    // Different tones per category
    const freqs = {
      spiritual: [528, 660, 792],
      wellness:  [440, 550, 660],
      work:      [523, 659, 784],
      personal:  [480, 600, 720],
      default:   [523, 659, 784],
    };
    const notes = freqs[category] || freqs.default;

    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.15 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.5);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.6);
    });
  } catch {}
}

// ─── Speech synthesis ──────────────────────────────────────────────────────────
function speakAlarm(alarm) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const msg = alarm.type === 'reminder'
    ? `${alarm.title} starts in ${alarm.minutesBefore} minutes.`
    : `Time for ${alarm.title}.`;
  const utt = new SpeechSynthesisUtterance(msg);
  utt.rate  = 0.95;
  utt.pitch = 1;
  utt.volume = 0.85;
  window.speechSynthesis.speak(utt);
}

// ─── Browser Notification API ──────────────────────────────────────────────────
function showBrowserNotification(alarm) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const body = alarm.type === 'reminder'
    ? `Starts in ${alarm.minutesBefore} minutes`
    : 'Starting now';

  const icons = {
    spiritual: '✝️', wellness: '💪', work: '💼',
    personal: '🌿', learning: '📖',
  };

  try {
    const n = new Notification(`${icons[alarm.category] || '⏰'} ${alarm.title}`, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `plos-alarm-${alarm.id}`,
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
    // Auto-close after 30s
    setTimeout(() => n.close(), 30_000);
  } catch {}
}
