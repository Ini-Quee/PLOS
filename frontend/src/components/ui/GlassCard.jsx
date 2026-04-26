import { motion } from 'framer-motion';
import { Colors } from '../../lib/colors';
import { BorderRadius, Spacing, Typography, FontWeights, FontFamilies } from '../../lib/typography';

/**
 * GlassCard - Glassmorphism card component with hover effects
 * Used for all dashboard cards to create the vision board aesthetic
 */

export default function GlassCard({ 
  children, 
  title, 
  icon, 
  accentColor = '#F5A623',
  onClick,
  className = '',
  size = 'medium', // small, medium, large, wide
  delay = 0,
  headerAction = null,
  loading = false,
}) {
  const sizeStyles = {
    small: { minHeight: '180px' },
    medium: { minHeight: '240px' },
    large: { minHeight: '320px' },
    wide: { minHeight: '200px', gridColumn: 'span 2' },
    full: { minHeight: '160px', gridColumn: 'span 3' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      onClick={onClick}
      className={className}
      style={{
        background: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        ...sizeStyles[size],
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          transformOrigin: 'left',
        }}
      />

      {/* Hover glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 0%, ${accentColor}15, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Card header */}
      {(title || icon) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing.base,
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: Spacing.sm,
          }}>
            {icon && (
              <span style={{
                fontSize: Typography.subtitle.fontSize,
                filter: 'grayscale(0.3)',
              }}>
                {icon}
              </span>
            )}
            {title && (
              <h3 style={{
                margin: 0,
                fontSize: Typography.caption.fontSize,
                fontWeight: FontWeights.semibold,
                fontFamily: FontFamilies.body,
                color: Colors.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {title}
              </h3>
            )}
          </div>
          {headerAction && (
            <div style={{ position: 'relative', zIndex: 2 }}>
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: Spacing.md,
          justifyContent: 'center',
        }}>
          <div style={{
            height: '20px',
            width: '60%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: BorderRadius.sm,
            animation: 'shimmer 1.5s infinite',
          }} />
          <div style={{
            height: '60px',
            width: '100%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: BorderRadius.sm,
            animation: 'shimmer 1.5s infinite',
            animationDelay: '0.1s',
          }} />
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      ) : (
        /* Card content */
        <div style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
        }}>
          {children}
        </div>
      )}

      {/* Bottom reflection */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to top, rgba(255,255,255,0.02), transparent)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}
