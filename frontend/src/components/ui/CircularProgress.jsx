import { motion } from 'framer-motion';
import { Colors } from '../../lib/colors';
import { Typography, FontWeights, FontFamilies } from '../../lib/typography';

/**
 * CircularProgress - Animated circular progress ring
 * Shows completion percentage with smooth animation
 */

export default function CircularProgress({ 
  value, 
  total, 
  size = 120, 
  strokeWidth = 8,
  color = '#F5A623',
  label,
  sublabel,
  delay = 0,
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{
        position: 'relative',
        width: size,
        height: size,
      }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          style={{
            transform: 'rotate(-90deg)',
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={Colors.border}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ 
              duration: 1.5, 
              delay: delay + 0.3,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.5, duration: 0.4 }}
            style={{
              fontSize: Typography.title.fontSize,
              fontWeight: FontWeights.bold,
              fontFamily: FontFamilies.display,
              color: Colors.textPrimary,
            }}
          >
            {percentage}%
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.7, duration: 0.3 }}
            style={{
              fontSize: Typography.micro.fontSize,
              color: Colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {value}/{total}
          </motion.span>
        </div>
      </div>

      {/* Labels */}
      {(label || sublabel) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.8, duration: 0.3 }}
          style={{
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          {label && (
            <p style={{
              margin: 0,
              fontSize: Typography.body.fontSize,
              fontWeight: FontWeights.medium,
              color: Colors.textPrimary,
            }}>
              {label}
            </p>
          )}
          {sublabel && (
            <p style={{
              margin: '4px 0 0 0',
              fontSize: Typography.caption.fontSize,
              color: Colors.textMuted,
            }}>
              {sublabel}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
