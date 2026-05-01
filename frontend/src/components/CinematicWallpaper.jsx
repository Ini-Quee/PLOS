import { useState, useEffect, useCallback, useMemo } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { getScenesByTimeAndSeason, getSceneById, getAllScenes } from '../lib/wallpaperScenes-local';
import PARTICLE_PRESETS from '../lib/particlePresets';
import './CinematicWallpaper.css';

const getPhotoUrl = (scene) => {
  const seed = scene.photo_seed || 1;
  return `https://picsum.photos/1920/1080?random=${seed}`;
};

export default function CinematicWallpaper() {
  const [currentScene, setCurrentScene] = useState(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [intensity, setIntensity] = useState('full');
  const [particlesInit, setParticlesInit] = useState(false);

  const performanceMode = useMemo(() => {
    const savedMode = localStorage.getItem('plos_wallpaper_intensity');
    if (savedMode) return savedMode;

    const memory = navigator.deviceMemory;
    const connection = navigator.connection?.effectiveType;

    if (memory && memory < 2) return 'minimal';
    if (connection === '2g' || connection === 'slow-2g') return 'minimal';
    if (memory && memory < 4) return 'reduced';
    return 'full';
  }, []);

  const getTimeOfDay = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 10.5) return 'morning';
    if (hour >= 10.5 && hour < 15) return 'midday';
    if (hour >= 15 && hour < 18.5) return 'golden_hour';
    if (hour >= 18.5 && hour < 20.5) return 'sunset';
    if (hour >= 20.5 && hour < 21.5) return 'blue_hour';
    return 'night';
  }, []);

  const getSeason = useCallback(() => {
    const month = new Date().getMonth() + 1;
    const offset = -(new Date().getTimezoneOffset() / 60);

    if (offset >= 0 && offset <= 1) {
      return month >= 4 && month <= 10 ? 'rainy' : 'harmattan';
    }

    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }, []);

  const getTimeGradient = useCallback((timeOfDay) => {
    const gradients = {
      dawn: 'linear-gradient(180deg, rgba(74,25,66,0.3) 0%, rgba(255,107,53,0.2) 50%, rgba(255,179,71,0.15) 100%)',
      morning: 'linear-gradient(180deg, rgba(27,79,114,0.15) 0%, transparent 50%)',
      midday: 'linear-gradient(180deg, rgba(14,77,146,0.1) 0%, transparent 60%)',
      golden_hour: 'linear-gradient(180deg, rgba(74,35,90,0.2) 0%, rgba(245,166,35,0.15) 100%)',
      sunset: 'linear-gradient(180deg, rgba(13,13,13,0.3) 0%, rgba(192,57,43,0.2) 50%, rgba(230,126,34,0.15) 100%)',
      blue_hour: 'linear-gradient(180deg, rgba(26,26,60,0.25) 0%, rgba(74,35,90,0.15) 100%)',
      night: 'linear-gradient(180deg, rgba(2,4,8,0.6) 0%, rgba(5,13,24,0.4) 100%)'
    };
    return gradients[timeOfDay] || gradients.night;
  }, []);

  const initParticles = useCallback(async (engine) => {
    await loadSlim(engine);
    setParticlesInit(true);
  }, []);

  // Load scene
  useEffect(() => {
    const loadScene = () => {
      const savedSceneId = localStorage.getItem('plos_wallpaper_scene');
      const savedIntensity = localStorage.getItem('plos_wallpaper_intensity');

      if (savedIntensity) {
        setIntensity(savedIntensity);
      } else {
        setIntensity(performanceMode);
      }

      let scene;
      if (savedSceneId && savedSceneId !== 'auto') {
        scene = getSceneById(savedSceneId);
      } else {
        const timeOfDay = getTimeOfDay();
        const season = getSeason();
        const matchingScenes = getScenesByTimeAndSeason(timeOfDay, season);
        scene = matchingScenes[0] || getAllScenes()[0];
      }

      setCurrentScene(scene);

      if (scene.video_url) {
        fetch(scene.video_url, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              setIsVideo(true);
              setPhotoUrl(scene.video_url);
              setPhotoLoaded(true);
            } else {
              throw new Error('Video not found');
            }
          })
          .catch(() => {
            setIsVideo(false);
            setPhotoLoaded(false);
          });
      } else {
        setIsVideo(false);
        setPhotoLoaded(false);
      }
    };

    loadScene();

    const handleSceneChange = () => { loadScene(); };
    window.addEventListener('wallpaper-scene-changed', handleSceneChange);
    return () => {
      window.removeEventListener('wallpaper-scene-changed', handleSceneChange);
    };
  }, [getTimeOfDay, getSeason, performanceMode]);

  // Preload photo (Picsum or local photo_url)
  useEffect(() => {
    if (!currentScene || isVideo) return;

    setPhotoLoaded(false);

    const url = currentScene.photo_url || getPhotoUrl(currentScene);
    setPhotoUrl(url);

    const img = new Image();
    img.onload = () => setPhotoLoaded(true);
    img.onerror = () => {
      if (currentScene.photo_url && currentScene.photo_seed) {
        const fallbackUrl = getPhotoUrl(currentScene);
        setPhotoUrl(fallbackUrl);
        const retry = new Image();
        retry.onload = () => setPhotoLoaded(true);
        retry.onerror = () => setPhotoLoaded(false);
        retry.src = fallbackUrl;
      } else {
        setPhotoLoaded(false);
      }
    };
    img.src = url;

    return () => { img.onload = null; img.onerror = null; };
  }, [currentScene, isVideo]);

  // Pause animations when tab hidden or battery low
  useEffect(() => {
    const handleVisibilityChange = () => {
      const root = document.querySelector('.cinematic-root');
      if (!root) return;

      if (document.hidden) {
        root.classList.add('paused');
      } else {
        root.classList.remove('paused');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const checkBattery = () => {
          const root = document.querySelector('.cinematic-root');
          if (!root) return;

          if (battery.level < 0.2 && !battery.charging) {
            root.classList.add('low-battery');
          } else {
            root.classList.remove('low-battery');
          }
        };

        battery.addEventListener('levelchange', checkBattery);
        battery.addEventListener('chargingchange', checkBattery);
        checkBattery();
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!currentScene) {
    return null;
  }

  const timeOfDay = getTimeOfDay();
  const timeGradient = getTimeGradient(timeOfDay);

  if (intensity === 'minimal') {
    return (
      <div className="cinematic-root minimal-mode">
        <div
          className="fallback-gradient"
          style={{ background: currentScene.photo_fallback_gradient }}
        />
        <div className="vignette-overlay" />
        <PhotoCredit scene={currentScene} />
      </div>
    );
  }

  return (
    <div className="cinematic-root" data-intensity={intensity}>
      {/* Layer 1: Video or Photo with Ken Burns effect */}
      {isVideo ? (
        <video
          className={`ken-burns-video ${photoLoaded ? 'loaded' : ''}`}
          style={{
            '--kb-start': currentScene.ken_burns?.start || 'scale(1.0) translate(0%, 0%)',
            '--kb-end': currentScene.ken_burns?.end || 'scale(1.05) translate(0%, 0%)',
            '--kb-duration': `${currentScene.ken_burns?.duration || 30}s`
          }}
          src={photoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <>
          {/* Gradient shows instantly, always behind the photo */}
          <div
            className="ken-burns-photo"
            style={{
              background: currentScene.photo_fallback_gradient,
              '--kb-start': currentScene.ken_burns.start,
              '--kb-end': currentScene.ken_burns.end,
              '--kb-duration': `${currentScene.ken_burns.duration}s`
            }}
          />
          {/* Photo fades in over the gradient once loaded */}
          <div
            className="ken-burns-photo"
            style={{
              backgroundImage: photoLoaded && photoUrl ? `url(${photoUrl})` : 'none',
              opacity: photoLoaded ? 1 : 0,
              transition: 'opacity 1.5s ease',
              '--kb-start': currentScene.ken_burns.start,
              '--kb-end': currentScene.ken_burns.end,
              '--kb-duration': `${currentScene.ken_burns.duration}s`
            }}
          />
        </>
      )}

      {/* Layer 2: Color grade overlay */}
      <div
        className="color-grade-overlay"
        style={{ background: currentScene.overlay_color }}
      />

      {/* Layer 3: Time-of-day atmospheric gradient */}
      <div className="time-gradient-overlay" style={{ background: timeGradient }} />

      {/* Layer 4: Particles (only in full mode) */}
      {intensity === 'full' && particlesInit && currentScene.particle_preset && (
        <div className="particles-layer">
          <Particles
            id="wallpaper-particles"
            options={PARTICLE_PRESETS[currentScene.particle_preset]}
            init={initParticles}
          />
        </div>
      )}

      {/* Layer 5: Vignette */}
      <div className="vignette-overlay" />

      {/* Photo credit */}
      <PhotoCredit scene={currentScene} />
    </div>
  );
}

function PhotoCredit({ scene }) {
  if (!scene || (!scene.credit && !scene.video_credit)) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 12,
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
        zIndex: 5,
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.05em',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        pointerEvents: 'none'
      }}
    >
      {scene.credit || scene.video_credit}
    </div>
  );
}
