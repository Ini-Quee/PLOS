import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { Colors, ModuleColors } from '../lib/colors';
import { Typography, FontWeights, Spacing, FontFamilies } from '../lib/typography';

// Components
import SeasonalBackground from '../components/backgrounds/SeasonalBackground';
import GlassCard from '../components/ui/GlassCard';
import CircularProgress from '../components/ui/CircularProgress';
import StreakCounter from '../components/ui/StreakCounter';
import MiniCalendar from '../components/ui/MiniCalendar';
import SparklineChart from '../components/ui/SparklineChart';

/**
 * VisionBoardDashboard - Complete life command center
 * Glassmorphic bento grid layout with seasonal backgrounds
 */

export default function VisionBoardDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [schedules, setSchedules] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalStreak, setJournalStreak] = useState(0);
  const [loading, setLoading] = useState({
    schedules: true,
    journal: true,
  });

  // Time-based greeting
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  }, []);

  // Fetch data
  const fetchSchedules = useCallback(async () => {
    setLoading(prev => ({ ...prev, schedules: true }));
    try {
      const response = await api.get('/schedule/today');
      setSchedules(response.data.schedules || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(prev => ({ ...prev, schedules: false }));
    }
  }, []);

  const fetchJournal = useCallback(async () => {
    setLoading(prev => ({ ...prev, journal: true }));
    try {
      const response = await api.get('/journal/entries');
      const entries = response.data.entries || [];
      setJournalEntries(entries);
      setJournalStreak(calculateStreak(entries));
    } catch (err) {
      console.error('Failed to fetch journal:', err);
    } finally {
      setLoading(prev => ({ ...prev, journal: false }));
    }
  }, []);

  // Calculate streak
  const calculateStreak = (entries) => {
    if (!entries?.length) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entryDates = new Set(
      entries.map(e => {
        const d = new Date(e.recorded_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    let streak = 0;
    let checkDate = new Date(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!entryDates.has(today.getTime()) && !entryDates.has(yesterday.getTime())) {
      return 0;
    }

    while (true) {
      if (entryDates.has(checkDate.getTime())) {
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

  // Generate mock calendar data
  const calendarData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    journalEntries.forEach(entry => {
      const date = new Date(entry.recorded_at);
      if (date.getMonth() === today.getMonth()) {
        data.push({
          date: date.toISOString().split('T')[0],
          type: 'journal',
        });
      }
    });

    // Add some workout data (mock)
    const completedSchedules = schedules.filter(s => s.completed);
    completedSchedules.forEach(schedule => {
      if (schedule.category === 'wellness') {
        data.push({
          date: new Date().toISOString().split('T')[0],
          type: 'workout',
        });
      }
    });

    return data;
  }, [journalEntries, schedules]);

  // Generate sparkline data
  const journalActivity = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = journalEntries.filter(e => {
        const entryDate = new Date(e.recorded_at).toISOString().split('T')[0];
        return entryDate === dateStr;
      }).length;
      
      data.push(count);
    }
    
    return data;
  }, [journalEntries]);

  // Toggle task completion
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

  // Logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchSchedules();
    fetchJournal();
  }, [fetchSchedules, fetchJournal]);

  const completedTasks = schedules.filter(s => s.completed).length;
  const totalTasks = schedules.length;

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Seasonal Background */}
      <SeasonalBackground />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            padding: `${Spacing.xl}px ${Spacing.xxl}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: Spacing.base,
          }}
        >
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                margin: 0,
                fontSize: Typography.hero.fontSize,
                fontWeight: FontWeights.bold,
                fontFamily: FontFamilies.display,
                color: Colors.textPrimary,
              }}
            >
              {getGreeting()}, {user?.name || 'Friend'} 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{
                margin: `${Spacing.sm}px 0 0 0`,
                fontSize: Typography.body.fontSize,
                color: Colors.textMuted,
              }}
            >
              {dateString}
            </motion.p>
          </div>

          <div style={{ display: 'flex', gap: Spacing.md }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              style={{
                padding: `${Spacing.sm}px ${Spacing.md}px`,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                color: Colors.textSecondary,
                fontSize: Typography.body.fontSize,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
            >
              Settings
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              style={{
                padding: `${Spacing.sm}px ${Spacing.md}px`,
                background: 'linear-gradient(135deg, #F5A623, #E09415)',
                border: 'none',
                borderRadius: 12,
                color: '#0D0D0D',
                fontSize: Typography.body.fontSize,
                fontWeight: FontWeights.semibold,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </motion.button>
          </div>
        </motion.header>

        {/* Bento Grid Dashboard */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: `0 ${Spacing.xxl}px ${Spacing.xxl}px`,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: Spacing.xl,
            gridAutoRows: 'minmax(200px, auto)',
          }}
        >
          {/* LUMI CARD - Small, left */}
          <GlassCard
            title="Lumi"
            icon="✨"
            size="small"
            delay={0}
            accentColor={ModuleColors.lumi}
            onClick={() => navigate('/talk-to-lumi')}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: Spacing.md,
            }}>
              {/* Pulsing Lumi orb */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 20px rgba(245, 166, 35, 0.3)',
                    '0 0 40px rgba(245, 166, 35, 0.5)',
                    '0 0 20px rgba(245, 166, 35, 0.3)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, #F5A623, #E09415)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 28 }}>💫</span>
              </motion.div>
              <p style={{
                margin: 0,
                fontSize: Typography.caption.fontSize,
                color: Colors.textMuted,
                textAlign: 'center',
              }}>
                Tap to chat
              </p>
            </div>
          </GlassCard>

          {/* TODAY'S PLAN - Large, center */}
          <GlassCard
            title="Today's Plan"
            icon="📋"
            size="large"
            delay={0.1}
            accentColor={ModuleColors.lumi}
            headerAction={
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/schedule');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: ModuleColors.lumi,
                  fontSize: Typography.body.fontSize,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                + Add
              </motion.button>
            }
          >
            {loading.schedules ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 30,
                    height: 30,
                    border: `2px solid ${Colors.border}`,
                    borderTopColor: ModuleColors.lumi,
                    borderRadius: '50%',
                  }}
                />
              </div>
            ) : (
              <div style={{
                display: 'flex',
                gap: Spacing.xl,
                height: '100%',
              }}>
                {/* Progress Ring */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CircularProgress
                    value={completedTasks}
                    total={totalTasks}
                    size={100}
                    strokeWidth={6}
                    color={ModuleColors.lumi}
                    delay={0.3}
                  />
                </div>

                {/* Task List */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: Spacing.sm,
                  overflow: 'hidden',
                }}>
                  {schedules.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: Colors.textMuted,
                      fontSize: Typography.body.fontSize,
                    }}>
                      No tasks today
                    </div>
                  ) : (
                    schedules.slice(0, 4).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        onClick={() => toggleTask(task.id, task.completed)}
                        whileHover={{ x: 4 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: Spacing.sm,
                          padding: `${Spacing.xs}px ${Spacing.sm}px`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: task.completed ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        }}
                      >
                        <motion.span
                          animate={task.completed ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.2 }}
                          style={{
                            fontSize: Typography.caption.fontSize,
                            color: task.completed ? Colors.success : Colors.textMuted,
                          }}
                        >
                          {task.completed ? '✅' : '⭕'}
                        </motion.span>
                        <span style={{
                          flex: 1,
                          fontSize: Typography.caption.fontSize,
                          color: task.completed ? Colors.textMuted : Colors.textPrimary,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {task.title}
                        </span>
                        <span style={{ fontSize: 12 }}>
                          {task.category === 'wellness' && '🌿'}
                          {task.category === 'work' && '💼'}
                          {task.category === 'personal' && '✨'}
                          {task.category === 'learning' && '📚'}
                        </span>
                      </motion.div>
                    ))
                  )}
                  {schedules.length > 4 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      style={{
                        margin: 0,
                        fontSize: Typography.micro.fontSize,
                        color: Colors.textMuted,
                        textAlign: 'center',
                      }}
                    >
                      +{schedules.length - 4} more tasks
                    </motion.p>
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          {/* JOURNAL - Medium, right */}
          <GlassCard
            title="Journal"
            icon="📖"
            size="medium"
            delay={0.2}
            accentColor={ModuleColors.journal}
            onClick={() => navigate('/journal/library')}
          >
            {loading.journal ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 30,
                    height: 30,
                    border: `2px solid ${Colors.border}`,
                    borderTopColor: ModuleColors.journal,
                    borderRadius: '50%',
                  }}
                />
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: Spacing.lg,
                height: '100%',
              }}>
                {/* Streak */}
                <StreakCounter
                  days={journalStreak}
                  label="Day Streak"
                  delay={0.3}
                  size="medium"
                />

                {/* Activity Chart */}
                <div>
                  <p style={{
                    margin: `0 0 ${Spacing.sm}px 0`,
                    fontSize: Typography.micro.fontSize,
                    color: Colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Last 7 Days
                  </p>
                  <SparklineChart
                    data={journalActivity.length ? journalActivity : [0, 0, 0, 0, 0, 0, 0]}
                    color={ModuleColors.journal}
                    height={50}
                    delay={0.4}
                  />
                </div>

                {/* Quick action */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/journal');
                  }}
                  style={{
                    marginTop: 'auto',
                    padding: `${Spacing.sm}px`,
                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                    border: 'none',
                    borderRadius: 10,
                    color: Colors.textPrimary,
                    fontSize: Typography.caption.fontSize,
                    fontWeight: FontWeights.semibold,
                    cursor: 'pointer',
                  }}
                >
                  ✍️ Write Now
                </motion.button>
              </div>
            )}
          </GlassCard>

          {/* CALENDAR - Medium */}
          <GlassCard
            title="Calendar"
            icon="📅"
            size="medium"
            delay={0.3}
            accentColor={Colors.blue}
            onClick={() => navigate('/calendar')}
          >
            <MiniCalendar
              markedDays={calendarData}
              delay={0.4}
            />
          </GlassCard>

          {/* AFFIRMATION - Wide, full width */}
          <GlassCard
            title="Today's Affirmation"
            icon="💭"
            size="full"
            delay={0.4}
            accentColor={ModuleColors.lumi}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              style={{
                textAlign: 'center',
                padding: `${Spacing.xl}px 0`,
              }}
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                style={{
                  margin: 0,
                  fontSize: Typography.title.fontSize,
                  fontFamily: FontFamilies.display,
                  fontStyle: 'italic',
                  color: Colors.textPrimary,
                  lineHeight: 1.5,
                }}
              >
                "I am disciplined enough to build the life I want."
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                style={{
                  margin: `${Spacing.md}px 0 0 0`,
                  fontSize: Typography.caption.fontSize,
                  color: Colors.textMuted,
                }}
              >
                — Your daily reminder
              </motion.p>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
