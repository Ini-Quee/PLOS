/**
 * PLOS Cinematic Wallpaper - Scene Library
 * 40 professionally curated photographic scenes with motion design
 * Photos sourced from Picsum Photos (free, no API key required)
 */

const SCENE_LIBRARY = {
  // ═══ MORNING SCENES ═══
  morning_coffee_garden: {
    id: "morning_coffee_garden",
    label: "Coffee Garden Morning",
    emoji: "☕",
    photo_seed: 42,
    photo_fallback_gradient: "linear-gradient(135deg, #8B4513 0%, #D2691E 40%, #F4A460 70%, #FFDEAD 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["all"],
    particle_preset: "dust_motes",
    ken_burns: {
      start: "scale(1.05) translate(0%, 0%)",
      end: "scale(1.12) translate(-2%, -1%)",
      duration: 25
    },
    overlay_color: "rgba(180, 120, 60, 0.15)",
    description: "Warm barista morning, looking out to garden",
    mood: "cozy, motivated, warm",
    sound_keyword: "coffee_shop"
  },

  morning_ocean_sunrise: {
    id: "morning_ocean_sunrise",
    label: "Ocean Sunrise",
    emoji: "🌅",
    photo_seed: 15,
    photo_fallback_gradient: "linear-gradient(180deg, #FF6B35 0%, #FFB347 30%, #87CEEB 70%, #006994 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["all"],
    particle_preset: "sea_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.08) translate(1%, -0.5%)",
      duration: 30
    },
    overlay_color: "rgba(255, 107, 53, 0.1)",
    description: "Golden hour ocean, waves shimmering",
    mood: "energized, hopeful, awakened"
  },

  morning_mountain_mist: {
    id: "morning_mountain_mist",
    label: "Mountain Morning Mist",
    emoji: "⛰️",
    photo_seed: 87,
    photo_fallback_gradient: "linear-gradient(180deg, #BDC3C7 0%, #2C3E50 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["spring", "summer"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.04) translate(0%, 1%)",
      end: "scale(1.1) translate(0%, -1%)",
      duration: 28
    },
    overlay_color: "rgba(189, 195, 199, 0.15)",
    description: "Misty peaks, pine forest, serene morning",
    mood: "calm, focused, present"
  },

  // ═══ RAINY SCENES ═══
  rain_zen_garden: {
    id: "rain_zen_garden",
    label: "Zen Garden Rain",
    emoji: "🌧️",
    photo_url: "https://images.unsplash.com/photo-1753714054210-2c4c7b2c63fc",
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
    description: "Stone lantern in Japanese garden - zen, peaceful, traditional",
    mood: "cozy, meditative, calm",
    credit: "Niksa Leko (Unsplash)"
  },

  rain_temple_cherry: {
    id: "rain_temple_cherry",
    label: "Cherry Blossoms Temple",
    emoji: "🌸",
    photo_url: "https://images.unsplash.com/photo-1759604406026-173aedcc64da",
    photo_seed: 334,
    photo_fallback_gradient: "linear-gradient(135deg, #FFB7C5 0%, #4A6741 50%, #1a2a1a 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring"],
    particle_preset: "cherry_petals",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.02) translate(0%, -0.5%)",
      duration: 25
    },
    overlay_color: "rgba(52, 73, 94, 0.15)",
    description: "Close-up rain drops on glass with blurred background - calm, cozy vibes",
    mood: "cozy, focused, serene",
    video_credit: "Pixabay"
  },

  rain_city_street: {
    id: "rain_city_street",
    label: "City Street Rain",
    emoji: "🌃",
    video_url: "https://cdn.pixabay.com/video/2022/11/01/137209-768668856_large.mp4",
    photo_seed: 456,
    photo_fallback_gradient: "linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 50%, #0a0f1a 100%)",
    time_of_day: ["night", "blue_hour", "all"],
    season: ["rainy", "autumn", "winter"],
    particle_preset: null,
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0.5%, 0%)",
      duration: 28
    },
    overlay_color: "rgba(10, 10, 26, 0.2)",
    description: "Light rain on city street with reflections - no people, outdoor perspective",
    mood: "calm, urban, introspective",
    video_credit: "Pixabay"
  },

  rain_forest_path: {
    id: "rain_forest_path",
    label: "Forest Rain Path",
    emoji: "🌲",
    video_url: "https://cdn.pixabay.com/video/2021/06/27/79481-571116933_large.mp4",
    photo_seed: 550,
    photo_fallback_gradient: "linear-gradient(180deg, #1a3a1a 0%, #2d5a2d 40%, #1a4a2a 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring"],
    particle_preset: null,
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0%, 1%)",
      duration: 35
    },
    overlay_color: "rgba(26, 58, 26, 0.2)",
    description: "Gentle rain through green forest - calm nature atmosphere, no people",
    mood: "refreshed, peaceful, natural",
    video_credit: "Pixabay"
  },

  rain_building_view: {
    id: "rain_building_view",
    label: "Rain Building View",
    emoji: "🏢",
    video_url: "https://cdn.pixabay.com/video/2020/04/29/37594-415534414_large.mp4",
    photo_seed: 601,
    photo_fallback_gradient: "linear-gradient(180deg, #2C3E50 0%, #34495E 50%, #1a1a2e 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring", "autumn"],
    particle_preset: null,
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(-1%, 0%)",
      duration: 32
    },
    overlay_color: "rgba(44, 62, 80, 0.18)",
    description: "Rain on buildings, architectural view - calm urban rain, no people",
    mood: "cozy, contemplative, peaceful",
    video_credit: "Pixabay"
  },

  // ═══ SUNSET / GOLDEN HOUR SCENES ═══
  sunset_beach: {
    id: "sunset_beach",
    label: "Beach Sunset",
    emoji: "🏖️",
    photo_seed: 178,
    photo_fallback_gradient: "linear-gradient(180deg, #4A235A 0%, #C0392B 30%, #E67E22 60%, #F5A623 85%, #FFF3B0 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["all"],
    particle_preset: "golden_dust",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.08) translate(0%, -2%)",
      duration: 30
    },
    overlay_color: "rgba(245, 166, 35, 0.12)",
    description: "Golden ocean sunset, warm sand",
    mood: "grateful, accomplished, peaceful"
  },

  sunset_savanna: {
    id: "sunset_savanna",
    label: "African Savanna Sunset",
    emoji: "🦁",
    photo_seed: 290,
    photo_fallback_gradient: "linear-gradient(180deg, #1a0a05 0%, #7B241C 25%, #C0392B 45%, #E67E22 65%, #F5A623 85%, #FFF3B0 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["harmattan", "dry"],
    particle_preset: "harmattan_dust",
    ken_burns: {
      start: "scale(1.02) translate(0%, 0%)",
      end: "scale(1.08) translate(-1%, -1%)",
      duration: 28
    },
    overlay_color: "rgba(201, 146, 58, 0.15)",
    description: "West African savanna, acacia silhouettes",
    mood: "proud, grounded, roots"
  },

  // ═══ NIGHT SCENES ═══
  night_starfield: {
    id: "night_starfield",
    label: "Starry Night Sky",
    emoji: "✨",
    photo_seed: 512,
    photo_fallback_gradient: "linear-gradient(180deg, #020408 0%, #050D18 50%, #0D1B2A 100%)",
    time_of_day: ["night"],
    season: ["all"],
    particle_preset: "stars_twinkle",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0.5%, 0.5%)",
      duration: 40
    },
    overlay_color: "rgba(2, 4, 8, 0.2)",
    description: "Vast starfield, milky way",
    mood: "awe, clarity, perspective"
  },

  night_cabin_fire: {
    id: "night_cabin_fire",
    label: "Cozy Cabin Fireplace",
    emoji: "🔥",
    photo_seed: 67,
    photo_fallback_gradient: "linear-gradient(135deg, #1a0500 0%, #3d1100 40%, #7a2800 70%, #F5A623 100%)",
    time_of_day: ["night", "blue_hour"],
    season: ["winter", "harmattan"],
    particle_preset: "ember_glow",
    ken_burns: {
      start: "scale(1.03) translate(0%, 0%)",
      end: "scale(1.07) translate(-1%, -0.5%)",
      duration: 18
    },
    overlay_color: "rgba(245, 166, 35, 0.12)",
    description: "Warm fireplace, safe and cozy",
    mood: "safe, warm, reflective"
  },

  // ═══ SEASONAL SPECIALS ═══
  cherry_blossom_japan: {
    id: "cherry_blossom_japan",
    label: "Cherry Blossoms",
    emoji: "🌸",
    photo_seed: 23,
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #FFB7C5 50%, #FFC0CB 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring"],
    particle_preset: "cherry_petals",
    ken_burns: {
      start: "scale(1.04) translate(0%, 0%)",
      end: "scale(1.1) translate(1%, -1%)",
      duration: 25
    },
    overlay_color: "rgba(255, 183, 197, 0.1)",
    description: "Japanese cherry blossoms, petals falling",
    mood: "beautiful, transient, present"
  },

  winter_snow_pine: {
    id: "winter_snow_pine",
    label: "Snowy Pine Forest",
    emoji: "❄️",
    photo_seed: 145,
    photo_fallback_gradient: "linear-gradient(180deg, #D5E8F0 0%, #A8C8D8 40%, #2C3E50 100%)",
    time_of_day: ["morning", "midday", "golden_hour"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.02) translate(0%, 0%)",
      end: "scale(1.07) translate(-0.5%, 1%)",
      duration: 35
    },
    overlay_color: "rgba(174, 214, 241, 0.1)",
    description: "Silent snow-covered pine trees",
    mood: "peaceful, pure, still"
  },

  christmas_warmth: {
    id: "christmas_warmth",
    label: "Christmas Evening",
    emoji: "🎄",
    photo_seed: 389,
    photo_fallback_gradient: "linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #8B0000 70%, #C41E3A 100%)",
    time_of_day: ["night", "blue_hour"],
    season: ["winter"],
    particle_preset: "snowfall_with_bokeh",
    ken_burns: {
      start: "scale(1.04) translate(0%, 0%)",
      end: "scale(1.09) translate(-1%, -0.5%)",
      duration: 22
    },
    overlay_color: "rgba(196, 30, 58, 0.08)",
    description: "Christmas bokeh lights, cozy warmth",
    mood: "joyful, warm, grateful"
  },

  // ═══ LIFESTYLE / PRODUCTIVITY SCENES ═══
  study_window_rain: {
    id: "study_window_rain",
    label: "Study by Rain Window",
    emoji: "📚",
    photo_seed: 501,
    photo_fallback_gradient: "linear-gradient(135deg, #2C3E50 0%, #34495E 50%, #1a1a2e 100%)",
    time_of_day: ["morning", "midday", "golden_hour"],
    season: ["rainy", "autumn"],
    particle_preset: "window_rain_light",
    ken_burns: {
      start: "scale(1.03) translate(0%, 0%)",
      end: "scale(1.06) translate(-0.5%, -0.5%)",
      duration: 20
    },
    overlay_color: "rgba(44, 62, 80, 0.15)",
    description: "Focused study, rain on window",
    mood: "focused, scholarly, determined"
  },

  rooftop_city_morning: {
    id: "rooftop_city_morning",
    label: "Rooftop City Morning",
    emoji: "🏙️",
    photo_seed: 78,
    photo_fallback_gradient: "linear-gradient(180deg, #1B4F72 0%, #2E86C1 40%, #AED6F1 70%, #FEF9E7 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["all"],
    particle_preset: "city_mist",
    ken_burns: {
      start: "scale(1.04) translate(0%, 1%)",
      end: "scale(1.1) translate(0%, -1%)",
      duration: 28
    },
    overlay_color: "rgba(27, 79, 114, 0.1)",
    description: "City skyline, morning ambitious energy",
    mood: "ambitious, awake, ready"
  },

  meditation_zen_garden: {
    id: "meditation_zen_garden",
    label: "Zen Garden Peace",
    emoji: "🪷",
    photo_seed: 234,
    photo_fallback_gradient: "linear-gradient(135deg, #4A4A4A 0%, #7a7a6a 50%, #c8c8b0 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["spring", "summer"],
    particle_preset: "gentle_petals",
    ken_burns: {
      start: "scale(1.02) translate(0%, 0%)",
      end: "scale(1.07) translate(0.5%, 0.5%)",
      duration: 35
    },
    overlay_color: "rgba(74, 74, 74, 0.1)",
    description: "Zen garden, raked sand, tranquility",
    mood: "peaceful, mindful, centered"
  },

  // ═══ ADDITIONAL CURATED SCENES ═══
  autumn_forest_path: {
    id: "autumn_forest_path",
    label: "Autumn Forest Walk",
    emoji: "🍂",
    photo_seed: 650,
    photo_fallback_gradient: "linear-gradient(180deg, #8B4513 0%, #D2691E 40%, #F4A460 100%)",
    time_of_day: ["morning", "midday", "golden_hour"],
    season: ["autumn"],
    particle_preset: "falling_leaves",
    ken_burns: {
      start: "scale(1.03) translate(0%, 0%)",
      end: "scale(1.08) translate(0%, -1%)",
      duration: 26
    },
    overlay_color: "rgba(210, 105, 30, 0.12)",
    description: "Crisp autumn air, falling leaves",
    mood: "nostalgic, grounded, transitioning"
  },

  desert_dunes_sunset: {
    id: "desert_dunes_sunset",
    label: "Desert Dunes Sunset",
    emoji: "🏜️",
    photo_seed: 710,
    photo_fallback_gradient: "linear-gradient(180deg, #7B241C 0%, #E67E22 40%, #F5A623 70%, #FFDEAD 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["harmattan", "dry"],
    particle_preset: "harmattan_dust",
    ken_burns: {
      start: "scale(1.02) translate(0%, 0%)",
      end: "scale(1.07) translate(1%, -0.5%)",
      duration: 32
    },
    overlay_color: "rgba(230, 126, 34, 0.15)",
    description: "Sahara desert, endless golden dunes",
    mood: "vast, warm, timeless"
  },

  aurora_northern_lights: {
    id: "aurora_northern_lights",
    label: "Northern Lights",
    emoji: "🌌",
    photo_seed: 770,
    photo_fallback_gradient: "linear-gradient(180deg, #0a1628 0%, #0d3b2e 40%, #1a4a3a 100%)",
    time_of_day: ["night"],
    season: ["winter"],
    particle_preset: "stars_twinkle",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-0.5%, 0.5%)",
      duration: 38
    },
    overlay_color: "rgba(76, 175, 125, 0.1)",
    description: "Aurora borealis dancing in arctic sky",
    mood: "magical, wonder, inspired"
  },

  lavender_fields_provence: {
    id: "lavender_fields_provence",
    label: "Lavender Fields",
    emoji: "💜",
    photo_seed: 830,
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #9b59b6 50%, #8e44ad 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["spring", "summer"],
    particle_preset: "gentle_petals",
    ken_burns: {
      start: "scale(1.03) translate(0%, 0%)",
      end: "scale(1.09) translate(1%, -1%)",
      duration: 27
    },
    overlay_color: "rgba(155, 89, 182, 0.1)",
    description: "Purple lavender rows, French countryside",
    mood: "romantic, dreamy, elegant"
  },

  tropical_beach_palms: {
    id: "tropical_beach_palms",
    label: "Tropical Beach Paradise",
    emoji: "🌴",
    photo_seed: 880,
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #00BCD4 50%, #006994 100%)",
    time_of_day: ["morning", "midday"],
    season: ["dry", "summer"],
    particle_preset: "sea_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.06) translate(-1%, 0%)",
      duration: 29
    },
    overlay_color: "rgba(0, 188, 212, 0.08)",
    description: "Crystal clear waters, swaying palms",
    mood: "relaxed, vacation, carefree"
  },

  tokyo_cyberpunk_night: {
    id: "tokyo_cyberpunk_night",
    label: "Tokyo Neon Night",
    emoji: "🗼",
    photo_seed: 930,
    photo_fallback_gradient: "linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 40%, #ff0080 100%)",
    time_of_day: ["night", "blue_hour"],
    season: ["all"],
    particle_preset: "bokeh_city",
    ken_burns: {
      start: "scale(1.04) translate(0%, 0%)",
      end: "scale(1.09) translate(0.5%, -0.5%)",
      duration: 24
    },
    overlay_color: "rgba(255, 0, 128, 0.08)",
    description: "Vibrant Tokyo streets, neon glow",
    mood: "energetic, modern, alive"
  },

  scottish_highlands_mist: {
    id: "scottish_highlands_mist",
    label: "Scottish Highlands",
    emoji: "🏴󐁧󐁢󐁳󐁣󐁴󐁿",
    photo_seed: 980,
    photo_fallback_gradient: "linear-gradient(180deg, #7F8C8D 0%, #2C3E50 50%, #1a2a1a 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring", "autumn"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.03) translate(0%, 0%)",
      end: "scale(1.08) translate(-0.5%, 1%)",
      duration: 31
    },
    overlay_color: "rgba(127, 140, 141, 0.15)",
    description: "Moody highlands, ancient castles",
    mood: "epic, historical, contemplative"
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
    morning: ['dawn', 'morning'],
    rain: ['rainy'],
    night: ['night', 'blue_hour'],
    sunset: ['golden_hour', 'sunset'],
    seasonal: ['spring', 'summer', 'autumn', 'winter'],
    lifestyle: ['all']
  };

  const timeFilters = categoryMap[category];
  if (!timeFilters) return [];

  return Object.values(SCENE_LIBRARY).filter(scene => {
    if (category === 'rain') {
      return scene.season.includes('rainy') || scene.description.toLowerCase().includes('rain');
    }
    if (category === 'seasonal') {
      return scene.season.some(s => ['spring', 'summer', 'autumn', 'winter'].includes(s));
    }
    if (category === 'lifestyle') {
      return ['study', 'coffee', 'meditation', 'rooftop'].some(keyword =>
        scene.id.includes(keyword)
      );
    }
    return scene.time_of_day.some(tod => timeFilters.includes(tod));
  });
};
