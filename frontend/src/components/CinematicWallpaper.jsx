import { useState, useEffect, useCallback, useMemo } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { getScenesByTimeAndSeason, getSceneById, getAllScenes } from '../lib/wallpaperScenes';
import PARTICLE_PRESETS from '../lib/particlePresets';
import './CinematicWallpaper.css';

/**
 * PLOS Cinematic Wallpaper System
 * Professional photo-based animated background with particles
 * Features: Ken Burns effect, time/season awareness, Unsplash photos
 */
export default function CinematicWallpaper() {
  const [currentScene, setCurrentScene] = useState(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [intensity, setIntensity] = useState('full');
  const [particlesInit, setParticlesInit] = useState(false);

  // Detect performance mode
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

  // Get current time of day
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

  // Get season based on region
  const getSeason = useCallback(() => {
    const month = new Date().getMonth() + 1; // 1-12
    const offset = -(new Date().getTimezoneOffset() / 60);

    // West Africa (UTC+0 to +1)
    if (offset >= 0 && offset <= 1) {
      return month >= 4 && month <= 10 ? 'rainy' : 'harmattan';
    }

    // Northern Hemisphere (Europe/USA)
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }, []);

  // Get time gradient overlay based on time of day
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

  // Initialize tsParticles
  const initParticles = useCallback(async (engine) => {
    await loadSlim(engine);
    setParticlesInit(true);
    console.log('✨ Particles engine initialized');
  }, []);

  // Load scene
  useEffect(() => {
    const loadScene = () => {
      // Check for manual scene selection
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
        console.log('🎬 Manual scene selected:', scene.label);
      } else {
        // Auto-select based on time and season
        const timeOfDay = getTimeOfDay();
        const season = getSeason();
        const matchingScenes = getScenesByTimeAndSeason(timeOfDay, season);
        scene = matchingScenes[0] || getAllScenes()[0];
        console.log(`🕐 Auto-selected scene for ${timeOfDay}/${season}:`, scene.label);
      }

      setCurrentScene(scene);

      // Build Unsplash URL
      const url = `https://source.unsplash.com/1920x1080/?${scene.photo_query}`;
      setPhotoUrl(url);
      setPhotoLoaded(false);

      // Preload photo
      const img = new Image();
      img.onload = () => {
        setPhotoLoaded(true);
        console.log('📸 Photo loaded:', scene.label);
      };
      img.onerror = () => {
        console.warn('⚠️ Photo failed to load, using fallback gradient');
        setPhotoLoaded(true); // Still set to true to show fallback
      };
      img.src = url;
    };

    loadScene();

    // Listen for scene changes
    const handleSceneChange = () => {
      console.log('🔄 Scene change detected');
      loadScene();
    };

    window.addEventListener('wallpaper-scene-changed', handleSceneChange);

    return () => {
      window.removeEventListener('wallpaper-scene-changed', handleSceneChange);
    };
  }, [getTimeOfDay, getSeason, performanceMode]);

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

    // Check battery
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

  // Minimal mode: only gradient
  if (intensity === 'minimal') {
    return (
      <div className="cinematic-root minimal-mode">
        <div
          className="fallback-gradient"
          style={{ background: currentScene.photo_fallback_gradient }}
        />
        <div className="vignette-overlay" />
        <PhotoCredit />
      </div>
    );
  }

  return (
    <div className="cinematic-root" data-intensity={intensity}>
      {/* Layer 1: Photo with Ken Burns effect */}
      <div
        className={`ken-burns-photo ${photoLoaded ? 'loaded' : ''}`}
        style={{
          backgroundImage: photoLoaded ? `url(${photoUrl})` : 'none',
          background: !photoLoaded ? currentScene.photo_fallback_gradient : undefined,
          '--kb-start': currentScene.ken_burns.start,
          '--kb-end': currentScene.ken_burns.end,
          '--kb-duration': `${currentScene.ken_burns.duration}s`
        }}
      />

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
      <PhotoCredit />
    </div>
  );
}

/**
 * Unsplash attribution (required by free tier)
 */
function PhotoCredit() {
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
      Photo: Unsplash
    </div>
  );
}
