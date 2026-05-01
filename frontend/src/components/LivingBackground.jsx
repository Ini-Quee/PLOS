import { useEffect, useState, useMemo } from 'react';
import { computeBackground, detectRegion, THEME_LIBRARY } from '../lib/livingBackgroundConfig';
import './LivingBackground.css';

/**
 * PLOS Living Background System
 * Time-aware, season-aware, location-aware animated wallpaper
 * Pure CSS animations + inline SVG - NO external assets
 */

export default function LivingBackground({ theme = 'auto', enabled = true, intensity = 'full' }) {
  const [config, setConfig] = useState(null);
  const [isLowMemory, setIsLowMemory] = useState(false);

  console.log('🌈 LivingBackground rendered!', { theme, enabled, intensity });

  // Detect low memory devices
  useEffect(() => {
    if (navigator.deviceMemory && navigator.deviceMemory < 2) {
      setIsLowMemory(true);
    }
  }, []);

  // Compute background configuration
  useEffect(() => {
    function updateBackground() {
      const now = new Date();
      const hour = now.getHours();
      const month = now.getMonth() + 1; // 1-12
      const region = detectRegion();

      const bgConfig = computeBackground(hour, month, region, theme);
      console.log('⏰ Background config computed:', { hour, month, region, theme, particles: bgConfig.particles, overlay_effect: bgConfig.overlay_effect });
      setConfig(bgConfig);
    }

    updateBackground();

    // Update every 60 seconds to catch time-of-day transitions
    const interval = setInterval(updateBackground, 60000);

    return () => clearInterval(interval);
  }, [theme]);

  // Don't render if disabled
  if (!enabled || !config) {
    return null;
  }

  // Force minimal mode on low memory devices
  const effectiveIntensity = isLowMemory ? 'minimal' : intensity;

  const className = `living-background ${effectiveIntensity === 'minimal' ? 'minimal-mode' : ''} ${effectiveIntensity === 'reduced' ? 'reduced-mode' : ''}`;

  return (
    <div className={className}>
      <SkyGradientLayer config={config} />

      {effectiveIntensity !== 'minimal' && (
        <LandscapeSilhouette config={config} />
      )}

      {effectiveIntensity === 'full' && (
        <WeatherOverlay config={config} />
      )}

      {effectiveIntensity === 'full' && (
        <AtmosphericLayer config={config} />
      )}

      <VignetteOverlay />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sky Gradient Layer - Base atmospheric gradient
 */
function SkyGradientLayer({ config }) {
  const { sky_top, sky_mid, sky_horizon, sky_low, sky_override } = config;

  const gradientStyle = sky_override || {
    background: `linear-gradient(180deg, ${sky_top} 0%, ${sky_mid} 30%, ${sky_horizon} 70%, ${sky_low} 100%)`
  };

  return (
    <div className="living-background-layer sky-gradient" style={gradientStyle} />
  );
}

/**
 * Landscape Silhouette - CSS/SVG drawn horizon
 */
function LandscapeSilhouette({ config }) {
  const { horizon_silhouette, ground_color, no_silhouette } = config;

  if (no_silhouette) return null;

  return (
    <div className="living-background-layer landscape-silhouette">
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 250">
        {renderSilhouette(horizon_silhouette, ground_color)}
      </svg>
    </div>
  );
}

/**
 * Render SVG silhouette based on type
 */
function renderSilhouette(type, color) {
  const darkerColor = adjustBrightness(color, 0.6);

  switch (type) {
    case 'tropical_treeline':
      return (
        <>
          <path
            d="M0,150 Q100,120 150,140 T250,130 T350,145 T450,135 T550,150 T650,140 T750,145 T850,135 T950,148 L1000,150 L1000,250 L0,250 Z"
            fill={darkerColor}
            opacity="0.7"
          />
          <path
            d="M0,180 Q120,160 180,170 T320,165 T460,175 T600,168 T740,172 T880,168 L1000,170 L1000,250 L0,250 Z"
            fill={darkerColor}
            opacity="0.5"
          />
        </>
      );

    case 'savanna':
      return (
        <>
          <ellipse cx="200" cy="100" rx="30" ry="45" fill={darkerColor} opacity="0.6" />
          <rect x="195" y="100" width="10" height="80" fill={darkerColor} opacity="0.7" />
          <ellipse cx="700" cy="120" rx="25" ry="40" fill={darkerColor} opacity="0.6" />
          <rect x="696" y="120" width="8" height="60" fill={darkerColor} opacity="0.7" />
          <path d="M0,220 L1000,220 L1000,250 L0,250 Z" fill={darkerColor} opacity="0.8" />
        </>
      );

    case 'rolling_hills':
      return (
        <>
          <path
            d="M0,180 Q250,140 500,160 T1000,150 L1000,250 L0,250 Z"
            fill={darkerColor}
            opacity="0.6"
          />
          <path
            d="M0,200 Q300,170 600,185 T1000,180 L1000,250 L0,250 Z"
            fill={darkerColor}
            opacity="0.8"
          />
        </>
      );

    case 'pine_forest':
    case 'full_canopy':
      return (
        <>
          {[...Array(12)].map((_, i) => {
            const x = i * 90 + Math.random() * 40;
            const height = 60 + Math.random() * 40;
            return (
              <polygon
                key={i}
                points={`${x},${200 - height} ${x - 15},200 ${x + 15},200`}
                fill={darkerColor}
                opacity={0.5 + Math.random() * 0.3}
              />
            );
          })}
        </>
      );

    case 'autumn_trees':
      return (
        <>
          {[...Array(8)].map((_, i) => {
            const x = i * 130 + Math.random() * 30;
            return (
              <g key={i}>
                <rect x={x - 3} y="160" width="6" height="60" fill={darkerColor} opacity="0.7" />
                <circle cx={x} cy="155" r="20" fill={darkerColor} opacity="0.5" />
              </g>
            );
          })}
          <path d="M0,210 L1000,210 L1000,250 L0,250 Z" fill={darkerColor} opacity="0.8" />
        </>
      );

    case 'bare_winter':
      return (
        <>
          {[...Array(10)].map((_, i) => {
            const x = i * 105 + Math.random() * 20;
            return (
              <g key={i}>
                <line x1={x} y1="180" x2={x} y2="240" stroke={darkerColor} strokeWidth="2" opacity="0.6" />
                <line x1={x} y1="200" x2={x - 10} y2="210" stroke={darkerColor} strokeWidth="1.5" opacity="0.5" />
                <line x1={x} y1="200" x2={x + 10} y2="210" stroke={darkerColor} strokeWidth="1.5" opacity="0.5" />
              </g>
            );
          })}
          <path d="M0,230 L1000,235 L1000,250 L0,250 Z" fill="#E8EEF0" />
        </>
      );

    case 'beach_horizon':
      return (
        <path d="M0,230 L1000,228 L1000,250 L0,250 Z" fill={darkerColor} opacity="0.4" />
      );

    case 'city_skyline':
      return (
        <>
          {[...Array(15)].map((_, i) => {
            const x = i * 70;
            const height = 60 + Math.random() * 90;
            const width = 30 + Math.random() * 40;
            return (
              <rect
                key={i}
                x={x}
                y={250 - height}
                width={width}
                height={height}
                fill={darkerColor}
                opacity={0.7 + Math.random() * 0.2}
              />
            );
          })}
        </>
      );

    case 'temple_treeline':
      return (
        <>
          <rect x="450" y="150" width="100" height="80" fill={darkerColor} opacity="0.6" />
          <polygon points="450,150 500,120 550,150" fill={darkerColor} opacity="0.7" />
          {[...Array(6)].map((_, i) => {
            const x = i * 180 + (i > 2 ? 120 : 0);
            return (
              <circle key={i} cx={x} cy="180" r="25" fill={darkerColor} opacity="0.5" />
            );
          })}
          <path d="M0,210 L1000,210 L1000,250 L0,250 Z" fill={darkerColor} opacity="0.8" />
        </>
      );

    case 'tropical_dense':
      return (
        <path
          d="M0,140 Q50,120 100,135 T200,125 T300,140 T400,130 T500,145 T600,135 T700,142 T800,133 T900,145 T1000,138 L1000,250 L0,250 Z"
          fill={darkerColor}
          opacity="0.9"
        />
      );

    default:
      return (
        <path d="M0,200 Q500,180 1000,200 L1000,250 L0,250 Z" fill={darkerColor} opacity="0.7" />
      );
  }
}

/**
 * Weather Overlay - Animated particles/effects
 */
function WeatherOverlay({ config }) {
  const { overlay_effect, particles, accent_color } = config;
  const effect = overlay_effect || particles;

  console.log('🌨️ WeatherOverlay:', { overlay_effect, particles, effect, accent_color });

  if (!effect) {
    console.log('❌ No effect - WeatherOverlay returning null');
    return null;
  }

  console.log('✅ Rendering weather effect:', effect);

  return (
    <div className="living-background-layer weather-overlay">
      {renderWeatherEffect(effect, accent_color)}
    </div>
  );
}

/**
 * Render weather particles
 */
function renderWeatherEffect(effect, accentColor) {
  switch (effect) {
    case 'tropical_rain':
      return (
        <>
          {[...Array(100)].map((_, i) => (
            <div
              key={`rain-${i}`}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 30}px`,
                animationDuration: `${0.4 + Math.random() * 0.4}s`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
          {[...Array(15)].map((_, i) => (
            <div
              key={`ripple-${i}`}
              className="rain-ripple"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </>
      );

    case 'harmattan_dust':
      return (
        <>
          <div className="harmattan-haze" />
          {[...Array(25)].map((_, i) => (
            <div
              key={`dust-${i}`}
              className="dust-particle"
              style={{
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                left: `${100 + Math.random() * 20}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 7}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </>
      );

    case 'cherry_petals':
      const petalColors = ['#FFB7C5', '#FF91A4', '#FFE4E8', '#FFC0CB'];
      return [...Array(40)].map((_, i) => (
        <div
          key={`petal-${i}`}
          className="cherry-petal"
          style={{
            background: petalColors[Math.floor(Math.random() * petalColors.length)],
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDuration: `${8 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 8}s`
          }}
        />
      ));

    case 'falling_leaves':
      const leafColors = ['#E67E22', '#C0392B', '#F39C12', '#8B4513', '#CD853F'];
      return [...Array(35)].map((_, i) => (
        <div
          key={`leaf-${i}`}
          className="autumn-leaf"
          style={{
            color: leafColors[Math.floor(Math.random() * leafColors.length)],
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDuration: `${6 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 10}s`
          }}
        />
      ));

    case 'snowfall':
      return [...Array(60)].map((_, i) => (
        <div
          key={`snow-${i}`}
          className="snowflake"
          style={{
            width: `${8 + Math.random() * 12}px`,
            height: `${8 + Math.random() * 12}px`,
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDuration: `${8 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 12}s`
          }}
        />
      ));

    case 'star_twinkle':
      return [...Array(120)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="star"
          style={{
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 70}%`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ));

    case 'bokeh_float':
    case 'bokeh_green':
    case 'bokeh_warm':
    case 'bokeh_city':
      const bokehClass = effect === 'bokeh_float' ? '' : effect.replace('bokeh_', 'bokeh-');
      return [...Array(12)].map((_, i) => (
        <div
          key={`bokeh-${i}`}
          className={`bokeh-circle ${bokehClass}`}
          style={{
            width: `${20 + Math.random() * 40}px`,
            height: `${20 + Math.random() * 40}px`,
            background: accentColor ? `${accentColor}${Math.floor(0.06 * 255 + Math.random() * 0.06 * 255).toString(16)}` : undefined,
            left: `${Math.random() * 100}%`,
            bottom: `-50px`,
            animationDuration: `${8 + Math.random() * 7}s`,
            animationDelay: `${Math.random() * 6}s`
          }}
        />
      ));

    case 'ocean_shimmer':
      return <div className="ocean-shimmer" />;

    case 'firefly_glow':
      return [...Array(25)].map((_, i) => (
        <div
          key={`firefly-${i}`}
          className="firefly"
          style={{
            color: '#F5A623',
            left: `${Math.random() * 100}%`,
            bottom: `${Math.random() * 40}%`,
            animationDuration: `${6 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 8}s`
          }}
        />
      ));

    case 'heat_shimmer':
      return [...Array(5)].map((_, i) => (
        <div
          key={`shimmer-${i}`}
          className="heat-shimmer-line"
          style={{
            top: `${75 + i * 5}%`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ));

    case 'rising_mist':
      return [...Array(6)].map((_, i) => (
        <div
          key={`mist-${i}`}
          className="mist-blob"
          style={{
            width: `${40 + Math.random() * 40}vw`,
            height: `${20 + Math.random() * 20}vh`,
            left: `${Math.random() * 60}%`,
            bottom: `${Math.random() * 30}%`,
            animationDuration: `${12 + Math.random() * 8}s`,
            animationDelay: `${Math.random() * 6}s`
          }}
        />
      ));

    case 'dust_particles':
      return [...Array(25)].map((_, i) => (
        <div
          key={`dust-dot-${i}`}
          className="dust-dot"
          style={{
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            left: `${Math.random() * 20}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 7}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ));

    case 'aurora_wave':
      return <div className="aurora-wave" />;

    case 'birds_flying':
      return [...Array(8)].map((_, i) => (
        <div
          key={`bird-${i}`}
          className="bird"
          style={{
            top: `${10 + Math.random() * 30}%`,
            animationDuration: `${15 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 20}s`
          }}
        />
      ));

    case 'clouds_drifting':
      return [...Array(6)].map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="cloud"
          style={{
            top: `${5 + Math.random() * 25}%`,
            animationDuration: `${40 + Math.random() * 30}s`,
            animationDelay: `${Math.random() * 40}s`,
            transform: `scale(${0.8 + Math.random() * 0.6})`
          }}
        />
      ));

    case 'sun_rays':
      return [...Array(12)].map((_, i) => (
        <div
          key={`ray-${i}`}
          className="sun-ray"
          style={{
            transform: `rotate(${i * 30}deg)`,
            animationDelay: `${i * 5}s`
          }}
        />
      ));

    default:
      return null;
  }
}

/**
 * Atmospheric Layer - Ambient glow overlay
 */
function AtmosphericLayer({ config }) {
  const { ambient_glow, warm_glow } = config;

  if (!ambient_glow && !warm_glow) return null;

  const glowStyle = {
    background: warm_glow
      ? 'radial-gradient(circle at 30% 60%, rgba(245,166,35,0.15), transparent 60%)'
      : `radial-gradient(circle at 50% 50%, ${ambient_glow}, transparent 70%)`
  };

  return (
    <div className="living-background-layer atmospheric-layer" style={glowStyle} />
  );
}

/**
 * Vignette Overlay - Always present subtle darkening at edges
 */
function VignetteOverlay() {
  return <div className="living-background-layer vignette" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function adjustBrightness(hex, factor) {
  if (!hex || !hex.startsWith('#')) return hex;

  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.round(Math.max(0, Math.min(255, rgb.r * factor)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g * factor)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b * factor)));

  return rgbToHex(r, g, b);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
