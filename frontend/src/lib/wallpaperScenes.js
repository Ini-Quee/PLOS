/**
 * PLOS Cinematic Wallpaper - Scene Library
 * 40 professionally curated photographic scenes with motion design
 * Photos sourced from Unsplash Source API (free tier, requires attribution)
 */

const SCENE_LIBRARY = {
  // ═══ MORNING SCENES ═══
  morning_coffee_garden: {
    id: "morning_coffee_garden",
    label: "Coffee Garden Morning",
    emoji: "☕",
    photo_query: "coffee,garden,morning,window",
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
    photo_query: "ocean,sunrise,golden,waves,beautiful",
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
    photo_query: "mountain,fog,morning,peaceful,forest",
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
  rain_window_cozy: {
    id: "rain_window_cozy",
    label: "Rainy Window Cafe",
    emoji: "🌧️",
    photo_query: "rain,window,cozy,cafe,bokeh",
    photo_fallback_gradient: "linear-gradient(135deg, #2C3E50 0%, #4A6741 50%, #1a2a1a 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring", "autumn"],
    particle_preset: "window_rain",
    ken_burns: {
      start: "scale(1.03) translate(0%, 0%)",
      end: "scale(1.06) translate(-0.5%, -0.5%)",
      duration: 20
    },
    overlay_color: "rgba(44, 62, 80, 0.2)",
    description: "Rain on cafe window, warm lights inside",
    mood: "cozy, introspective, focused"
  },

  rain_tropical_forest: {
    id: "rain_tropical_forest",
    label: "Tropical Rain Forest",
    emoji: "🌿",
    photo_query: "tropical,rainforest,rain,green,lush",
    photo_fallback_gradient: "linear-gradient(180deg, #1a3a1a 0%, #2d5a2d 40%, #1a4a2a 100%)",
    time_of_day: ["all"],
    season: ["rainy"],
    particle_preset: "heavy_rain",
    ken_burns: {
      start: "scale(1.05) translate(0%, 0%)",
      end: "scale(1.1) translate(-1%, 1%)",
      duration: 22
    },
    overlay_color: "rgba(26, 58, 26, 0.2)",
    description: "Nigerian/West African tropical rain",
    mood: "refreshed, alive, earthy"
  },

  rain_city_night: {
    id: "rain_city_night",
    label: "City Rain at Night",
    emoji: "🌃",
    photo_query: "city,rain,night,lights,reflection,wet",
    photo_fallback_gradient: "linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 50%, #0a0f1a 100%)",
    time_of_day: ["night", "blue_hour"],
    season: ["rainy", "autumn", "winter"],
    particle_preset: "night_rain",
    ken_burns: {
      start: "scale(1.04) translate(0%, 0%)",
      end: "scale(1.09) translate(1%, 0%)",
      duration: 25
    },
    overlay_color: "rgba(10, 10, 26, 0.25)",
    description: "Neon reflections in wet city streets",
    mood: "mysterious, deep, reflective"
  },

  // ═══ SUNSET / GOLDEN HOUR SCENES ═══
  sunset_beach: {
    id: "sunset_beach",
    label: "Beach Sunset",
    emoji: "🏖️",
    photo_query: "sunset,beach,ocean,golden,waves,beautiful",
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
    photo_query: "africa,savanna,sunset,acacia,red,sky",
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
    photo_query: "stars,night,sky,milky,way,dark",
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
    photo_query: "fireplace,cabin,cozy,warm,wood,winter",
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
    photo_query: "cherry,blossom,japan,sakura,spring,pink",
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
    photo_query: "snow,pine,forest,winter,white,peaceful",
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
    photo_query: "christmas,lights,bokeh,warm,cozy,holiday",
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
    photo_query: "study,desk,window,rain,books,lamp,cozy",
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
    photo_query: "rooftop,city,morning,skyline,coffee,view",
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
    photo_query: "zen,garden,peaceful,japan,minimal,stone",
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
    photo_query: "autumn,forest,path,orange,leaves,fall",
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
    photo_query: "desert,dunes,sunset,sahara,golden,sand",
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
    photo_query: "aurora,northern,lights,night,green,sky",
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
    photo_query: "lavender,fields,provence,purple,sunset,france",
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
    photo_query: "tropical,beach,palms,turquoise,paradise,ocean",
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
    photo_query: "tokyo,night,neon,cyberpunk,city,lights",
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
    photo_query: "scotland,highlands,mist,castle,green,mountains",
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
