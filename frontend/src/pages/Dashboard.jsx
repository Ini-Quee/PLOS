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
              Good morning, {user?.name || 'User'}.
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
          {/* TODAY'S PLAN */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              transition: 'box-shadow 0.2s',
            }}
            className="amber-glow-hover"
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#F5F0E8'
            }}>
              TODAY'S PLAN
            </h2>
            <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <span style={{ color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Workout done</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>⏳</span>
                  <span style={{ color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Meditate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>⬜</span>
                  <span style={{ color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Read 10 pages</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>⬜</span>
                  <span style={{ color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>5 applications</span>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2E2E2E' }}>
          <button
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

          {/* JOURNAL */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              transition: 'box-shadow 0.2s',
            }}
            className="amber-glow-hover"
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#F5F0E8'
            }}>
              JOURNAL
            </h2>
            <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔥</span>
                <span style={{ color: '#F5F0E8', fontSize: '16px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                  {loading ? '...' : `${streak} day streak`}
                </span>
              </div>
              <p style={{ margin: '0 0 16px 0', color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
                Last entry: {lastEntryText}
              </p>
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
            </div>
          </div>

          {/* ACTIVE PROJECTS */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              transition: 'box-shadow 0.2s',
            }}
            className="amber-glow-hover"
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#F5F0E8'
            }}>
              ACTIVE PROJECTS
            </h2>
            <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#F5F0E8', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>PLOS</span>
                  <span style={{ color: '#F5A623', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>80%</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: '#2E2E2E',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '80%',
                      height: '100%',
                      backgroundColor: '#F5A623',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#F5F0E8', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>AZ-500</span>
                  <span style={{ color: '#F5A623', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>40%</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: '#2E2E2E',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '40%',
                      height: '100%',
                      backgroundColor: '#F5A623',
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
              color: '#F5A623',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            [All Projects]
          </button>
            </div>
          </div>

          {/* THIS WEEK'S GOALS */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              transition: 'box-shadow 0.2s',
            }}
            className="amber-glow-hover"
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: '#F5F0E8'
            }}>
              THIS WEEK'S GOALS
            </h2>
            <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#6B5F52', fontSize: '16px' }}>☐</span>
                  <span style={{ color: '#F5F0E8', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Finish journal feature</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#6B5F52', fontSize: '16px' }}>☐</span>
                  <span style={{ color: '#F5F0E8', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Post 3x on LinkedIn</span>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2E2E2E' }}>
          <button
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
            [All Goals]
          </button>
              </div>
            </div>
          </div>

          {/* TODAY'S AFFIRMATION - Full Width */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              gridColumn: '1 / -1',
              textAlign: 'center',
              transition: 'box-shadow 0.2s',
            }}
            className="amber-glow-hover"
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

          {/* UPCOMING POSTS - Full Width */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
              gridColumn: '1 / -1',
              transition: 'box-shadow 0.2s',
            }}
            className="amber-glow-hover"
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: '#242424',
                    borderRadius: '12px',
                  }}
                >
                  <span style={{ color: '#F5A623', fontSize: '14px', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
                    LinkedIn
                  </span>
                  <span style={{ color: '#6B5F52', fontSize: '14px' }}>•</span>
                  <span style={{ color: '#A89880', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Today 09:00</span>
                  <span style={{ color: '#6B5F52', fontSize: '14px' }}>•</span>
                  <span style={{ color: '#F5F0E8', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
                    "Building PLOS in public"
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2E2E2E' }}>
          <button
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
            [Content Planner]
          </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
