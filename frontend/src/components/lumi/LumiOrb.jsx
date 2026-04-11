import { useEffect, useRef } from 'react';
import './LumiOrb.css';

/**
 * LumiOrb — The visual representation of Lumi
 * A softly glowing amber circle that shifts states:
 * - idle: slow pulse (breathing)
 * - listening: pulse quickens, sound wave visualizer
 * - speaking: brightens, active glow
 *
 * Props:
 * - state: 'idle' | 'listening' | 'speaking'
 * - size: 'small' | 'medium' | 'large' | number (pixels)
 * - onClick: function — Called when orb is clicked
 * - className: string — Additional CSS classes
 */
export default function LumiOrb({
  state = 'idle',
  size = 'medium',
  onClick,
  className = '',
}) {
  const orbRef = useRef(null);
  const waveRef = useRef(null);

  // Convert size prop to pixels
  const sizeMap = {
    small: 48,
    medium: 64,
    large: 96,
    xl: 128,
  };

  const sizePx = typeof size === 'number' ? size : sizeMap[size] || 64;

  // Dynamic styles based on state
  const getOrbStyles = () => {
    const baseStyles = {
      width: sizePx,
      height: sizePx,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
    };

    switch (state) {
      case 'listening':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(245, 166, 35, 0.2)',
          boxShadow: '0 0 32px rgba(245, 166, 35, 0.4), 0 0 64px rgba(245, 166, 35, 0.2)',
          transform: 'scale(1.05)',
        };
      case 'speaking':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(245, 166, 35, 0.3)',
          boxShadow: '0 0 48px rgba(245, 166, 35, 0.5), 0 0 96px rgba(245, 166, 35, 0.3)',
          transform: 'scale(1.08)',
        };
      case 'idle':
      default:
        return {
          ...baseStyles,
          backgroundColor: 'rgba(245, 166, 35, 0.12)',
          boxShadow: '0 0 24px rgba(245, 166, 35, 0.25)',
        };
    }
  };

  // Inner circle styles
  const getInnerStyles = () => {
    const baseSize = sizePx * 0.6;
    const baseStyles = {
      width: baseSize,
      height: baseSize,
      borderRadius: '50%',
      transition: 'all 0.3s ease',
    };

    switch (state) {
      case 'listening':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(245, 166, 35, 0.6)',
          boxShadow: '0 0 16px rgba(245, 166, 35, 0.6)',
        };
      case 'speaking':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(245, 166, 35, 0.8)',
          boxShadow: '0 0 24px rgba(245, 166, 35, 0.8)',
        };
      case 'idle':
      default:
        return {
          ...baseStyles,
          backgroundColor: 'rgba(245, 166, 35, 0.4)',
          boxShadow: '0 0 12px rgba(245, 166, 35, 0.4)',
        };
    }
  };

  // Apply animation class based on state
  const getAnimationClass = () => {
    switch (state) {
      case 'listening':
        return 'lumi-orb-listening';
      case 'speaking':
        return 'lumi-orb-speaking';
      case 'idle':
      default:
        return 'lumi-orb-idle';
    }
  };

  return (
    <div
      ref={orbRef}
      className={`lumi-orb ${getAnimationClass()} ${className}`}
      style={getOrbStyles()}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={`Lumi is ${state}`}
    >
      {/* Inner glowing circle */}
      <div className="lumi-orb-inner" style={getInnerStyles()} />

      {/* Sound wave visualizer (only in listening state) */}
      {state === 'listening' && (
        <div ref={waveRef} className="lumi-sound-wave">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="lumi-wave-bar"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: `${20 + i * 8}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Ripple effect (only in speaking state) */}
      {state === 'speaking' && (
        <div className="lumi-ripple-container">
          <div className="lumi-ripple" />
          <div className="lumi-ripple" style={{ animationDelay: '0.3s' }} />
        </div>
      )}
    </div>
  );
}
