import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

// Safe color system
const Colors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  border: '#2E2E2E',
  textPrimary: '#F5F0E8',
  textSecondary: '#A89880',
  textMuted: '#6B5F52',
  lumi: '#F5A623',
  purple: '#8B5CF6',
  green: '#10B981',
  blue: '#4A9EFF',
  coral: '#F87171',
};

// Safe typography
const Typography = {
  hero: { fontSize: 36, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { fontSize: 18, fontWeight: '500' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
  micro: { fontSize: 11, fontWeight: '500' },
};

const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32,
};

// Glass Card Component
function GlassCard({ children, title, icon, accentColor = Colors.lumi, delay = 0, onClick, size = 'medium', gridColumn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={onClick}
      style={{
        background: 'rgba(26, 26, 26, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: Spacing.xl,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minHeight: size === 'small' ? '180px' : size === 'large' ? '320px' : size === 'wide' ? '200px' : '240px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: gridColumn || 'auto',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
      }} />

      {(title || icon) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: Spacing.sm,
          marginBottom: Spacing.base,
        }}>
          {icon && <span style={{ fontSize: Typography.body.fontSize }}>{icon}</span>}
          {title && (
            <h3 style={{
              margin: 0,
              fontSize: Typography.caption.fontSize,
              fontWeight: '600',
              color: Colors.textPrimary,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>{title}</h3>
          )}
        </div>
      )}

      <div style={{ flex: 1 }}>{children}</div>
    </motion.div>
  );
}

// Seasonal Background
function SeasonalBackground() {
  const [season, setSeason] = useState('summer');

  useEffect(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) setSeason('spring');
    else if (month >= 6 && month <= 8) setSeason('summer');
    else if (month >= 9 && month <= 11) setSeason('autumn');
    else setSeason('winter');
  }, []);

  const gradients = {
    spring: 'radial-gradient(circle at 30% 50%, rgba(16,185,129,0.08) 0%, transparent 50%)',
    summer: 'radial-gradient(circle at 50% 30%, rgba(245,166,35,0.12) 0%, transparent 60%)',
    autumn: 'radial-gradient(circle at 40% 40%, rgba(217,119,6,0.1) 0%, transparent 50%)',
    winter: 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.06) 0%, transparent 50%)',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0,
      background: '#0D0D0D',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: gradients[season],
      }} />
    </div>
  );
}

// Circular Progress
function CircularProgress({ value, total, size = 100, color = Colors.lumi, delay = 0 }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={Colors.border} strokeWidth="6" />
          <motion.circle
            cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, delay: delay + 0.3 }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.5 }}
            style={{ fontSize: Typography.title.fontSize, fontWeight: '700', color: Colors.textPrimary }}
          >{percentage}%</motion.span>
        </div>
      </div>
    </div>
  );
}

// Streak Counter with milestone celebration
function StreakCounter({ days, delay = 0 }) {
  const milestones = { 7: '1 Week!', 14: '2 Weeks!', 30: '1 Month!', 60: '2 Months!', 100: '100 Days!' };
  const milestone = milestones[days];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Spacing.sm }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
        <motion.span
          animate={days > 0 ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
          style={{ fontSize: 40, filter: 'drop-shadow(0 0 8px rgba(245, 166, 35, 0.5))' }}
        >🔥</motion.span>
        <span style={{ fontSize: Typography.title.fontSize, fontWeight: '700', color: Colors.textPrimary }}>{days}</span>
      </div>
      {milestone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.3 }}
          style={{
            padding: '4px 12px', background: 'linear-gradient(135deg, #F5A623, #F87171)',
            borderRadius: 12, fontSize: Typography.micro.fontSize, fontWeight: '600', color: '#0D0D0D',
          }}
        >🎉 {milestone}</motion.div>
      )}
      <span style={{ fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>Day Streak</span>
    </motion.div>
  );
}

// Sparkline Chart for activity trends
function SparklineChart({ data = [], color = Colors.lumi, delay = 0 }) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((val / max) * 80 + 10),
  }));

  const pathD = points.reduce((acc, p, i) => 
    `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, ''
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 60 }}>
        <motion.path
          d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.3, duration: 1.2 }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2}
            fill={i === points.length - 1 ? color : 'transparent'} stroke={color} strokeWidth="2"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.5 + i * 0.05 }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// Mini Calendar with activity dots
function MiniCalendar({ journalDates = [], scheduleDates = [], delay = 0 }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getActivityTypes = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const types = [];
    if (journalDates.includes(dateStr)) types.push('journal');
    if (scheduleDates.includes(dateStr)) types.push('schedule');
    return types;
  };

  const activityColors = { journal: Colors.purple, schedule: Colors.green, both: Colors.lumi };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: Typography.body.fontSize, fontWeight: '600', color: Colors.textPrimary }}>
          {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <span style={{ fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>Today: {today.getDate()}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: Typography.micro.fontSize, color: Colors.textMuted }}>{d}</div>
        ))}
        {days.map((day, i) => {
          const activities = getActivityTypes(day);
          const isToday = day === today.getDate();
          const activityColor = activities.length > 1 ? activityColors.both : activityColors[activities[0]];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: delay + i * 0.01 }}
              style={{
                aspectRatio: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                background: isToday ? Colors.lumi : 'transparent',
                color: isToday ? '#0D0D0D' : Colors.textPrimary,
                fontSize: Typography.caption.fontSize,
                position: 'relative',
              }}
            >
              {day}
              {activities.length > 0 && (
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: activityColor,
                  marginTop: 2,
                  boxShadow: `0 0 4px ${activityColor}`,
                }} />
              )}
              {isToday && (
                <div style={{
                  position: 'absolute', inset: -2,
                  borderRadius: 10, border: `2px solid ${Colors.lumi}`,
                }} />
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${Colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: Colors.purple }} />
          <span style={{ fontSize: Typography.micro.fontSize, color: Colors.textMuted }}>Journal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: Colors.green }} />
          <span style={{ fontSize: Typography.micro.fontSize, color: Colors.textMuted }}>Tasks</span>
        </div>
      </div>
    </motion.div>
  );
}

// Empty State Component
function EmptyState({ icon, title, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: Spacing.md, textAlign: 'center',
    }}>
      <span style={{ fontSize: 40, opacity: 0.5 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>{title}</p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onAction}
          style={{
            padding: `${Spacing.sm}px ${Spacing.md}px`,
            background: Colors.lumi, border: 'none', borderRadius: 8,
            color: '#0D0D0D', fontWeight: '600', cursor: 'pointer',
          }}
        >{action}</motion.button>
      )}
    </div>
  );
}

// Main Dashboard
export default function DashboardVision() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalStreak, setJournalStreak] = useState(0);
  const [loading, setLoading] = useState({ schedules: true, journal: true });
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setError(null);
    try {
      await Promise.all([fetchSchedules(), fetchJournal()]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load some data. Please refresh.');
    }
  };

  const fetchSchedules = async () => {
    setLoading(prev => ({ ...prev, schedules: true }));
    try {
      const response = await api.get('/schedule/today');
      setSchedules(response.data.schedules || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setSchedules([]);
    } finally {
      setLoading(prev => ({ ...prev, schedules: false }));
    }
  };

  const fetchJournal = async () => {
    setLoading(prev => ({ ...prev, journal: true }));
    try {
      const response = await api.get('/journal/entries?limit=100');
      const entries = response.data.entries || [];
      setJournalEntries(entries);
      setJournalStreak(calculateStreak(entries));
    } catch (err) {
      console.error('Failed to fetch journal:', err);
      setJournalEntries([]);
      setJournalStreak(0);
    } finally {
      setLoading(prev => ({ ...prev, journal: false }));
    }
  };

  // Calculate actual streak (consecutive days)
  const calculateStreak = (entries) => {
    if (!entries?.length) return 0;

    const dates = entries.map(e => {
      const d = new Date(e.recorded_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }).sort((a, b) => b - a);

    const uniqueDates = [...new Set(dates)];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    // Check if there's an entry for today or yesterday to start streak
    const hasEntryToday = uniqueDates.includes(today.getTime());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const hasEntryYesterday = uniqueDates.includes(yesterday.getTime());

    if (!hasEntryToday && !hasEntryYesterday) return 0;

    // Count consecutive days
    while (true) {
      if (uniqueDates.includes(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (checkDate.getTime() === today.getTime()) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Get dates with activity for calendar
  const journalDates = useMemo(() => {
    return journalEntries.map(e => {
      const d = new Date(e.recorded_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
  }, [journalEntries]);

  const scheduleDates = useMemo(() => {
    return schedules
      .filter(s => s.completed)
      .map(s => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });
  }, [schedules]);

  // Get last 7 days activity for sparkline
  const activityData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = journalEntries.filter(e => {
        const entryDate = new Date(e.recorded_at);
        return `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}` === dateStr;
      }).length;
      data.push(count);
    }
    return data;
  }, [journalEntries]);

  const toggleTask = async (id, completed) => {
    try {
      if (completed) {
        await api.delete(`/schedule/${id}/complete`);
      } else {
        await api.post(`/schedule/${id}/complete`);
      }
      fetchSchedules();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const completedTasks = schedules.filter(s => s.completed).length;
  const totalTasks = schedules.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: Colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: Colors.textPrimary }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <SeasonalBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ padding: `${Spacing.xl}px ${Spacing.xxl}px` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: Spacing.base }}>
            <div>
              <h1 style={{ margin: 0, fontSize: Typography.hero.fontSize, fontWeight: '700', color: Colors.textPrimary }}>
                {getGreeting()}, {user?.name || 'Friend'} 👋
              </h1>
              <p style={{ margin: `${Spacing.sm}px 0 0 0`, fontSize: Typography.body.fontSize, color: Colors.textMuted }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: Spacing.md }}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/settings')}
                style={{
                  padding: `${Spacing.sm}px ${Spacing.md}px`, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: Colors.textSecondary,
                  cursor: 'pointer',
                }}
              >Settings</motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={logout}
                style={{
                  padding: `${Spacing.sm}px ${Spacing.md}px`, background: Colors.lumi,
                  border: 'none', borderRadius: 12, color: '#0D0D0D', fontWeight: '600', cursor: 'pointer',
                }}
              >Sign Out</motion.button>
            </div>
          </div>
        </motion.header>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              margin: `0 ${Spacing.xxl}px`, padding: Spacing.md, background: 'rgba(224, 82, 82, 0.2)',
              border: '1px solid rgba(224, 82, 82, 0.3)', borderRadius: 12, color: Colors.coral,
            }}
          >
            {error} <button onClick={loadData} style={{ marginLeft: Spacing.md, color: Colors.lumi, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
          </motion.div>
        )}

        {/* Bento Grid */}
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          padding: `${Spacing.lg}px ${Spacing.xxl}px ${Spacing.xxl}px`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: Spacing.xl,
        }}>
          {/* Lumi Card */}
          <GlassCard title="Lumi" icon="✨" size="small" delay={0} accentColor={Colors.lumi} onClick={() => navigate('/talk-to-lumi')}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: Spacing.md }}>
              <motion.div
                animate={{ boxShadow: ['0 0 20px rgba(245, 166, 35, 0.3)', '0 0 40px rgba(245, 166, 35, 0.5)', '0 0 20px rgba(245, 166, 35, 0.3)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ width: 60, height: 60, borderRadius: '50%', background: Colors.lumi, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}
              >💫</motion.div>
              <p style={{ color: Colors.textMuted, margin: 0, fontSize: Typography.caption.fontSize }}>Tap to chat with Lumi</p>
            </div>
          </GlassCard>

          {/* Today's Plan */}
          <GlassCard title="Today's Plan" icon="📋" size="large" delay={0.1} accentColor={Colors.lumi} gridColumn="span 2">
            {loading.schedules ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 40, height: 40, border: `3px solid ${Colors.border}`, borderTopColor: Colors.lumi, borderRadius: '50%' }} />
              </div>
            ) : schedules.length === 0 ? (
              <EmptyState icon="📋" title="No tasks for today" action="Add Task" onAction={() => navigate('/schedule')} />
            ) : (
              <div style={{ display: 'flex', gap: Spacing.lg, height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress value={completedTasks} total={totalTasks} delay={0.3} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
                  {schedules.slice(0, 4).map((task, i) => (
                    <motion.div
                      key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                      onClick={() => toggleTask(task.id, task.completed)}
                      whileHover={{ x: 4, backgroundColor: 'rgba(245, 166, 35, 0.05)' }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: Spacing.sm, padding: `${Spacing.xs}px`,
                        borderRadius: 8, cursor: 'pointer',
                      }}
                    >
                      <motion.span animate={task.completed ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.2 }}>
                        {task.completed ? '✅' : '⭕'}
                      </motion.span>
                      <span style={{
                        flex: 1, fontSize: Typography.caption.fontSize,
                        color: task.completed ? Colors.textMuted : Colors.textPrimary,
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}>{task.title}</span>
                      <span style={{ fontSize: Typography.micro.fontSize }}>
                        {task.category === 'wellness' && '🌿'}
                        {task.category === 'work' && '💼'}
                        {task.category === 'personal' && '✨'}
                        {task.category === 'learning' && '📚'}
                      </span>
                    </motion.div>
                  ))}
                  {schedules.length > 4 && (
                    <p style={{ margin: 0, fontSize: Typography.micro.fontSize, color: Colors.textMuted, textAlign: 'center' }}>
                      +{schedules.length - 4} more tasks
                    </p>
                  )}
                  <div style={{ marginTop: 'auto', paddingTop: Spacing.sm, borderTop: `1px solid ${Colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>{completionRate}% complete</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); navigate('/schedule'); }}
                        style={{ background: 'none', border: 'none', color: Colors.lumi, fontSize: Typography.caption.fontSize, cursor: 'pointer' }}
                      >View All →</motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Journal */}
          <GlassCard title="Journal" icon="📖" delay={0.2} accentColor={Colors.purple} onClick={() => navigate('/journal')}>
            {loading.journal ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 40, height: 40, border: `3px solid ${Colors.border}`, borderTopColor: Colors.purple, borderRadius: '50%' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.lg, height: '100%' }}>
                <StreakCounter days={journalStreak} delay={0.3} />
                <div>
                  <p style={{ margin: `0 0 ${Spacing.sm}px 0`, fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>Last 7 Days</p>
                  <SparklineChart data={activityData} color={Colors.purple} delay={0.4} />
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', gap: Spacing.sm }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={(e) => { e.stopPropagation(); navigate('/journal'); }}
                    style={{
                      flex: 1, padding: Spacing.sm, background: Colors.purple,
                      border: 'none', borderRadius: 10, color: Colors.textPrimary,
                      fontWeight: '600', cursor: 'pointer', fontSize: Typography.caption.fontSize,
                    }}
                  >✍️ Write Now</motion.button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Calendar */}
          <GlassCard title="Calendar" icon="📅" delay={0.3} accentColor={Colors.blue} onClick={() => navigate('/calendar')}>
            <MiniCalendar journalDates={journalDates} scheduleDates={scheduleDates} delay={0.4} />
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard title="Quick Stats" icon="📊" size="wide" delay={0.35} accentColor={Colors.green} gridColumn="span 2">
            <div style={{ display: 'flex', gap: Spacing.lg, justifyContent: 'space-around', height: '100%', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                  style={{ fontSize: Typography.title.fontSize, fontWeight: '700', color: Colors.lumi }}
                >{journalEntries.length}</motion.div>
                <p style={{ margin: `${Spacing.xs}px 0 0 0`, fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>Total Entries</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
                  style={{ fontSize: Typography.title.fontSize, fontWeight: '700', color: Colors.green }}
                >{completedTasks}</motion.div>
                <p style={{ margin: `${Spacing.xs}px 0 0 0`, fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>Tasks Done</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }}
                  style={{ fontSize: Typography.title.fontSize, fontWeight: '700', color: Colors.blue }}
                >{journalStreak}</motion.div>
                <p style={{ margin: `${Spacing.xs}px 0 0 0`, fontSize: Typography.caption.fontSize, color: Colors.textMuted }}>Day Streak</p>
              </div>
            </div>
          </GlassCard>

          {/* Affirmation */}
          <GlassCard title="Today's Affirmation" icon="💭" size="wide" delay={0.4} accentColor={Colors.lumi} gridColumn="span 2">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
                style={{
                  margin: 0, fontSize: Typography.subtitle.fontSize,
                  fontStyle: 'italic', color: Colors.textPrimary, textAlign: 'center', lineHeight: 1.5,
                }}
              >"I am disciplined enough to build the life I want."</motion.p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
