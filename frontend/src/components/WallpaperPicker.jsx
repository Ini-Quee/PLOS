import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllScenes, getScenesByCategory, getScenesByTimeAndSeason } from '../lib/wallpaperScenes';
import './WallpaperPicker.css';

/**
 * PLOS Wallpaper Scene Picker
 * Beautiful modal for selecting cinematic backgrounds
 */
export default function WallpaperPicker({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('suggested');
  const [currentSceneId, setCurrentSceneId] = useState('auto');
  const [intensity, setIntensity] = useState('full');

  useEffect(() => {
    const savedScene = localStorage.getItem('plos_wallpaper_scene') || 'auto';
    const savedIntensity = localStorage.getItem('plos_wallpaper_intensity') || 'full';
    setCurrentSceneId(savedScene);
    setIntensity(savedIntensity);
  }, [isOpen]);

  const categories = [
    { id: 'suggested', label: 'Perfect for Now', icon: '✨' },
    { id: 'morning', label: 'Morning', icon: '🌅' },
    { id: 'rain', label: 'Rain', icon: '🌧️' },
    { id: 'night', label: 'Night', icon: '🌙' },
    { id: 'sunset', label: 'Sunset', icon: '🌇' },
    { id: 'seasonal', label: 'Seasonal', icon: '🍂' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '☕' }
  ];

  const getSuggestedScenes = () => {
    const hour = new Date().getHours();
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 10) timeOfDay = 'dawn';
    else if (hour >= 10 && hour < 15) timeOfDay = 'midday';
    else if (hour >= 15 && hour < 19) timeOfDay = 'golden_hour';

    const month = new Date().getMonth() + 1;
    let season = 'all';
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else if (month === 12 || month <= 2) season = 'winter';

    return getScenesByTimeAndSeason(timeOfDay, season).slice(0, 6);
  };

  const getScenes = () => {
    if (selectedCategory === 'suggested') {
      return getSuggestedScenes();
    }
    return getScenesByCategory(selectedCategory);
  };

  const handleSceneSelect = (sceneId) => {
    localStorage.setItem('plos_wallpaper_scene', sceneId);
    setCurrentSceneId(sceneId);

    // Dispatch event to update wallpaper
    window.dispatchEvent(new Event('wallpaper-scene-changed'));

    // Show toast
    const scene = getAllScenes().find(s => s.id === sceneId);
    if (scene) {
      showToast(`World changed to ${scene.label} ${scene.emoji}`);
    }

    // Close after brief delay
    setTimeout(() => onClose(), 800);
  };

  const handleIntensityChange = (newIntensity) => {
    localStorage.setItem('plos_wallpaper_intensity', newIntensity);
    setIntensity(newIntensity);
    window.dispatchEvent(new Event('wallpaper-scene-changed'));
  };

  const scenes = getScenes();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="wallpaper-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="wallpaper-picker-modal"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="picker-header">
              <h2 className="picker-title">Choose Your World</h2>
              <button className="picker-close" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* Category tabs */}
            <div className="picker-categories">
              {categories.map(cat => (
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

            {/* Scene grid */}
            <div className="picker-scenes">
              {/* Auto option */}
              {selectedCategory === 'suggested' && (
                <SceneCard
                  scene={{
                    id: 'auto',
                    label: 'Auto (Smart)',
                    emoji: '🤖',
                    description: 'Automatically matches time & season',
                    photo_query: 'nature,beautiful,peaceful'
                  }}
                  isActive={currentSceneId === 'auto'}
                  onSelect={handleSceneSelect}
                />
              )}

              {scenes.map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  isActive={currentSceneId === scene.id}
                  onSelect={handleSceneSelect}
                />
              ))}
            </div>

            {/* Bottom controls */}
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

/**
 * Individual scene card
 */
function SceneCard({ scene, isActive, onSelect }) {
  const thumbnailUrl = scene.id === 'auto'
    ? 'https://source.unsplash.com/400x300/?nature,peaceful'
    : `https://source.unsplash.com/400x300/?${scene.photo_query}`;

  return (
    <motion.div
      className={`scene-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(scene.id)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="scene-thumbnail"
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      >
        {isActive && (
          <div className="active-indicator">
            <span className="checkmark">✓</span>
            <span className="active-label">Playing</span>
          </div>
        )}
      </div>
      <div className="scene-info">
        <span className="scene-emoji">{scene.emoji}</span>
        <span className="scene-label">{scene.label}</span>
      </div>
      <div className="scene-description">{scene.description}</div>
    </motion.div>
  );
}

/**
 * Toast notification
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'wallpaper-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2500);
}
