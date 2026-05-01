import { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { pickScene, DEFAULT_PALETTE } from '../lib/atmos';
import './Atmosphere.css';

// ─── Context: lets any page read the current palette ─────────────────────────
export const AtmosContext = createContext({ palette: DEFAULT_PALETTE, scene: null });
export const useAtmos = () => useContext(AtmosContext);

// ─── Stable random arrays (no re-render flicker) ──────────────────────────────
function useParticles(type, count) {
  return useMemo(() => {
    if (!type) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x:        Math.random() * 100,
      y:        Math.random() * 110 - 10,
      size:     Math.random(),
      duration: Math.random(),
      delay:    Math.random(),
      drift:    Math.random() * 2 - 1,
    }));
  }, [type, count]);
}

// ─── Particle layer components ────────────────────────────────────────────────

function RainLayer({ particles }) {
  return (
    <div className="atmos-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-rain-drop"
          style={{
            left:              `${p.x}%`,
            top:               `-${30 + p.size * 20}px`,
            animationDuration: `${0.55 + p.duration * 0.35}s`,
            animationDelay:    `${p.delay * 3}s`,
            opacity:           0.5 + p.size * 0.3,
          }}
        />
      ))}
    </div>
  );
}

function SnowLayer({ particles }) {
  return (
    <div className="atmos-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-snowflake"
          style={{
            left:              `${p.x}%`,
            top:               `-20px`,
            width:             `${6 + p.size * 10}px`,
            height:            `${6 + p.size * 10}px`,
            animationDuration: `${8 + p.duration * 8}s`,
            animationDelay:    `${p.delay * 10}s`,
            '--drift':         `${p.drift * 60}px`,
          }}
        />
      ))}
    </div>
  );
}

function DustLayer({ particles }) {
  return (
    <div className="atmos-particles" aria-hidden="true">
      <div className="atmos-dust-haze" />
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-dust-particle"
          style={{
            left:              `${100 + p.x * 20}%`,
            top:               `${p.y}%`,
            width:             `${1.5 + p.size * 2}px`,
            height:            `${1.5 + p.size * 2}px`,
            animationDuration: `${9 + p.duration * 8}s`,
            animationDelay:    `${p.delay * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

function StarsLayer({ particles }) {
  return (
    <div className="atmos-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-star"
          style={{
            left:              `${p.x}%`,
            top:               `${p.y * 0.7}%`,
            width:             `${2 + p.size * 3}px`,
            height:            `${2 + p.size * 3}px`,
            animationDuration: `${2.5 + p.duration * 3}s`,
            animationDelay:    `${p.delay * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

function PetalsLayer({ particles }) {
  const COLORS = ['#FFB7C5', '#FF91A4', '#FFE4E8', '#FFC0CB', '#FFD0DC'];
  return (
    <div className="atmos-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-petal"
          style={{
            left:              `${p.x}%`,
            top:               `-20px`,
            background:        COLORS[p.id % COLORS.length],
            animationDuration: `${8 + p.duration * 6}s`,
            animationDelay:    `${p.delay * 8}s`,
            '--drift':         `${p.drift * 80}px`,
          }}
        />
      ))}
    </div>
  );
}

function LeavesLayer({ particles }) {
  const COLORS = ['#C84800', '#A03010', '#D86820', '#8B4010', '#E08030'];
  return (
    <div className="atmos-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-leaf"
          style={{
            left:              `${p.x}%`,
            top:               `-20px`,
            color:             COLORS[p.id % COLORS.length],
            animationDuration: `${7 + p.duration * 6}s`,
            animationDelay:    `${p.delay * 8}s`,
            '--drift':         `${p.drift * 100}px`,
          }}
        />
      ))}
    </div>
  );
}

function EmbersLayer({ particles }) {
  return (
    <div className="atmos-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-ember"
          style={{
            left:              `${30 + p.x * 40}%`,
            bottom:            `${5 + p.size * 10}%`,
            width:             `${2 + p.size * 3}px`,
            height:            `${2 + p.size * 3}px`,
            animationDuration: `${4 + p.duration * 5}s`,
            animationDelay:    `${p.delay * 4}s`,
            '--drift':         `${p.drift * 40}px`,
          }}
        />
      ))}
    </div>
  );
}

function MistLayer({ particles }) {
  return (
    <div className="atmos-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="atmos-mist"
          style={{
            width:             `${40 + p.size * 40}vw`,
            height:            `${20 + p.size * 20}vh`,
            left:              `${p.x * 60}%`,
            bottom:            `${p.y * 30 + 5}%`,
            animationDuration: `${14 + p.duration * 8}s`,
            animationDelay:    `${p.delay * 6}s`,
          }}
        />
      ))}
    </div>
  );
}

const PARTICLE_COUNT = {
  rain:   90,
  snow:   55,
  dust:   22,
  stars:  80,
  petals: 35,
  leaves: 30,
  embers: 18,
  mist:   5,
};

function ParticleLayer({ type }) {
  const count  = PARTICLE_COUNT[type] || 0;
  const particles = useParticles(type, count);
  if (!type || !count) return null;

  switch (type) {
    case 'rain':   return <RainLayer particles={particles} />;
    case 'snow':   return <SnowLayer particles={particles} />;
    case 'dust':   return <DustLayer particles={particles} />;
    case 'stars':  return <StarsLayer particles={particles} />;
    case 'petals': return <PetalsLayer particles={particles} />;
    case 'leaves': return <LeavesLayer particles={particles} />;
    case 'embers': return <EmbersLayer particles={particles} />;
    case 'mist':   return <MistLayer particles={particles} />;
    default:       return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Atmosphere({ section = 'all', children }) {
  const [scene,       setScene]       = useState(() => pickScene({ section }));
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const imgRef = useRef(null);

  // Re-pick scene every 60s so time-of-day transitions work
  useEffect(() => {
    const pick = () => setScene(pickScene({ section }));
    const id = setInterval(pick, 60_000);
    window.addEventListener('atmos-scene-changed', pick);
    return () => { clearInterval(id); window.removeEventListener('atmos-scene-changed', pick); };
  }, [section]);

  // Load photo
  useEffect(() => {
    setPhotoLoaded(false);
    const img = new Image();
    img.onload  = () => setPhotoLoaded(true);
    img.onerror = () => setPhotoLoaded(false);
    img.src = scene.photo;
    imgRef.current = img;
    return () => { img.onload = null; img.onerror = null; };
  }, [scene.photo]);

  // Pause animations when tab hidden
  useEffect(() => {
    const onVis = () => {
      document.querySelector('.atmos-root')
        ?.classList.toggle('atmos-paused', document.hidden);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const ctx = useMemo(() => ({ palette: scene.palette, scene }), [scene]);

  return (
    <AtmosContext.Provider value={ctx}>
      <div className="atmos-root">
        {/* Layer 1: gradient (instant, always visible) */}
        <div
          className="atmos-layer atmos-gradient"
          style={{ background: scene.fallback }}
        />

        {/* Layer 2: photo (fades in when loaded) */}
        <div
          className="atmos-layer atmos-photo"
          style={{
            backgroundImage: scene.photo ? `url(${scene.photo})` : 'none',
            opacity:         photoLoaded ? 1 : 0,
          }}
        />

        {/* Layer 3: scene-tinted overlay */}
        <div
          className="atmos-layer atmos-overlay"
          style={{ background: scene.overlay }}
        />

        {/* Layer 4: vignette */}
        <div className="atmos-layer atmos-vignette" />

        {/* App content */}
        <div className="atmos-content">
          {children}
        </div>

        {/* Layer 5: particles — fixed ABOVE content so they're always visible */}
        <ParticleLayer type={scene.particles} />
      </div>
    </AtmosContext.Provider>
  );
}
