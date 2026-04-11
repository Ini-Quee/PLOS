import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

/**
 * Year Plan Page
 * Per AGENTS.md Part 6.11
 * Year Goal → Quarterly Milestone → Monthly Theme → Weekly Priority → Daily Intention
 */
export default function YearPlan() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState({ year: [], quarters: {}, months: {}, weeks: {} });
  const [intention, setIntention] = useState('');
  const [todayIntention, setTodayIntention] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
    fetchTodayIntention();
  }, []);

  async function fetchGoals() {
    setLoading(true);
    try {
      const response = await api.get('/goals');
      setGoals(response.data.goals || { year: [], quarters: {}, months: {}, weeks: {} });
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayIntention() {
    try {
      const response = await api.get('/goals/intention/today');
      setTodayIntention(response.data.intention);
      if (response.data.intention) {
        setIntention(response.data.intention.intention);
      }
    } catch (err) {
      console.error('Error fetching intention:', err);
    }
  }

  async function setDailyIntention(e) {
    e.preventDefault();
    try {
      await api.post('/goals/intention', { intention });
      fetchTodayIntention();
    } catch (err) {
      console.error('Error setting intention:', err);
    }
  }

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <LivingBackground />

      <div style={{ position: 'relative', zIndex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #2E2E2E',
            borderRadius: '12px', color: '#A89880', fontSize: '14px', cursor: 'pointer',
          }}>← Back</button>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, fontFamily: "'DM Serif Display', serif", color: '#F5F0E8' }}>
            Year Plan
          </h1>
        </div>

        {/* Daily Intention */}
        <div style={{
          backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
          padding: '24px', marginBottom: '32px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#F5A623', fontSize: '18px' }}>
            🌅 Today's Intention
          </h2>
          <form onSubmit={setDailyIntention}>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="What is your intention for today?"
              style={{
                width: '100%', padding: '16px', backgroundColor: '#242424',
                border: '1px solid #2E2E2E', borderRadius: '12px', color: '#F5F0E8',
                fontSize: '18px', fontFamily: "'DM Serif Display', serif", fontStyle: 'italic'
              }}
            />
            <button type="submit" style={{
              marginTop: '12px', padding: '12px 24px', backgroundColor: '#F5A623',
              border: 'none', borderRadius: '8px', color: '#0D0D0D', fontWeight: 600,
              cursor: 'pointer'
            }}>
              {todayIntention ? 'Update Intention' : 'Set Intention'}
            </button>
          </form>
          {todayIntention?.is_spoken && (
            <p style={{ marginTop: '12px', color: '#4CAF7D', fontSize: '14px' }}>
              ✓ Lumi has read this to you today
            </p>
          )}
        </div>

        {/* Year Goals */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A89880' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Year Goal */}
            <div style={{
              backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E', padding: '24px'
            }}>
              <h2 style={{ margin: '0 0 16px 0', color: '#F5A623', fontSize: '18px' }}>🎯 Year Goal</h2>
              {goals.year.length === 0 ? (
                <p style={{ color: '#6B5F52', textAlign: 'center' }}>No year goal set yet</p>
              ) : (
                goals.year.map((g) => (
                  <div key={g.id} style={{ padding: '12px', backgroundColor: '#242424', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#F5F0E8' }}>{g.title}</p>
                  </div>
                ))
              )}
            </div>

            {/* Current Quarter */}
            <div style={{
              backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E', padding: '24px'
            }}>
              <h2 style={{ margin: '0 0 16px 0', color: '#F5A623', fontSize: '18px' }}>
                📅 Q{currentQuarter} Milestones
              </h2>
              {(goals.quarters[currentQuarter] || []).length === 0 ? (
                <p style={{ color: '#6B5F52', textAlign: 'center' }}>No quarterly milestones</p>
              ) : (
                goals.quarters[currentQuarter].map((g) => (
                  <div key={g.id} style={{ padding: '12px', backgroundColor: '#242424', borderRadius: '8px', marginBottom: '8px' }}>
                    <p style={{ margin: 0, color: '#F5F0E8' }}>{g.title}</p>
                  </div>
                ))
              )}
            </div>

            {/* Current Month */}
            <div style={{
              backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E', padding: '24px'
            }}>
              <h2 style={{ margin: '0 0 16px 0', color: '#F5A623', fontSize: '18px' }}>
                📆 {new Date().toLocaleDateString('en-US', { month: 'long' })} Theme
              </h2>
              {(goals.months[currentMonth] || []).length === 0 ? (
                <p style={{ color: '#6B5F52', textAlign: 'center' }}>No monthly theme set</p>
              ) : (
                goals.months[currentMonth].map((g) => (
                  <div key={g.id} style={{ padding: '12px', backgroundColor: '#242424', borderRadius: '8px', marginBottom: '8px' }}>
                    <p style={{ margin: 0, color: '#F5F0E8' }}>{g.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
