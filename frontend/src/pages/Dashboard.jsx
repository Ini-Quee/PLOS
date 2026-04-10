import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [lastEntryDate, setLastEntryDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch journal streak data
  useEffect(() => {
    async function fetchJournalData() {
      try {
        // Get entries to calculate streak
        const response = await api.get('/journal/entries');
        const entries = response.data.entries || [];
        
        // Calculate streak (consecutive days with entries)
        const streakCount = calculateStreak(entries);
        setStreak(streakCount);
        
        // Get last entry date
        if (entries.length > 0) {
          const sorted = entries.sort((a, b) => 
            new Date(b.recorded_at) - new Date(a.recorded_at)
          );
          setLastEntryDate(new Date(sorted[0].recorded_at));
        }
      } catch (err) {
        console.error('Failed to fetch journal data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchJournalData();
    }
  }, [user]);

  function calculateStreak(entries) {
    if (!entries || entries.length === 0) return 0;
    
    // Sort by date descending
    const sorted = entries.sort((a, b) => 
      new Date(b.recorded_at) - new Date(a.recorded_at)
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if there's an entry for today or yesterday to start streak
    const dates = sorted.map(e => {
      const d = new Date(e.recorded_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    
    // Start from today and go backwards
    while (dates.includes(currentDate.getTime())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // If no entry today, check if there's one yesterday to continue streak
    if (streak === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dates.includes(yesterday.getTime())) {
        streak = 1;
        currentDate = new Date(yesterday);
        currentDate.setDate(currentDate.getDate() - 1);
        while (dates.includes(currentDate.getTime())) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }
    }
    
    return streak;
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lastEntryText = lastEntryDate 
    ? lastEntryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'No entries yet';

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1e',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '32px',
            padding: '24px',
            backgroundColor: '#111827',
            borderRadius: '12px',
            border: '1px solid #1e293b',
          }}
        >
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                Good morning, {user?.name || 'User'}.
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '14px' }}>
                {dateString}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => navigate('/settings')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#00bfa5',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0a0f1e',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
          }}
        >
          {/* TODAY'S SCHEDULE */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              TODAY'S SCHEDULE
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px', minWidth: '50px' }}>07:00</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>Prayer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px', minWidth: '50px' }}>08:00</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>Gym</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px', minWidth: '50px' }}>09:00</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>Deep work</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px', minWidth: '50px' }}>12:00</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>Lunch</span>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
                <button
                  style={{
                    padding: '8px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#00bfa5',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  [View Full Schedule]
                </button>
              </div>
            </div>
          </div>

          {/* JOURNAL */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              JOURNAL
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔥</span>
                <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600 }}>
                  {loading ? '...' : `${streak} day streak`}
                </span>
              </div>
              <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '14px' }}>
                Last entry: {lastEntryText}
              </p>
              <button
                onClick={() => navigate('/journal')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#00bfa5',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0a0f1e',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                [Start Today's Journal]
              </button>
            </div>
          </div>

          {/* ACTIVE PROJECTS */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              ACTIVE PROJECTS
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>PLOS App</span>
                  <span style={{ color: '#00bfa5', fontSize: '14px' }}>80%</span>
                </div>
                <div 
                  style={{
                    height: '8px',
                    backgroundColor: '#1e293b',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div 
                    style={{
                      width: '80%',
                      height: '100%',
                      backgroundColor: '#00bfa5',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>AWS Cert</span>
                  <span style={{ color: '#00bfa5', fontSize: '14px' }}>40%</span>
                </div>
                <div 
                  style={{
                    height: '8px',
                    backgroundColor: '#1e293b',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div 
                    style={{
                      width: '40%',
                      height: '100%',
                      backgroundColor: '#00bfa5',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              <button
                style={{
                  padding: '8px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#00bfa5',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                [View Projects]
              </button>
            </div>
          </div>

          {/* THIS WEEK'S GOALS */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              THIS WEEK'S GOALS
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '16px' }}>□</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>Finish journal feature</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '16px' }}>□</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>Post 3x on LinkedIn</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '16px' }}>□</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>Read 30 mins daily</span>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
                <button
                  style={{
                    padding: '8px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#00bfa5',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  [View All Goals]
                </button>
              </div>
            </div>
          </div>

          {/* UPCOMING POSTS */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
              gridColumn: '1 / -1',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              UPCOMING POSTS
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: '#1a2235',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ color: '#00bfa5', fontSize: '14px', fontWeight: 500 }}>
                    LinkedIn
                  </span>
                  <span style={{ color: '#475569', fontSize: '14px' }}>•</span>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Today 09:00</span>
                  <span style={{ color: '#475569', fontSize: '14px' }}>•</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>
                    "Building PLOS in public"
                  </span>
                </div>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: '#1a2235',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ color: '#00bfa5', fontSize: '14px', fontWeight: 500 }}>
                    X
                  </span>
                  <span style={{ color: '#475569', fontSize: '14px' }}>•</span>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Tomorrow 10:00</span>
                  <span style={{ color: '#475569', fontSize: '14px' }}>•</span>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>
                    "Security tip: JWT rotation"
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
                <button
                  style={{
                    padding: '8px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#00bfa5',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  [Go to Content Planner]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}