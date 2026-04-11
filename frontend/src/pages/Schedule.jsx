import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

/**
 * Schedule Page — Daily Plan View
 * Per AGENTS.md Part 6.5
 * Shows today's schedule with time blocks, completion toggles, and streaks
 */
export default function Schedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new schedule
  const [form, setForm] = useState({
    title: '',
    start_time: '08:00',
    duration_minutes: 60,
    category: 'personal',
    repeat_pattern: 'daily',
    is_high_priority: false,
  });

  const categories = {
    wellness: { label: 'Wellness', color: '#4CAF7D', icon: '🌿' },
    work: { label: 'Work', color: '#F5A623', icon: '💼' },
    personal: { label: 'Personal', color: '#9B59B6', icon: '✨' },
    learning: { label: 'Learning', color: '#3498DB', icon: '📚' },
    'lumi-suggested': { label: 'Lumi', color: '#F5A623', icon: '✨' },
  };

  // Fetch today's schedule
  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  async function fetchTodaySchedule() {
    setLoading(true);
    try {
      const response = await api.get('/schedule/today');
      setSchedules(response.data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }

  // Toggle completion
  async function toggleComplete(scheduleId, completed) {
    try {
      if (completed) {
        await api.post(`/schedule/${scheduleId}/complete`);
      } else {
        await api.delete(`/schedule/${scheduleId}/complete`);
      }
      // Refresh schedule
      fetchTodaySchedule();
    } catch (err) {
      console.error('Error toggling completion:', err);
      setError('Failed to update completion');
    }
  }

  // Create new schedule
  async function handleAddSchedule(e) {
    e.preventDefault();
    try {
      await api.post('/schedule', form);
      setShowAddModal(false);
      setForm({
        title: '',
        start_time: '08:00',
        duration_minutes: 60,
        category: 'personal',
        repeat_pattern: 'daily',
        is_high_priority: false,
      });
      fetchTodaySchedule();
    } catch (err) {
      console.error('Error creating schedule:', err);
      setError('Failed to create schedule');
    }
  }

  // Calculate time blocks
  const timeBlocks = [];
  for (let hour = 5; hour <= 23; hour++) {
    timeBlocks.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Get schedule position based on time
  function getScheduleStyle(schedule) {
    const [hours, minutes] = schedule.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const startOffset = ((startMinutes - 300) / 60) * 80; // 80px per hour
    const height = (schedule.duration_minutes / 60) * 80;
    return {
      top: `${startOffset}px`,
      height: `${height}px`,
    };
  }

  // Format time display
  function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Calculate completion stats
  const completedCount = schedules.filter((s) => s.completed).length;
  const totalCount = schedules.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <LivingBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #2E2E2E',
                borderRadius: '12px',
                color: '#A89880',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#F5F0E8';
                e.target.style.borderColor = '#F5A623';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#A89880';
                e.target.style.borderColor = '#2E2E2E';
              }}
            >
              ← Back
            </button>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                fontFamily: "'DM Serif Display', serif",
                color: '#F5F0E8',
              }}
            >
              Today's Plan
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/calendar')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #F5A623',
                borderRadius: '12px',
                color: '#F5A623',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              📅 View Calendar
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#F5A623',
                border: 'none',
                borderRadius: '12px',
                color: '#0D0D0D',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              + Add Routine
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '12px',
            border: '1px solid #2E2E2E',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                color: '#A89880',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {completedCount} of {totalCount} completed
            </span>
            <span
              style={{
                color: '#F5A623',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {Math.round(progress)}%
            </span>
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
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#F5A623',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Schedule content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A89880' }}>
            Loading schedule...
          </div>
        ) : schedules.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
            }}
          >
            <p
              style={{
                color: '#A89880',
                fontSize: '18px',
                fontFamily: "'DM Serif Display', serif",
                marginBottom: '16px',
              }}
            >
              No routines scheduled for today
            </p>
            <p
              style={{
                color: '#6B5F52',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                marginBottom: '24px',
              }}
            >
              Add your first routine to start building your day
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
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
              Add Your First Routine
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Time blocks column */}
            <div style={{ width: '60px', flexShrink: 0 }}>
              {timeBlocks.map((time) => (
                <div
                  key={time}
                  style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    paddingRight: '12px',
                    color: '#6B5F52',
                    fontSize: '12px',
                    fontFamily: "'Inter', sans-serif",
                    borderTop: '1px solid #2E2E2E',
                  }}
                >
                  {formatTime(time)}
                </div>
              ))}
            </div>

            {/* Schedule items */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Grid lines */}
              {timeBlocks.map((time) => (
                <div
                  key={time}
                  style={{
                    height: '80px',
                    borderTop: '1px solid #2E2E2E',
                    borderLeft: '1px solid #2E2E2E',
                  }}
                />
              ))}

              {/* Schedule cards */}
              {schedules.map((schedule) => {
                const category = categories[schedule.category] || categories.personal;
                return (
                  <div
                    key={schedule.id}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      right: '8px',
                      ...getScheduleStyle(schedule),
                      backgroundColor: schedule.completed
                        ? 'rgba(76, 175, 125, 0.1)'
                        : '#242424',
                      border: `2px solid ${schedule.completed ? '#4CAF7D' : category.color}`,
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => toggleComplete(schedule.id, !schedule.completed)}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <span>{category.icon}</span>
                        <span
                          style={{
                            color: schedule.completed ? '#4CAF7D' : category.color,
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            textTransform: 'uppercase',
                          }}
                        >
                          {category.label}
                        </span>
                        {schedule.streak > 1 && (
                          <span
                            style={{
                              color: '#F5A623',
                              fontSize: '11px',
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            🔥 {schedule.streak}
                          </span>
                        )}
                      </div>
                      <h3
                        style={{
                          margin: 0,
                          color: schedule.completed ? '#6B5F52' : '#F5F0E8',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif",
                          textDecoration: schedule.completed ? 'line-through' : 'none',
                        }}
                      >
                        {schedule.title}
                      </h3>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          color: '#6B5F52',
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {formatTime(schedule.start_time)} · {schedule.duration_minutes} min
                      </span>
                      {schedule.completed && (
                        <span
                          style={{
                            color: '#4CAF7D',
                            fontSize: '14px',
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Schedule Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '16px',
                border: '1px solid #2E2E2E',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 600,
                  fontFamily: "'DM Serif Display', serif",
                  color: '#F5F0E8',
                }}
              >
                Add New Routine
              </h2>

              <form onSubmit={handleAddSchedule}>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#A89880',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Morning Workout"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#242424',
                      border: '1px solid #2E2E2E',
                      borderRadius: '8px',
                      color: '#F5F0E8',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: '#A89880',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#242424',
                        border: '1px solid #2E2E2E',
                        borderRadius: '8px',
                        color: '#F5F0E8',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: '#A89880',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={form.duration_minutes}
                      onChange={(e) =>
                        setForm({ ...form, duration_minutes: parseInt(e.target.value) })
                      }
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#242424',
                        border: '1px solid #2E2E2E',
                        borderRadius: '8px',
                        color: '#F5F0E8',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#A89880',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#242424',
                      border: '1px solid #2E2E2E',
                      borderRadius: '8px',
                      color: '#F5F0E8',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                      outline: 'none',
                    }}
                  >
                    {Object.entries(categories).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#A89880',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Repeat
                  </label>
                  <select
                    value={form.repeat_pattern}
                    onChange={(e) => setForm({ ...form, repeat_pattern: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#242424',
                      border: '1px solid #2E2E2E',
                      borderRadius: '8px',
                      color: '#F5F0E8',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                      outline: 'none',
                    }}
                  >
                    <option value="none">One-time only</option>
                    <option value="daily">Every day</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom days</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_high_priority}
                      onChange={(e) =>
                        setForm({ ...form, is_high_priority: e.target.checked })
                      }
                      style={{ width: '20px', height: '20px', accentColor: '#F5A623' }}
                    />
                    <span
                      style={{
                        color: '#F5F0E8',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      High priority routine
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #2E2E2E',
                      borderRadius: '8px',
                      color: '#A89880',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#F5A623',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#0D0D0D',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Add Routine
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              backgroundColor: 'rgba(224, 82, 82, 0.1)',
              border: '1px solid rgba(224, 82, 82, 0.3)',
              borderRadius: '8px',
              color: '#E05252',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
