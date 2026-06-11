import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCENES } from '../lib/atmos';
import './WallpaperPicker.css';

const SCENE_LIST = Object.values(SCENES);

const CATEGORIES = [
  { id: 'suggested', label: 'Perfect for Now', icon: '✨' },
  { id: 'morning',   label: 'Morning',         icon: '🌅' },
  { id: 'rain',      label: 'Rain',            icon: '🌧️' },
  { id: 'night',     label: 'Night',           icon: '🌙' },
  { id: 'sunset',    label: 'Sunset',          icon: '🌇' },
  { id: 'seasonal',  label: 'Seasonal',        icon: '🍂' },
  { id: 'lifestyle', label: 'Lifestyle',       icon: '☕' },
];

const CATEGORY_FILTER = {
  morning:   s => s.time?.some(t => ['dawn','morning'].includes(t)),
  rain:      s => s.id.includes('rain') || s.particles === 'rain',
  night:     s => s.time?.some(t => ['night','blue_hour'].includes(t)),
  sunset:    s => s.time?.some(t => ['golden_hour','sunset'].includes(t)),
  seasonal:  s => ['cherry_blossoms','snowy_forest','autumn_forest'].includes(s.id),
  lifestyle: s => ['cozy_library','morning_coffee'].includes(s.id),
};

const SCENE_ICONS = {
  morning_coffee:        '☕',
  morning_mountain_mist: '⛰️',
  rain_window:           '🌧️',
  tropical_rain_forest:  '🌲',
  cozy_library:          '📚',
  harmattan_sunset:      '🌅',
  beach_sunset:          '🏖️',
  night_starfield:       '✨',
  fireplace_cabin:       '🔥',
  cherry_blossoms:       '🌸',
  snowy_forest:          '❄️',
  nigeria_rain_city:     '🌃',
  autumn_forest:         '🍂',
};

export default function WallpaperPicker({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('suggested');
  const [currentSceneId, setCurrentSceneId] = useState('auto');
  const [intensity, setIntensity] = useState('minimal');

  useEffect(() => {
    const savedScene = localStorage.getItem('plos_atmos_scene') || 'auto';
    const savedIntensity = localStorage.getItem('plos_wallpaper_intensity') || 'minimal';
    setCurrentSceneId(savedScene);
    setIntensity(savedIntensity);
  }, [isOpen]);

  const getSuggestedScenes = () => {
    const hour = new Date().getHours();
    let timeFilter;
    if (hour >= 5 && hour < 11)       timeFilter = s => s.time?.some(t => ['dawn','morning'].includes(t));
    else if (hour >= 11 && hour < 15)  timeFilter = s => s.time?.includes('midday') || s.time?.includes('all');
    else if (hour >= 15 && hour < 20)  timeFilter = s => s.time?.some(t => ['golden_hour','sunset'].includes(t));
    else                               timeFilter = s => s.time?.some(t => ['night','blue_hour'].includes(t));
    return SCENE_LIST.filter(timeFilter).slice(0, 6);
  };

  const getScenes = () => {
    if (selectedCategory === 'suggested') return getSuggestedScenes();
    const filter = CATEGORY_FILTER[selectedCategory];
    return filter ? SCENE_LIST.filter(filter) : SCENE_LIST;
  };

  const handleSceneSelect = (sceneId) => {
    if (sceneId === 'auto') {
      localStorage.removeItem('plos_atmos_scene');
      localStorage.removeItem('plos_custom_scene');
    } else if (sceneId === 'plain') {
      localStorage.setItem('plos_atmos_scene', 'plain');
      localStorage.removeItem('plos_custom_scene');
    } else {
      localStorage.setItem('plos_atmos_scene', sceneId);
    }
    setCurrentSceneId(sceneId);
    window.dispatchEvent(new Event('atmos-scene-changed'));

    const label = sceneId === 'auto' ? 'Auto (Smart)'
      : sceneId === 'plain' ? 'Plain background'
      : SCENES[sceneId]?.label || sceneId;
    showToast(`World changed to ${label}`);

    setTimeout(() => onClose(), 800);
  };

  const handleIntensityChange = (newIntensity) => {
    localStorage.setItem('plos_wallpaper_intensity', newIntensity);
    setIntensity(newIntensity);
    window.dispatchEvent(new Event('atmos-scene-changed'));
  };

  const scenes = getScenes();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="wallpaper-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="wallpaper-picker-modal"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="picker-header">
              <h2 className="picker-title">Choose Your World</h2>
              <button className="picker-close" onClick={onClose}>✕</button>
            </div>

            <div className="picker-categories">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-label">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="picker-scenes">
              {selectedCategory === 'suggested' && (
                <SceneCard
                  scene={{ id: 'auto', label: 'Auto (Smart)', description: 'Matches time & season automatically' }}
                  icon="🤖"
                  isActive={currentSceneId === 'auto'}
                  onSelect={handleSceneSelect}
                  thumbnailUrl={null}
                />
              )}

              {selectedCategory === 'suggested' && (
                <SceneCard
                  scene={{ id: 'plain', label: 'Plain', description: 'No wallpaper, calm solid background' }}
                  icon="⬛"
                  isActive={currentSceneId === 'plain'}
                  onSelect={handleSceneSelect}
                  thumbnailUrl={null}
                />
              )}

              {scenes.map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  icon={SCENE_ICONS[scene.id] || '🌄'}
                  isActive={currentSceneId === scene.id}
                  onSelect={handleSceneSelect}
                  thumbnailUrl={scene.photo}
                />
              ))}
            </div>

            <div className="picker-footer">
              <div className="intensity-control">
                <label className="intensity-label">Motion Intensity</label>
                <div className="intensity-buttons">
                  {['minimal', 'reduced', 'full'].map(level => (
                    <button
                      key={level}
                      className={`intensity-btn ${intensity === level ? 'active' : ''}`}
                      onClick={() => handleIntensityChange(level)}
                    >
                      {level === 'minimal' && '🔇 Minimal'}
                      {level === 'reduced' && '🔉 Balanced'}
                      {level === 'full' && '🔊 Cinematic'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SceneCard({ scene, icon, isActive, onSelect, thumbnailUrl }) {
  return (
    <motion.div
      className={`scene-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(scene.id)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="scene-thumbnail"
        style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : {}}
      >
        {isActive && (
          <div className="active-indicator">
            <span className="checkmark">✓</span>
            <span className="active-label">Playing</span>
          </div>
        )}
      </div>
      <div className="scene-info">
        <span className="scene-emoji">{icon}</span>
        <span className="scene-label">{scene.label}</span>
      </div>
      <div className="scene-description">{scene.description}</div>
    </motion.div>
  );
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'wallpaper-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2500);
}
