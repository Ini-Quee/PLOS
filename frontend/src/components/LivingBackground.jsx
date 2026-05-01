import { useEffect, useState, useMemo } from 'react';
import { computeBackground, detectRegion } from '../lib/livingBackgroundConfig';
import './LivingBackground.css';

const PETAL_COLORS = ['#FFB7C5', '#FF91A4', '#FFE4E8', '#FFC0CB'];
const LEAF_COLORS = ['#E67E22', '#C0392B', '#F39C12', '#8B4513', '#CD853F'];
const BOKEH_CLASS_MAP = {
  bokeh_float: 'bokeh-default',
  bokeh_green: 'bokeh-green',
  bokeh_warm: 'bokeh-warm',
  bokeh_city: 'bokeh-city',
};
const INTENSITY_RANK = { minimal: 0, reduced: 1, full: 2 };

const getPerformanceMode = () => {
  const savedMode = localStorage.getItem('plos_wallpaper_intensity');
  if (savedMode) return savedMode;

  const memory = navigator.deviceMemory;
  const connection = navigator.connection?.effectiveType;
  const cores = navigator.hardwareConcurrency || 4;

  if (memory && memory < 2) return 'minimal';
  if (connection === '2g' || connection === 'slow-2g') return 'minimal';
  if (cores <= 2) return 'reduced';
  if (memory && memory < 4) return 'reduced';
  return 'full';
};

export default function LivingBackground({ theme = 'auto', enabled = true, intensity = 'full' }) {
  const [config, setConfig] = useState(null);
  const [performanceMode, setPerformanceMode] = useState('full');

  useEffect(() => {
    setPerformanceMode(getPerformanceMode());
  }, []);

  useEffect(() => {
    function updateBackground() {
      const now = new Date();
      const hour = now.getHours();
      const month = now.getMonth() + 1;
      const region = detectRegion();
      const bgConfig = computeBackground(hour, month, region, theme);
      setConfig(bgConfig);
    }
    updateBackground();
    const interval = setInterval(updateBackground, 60000);
    return () => clearInterval(interval);
  }, [theme]);

  if (!enabled || !config) return null;

  const effectiveIntensity = INTENSITY_RANK[performanceMode] < INTENSITY_RANK[intensity]
    ? performanceMode : intensity;

  const className = `living-background${effectiveIntensity === 'minimal' ? ' minimal-mode' : ''}${effectiveIntensity === 'reduced' ? ' reduced-mode' : ''}`;

  return (
    <div className={className}>
      <SkyGradientLayer config={config} />
      {effectiveIntensity !== 'minimal' && (
        <LandscapeSilhouette config={config} />
      )}
      {effectiveIntensity === 'full' && (
        <WeatherOverlay config={config} performanceMode={performanceMode} />
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

function SkyGradientLayer({ config }) {
  const { sky_top, sky_mid, sky_horizon, sky_low, sky_override } = config;

  const gradientStyle = sky_override || {
    background: `linear-gradient(180deg, ${sky_top} 0%, ${sky_mid} 30%, ${sky_horizon} 70%, ${sky_low} 100%)`
  };

  return (
    <div className="living-background-layer sky-gradient" style={gradientStyle} />
  );
}

function LandscapeSilhouette({ config }) {
  const { horizon_silhouette, ground_color, no_silhouette } = config;

  if (no_silhouette) return null;

  return (
    <div className="living-background-layer landscape-silhouette">
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 250">
        <SilhouetteContent type={horizon_silhouette} color={ground_color} />
      </svg>
    </div>
  );
}

function SilhouetteContent({ type, color }) {
  const darkerColor = adjustBrightness(color, 0.6);

  const randomData = useMemo(() => {
    switch (type) {
      case 'pine_forest':
      case 'full_canopy':
        return Array.from({ length: 12 }, (_, i) => ({
          x: i * 90 + Math.random() * 40,
          height: 60 + Math.random() * 40,
          opacity: 0.5 + Math.random() * 0.3,
        }));
      case 'autumn_trees':
        return Array.from({ length: 8 }, (_, i) => ({
          x: i * 130 + Math.random() * 30,
        }));
      case 'bare_winter':
        return Array.from({ length: 10 }, (_, i) => ({
          x: i * 105 + Math.random() * 20,
        }));
      case 'city_skyline':
        return Array.from({ length: 15 }, (_, i) => ({
          x: i * 70,
          height: 60 + Math.random() * 90,
          width: 30 + Math.random() * 40,
          opacity: 0.7 + Math.random() * 0.2,
        }));
      default:
        return null;
    }
  }, [type]);

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
          {randomData.map((d, i) => (
            <polygon
              key={i}
              points={`${d.x},${200 - d.height} ${d.x - 15},200 ${d.x + 15},200`}
              fill={darkerColor}
              opacity={d.opacity}
            />
          ))}
        </>
      );

    case 'autumn_trees':
      return (
        <>
          {randomData.map((d, i) => (
            <g key={i}>
              <rect x={d.x - 3} y="160" width="6" height="60" fill={darkerColor} opacity="0.7" />
              <circle cx={d.x} cy="155" r="20" fill={darkerColor} opacity="0.5" />
            </g>
          ))}
          <path d="M0,210 L1000,210 L1000,250 L0,250 Z" fill={darkerColor} opacity="0.8" />
        </>
      );

    case 'bare_winter':
      return (
        <>
          {randomData.map((d, i) => (
            <g key={i}>
              <line x1={d.x} y1="180" x2={d.x} y2="240" stroke={darkerColor} strokeWidth="2" opacity="0.6" />
              <line x1={d.x} y1="200" x2={d.x - 10} y2="210" stroke={darkerColor} strokeWidth="1.5" opacity="0.5" />
              <line x1={d.x} y1="200" x2={d.x + 10} y2="210" stroke={darkerColor} strokeWidth="1.5" opacity="0.5" />
            </g>
          ))}
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
          {randomData.map((d, i) => (
            <rect
              key={i}
              x={d.x}
              y={250 - d.height}
              width={d.width}
              height={d.height}
              fill={darkerColor}
              opacity={d.opacity}
            />
          ))}
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

function WeatherOverlay({ config, performanceMode }) {
  const { overlay_effect, particles, accent_color } = config;
  const effect = overlay_effect || particles;

  if (!effect) return null;

  return (
    <div className="living-background-layer weather-overlay">
      <WeatherEffectContent effect={effect} accentColor={accent_color} performanceMode={performanceMode} />
    </div>
  );
}

function WeatherEffectContent({ effect, accentColor, performanceMode }) {
  const data = useMemo(() => {
    switch (effect) {
      case 'tropical_rain':
        return {
          drops: Array.from({ length: 100 }, () => ({
            left: Math.random() * 100,
            top: -(Math.random() * 30),
            duration: 0.4 + Math.random() * 0.4,
            delay: Math.random() * 3,
          })),
          ripples: Array.from({ length: 15 }, () => ({
            left: Math.random() * 100,
            delay: Math.random() * 3,
          })),
        };
      case 'harmattan_dust':
        return Array.from({ length: 25 }, () => ({
          width: 1 + Math.random() * 2,
          height: 1 + Math.random() * 2,
          left: 100 + Math.random() * 20,
          top: Math.random() * 100,
          duration: 8 + Math.random() * 7,
          delay: Math.random() * 5,
        }));
      case 'cherry_petals':
        return Array.from({ length: 40 }, () => ({
          colorIndex: Math.floor(Math.random() * PETAL_COLORS.length),
          left: Math.random() * 100,
          duration: 8 + Math.random() * 6,
          delay: Math.random() * 8,
        }));
      case 'falling_leaves':
        return Array.from({ length: 35 }, () => ({
          colorIndex: Math.floor(Math.random() * LEAF_COLORS.length),
          left: Math.random() * 100,
          duration: 6 + Math.random() * 6,
          delay: Math.random() * 10,
        }));
      case 'snowfall':
        return Array.from({ length: 60 }, () => ({
          size: 8 + Math.random() * 12,
          left: Math.random() * 100,
          duration: 8 + Math.random() * 10,
          delay: Math.random() * 12,
        }));
      case 'star_twinkle': {
        const count = performanceMode === 'full' ? 80
          : performanceMode === 'reduced' ? 40
          : 20;
        return Array.from({ length: count }, () => ({
          size: 3 + Math.random() * 4,
          left: Math.random() * 100,
          top: Math.random() * 70,
          duration: 2 + Math.random() * 3,
          delay: Math.random() * 5,
        }));
      }
      case 'bokeh_float':
      case 'bokeh_green':
      case 'bokeh_warm':
      case 'bokeh_city':
        return Array.from({ length: 12 }, () => ({
          size: 20 + Math.random() * 40,
          left: Math.random() * 100,
          duration: 8 + Math.random() * 7,
          delay: Math.random() * 6,
          alphaHex: Math.floor(0.06 * 255 + Math.random() * 0.06 * 255).toString(16),
        }));
      case 'firefly_glow':
        return Array.from({ length: 25 }, () => ({
          left: Math.random() * 100,
          bottom: Math.random() * 40,
          duration: 6 + Math.random() * 6,
          delay: Math.random() * 8,
        }));
      case 'rising_mist':
        return Array.from({ length: 6 }, () => ({
          width: 40 + Math.random() * 40,
          height: 20 + Math.random() * 20,
          left: Math.random() * 60,
          bottom: Math.random() * 30,
          duration: 12 + Math.random() * 8,
          delay: Math.random() * 6,
        }));
      case 'dust_particles':
        return Array.from({ length: 25 }, () => ({
          size: 1 + Math.random() * 2,
          left: Math.random() * 20,
          top: Math.random() * 100,
          duration: 8 + Math.random() * 7,
          delay: Math.random() * 5,
        }));
      case 'birds_flying':
        return Array.from({ length: 8 }, () => ({
          top: 10 + Math.random() * 30,
          duration: 15 + Math.random() * 10,
          delay: Math.random() * 20,
        }));
      case 'clouds_drifting':
        return Array.from({ length: 6 }, () => ({
          top: 5 + Math.random() * 25,
          duration: 40 + Math.random() * 30,
          delay: Math.random() * 40,
          scale: 0.8 + Math.random() * 0.6,
        }));
      default:
        return null;
    }
  }, [effect, performanceMode]);

  switch (effect) {
    case 'tropical_rain':
      return (
        <>
          {data.drops.map((d, i) => (
            <div
              key={`rain-${i}`}
              className="rain-drop"
              style={{
                left: `${d.left}%`,
                top: `${d.top}px`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
          {data.ripples.map((d, i) => (
            <div
              key={`ripple-${i}`}
              className="rain-ripple"
              style={{
                left: `${d.left}%`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'harmattan_dust':
      return (
        <>
          <div className="harmattan-haze" />
          {data.map((d, i) => (
            <div
              key={`dust-${i}`}
              className="dust-particle"
              style={{
                width: `${d.width}px`,
                height: `${d.height}px`,
                left: `${d.left}%`,
                top: `${d.top}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'cherry_petals':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`petal-${i}`}
              className="cherry-petal"
              style={{
                background: PETAL_COLORS[d.colorIndex],
                left: `${d.left}%`,
                top: '-20px',
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'falling_leaves':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`leaf-${i}`}
              className="autumn-leaf"
              style={{
                color: LEAF_COLORS[d.colorIndex],
                left: `${d.left}%`,
                top: '-20px',
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'snowfall':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`snow-${i}`}
              className="snowflake"
              style={{
                width: `${d.size}px`,
                height: `${d.size}px`,
                left: `${d.left}%`,
                top: '-20px',
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'star_twinkle':
      return (
        <div style={{ willChange: 'opacity' }}>
          {data.map((d, i) => (
            <div
              key={`star-${i}`}
              className="star"
              style={{
                width: `${d.size}px`,
                height: `${d.size}px`,
                left: `${d.left}%`,
                top: `${d.top}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </div>
      );

    case 'bokeh_float':
    case 'bokeh_green':
    case 'bokeh_warm':
    case 'bokeh_city':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`bokeh-${i}`}
              className={`bokeh-circle ${BOKEH_CLASS_MAP[effect] || ''}`}
              style={{
                width: `${d.size}px`,
                height: `${d.size}px`,
                background: accentColor ? `${accentColor}${d.alphaHex}` : undefined,
                left: `${d.left}%`,
                bottom: '-50px',
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'ocean_shimmer':
      return <div className="ocean-shimmer" />;

    case 'firefly_glow':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`firefly-${i}`}
              className="firefly"
              style={{
                color: '#F5A623',
                left: `${d.left}%`,
                bottom: `${d.bottom}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'heat_shimmer':
      return (
        <>
          {[...Array(5)].map((_, i) => (
            <div
              key={`shimmer-${i}`}
              className="heat-shimmer-line"
              style={{
                top: `${75 + i * 5}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </>
      );

    case 'rising_mist':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`mist-${i}`}
              className="mist-blob"
              style={{
                width: `${d.width}vw`,
                height: `${d.height}vh`,
                left: `${d.left}%`,
                bottom: `${d.bottom}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'dust_particles':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`dust-dot-${i}`}
              className="dust-dot"
              style={{
                width: `${d.size}px`,
                height: `${d.size}px`,
                left: `${d.left}%`,
                top: `${d.top}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'aurora_wave':
      return <div className="aurora-wave" />;

    case 'birds_flying':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`bird-${i}`}
              className="bird"
              style={{
                top: `${d.top}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </>
      );

    case 'clouds_drifting':
      return (
        <>
          {data.map((d, i) => (
            <div
              key={`cloud-${i}`}
              className="cloud"
              style={{
                top: `${d.top}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
                transform: `scale(${d.scale})`,
              }}
            />
          ))}
        </>
      );

    case 'sun_rays':
      return (
        <>
          {[...Array(12)].map((_, i) => (
            <div
              key={`ray-${i}`}
              className="sun-ray"
              style={{
                transform: `rotate(${i * 30}deg)`,
                animationDelay: `${i * 5}s`,
              }}
            />
          ))}
        </>
      );

    default:
      return null;
  }
}

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
