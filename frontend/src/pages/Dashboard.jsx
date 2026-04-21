import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

// Skeleton Loader Component
function SkeletonLoader({ width = '100%', height = '20px', circle = false }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '8px',
        background: 'linear-gradient(90deg, #1C1C27 25%, #2D2D3A 50%, #1C1C27 75%)',
        backgroundSize: '200% 100%',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// Card Skeleton
function CardSkeleton({ rows = 3 }) {
  return (
    <div style={{ padding: '24px' }}>
      <SkeletonLoader width="60%" height="24px" style={{ marginBottom: '16px' }} />
      <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SkeletonLoader width="24px" height="24px" />
            <SkeletonLoader width="70%" height="16px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
      <p style={{ color: '#E05252', fontSize: '14px', marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          backgroundColor: 'transparent',
          border: '1px solid #F5A623',
          borderRadius: '8px',
          color: '#F5A623',
          fontSize: '14px',
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Try Again
      </button>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon, message, actionLabel, onAction }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>{icon}</div>
      <p style={{ color: '#A89880', fontSize: '14px', margin: '0 0 16px 0', fontFamily: "'Inter', sans-serif" }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 20px',
            backgroundColor: '#F5A623',
            border: 'none',
            borderRadius: '12px',
            color: '#0D0D0D',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Coming Soon Card
function ComingSoonCard({ title, icon, description }) {
  return (
    <div
      style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '16px',
        border: '1px solid #2E2E2E',
        padding: '24px',
        opacity: 0.7,
      }}
    >
      <h2 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        color: '#F5F0E8',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ opacity: 0.5 }}>{icon}</span>
        {title}
      </h2>
      <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <span style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}>🚧</span>
          <p style={{ color: '#6B5F52', fontSize: '14px', margin: 0, fontFamily: "'Inter', sans-serif" }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [schedules, setSchedules] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalStreak, setJournalStreak] = useState(0);

  // Loading states
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [journalLoading, setJournalLoading] = useState(true);

  // Error states
  const [schedulesError, setSchedulesError] = useState(null);
  const [journalError, setJournalError] = useState(null);

  // Get time-based greeting
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  }, []);

  // Fetch today's schedule
  const fetchSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      const response = await api.get('/schedule/today');
      setSchedules(response.data.schedules || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setSchedulesError('Couldn\'t load your schedule');
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  // Fetch journal entries
  const fetchJournalEntries = useCallback(async () => {
    setJournalLoading(true);
    setJournalError(null);
    try {
      const response = await api.get('/journal/entries');
      const entries = response.data.entries || [];
      setJournalEntries(entries);
      
      // Calculate streak from entries
      const streak = calculateStreak(entries);
      setJournalStreak(streak);
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
      setJournalError('Couldn\'t load journal data');
    } finally {
      setJournalLoading(false);
    }
  }, []);

  // Calculate journal streak from entries
  function calculateStreak(entries) {
    if (!entries || entries.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get unique dates with entries
    const entryDates = new Set(
      entries.map(e => {
        const d = new Date(e.recorded_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    
    let streak = 0;
    let checkDate = new Date(today);
    
    // Check today or yesterday to start streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const hasToday = entryDates.has(today.getTime());
    const hasYesterday = entryDates.has(yesterday.getTime());
    
    if (!hasToday && !hasYesterday) {
      return 0; // Streak broken
    }
    
    // Count consecutive days
    while (true) {
      if (entryDates.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (checkDate.getTime() === today.getTime()) {
        // Today not completed, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Toggle schedule completion
  const toggleScheduleComplete = async (scheduleId, currentlyCompleted) => {
    try {
      if (currentlyCompleted) {
        await api.delete(`/schedule/${scheduleId}/complete`);
      } else {
        await api.post(`/schedule/${scheduleId}/complete`);
      }
      // Refresh schedules
      fetchSchedules();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSchedules();
    fetchJournalEntries();
  }, [fetchSchedules, fetchJournalEntries]);

  // Logout handler
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get last entry date text
  const lastEntryText = journalEntries.length > 0
    ? new Date(journalEntries[0].recorded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'No entries yet';

  // Calculate completed vs total schedules
  const completedCount = schedules.filter(s => s.completed).length;
  const totalCount = schedules.length;

  // Category icons
  const categoryIcons = {
    wellness: '🌿',
    work: '💼',
    personal: '✨',
    learning: '📚',
    'lumi-suggested': '✨',
  };

  // Category colors
  const categoryColors = {
    wellness: '#4CAF7D',
    work: '#F5A623',
    personal: '#9B59B6',
    learning: '#3498DB',
    'lumi-suggested': '#F5A623',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0D',
        color: '#F5F0E8',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
            padding: '24px',
            backgroundColor: '#1A1A1A',
            borderRadius: '16px',
            border: '1px solid #2E2E2E',
          }}
        >
          <div>
            <p style={{ margin: 0, color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
              {getGreeting()}, {user?.name || 'User'}.
            </p>
            <p style={{
              margin: '8px 0 0 0',
              color: '#6B5F52',
              fontSize: '14px',
              fontFamily: "'DM Serif Display', serif",
              fontStyle: 'italic'
            }}>
              {dateString}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/settings')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #2E2E2E',
                borderRadius: '12px',
                color: '#A89880',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#F5A623',
                border: 'none',
                borderRadius: '12px',
                color: '#0D0D0D',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Talk to Lumi Button */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate('/talk-to-lumi')}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: '#F5A623',
              border: 'none',
              borderRadius: '16px',
              color: '#0D0D0D',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'DM Serif Display', serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '24px' }}>✨</span>
            Talk to Lumi
            <span style={{ fontSize: '24px' }}>✨</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
          }}
        >
          {/* TODAY'S PLAN - Real Data */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              transition: 'box-shadow 0.2s',
            }}
          >
            <h2 style={{
              margin: '0',
              padding: '24px 24px 16px 24px',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#F5F0E8'
            }}>
              TODAY'S PLAN
            </h2>
            
            {schedulesLoading ? (
              <CardSkeleton rows={4} />
            ) : schedulesError ? (
              <ErrorState 
                message={schedulesError} 
                onRetry={fetchSchedules} 
              />
            ) : schedules.length === 0 ? (
              <EmptyState
                icon="📅"
                message="No plan for today. Tap + to add tasks"
                actionLabel="Add Routine"
                onAction={() => navigate('/schedule')}
              />
            ) : (
              <div style={{ padding: '0 24px 24px 24px' }}>
                <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {schedules.slice(0, 5).map((schedule) => (
                      <div 
                        key={schedule.id}
                        onClick={() => toggleScheduleComplete(schedule.id, schedule.completed)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 166, 35, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ 
                          fontSize: '16px',
                          color: schedule.completed ? '#4CAF7D' : '#6B5F52'
                        }}>
                          {schedule.completed ? '✅' : '⬜'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{ 
                            color: schedule.completed ? '#6B5F52' : '#A89880', 
                            fontSize: '14px',
                            fontFamily: "'Inter', sans-serif",
                            textDecoration: schedule.completed ? 'line-through' : 'none'
                          }}>
                            {schedule.title}
                          </span>
                          {schedule.streak > 1 && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: '#F5A623',
                            }}>
                              🔥 {schedule.streak}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: categoryColors[schedule.category] || '#A89880',
                        }}>
                          {categoryIcons[schedule.category] || '✨'}
                        </span>
                      </div>
                    ))}
                    {schedules.length > 5 && (
                      <p style={{
                        margin: '8px 0 0 0',
                        color: '#6B5F52',
                        fontSize: '12px',
                        fontFamily: "'Inter', sans-serif",
                        textAlign: 'center'
                      }}>
                        +{schedules.length - 5} more items
                      </p>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2E2E2E' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#A89880', fontSize: '12px' }}>
                        {completedCount} of {totalCount} completed
                      </span>
                      <span style={{ color: '#F5A623', fontSize: '12px', fontWeight: 600 }}>
                        {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{
                      height: '4px',
                      backgroundColor: '#2E2E2E',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                        backgroundColor: '#F5A623',
                        borderRadius: '2px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <button
                      onClick={() => navigate('/schedule')}
                      style={{
                        padding: '8px 0',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#F5A623',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      [Full Schedule]
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* JOURNAL - Real Data */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              transition: 'box-shadow 0.2s',
            }}
          >
            <h2 style={{
              margin: '0',
              padding: '24px 24px 16px 24px',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#F5F0E8'
            }}>
              JOURNAL
            </h2>
            
            {journalLoading ? (
              <CardSkeleton rows={3} />
            ) : journalError ? (
              <ErrorState
                message={journalError}
                onRetry={fetchJournalEntries}
              />
            ) : (
              <div style={{ padding: '0 24px 24px 24px' }}>
                <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🔥</span>
                    <span style={{ color: '#F5F0E8', fontSize: '16px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                      {journalStreak} day streak
                    </span>
                  </div>
                  <p style={{ margin: '0 0 16px 0', color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
                    Last entry: {lastEntryText}
                  </p>
                  
                  {journalEntries.length === 0 ? (
                    <EmptyState
                      icon="📝"
                      message="Start your first journal entry"
                      actionLabel="Open Journal"
                      onAction={() => navigate('/journal')}
                    />
                  ) : (
                    <button
                      onClick={() => navigate('/journal')}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#F5A623',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#0D0D0D',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.2s',
                      }}
                    >
                      [Open Journal]
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE PROJECTS - Coming Soon */}
          <ComingSoonCard
            title="ACTIVE PROJECTS"
            icon="🎯"
            description="Track your projects and progress. Coming soon!"
          />

          {/* THIS WEEK'S GOALS - Coming Soon */}
          <ComingSoonCard
            title="THIS WEEK'S GOALS"
            icon="🎯"
            description="Set and track weekly goals. Coming soon!"
          />

          {/* TODAY'S AFFIRMATION - Full Width */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              gridColumn: '1 / -1',
              textAlign: 'center',
            }}
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#A89880',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              TODAY'S AFFIRMATION
            </h2>
            <p style={{
              margin: 0,
              fontSize: '24px',
              fontFamily: "'DM Serif Display', serif",
              fontStyle: 'italic',
              color: '#F5F0E8'
            }}>
              "I am disciplined enough to build the life I want."
            </p>
          </div>

          {/* UPCOMING POSTS - Coming Soon */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              gridColumn: '1 / -1',
            }}
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#F5F0E8'
            }}>
              UPCOMING POSTS
            </h2>
            <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}>🚧</span>
                <p style={{ color: '#6B5F52', fontSize: '14px', margin: 0, fontFamily: "'Inter', sans-serif" }}>
                  Content planner coming soon! Schedule and manage your social media posts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
