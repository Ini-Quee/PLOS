/**
 * PLOS Cinematic Wallpaper - LOCAL Image Library
 * All images stored locally in /public/images/backgrounds/
 * No internet required - perfect for offline use!
 */

const SCENE_LIBRARY = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // SNOW SCENES - Winter Beauty
  // ═══════════════════════════════════════════════════════════════════════════════

  snow_sunset_trees: {
    id: "snow_sunset_trees",
    label: "Winter Sunset Forest",
    emoji: "🌄",
    photo_url: "/images/backgrounds/snow/snow-sunset-trees.jpg",
    photo_seed: 145,
    photo_fallback_gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFA726 30%, #D5E8F0 60%, #7a9aaa 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-1%, -0.5%)",
      duration: 30
    },
    overlay_color: "rgba(255, 107, 107, 0.08)",
    description: "Peaceful winter sunset with snowy trees - warm orange sky, serene",
    mood: "peaceful, warm, winter beauty",
    region: "Winter forest"
  },

  // Add more scenes as you add images!
  // Copy the template below for each new image:

  /*
  template_scene: {
    id: "unique_scene_id",
    label: "Scene Display Name",
    emoji: "🎨",
    photo_url: "/images/backgrounds/FOLDER/filename.jpg",
    photo_fallback_gradient: "linear-gradient(135deg, #COLOR1 0%, #COLOR2 50%, #COLOR3 100%)",
    time_of_day: ["morning", "midday", "golden_hour", "sunset", "blue_hour", "night", "all"],
    season: ["spring", "summer", "autumn", "winter", "rainy", "harmattan", "all"],
    particle_preset: "window_rain" or "snowfall" or "cherry_petals" or "falling_leaves" or null,
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-1%, -0.5%)",
      duration: 30
    },
    overlay_color: "rgba(44, 62, 80, 0.15)",
    description: "What this scene shows and the mood it creates",
    mood: "calm, peaceful, cozy",
    region: "Where this type of scene is from"
  },
  */

  // ═══════════════════════════════════════════════════════════════════════════════
  // RAIN SCENES - Placeholder (add your rain images here)
  // ═══════════════════════════════════════════════════════════════════════════════

  rain_example: {
    id: "rain_example",
    label: "Rain Scene Example",
    emoji: "🌧️",
    photo_url: "/images/backgrounds/rain/your-rain-image.jpg",
    photo_seed: 200,
    photo_fallback_gradient: "linear-gradient(135deg, #2C3E50 0%, #4A6741 50%, #1a2a1a 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring", "autumn"],
    particle_preset: "window_rain",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-0.5%, -0.5%)",
      duration: 30
    },
    overlay_color: "rgba(44, 62, 80, 0.15)",
    description: "Replace with your rain image description",
    mood: "cozy, rainy, peaceful",
    region: "Rain"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // FOREST SCENES - Placeholder
  // ═══════════════════════════════════════════════════════════════════════════════

  forest_example: {
    id: "forest_example",
    label: "Forest Scene Example",
    emoji: "🌲",
    photo_url: "/images/backgrounds/forest/your-forest-image.jpg",
    photo_seed: 334,
    photo_fallback_gradient: "linear-gradient(180deg, #2d5a2d 0%, #1a4a2a 50%, #0a2a1a 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring", "summer", "autumn"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0%, -1%)",
      duration: 35
    },
    overlay_color: "rgba(45, 90, 45, 0.15)",
    description: "Replace with your forest image description",
    mood: "peaceful, natural, fresh",
    region: "Forest"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MOUNTAIN SCENES - Placeholder
  // ═══════════════════════════════════════════════════════════════════════════════

  mountain_example: {
    id: "mountain_example",
    label: "Mountain Scene Example",
    emoji: "⛰️",
    photo_url: "/images/backgrounds/mountain/your-mountain-image.jpg",
    photo_seed: 87,
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #5F9EA0 50%, #2C3E50 100%)",
    time_of_day: ["morning", "midday"],
    season: ["all"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0%, -0.5%)",
      duration: 36
    },
    overlay_color: "rgba(95, 158, 160, 0.1)",
    description: "Replace with your mountain image description",
    mood: "majestic, peaceful, expansive",
    region: "Mountains"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // OCEAN/BEACH SCENES - Placeholder
  // ═══════════════════════════════════════════════════════════════════════════════

  ocean_example: {
    id: "ocean_example",
    label: "Ocean Scene Example",
    emoji: "🌊",
    photo_url: "/images/backgrounds/ocean/your-ocean-image.jpg",
    photo_seed: 15,
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #00BCD4 50%, #006994 100%)",
    time_of_day: ["morning", "midday"],
    season: ["summer", "dry"],
    particle_preset: "sea_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(-0.5%, 0%)",
      duration: 32
    },
    overlay_color: "rgba(0, 188, 212, 0.08)",
    description: "Replace with your ocean image description",
    mood: "calm, tropical, peaceful",
    region: "Ocean"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DESERT SCENES - Placeholder
  // ═══════════════════════════════════════════════════════════════════════════════

  desert_example: {
    id: "desert_example",
    label: "Desert Scene Example",
    emoji: "🏜️",
    photo_url: "/images/backgrounds/desert/your-desert-image.jpg",
    photo_seed: 710,
    photo_fallback_gradient: "linear-gradient(180deg, #F5A623 0%, #E67E22 50%, #D35400 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["harmattan", "dry", "summer"],
    particle_preset: "harmattan_dust",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-1%, -0.5%)",
      duration: 32
    },
    overlay_color: "rgba(245, 166, 35, 0.12)",
    description: "Replace with your desert image description",
    mood: "warm, vast, peaceful",
    region: "Desert"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUNSET/SKY SCENES - Placeholder
  // ═══════════════════════════════════════════════════════════════════════════════

  sunset_example: {
    id: "sunset_example",
    label: "Sunset Scene Example",
    emoji: "🌅",
    photo_url: "/images/backgrounds/sunset/your-sunset-image.jpg",
    photo_seed: 178,
    photo_fallback_gradient: "linear-gradient(180deg, #4A235A 0%, #C0392B 30%, #E67E22 60%, #F5A623 85%, #FFF3B0 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["all"],
    particle_preset: "golden_dust",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0%, -0.5%)",
      duration: 30
    },
    overlay_color: "rgba(192, 57, 43, 0.12)",
    description: "Replace with your sunset image description",
    mood: "warm, peaceful, inspiring",
    region: "Sky"
  }
};

export default SCENE_LIBRARY;

/**
 * Get scenes matching current time and season
 */
export const getScenesByTimeAndSeason = (timeOfDay, season) => {
  return Object.values(SCENE_LIBRARY).filter(scene =>
    (scene.time_of_day.includes(timeOfDay) || scene.time_of_day.includes("all")) &&
    (scene.season.includes(season) || scene.season.includes("all"))
  );
};

/**
 * Get scene by ID
 */
export const getSceneById = (sceneId) => {
  return SCENE_LIBRARY[sceneId] || Object.values(SCENE_LIBRARY)[0];
};

/**
 * Get all scenes
 */
export const getAllScenes = () => {
  return Object.values(SCENE_LIBRARY);
};

/**
 * Get scenes by category
 */
export const getScenesByCategory = (category) => {
  const categoryMap = {
    rain: (scene) => scene.season.includes('rainy') || scene.id.includes('rain'),
    snow: (scene) => scene.season.includes('winter') && scene.id.includes('snow'),
    spring: (scene) => scene.season.includes('spring'),
    summer: (scene) => scene.season.includes('summer') || scene.season.includes('dry'),
    autumn: (scene) => scene.season.includes('autumn'),
    mountain: (scene) => scene.id.includes('mountain'),
    desert: (scene) => scene.id.includes('desert'),
    ocean: (scene) => scene.id.includes('ocean') || scene.id.includes('beach'),
    forest: (scene) => scene.id.includes('forest'),
    night: (scene) => scene.time_of_day.includes('night'),
    sunset: (scene) => scene.time_of_day.includes('sunset') || scene.time_of_day.includes('golden_hour')
  };

  const filter = categoryMap[category];
  if (!filter) return [];

  return Object.values(SCENE_LIBRARY).filter(filter);
};

/**
 * Get scenes by mood
 */
export const getScenesByMood = (mood) => {
  return Object.values(SCENE_LIBRARY).filter(scene =>
    scene.mood && scene.mood.toLowerCase().includes(mood.toLowerCase())
  );
};

/**
 * Get scenes by region
 */
export const getScenesByRegion = (region) => {
  return Object.values(SCENE_LIBRARY).filter(scene =>
    scene.region && scene.region.toLowerCase().includes(region.toLowerCase())
  );
};
