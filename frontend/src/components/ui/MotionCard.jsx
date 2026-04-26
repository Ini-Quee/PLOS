import { motion } from 'framer-motion';
import { transitions, animations } from '../../styles/motion';
import { Colors } from '../../lib/colors';
import { BorderRadius, Spacing } from '../../lib/typography';

export const MotionCard = ({ 
  children, 
  accentColor,
  hoverable = true,
  onClick,
  delay = 0,
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: {
      background: Colors.card,
      border: `1px solid ${Colors.border}`,
    },
    elevated: {
      background: Colors.surface,
      border: `1px solid ${Colors.border}`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
    glass: {
      background: `${Colors.card}80`,
      border: `1px solid ${Colors.border}`,
      backdropFilter: 'blur(10px)',
    },
  };

  return (
    <motion.div
      className={`plos-card plos-card--${variant}`}
      style={{
        ...variants[variant],
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...props.style,
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay,
        ...transitions.smooth 
      }}
      whileHover={hoverable ? {
        y: -4,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        transition: { duration: 0.2 },
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      {...props}
    >
      {/* Accent line animation */}
      {accentColor && (
        <motion.div
          className="card-accent-line"
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ delay: delay + 0.2, duration: 0.4 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '3px',
            background: accentColor,
          }}
        />
      )}

      {/* Shine effect on hover */}
      <motion.div
        className="card-shine"
        initial={{ opacity: 0, x: '-100%' }}
        whileHover={{ 
          opacity: 0.1, 
          x: '100%',
          transition: { duration: 0.6 },
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Top gradient line */}
      <motion.div
        className="card-top-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.6 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          transformOrigin: 'center',
        }}
      />

      {children}
    </motion.div>
  );
};

export default MotionCard;
