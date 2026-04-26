import { motion } from 'framer-motion';
import { Colors } from '../../lib/colors';
import { Typography, FontWeights, FontFamilies } from '../../lib/typography';

/**
 * StreakCounter - Animated streak counter with fire emoji
 * Shows consecutive days with celebratory animation
 */

export default function StreakCounter({ 
  days, 
  label = 'Day Streak',
  delay = 0,
  size = 'large', // small, medium, large
}) {
  const sizeStyles = {
    small: {
      emoji: 24,
      number: Typography.subtitle.fontSize,
      label: Typography.micro.fontSize,
    },
    medium: {
      emoji: 32,
      number: Typography.title.fontSize,
      label: Typography.caption.fontSize,
    },
    large: {
      emoji: 48,
      number: Typography.hero.fontSize,
      label: Typography.body.fontSize,
    },
  };

  const styles = sizeStyles[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Animated fire emoji */}
        <motion.span
          animate={days > 0 ? {
            scale: [1, 1.2, 1],
            rotate: [0, -5, 5, 0],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          style={{
            fontSize: styles.emoji,
            filter: 'drop-shadow(0 0 8px rgba(245, 166, 35, 0.5))',
          }}
        >
          🔥
        </motion.span>

        {/* Streak number */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2, duration: 0.5 }}
          style={{
            fontSize: styles.number,
            fontWeight: FontWeights.bold,
            fontFamily: FontFamilies.display,
            color: Colors.textPrimary,
          }}
        >
          {days}
        </motion.span>
      </div>

      {/* Label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4, duration: 0.3 }}
        style={{
          marginTop: 4,
          fontSize: styles.label,
          color: Colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {label}
      </motion.span>

      {/* Streak milestones celebration */}
      {[7, 14, 30, 60, 100].includes(days) && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.6, ...transitions.bouncy }}
          style={{
            marginTop: 8,
            padding: '4px 12px',
            background: 'linear-gradient(135deg, #F5A623, #F87171)',
            borderRadius: 12,
            fontSize: Typography.micro.fontSize,
            fontWeight: FontWeights.semibold,
            color: '#0D0D0D',
          }}
        >
          {days === 7 && '1 Week! 🎉'}
          {days === 14 && '2 Weeks! 💪'}
          {days === 30 && '1 Month! 🌟'}
          {days === 60 && '2 Months! 🔥'}
          {days === 100 && '100 Days! 🏆'}
        </motion.div>
      )}
    </motion.div>
  );
}

// Bouncy transition for milestone badges
const transitions = {
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  },
};
