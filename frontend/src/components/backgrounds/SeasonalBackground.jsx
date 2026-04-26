import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * SeasonalBackground - Animated seasonal particle background
 * Auto-detects current season and renders appropriate particles
 * Spring: Floating petals
 * Summer: Warm glow with sun rays
 * Autumn: Falling leaves
 * Winter: Snowflakes
 */

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

const SeasonConfig = {
  spring: {
    colors: ['#10B981', '#8B5CF6', '#34D399'],
    particles: 25,
    speed: 15,
    size: { min: 4, max: 12 },
    opacity: { min: 0.3, max: 0.6 },
    background: 'radial-gradient(circle at 30% 50%, rgba(16,185,129,0.08) 0%, transparent 50%)',
    secondary: 'radial-gradient(circle at 70% 20%, rgba(139,92,246,0.06) 0%, transparent 40%)',
    name: '🌸 Spring',
  },
  summer: {
    colors: ['#F5A623', '#F87171', '#FBBF24'],
    particles: 20,
    speed: 25,
    size: { min: 6, max: 16 },
    opacity: { min: 0.4, max: 0.7 },
    background: 'radial-gradient(circle at 50% 30%, rgba(245,166,35,0.12) 0%, transparent 60%)',
    secondary: 'radial-gradient(circle at 80% 70%, rgba(248,113,113,0.08) 0%, transparent 40%)',
    name: '☀️ Summer',
  },
  autumn: {
    colors: ['#D97706', '#92400E', '#F59E0B'],
    particles: 30,
    speed: 18,
    size: { min: 5, max: 14 },
    opacity: { min: 0.35, max: 0.65 },
    background: 'radial-gradient(circle at 40% 40%, rgba(217,119,6,0.1) 0%, transparent 50%)',
    secondary: 'radial-gradient(circle at 20% 80%, rgba(146,64,14,0.06) 0%, transparent 35%)',
    name: '🍂 Autumn',
  },
  winter: {
    colors: ['#60A5FA', '#C084FC', '#A5B4FC'],
    particles: 40,
    speed: 12,
    size: { min: 3, max: 8 },
    opacity: { min: 0.5, max: 0.8 },
    background: 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.06) 0%, transparent 50%)',
    secondary: 'radial-gradient(circle at 30% 70%, rgba(192,132,252,0.04) 0%, transparent 40%)',
    name: '❄️ Winter',
  },
};

// Generate random particles
const generateParticles = (count, config) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * (config.size.max - config.size.min) + config.size.min,
    opacity: Math.random() * (config.opacity.max - config.opacity.min) + config.opacity.min,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    duration: Math.random() * config.speed + config.speed / 2,
    delay: Math.random() * 5,
    drift: (Math.random() - 0.5) * 30, // Horizontal drift
  }));
};

export default function SeasonalBackground() {
  const [season, setSeason] = useState(getCurrentSeason());
  const [mounted, setMounted] = useState(false);
  
  const config = SeasonConfig[season];
  
  // Generate particles memoized
  const particles = useMemo(() => 
    generateParticles(config.particles, config), 
    [season]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Particle animation variants based on season
  const getParticleVariants = () => {
    switch (season) {
      case 'spring':
        return {
          initial: { y: '-10%', x: 0, opacity: 0 },
          animate: (particle) => ({
            y: '110%',
            x: [0, particle.drift, 0, -particle.drift, 0],
            opacity: [0, particle.opacity, particle.opacity, particle.opacity, 0],
            rotate: [0, 180, 360],
          }),
        };
      case 'summer':
        return {
          initial: { scale: 0.5, opacity: 0 },
          animate: {
            scale: [0.5, 1.2, 1, 0.8, 1.1, 0.5],
            opacity: [0, 0.6, 0.4, 0.5, 0.3, 0],
          },
        };
      case 'autumn':
        return {
          initial: { y: '-10%', x: 0, opacity: 0, rotate: 0 },
          animate: (particle) => ({
            y: '110%',
            x: [0, particle.drift * 1.5, particle.drift, 0, -particle.drift],
            opacity: [0, particle.opacity, particle.opacity, particle.opacity, 0],
            rotate: [0, 90, 180, 270, 360],
          }),
        };
      case 'winter':
        return {
          initial: { y: '-5%', x: 0, opacity: 0 },
          animate: (particle) => ({
            y: '105%',
            x: [0, particle.drift * 0.5, -particle.drift * 0.5, particle.drift * 0.3, 0],
            opacity: [0, particle.opacity, particle.opacity, particle.opacity * 0.8, 0],
          }),
        };
      default:
        return {};
    }
  };

  const particleVariants = getParticleVariants();

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: '#0D0D0D',
      }}
    >
      {/* Base seasonal gradients */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: config.background,
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: config.secondary,
        }}
      />

      {/* Animated particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          custom={particle}
          variants={particleVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: season === 'summer' ? `${particle.y}%` : undefined,
            width: particle.size,
            height: particle.size,
            borderRadius: season === 'winter' ? '50%' : '2px',
            backgroundColor: particle.color,
            opacity: particle.opacity,
            filter: season === 'summer' ? 'blur(8px)' : 'blur(1px)',
            boxShadow: season === 'winter' 
              ? `0 0 ${particle.size * 2}px ${particle.color}40` 
              : undefined,
          }}
        />
      ))}

      {/* Summer sun rays effect */}
      {season === 'summer' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              rgba(245, 166, 35, 0.03) 10deg,
              transparent 20deg,
              transparent 40deg,
              rgba(245, 166, 35, 0.02) 50deg,
              transparent 60deg,
              transparent 80deg,
              rgba(245, 166, 35, 0.03) 90deg,
              transparent 100deg,
              transparent 120deg,
              rgba(245, 166, 35, 0.02) 130deg,
              transparent 140deg,
              transparent 160deg,
              rgba(245, 166, 35, 0.03) 170deg,
              transparent 180deg,
              transparent 200deg,
              rgba(245, 166, 35, 0.02) 210deg,
              transparent 220deg,
              transparent 240deg,
              rgba(245, 166, 35, 0.03) 250deg,
              transparent 260deg,
              transparent 280deg,
              rgba(245, 166, 35, 0.02) 290deg,
              transparent 300deg,
              transparent 320deg,
              rgba(245, 166, 35, 0.03) 330deg,
              transparent 340deg,
              transparent 360deg
            )`,
          }}
        />
      )}

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(13, 13, 13, 0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// Export helper for manual season override
export { getCurrentSeason, SeasonConfig };
