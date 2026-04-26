import { motion } from 'framer-motion';
import { transitions, animations } from '../../styles/motion';
import { Colors } from '../../lib/colors';
import { Typography, FontWeights } from '../../lib/typography';

export const MotionButton = ({ 
  children, 
  variant = 'primary', 
  loading = false,
  disabled = false,
  icon,
  onClick,
  size = 'medium',
  fullWidth = false,
  ...props 
}) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${Colors.blue} 0%, ${Colors.purple} 100%)`,
      color: '#FFFFFF',
    },
    secondary: {
      background: Colors.card,
      color: Colors.textPrimary,
      border: `1px solid ${Colors.border}`,
    },
    ghost: {
      background: 'transparent',
      color: Colors.textSecondary,
    },
    success: {
      background: `linear-gradient(135deg, ${Colors.green} 0%, ${Colors.teal} 100%)`,
      color: '#FFFFFF',
    },
    gold: {
      background: `linear-gradient(135deg, ${Colors.gold} 0%, '#E09415' 100%)`,
      color: '#0D0D0D',
    },
  };

  const sizes = {
    small: {
      padding: '8px 16px',
      fontSize: Typography.caption.fontSize,
    },
    medium: {
      padding: '12px 24px',
      fontSize: Typography.body.fontSize,
    },
    large: {
      padding: '16px 32px',
      fontSize: Typography.subtitle.fontSize,
    },
  };

  return (
    <motion.button
      className={`plos-button plos-button--${variant} plos-button--${size}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ 
        scale: disabled ? 1 : 1.02, 
        boxShadow: variant === 'primary' 
          ? `0 10px 30px ${Colors.blue}40`
          : '0 10px 30px rgba(0, 0, 0, 0.2)',
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={transitions.spring}
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        borderRadius: '12px',
        border: 'none',
        fontWeight: FontWeights.semibold,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        ...props.style,
      }}
      {...props}
    >
      {/* Ripple effect overlay */}
      <motion.span
        className="ripple"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 2, opacity: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
        }}
      />

      {loading ? (
        <motion.div
          className="button-spinner"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid transparent',
            borderTopColor: 'currentColor',
            borderRadius: '50%',
          }}
        />
      ) : (
        <>
          {icon && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.1, 
                ...transitions.bouncy 
              }}
              style={{ display: 'inline-flex' }}
            >
              {icon}
            </motion.span>
          )}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ...transitions.smooth }}
          >
            {children}
          </motion.span>
        </>
      )}
    </motion.button>
  );
};

export default MotionButton;
