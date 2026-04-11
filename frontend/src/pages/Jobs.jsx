import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

/**
 * Jobs Page — Job Application Tracker
 * Per AGENTS.md Part 6.8
 * Tracks job applications with status pipeline
 */
export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

  const [form, setForm] = useState({
    company: '',
    role: '',
    status: 'applied',
    notes: '',
  });

  const statusConfig = {
    applied: { color: '#3498DB', label: 'Applied', icon: '📤' },
    interview: { color: '#F5A623', label: 'Interview', icon: '🗣️' },
    offer: { color: '#4CAF7D', label: 'Offer', icon: '🎉' },
    rejected: { color: '#6B5F52', label: 'Rejected', icon: '❌' },
    withdrawn: { color: '#6B5F52', label: 'Withdrawn', icon: '🚫' },
  };

  useEffect(() => {
    fetchJobs();
    fetchTodayStats();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const response = await api.get('/jobs');
      setJobs(response.data.jobs || []);
      setStats(response.data.stats || {});
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayStats() {
    try {
      const response = await api.get('/jobs/today');
      setTodayCount(response.data.today || 0);
    } catch (err) {
      console.error('Error fetching today stats:', err);
    }
  }

  async function addJob(e) {
    e.preventDefault();
    try {
      await api.post('/jobs', form);
      setShowAddModal(false);
      setForm({ company: '', role: '', status: 'applied', notes: '' });
      fetchJobs();
      fetchTodayStats();
    } catch (err) {
      console.error('Error adding job:', err);
    }
  }

  async function updateStatus(jobId, newStatus) {
    try {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      await api.put(`/jobs/${jobId}`, {
        ...job,
        status: newStatus,
      });
      fetchJobs();
    } catch (err) {
      console.error('Error updating job:', err);
    }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  // Daily goal
  const dailyGoal = 5;
  const progress = Math.min((todayCount / dailyGoal) * 100, 100);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <LivingBackground />

      <div style={{ position: 'relative', zIndex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #2E2E2E',
              borderRadius: '12px', color: '#A89880', fontSize: '14px', cursor: 'pointer',
            }}>← Back</button>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, fontFamily: "'DM Serif Display', serif", color: '#F5F0E8' }}>
              Job Applications
            </h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '12px 24px', backgroundColor: '#F5A623', border: 'none', borderRadius: '12px',
            color: '#0D0D0D', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>+ Add Application</button>
        </div>

        {/* Daily Goal Progress */}
        <div style={{
          backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
          padding: '24px', marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', color: '#F5F0E8', fontSize: '18px' }}>
                Today's Goal
              </h2>
              <p style={{ margin: 0, color: '#6B5F52', fontSize: '14px' }}>
                {todayCount} of {dailyGoal} applications
              </p>
            </div>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#242424',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${todayCount >= dailyGoal ? '#4CAF7D' : '#F5A623'}`
            }}>
              <span style={{ fontSize: '24px' }}>{todayCount >= dailyGoal ? '✅' : '🎯'}</span>
            </div>
          </div>
          <div style={{ height: '8px', backgroundColor: '#2E2E2E', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, backgroundColor: todayCount >= dailyGoal ? '#4CAF7D' : '#F5A623',
              borderRadius: '4px', transition: 'width 0.3s'
            }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Applied', value: stats.applied || 0, color: '#3498DB' },
            { label: 'Interview', value: stats.interview || 0, color: '#F5A623' },
            { label: 'Offers', value: stats.offer || 0, color: '#4CAF7D' },
            { label: 'Rejected', value: stats.rejected || 0, color: '#6B5F52' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#1A1A1A', borderRadius: '12px', border: '1px solid #2E2E2E',
              padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#6B5F52', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['all', 'applied', 'interview', 'offer', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                backgroundColor: filter === status ? '#F5A623' : '#242424',
                color: filter === status ? '#0D0D0D' : '#A89880',
                fontWeight: filter === status ? 600 : 400,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {status === 'all' ? 'All Applications' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A89880' }}>Loading...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px', backgroundColor: '#1A1A1A',
            borderRadius: '16px', border: '1px solid #2E2E2E'
          }}>
            <p style={{ color: '#A89880', fontSize: '18px', fontFamily: "'DM Serif Display', serif" }}>
              No job applications yet
            </p>
            <p style={{ color: '#6B5F52', fontSize: '14px' }}>
              Start tracking your job search journey
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredJobs.map((job) => {
              const status = statusConfig[job.status] || statusConfig.applied;

              return (
                <div
                  key={job.id}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '16px',
                    backgroundColor: '#1A1A1A', borderRadius: '12px',
                    borderLeft: `4px solid ${status.color}`,
                  }}
                >
                  <span style={{ fontSize: '24px', marginRight: '16px' }}>{status.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', color: '#F5F0E8', fontSize: '16px' }}>
                      {job.role}
                    </h3>
                    <p style={{ margin: 0, color: '#A89880', fontSize: '14px' }}>
                      {job.company}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <select
                      value={job.status}
                      onChange={(e) => updateStatus(job.id, e.target.value)}
                      style={{
                        padding: '6px 12px', backgroundColor: '#242424', border: '1px solid #2E2E2E',
                        borderRadius: '8px', color: '#F5F0E8', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                    {job.date_applied && (
                      <p style={{ margin: '4px 0 0 0', color: '#6B5F52', fontSize: '12px' }}>
                        Applied {new Date(job.date_applied).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Job Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <form onSubmit={addJob} style={{
              backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid #2E2E2E',
              padding: '24px', maxWidth: '500px', width: '100%'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#F5F0E8', fontFamily: "'DM Serif Display', serif" }}>
                Add Application
              </h2>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company name"
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              />
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Role / Position"
                required
                style={{
                  width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: '#242424',
                  border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F0E8'
                }}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid #2E2E2E',
                  borderRadius: '8px', color: '#A89880', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: '12px', backgroundColor: '#F5A623', border: 'none',
                  borderRadius: '8px', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer'
                }}>Add Application</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
