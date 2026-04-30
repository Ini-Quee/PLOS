import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

export default function SeasonalBookBackground({ bookType, season, theme }) {
  // Memoize particles properly - only regenerate when book/season truly changes
  const particles = useMemo(() => {
    if (!theme) return [];
    return Array.from({ length: 20 }, (_, i) => ({
      id: `${bookType}-${season}-${i}`, // Unique key prevents duplicates
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 8,
    }));
  }, [bookType, season, theme?.particleColor]); // Only when these change

  if (!theme) {
    return null; // Don't render if no theme
  }

  // Rain/storm effect for rainy season
  const isRainy = season === 'rainy' || season === 'wet';
  // Dust/wind effect for harmattan/dry
  const isDusty = season === 'harmattan' || season === 'dry';
  // Snow effect for winter
  const isWinter = season === 'winter';
  // Warm glow for spiritual or business
  const hasWarmGlow = bookType === 'spiritual' || bookType === 'business';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`bg-${bookType}-${season}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Primary gradient orb */}
        <motion.div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-5%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.gradient1} 0%, transparent 70%)`,
            filter: 'blur(90px)',
            willChange: 'transform',
          }}
          animate={{
            x: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary gradient orb */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-5%',
            width: '45%',
            height: '45%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.gradient2} 0%, transparent 70%)`,
            filter: 'blur(90px)',
            willChange: 'transform',
          }}
          animate={{
            x: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Floating particles (reduced for performance) */}
        {particles.slice(0, 15).map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: theme.particleColor,
              opacity: 0.25,
              filter: 'blur(1px)',
              willChange: 'transform, opacity',
            }}
            animate={{
              y: [0, -120, 0],
              x: [0, Math.random() * 60 - 30, 0],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          />
        ))}

        {/* Ambient center glow */}
        <motion.div
          style={{
            position: 'absolute',
            top: '30%',
            left: '40%',
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.gradient1} 0%, transparent 65%)`,
            filter: 'blur(110px)',
            willChange: 'transform, opacity',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Warm glow for spiritual/business books */}
        {hasWarmGlow && (
          <motion.div
            style={{
              position: 'absolute',
              top: '20%',
              right: '20%',
              width: '25%',
              height: '25%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.accentColor}20 0%, transparent 70%)`,
              filter: 'blur(80px)',
              willChange: 'transform, opacity',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 3,
            }}
          />
        )}

        {/* Rain effect for rainy season */}
        {isRainy && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(transparent 50%, rgba(127,184,127,0.03) 50%)',
              backgroundSize: '2px 30px',
            }}
            animate={{
              backgroundPositionY: ['0px', '30px'],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Dust/wind effect for harmattan/dry season */}
        {isDusty && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '30%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${theme.particleColor}15, transparent)`,
              transform: 'skewX(-15deg)',
              filter: 'blur(40px)',
            }}
            animate={{
              left: ['-100%', '200%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Snow effect for winter */}
        {isWinter && (
          <>
            {Array.from({ length: 30 }, (_, i) => (
              <motion.div
                key={`snow-${i}`}
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.4)',
                  filter: 'blur(0.5px)',
                }}
                animate={{
                  y: ['0vh', '100vh'],
                  x: [0, Math.random() * 40 - 20],
                  opacity: [1, 0.2],
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </>
        )}

        {/* Subtle vignette (not full black) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 40%, transparent 0%, rgba(10,9,8,0.2) 100%)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
