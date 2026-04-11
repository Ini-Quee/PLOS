import { useEffect, useState } from 'react';
import './LivingBackground.css';

/**
 * LivingBackground — Environment themes for PLOS
 * Per AGENTS.md Part 3: Five theme options
 * - Forest: deep greens, soft light through trees
 * - Starfield: deep blue, slow-moving stars
 * - WarmStudy: amber candlelight glow, warm shadows
 * - Cloud: soft white clouds drifting
 * - Minimal: subtle slow gradient shift, no particles
 */
export default function LivingBackground({ theme: userTheme = null }) {
  // Get theme from localStorage or prop
  const [theme, setTheme] = useState(() => {
    if (userTheme) return userTheme;
    const saved = localStorage.getItem('plos_background_theme');
    return saved || 'cloud';
  });

  // Get LivingBackground enabled state
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('plos_living_background');
    return saved === 'true';
  });

  // Time-based state (for cloud theme)
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [season, setSeason] = useState('spring');

  // Listen for theme changes from Settings
  useEffect(() => {
    function handleStorageChange() {
      const savedTheme = localStorage.getItem('plos_background_theme');
      const savedEnabled = localStorage.getItem('plos_living_background');
      if (savedTheme) setTheme(savedTheme);
      if (savedEnabled) setEnabled(savedEnabled === 'true');
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update time of day (for cloud theme)
  useEffect(() => {
    function updateEnvironment() {
      const now = new Date();
      const hour = now.getHours();
      const month = now.getMonth();

      // Time of day
      if (hour >= 5 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour < 17) {
        setTimeOfDay('afternoon');
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }

      // Season (Northern Hemisphere)
      if (month >= 2 && month <= 4) {
        setSeason('spring');
      } else if (month >= 5 && month <= 7) {
        setSeason('summer');
      } else if (month >= 8 && month <= 10) {
        setSeason('autumn');
      } else {
        setSeason('winter');
      }
    }

    updateEnvironment();
    const interval = setInterval(updateEnvironment, 60000);
    return () => clearInterval(interval);
  }, []);

  // If LivingBackground is disabled, return minimal static background
  if (!enabled) {
    return (
      <div
        className="living-background minimal"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          backgroundColor: '#0D0D0D',
        }}
      />
    );
  }

  // Render based on selected theme
  const renderTheme = () => {
    switch (theme) {
      case 'forest':
        return <ForestTheme />;
      case 'starfield':
        return <StarfieldTheme />;
      case 'warm-study':
        return <WarmStudyTheme />;
      case 'cloud':
        return <CloudTheme timeOfDay={timeOfDay} season={season} />;
      case 'minimal':
        return <MinimalTheme />;
      default:
        return <CloudTheme timeOfDay={timeOfDay} season={season} />;
    }
  };

  return (
    <div className={`living-background theme-${theme}`}>
      {renderTheme()}
    </div>
  );
}

/**
 * Forest Theme — Deep greens, soft light through trees
 */
function ForestTheme() {
  return (
    <>
      <div className="forest-bg" />
      <div className="forest-trees" />
      <div className="forest-light" />
      <div className="forest-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="forest-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Starfield Theme — Deep blue, slow-moving stars
 */
function StarfieldTheme() {
  return (
    <>
      <div className="starfield-bg" />
      <div className="starfield-stars">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>
      <div className="starfield-nebula" />
    </>
  );
}

/**
 * Warm Study Theme — Amber candlelight glow, warm shadows
 */
function WarmStudyTheme() {
  return (
    <>
      <div className="warm-study-bg" />
      <div className="candle-glow" />
      <div className="candle-glow-secondary" />
      <div className="warm-shadows" />
      <div className="dust-particles">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="dust-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Cloud Theme — Soft white clouds drifting
 */
function CloudTheme({ timeOfDay, season }) {
  return (
    <>
      <div className={`cloud-bg ${timeOfDay}`} />
      {(timeOfDay === 'morning' || timeOfDay === 'afternoon') && (
        <div id="clouds">
          <div className="cloud x1" />
          <div className="cloud x2" />
          <div className="cloud x3" />
          <div className="cloud x4" />
          <div className="cloud x5" />
        </div>
      )}
      {timeOfDay === 'night' && <div id="stars" />}
      <div id="seasonal-particles" className={season} />
    </>
  );
}

/**
 * Minimal Theme — Subtle slow gradient shift, no particles
 */
function MinimalTheme() {
  return (
    <>
      <div className="minimal-gradient" />
      <div className="minimal-overlay" />
    </>
  );
}
