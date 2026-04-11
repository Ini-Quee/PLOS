import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

/**
 * Calendar Page — Monthly View
 * Per AGENTS.md Part 6.5
 * Beautiful wall planner with monthly grid, colored dots by category
 */
export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const categories = {
    wellness: { color: '#4CAF7D', label: 'Wellness' },
    work: { color: '#F5A623', label: 'Work' },
    personal: { color: '#9B59B6', label: 'Personal' },
    learning: { color: '#3498DB', label: 'Learning' },
    'lumi-suggested': { color: '#F5A623', label: 'Lumi' },
  };

  // Fetch all schedules for the current month
  useEffect(() => {
    fetchSchedules();
  }, [currentDate]);

  async function fetchSchedules() {
    setLoading(true);
    try {
      const response = await api.get('/schedule');
      setSchedules(response.data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null); // Empty cells
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get schedules for a specific day
  function getSchedulesForDay(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, day).getDay();

    return schedules.filter((schedule) => {
      // Check if schedule applies to this date
      if (schedule.repeat_pattern === 'none') {
        return schedule.target_date === dateStr;
      }

      // Daily
      if (schedule.repeat_pattern === 'daily') return true;

      // Weekdays
      if (schedule.repeat_pattern === 'weekdays') {
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      }

      // Weekly / Custom
      if (schedule.repeat_pattern === 'weekly' || schedule.repeat_pattern === 'custom') {
        return schedule.repeat_days?.includes(dayOfWeek);
      }

      return false;
    });
  }

  // Navigation
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  // Get unique categories for a day
  function getDayCategories(day) {
    const daySchedules = getSchedulesForDay(day);
    const categories = [...new Set(daySchedules.map((s) => s.category))];
    return categories;
  }

  // Get selected date schedules
  const selectedDaySchedules = selectedDate ? getSchedulesForDay(selectedDate) : [];

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
            marginBottom: '32px',
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
              Calendar
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={prevMonth}
              style={{
                padding: '10px 16px',
                backgroundColor: '#242424',
                border: '1px solid #2E2E2E',
                borderRadius: '8px',
                color: '#F5F0E8',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 600,
                fontFamily: "'DM Serif Display', serif",
                color: '#F5F0E8',
                minWidth: '200px',
                textAlign: 'center',
              }}
            >
              {monthName}
            </h2>
            <button
              onClick={nextMonth}
              style={{
                padding: '10px 16px',
                backgroundColor: '#242424',
                border: '1px solid #2E2E2E',
                borderRadius: '8px',
                color: '#F5F0E8',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              →
            </button>
          </div>

          <button
            onClick={() => navigate('/schedule')}
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
            📅 Daily View
          </button>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            padding: '16px',
            backgroundColor: '#1A1A1A',
            borderRadius: '12px',
            border: '1px solid #2E2E2E',
          }}
        >
          {Object.entries(categories).map(([key, cat]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: cat.color,
                }}
              />
              <span style={{ color: '#A89880', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}>
                {cat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '16px',
            border: '1px solid #2E2E2E',
            padding: '24px',
          }}
        >
          {/* Day headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  color: '#6B5F52',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  textTransform: 'uppercase',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
            }}
          >
            {calendarDays.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{
                      aspectRatio: '1',
                      backgroundColor: '#242424',
                      borderRadius: '8px',
                      opacity: 0.5,
                    }}
                  />
                );
              }

              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              const isSelected = selectedDate === day;
              const dayCategories = getDayCategories(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    aspectRatio: '1',
                    backgroundColor: isSelected
                      ? 'rgba(245, 166, 35, 0.2)'
                      : isToday
                      ? 'rgba(245, 166, 35, 0.1)'
                      : '#242424',
                    border: `2px solid ${
                      isSelected ? '#F5A623' : isToday ? '#F5A623' : 'transparent'
                    }`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span
                    style={{
                      color: isToday ? '#F5A623' : '#F5F0E8',
                      fontSize: '16px',
                      fontWeight: isToday ? 700 : 400,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {day}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      marginTop: 'auto',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                  >
                    {dayCategories.slice(0, 3).map((cat, i) => (
                      <div
                        key={i}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: categories[cat]?.color || '#F5A623',
                        }}
                      />
                    ))}
                    {dayCategories.length > 3 && (
                      <span
                        style={{
                          color: '#6B5F52',
                          fontSize: '10px',
                        }}
                      >
                        +{dayCategories.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date panel */}
        {selectedDate && (
          <div
            style={{
              marginTop: '24px',
              backgroundColor: '#1A1A1A',
              borderRadius: '16px',
              border: '1px solid #2E2E2E',
              padding: '24px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: 600,
                fontFamily: "'DM Serif Display', serif",
                color: '#F5F0E8',
              }}
            >
              {new Date(year, month, selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {selectedDaySchedules.length === 0 ? (
              <p
                style={{
                  color: '#6B5F52',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                No routines scheduled for this day
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedDaySchedules.map((schedule) => {
                  const cat = categories[schedule.category] || categories.personal;
                  return (
                    <div
                      key={schedule.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#242424',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${cat.color}`,
                      }}
                    >
                      <span
                        style={{
                          color: '#6B5F52',
                          fontSize: '14px',
                          fontFamily: "'Inter', sans-serif",
                          minWidth: '60px',
                        }}
                      >
                        {schedule.start_time}
                      </span>
                      <span
                        style={{
                          color: '#F5F0E8',
                          fontSize: '14px',
                          fontFamily: "'Inter', sans-serif",
                          flex: 1,
                        }}
                      >
                        {schedule.title}
                      </span>
                      <span
                        style={{
                          color: cat.color,
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif",
                          textTransform: 'uppercase',
                        }}
                      >
                        {cat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
