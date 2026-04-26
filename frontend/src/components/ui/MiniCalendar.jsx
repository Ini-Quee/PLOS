import { motion } from 'framer-motion';
import { Colors, ModuleColors } from '../../lib/colors';
import { Typography, FontWeights, FontFamilies } from '../../lib/typography';

/**
 * MiniCalendar - Compact calendar widget showing current month
 * With activity dots for tracked days
 */

export default function MiniCalendar({ 
  markedDays = [], // Array of dates with activity: [{date: '2024-01-15', type: 'journal'}]
  onDateClick,
  delay = 0,
}) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Create calendar grid
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Check if a day has activity
  const getDayActivity = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return markedDays.find(d => d.date === dateStr);
  };

  // Activity colors
  const activityColors = {
    journal: ModuleColors.journal,
    workout: Colors.green,
    schedule: ModuleColors.lumi,
    default: Colors.textMuted,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        width: '100%',
      }}
    >
      {/* Month header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1, duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{
          fontSize: Typography.body.fontSize,
          fontWeight: FontWeights.semibold,
          color: Colors.textPrimary,
          fontFamily: FontFamilies.display,
        }}>
          {monthNames[currentMonth]} {currentYear}
        </span>
        <span style={{
          fontSize: Typography.micro.fontSize,
          color: Colors.textMuted,
        }}>
          Today: {currentDate}
        </span>
      </motion.div>

      {/* Day names header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        marginBottom: 8,
      }}>
        {dayNames.map((day, index) => (
          <div
            key={index}
            style={{
              textAlign: 'center',
              fontSize: Typography.micro.fontSize,
              fontWeight: FontWeights.semibold,
              color: Colors.textMuted,
              textTransform: 'uppercase',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
      }}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} style={{ aspectRatio: 1 }} />;
          }

          const isToday = day === currentDate;
          const activity = getDayActivity(day);
          const hasActivity = !!activity;

          return (
            <motion.button
              key={day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.1 + index * 0.01, duration: 0.2 }}
              whileHover={onDateClick ? { scale: 1.1 } : {}}
              whileTap={onDateClick ? { scale: 0.95 } : {}}
              onClick={() => onDateClick && onDateClick(day)}
              style={{
                aspectRatio: 1,
                borderRadius: 8,
                border: 'none',
                background: isToday 
                  ? `linear-gradient(135deg, ${ModuleColors.lumi}, ${ModuleColors.lumi}80)`
                  : hasActivity 
                    ? `${activityColors[activity.type]}20`
                    : 'transparent',
                color: isToday ? '#0D0D0D' : Colors.textPrimary,
                fontSize: Typography.caption.fontSize,
                fontWeight: isToday ? FontWeights.bold : FontWeights.regular,
                cursor: onDateClick ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                position: 'relative',
              }}
            >
              {day}
              
              {/* Activity dot */}
              {hasActivity && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.3 + index * 0.02, ...transitions.bouncy }}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: activityColors[activity.type] || activityColors.default,
                    boxShadow: `0 0 4px ${activityColors[activity.type] || activityColors.default}`,
                  }}
                />
              )}

              {/* Today indicator ring */}
              {isToday && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: delay + 0.2, duration: 0.3 }}
                  style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: 10,
                    border: `2px solid ${ModuleColors.lumi}`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.5, duration: 0.3 }}
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${Colors.border}`,
        }}
      >
        {[
          { color: ModuleColors.journal, label: 'Journal' },
          { color: Colors.green, label: 'Workout' },
          { color: ModuleColors.lumi, label: 'Tasks' },
        ].map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: item.color,
            }} />
            <span style={{
              fontSize: Typography.micro.fontSize,
              color: Colors.textMuted,
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

const transitions = {
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  },
};
