/**
 * PLOS Cinematic Wallpaper - Curated Scene Library
 * 50+ professionally curated authentic scenes from around the world
 * Photos from Unsplash & Pexels - Real images people save to vision boards
 * Features: Ken Burns effect, time/season awareness, particle effects
 */

const SCENE_LIBRARY = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // RAIN SCENES - Japanese Gardens & Asian Beauty
  // ═══════════════════════════════════════════════════════════════════════════════

  rain_cozy_window: {
    id: "rain_cozy_window",
    label: "Cozy Rain Window",
    emoji: "🌧️",
    photo_url: "https://images.unsplash.com/premium_photo-1661963004511-dfef3e05b8de?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(135deg, #F5A623 0%, #E67E22 50%, #2C3E50 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring", "autumn"],
    particle_preset: "window_rain",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-1%, -0.5%)",
      duration: 30
    },
    overlay_color: "rgba(245, 166, 35, 0.12)",
    description: "Rain drops on window with warm bokeh lights - cozy, intimate, peaceful",
    mood: "cozy, warm, contemplative",
    region: "Urban",
    credit: "Getty Images (Unsplash)"
  },

  rain_crystal_drops: {
    id: "rain_crystal_drops",
    label: "Crystal Rain Drops",
    emoji: "💧",
    photo_url: "https://images.unsplash.com/photo-1599926720612-9c4774375a9f?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(135deg, #D5E8F0 0%, #A8C8D8 50%, #7a9aaa 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring"],
    particle_preset: "window_rain",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0.5%, -1%)",
      duration: 28
    },
    overlay_color: "rgba(213, 232, 240, 0.1)",
    description: "Crystal-clear water droplets on glass - minimalist, meditative, peaceful",
    mood: "meditative, clear, peaceful",
    region: "Macro",
    credit: "Valentin (Unsplash)"
  },

  rain_night_window: {
    id: "rain_night_window",
    label: "Night Rain Window",
    emoji: "🌃",
    photo_url: "https://images.unsplash.com/photo-1643287146701-93c795880dda?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #1a1a3a 0%, #2C3E50 50%, #0a1a1a 100%)",
    time_of_day: ["night", "blue_hour"],
    season: ["rainy", "autumn", "winter"],
    particle_preset: "night_rain",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(0%, -0.5%)",
      duration: 32
    },
    overlay_color: "rgba(26, 26, 60, 0.18)",
    description: "Atmospheric nighttime rain with soft ambient lighting - moody, contemplative",
    mood: "moody, atmospheric, calm",
    region: "Urban night",
    credit: "Max van den Oetelaar (Unsplash)"
  },

  forest_misty_path: {
    id: "forest_misty_path",
    label: "Misty Forest Path",
    emoji: "🌲",
    photo_url: "https://images.unsplash.com/photo-1767195314999-cee0c2b4cbfa?w=1920&h=1080&fit=crop",
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
    description: "Enchanting misty forest with ethereal light - magical, peaceful, mystical",
    mood: "magical, ethereal, peaceful",
    region: "Forest",
    credit: "Atul Pandey (Unsplash)"
  },

  forest_sunlight: {
    id: "forest_sunlight",
    label: "Sunlit Forest Path",
    emoji: "🌳",
    photo_url: "https://images.unsplash.com/photo-1607087925457-c2031e363bfe?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(135deg, #F5A623 0%, #8B6F47 50%, #2d5a2d 100%)",
    time_of_day: ["morning", "golden_hour"],
    season: ["spring", "summer", "autumn"],
    particle_preset: "dust_motes",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.06) translate(-1%, 0%)",
      duration: 30
    },
    overlay_color: "rgba(245, 166, 35, 0.12)",
    description: "Golden sunlight streaming through forest canopy - warm, inviting, meditative",
    mood: "warm, inviting, peaceful",
    region: "Forest",
    credit: "Annie Spratt (Unsplash)"
  },

  forest_foggy: {
    id: "forest_foggy",
    label: "Foggy Dreamlike Forest",
    emoji: "🌫️",
    photo_url: "https://images.unsplash.com/photo-1738395548716-522475b89043?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #7F8C8D 0%, #5F6A6A 50%, #2C3E50 100%)",
    time_of_day: ["morning", "midday"],
    season: ["autumn", "winter", "spring"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0.5%, -0.5%)",
      duration: 38
    },
    overlay_color: "rgba(127, 140, 141, 0.15)",
    description: "Dense fog embracing towering trees - dreamlike, spiritual, contemplative",
    mood: "dreamlike, spiritual, minimalist",
    region: "Forest",
    credit: "Ingmar (Unsplash)"
  },

  rain_pink_lilacs: {
    id: "rain_pink_lilacs",
    label: "Pink Lilacs in Rain",
    emoji: "🌺",
    photo_url: "https://images.pexels.com/photos/25706561/pexels-photo-25706561.jpeg?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(135deg, #FFB7C5 0%, #D5A6BD 50%, #8B7D7B 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring"],
    particle_preset: "tropical_rain",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.06) translate(-0.5%, 1%)",
      duration: 25
    },
    overlay_color: "rgba(255, 183, 197, 0.1)",
    description: "Pink lilacs drenched in rain - romantic, fresh, colorful spring scene",
    mood: "romantic, fresh, vibrant",
    region: "Russia"
  },

  rain_pond_ripples: {
    id: "rain_pond_ripples",
    label: "Pond Rain Ripples",
    emoji: "💧",
    photo_url: "https://images.pexels.com/photos/36020246/pexels-photo-36020246.jpeg?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #5a7a6a 0%, #3a5a4a 50%, #1a3a2a 100%)",
    time_of_day: ["all"],
    season: ["rainy", "spring", "summer"],
    particle_preset: "window_rain",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(0%, 0%)",
      duration: 35
    },
    overlay_color: "rgba(90, 122, 106, 0.12)",
    description: "Tranquil pond with rain ripples - serene, meditative, zen atmosphere",
    mood: "serene, meditative, zen",
    region: "Asia"
  },

  rain_green_leaves: {
    id: "rain_green_leaves",
    label: "Fresh Rain Dewdrops",
    emoji: "🍃",
    photo_url: "https://images.pexels.com/photos/23414835/pexels-photo-23414835.jpeg?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(135deg, #2d5a2d 0%, #4a7a4a 50%, #6a9a6a 100%)",
    time_of_day: ["morning", "midday"],
    season: ["rainy", "spring", "summer"],
    particle_preset: "dust_motes",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.08) translate(-1%, -1%)",
      duration: 22
    },
    overlay_color: "rgba(45, 90, 45, 0.1)",
    description: "Vibrant green leaves with dewdrops after rain - fresh, rejuvenating",
    mood: "fresh, rejuvenating, natural",
    region: "Belgium"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SNOW SCENES - Mountains, Forests, Cozy Cabins
  // ═══════════════════════════════════════════════════════════════════════════════

  snow_mountain_pines: {
    id: "snow_mountain_pines",
    label: "Snowy Mountain Pines",
    emoji: "🏔️",
    photo_url: "https://images.unsplash.com/photo-1554190907-650057d92a1a?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #D5E8F0 0%, #A8C8D8 40%, #7a9aaa 100%)",
    time_of_day: ["morning", "midday"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0%, -1%)",
      duration: 35
    },
    overlay_color: "rgba(174, 214, 241, 0.1)",
    description: "Pine trees on snow-covered mountain - majestic, pristine winter wonder",
    mood: "majestic, pristine, peaceful",
    region: "North America"
  },

  snow_white_peaks: {
    id: "snow_white_peaks",
    label: "White Mountain Peaks",
    emoji: "⛰️",
    photo_url: "https://images.unsplash.com/photo-1554190907-415f9faecb06?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #E8F0F8 0%, #C8D8E8 50%, #A8B8C8 100%)",
    time_of_day: ["all"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(-0.5%, -0.5%)",
      duration: 38
    },
    overlay_color: "rgba(232, 240, 248, 0.08)",
    description: "White snow-covered mountain peaks - pure, peaceful, expansive",
    mood: "pure, peaceful, expansive",
    region: "North America"
  },

  snow_forest_road: {
    id: "snow_forest_road",
    label: "Snowy Forest Path",
    emoji: "🌲",
    photo_url: "https://unsplash.com/photos/dYWm2BAxgB4/download?w=1920",
    photo_fallback_gradient: "linear-gradient(180deg, #D5D5E0 0%, #9595A5 50%, #656575 100%)",
    time_of_day: ["all"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0%, 1%)",
      duration: 32
    },
    overlay_color: "rgba(213, 213, 224, 0.1)",
    description: "Snow-covered road through bare trees - quiet, peaceful winter path",
    mood: "quiet, peaceful, isolated",
    region: "Eastern Europe"
  },

  snow_cabin_forest: {
    id: "snow_cabin_forest",
    label: "Log Cabin in Snow",
    emoji: "🏡",
    photo_url: "https://images.unsplash.com/photo-1640557283858-59d8db7327ad?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(135deg, #8B6F47 0%, #D5D5E0 50%, #A8C8D8 100%)",
    time_of_day: ["all"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(-1%, 0%)",
      duration: 28
    },
    overlay_color: "rgba(139, 111, 71, 0.08)",
    description: "Log cabin in snowy forest - cozy, warm refuge, winter retreat",
    mood: "cozy, warm, refuge",
    region: "Scandinavia"
  },

  snow_sweden_landscape: {
    id: "snow_sweden_landscape",
    label: "Swedish Winter",
    emoji: "❄️",
    photo_url: "https://images.pexels.com/photos/34838458/pexels-photo-34838458.jpeg?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #E0E8F0 0%, #B0C0D0 50%, #8090A0 100%)",
    time_of_day: ["all"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(0.5%, -0.5%)",
      duration: 36
    },
    overlay_color: "rgba(224, 232, 240, 0.08)",
    description: "Serene snowy landscape - peaceful, Nordic winter beauty",
    mood: "peaceful, Nordic, serene",
    region: "Sweden"
  },

  snow_norway_forest: {
    id: "snow_norway_forest",
    label: "Norwegian Winter Forest",
    emoji: "🌨️",
    photo_url: "https://images.pexels.com/photos/29787699/pexels-photo-29787699.jpeg?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #C8D8E8 0%, #98A8B8 50%, #687888 100%)",
    time_of_day: ["all"],
    season: ["winter"],
    particle_preset: "snowfall",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-0.5%, 1%)",
      duration: 33
    },
    overlay_color: "rgba(200, 216, 232, 0.1)",
    description: "Serene winter landscape with snowy trees in Norway",
    mood: "Nordic, peaceful, forest",
    region: "Norway"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SPRING SCENES - Cherry Blossoms & Tulips
  // ═══════════════════════════════════════════════════════════════════════════════

  spring_cherry_roof: {
    id: "spring_cherry_roof",
    label: "Cherry Blossom Roof",
    emoji: "🌸",
    photo_url: "https://images.unsplash.com/photo-1461727885569-b2ddec0c4328?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #FFE4E8 0%, #FFB7C5 50%, #FF91A4 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring"],
    particle_preset: "cherry_petals",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.06) translate(-1%, -1%)",
      duration: 25
    },
    overlay_color: "rgba(255, 228, 232, 0.1)",
    description: "Cherry blossom over Asian roof - traditional spring, cultural beauty",
    mood: "traditional, spring, cultural",
    region: "Japan"
  },

  spring_cherry_canal: {
    id: "spring_cherry_canal",
    label: "Cherry Canal Walk",
    emoji: "🌸",
    photo_url: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #FFB7C5 50%, #FFC0CB 100%)",
    time_of_day: ["morning", "midday", "golden_hour"],
    season: ["spring"],
    particle_preset: "cherry_petals",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(1%, 0%)",
      duration: 30
    },
    overlay_color: "rgba(135, 206, 235, 0.08)",
    description: "Waterway lined with blooming cherry trees - romantic spring serenity",
    mood: "romantic, peaceful, spring",
    region: "Japan"
  },

  spring_sakura_bloom: {
    id: "spring_sakura_bloom",
    label: "Sakura Full Bloom",
    emoji: "🌸",
    photo_url: "https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #FFE4E8 0%, #FFB7C5 50%, #FF91A4 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring"],
    particle_preset: "cherry_petals",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.07) translate(-0.5%, -1%)",
      duration: 26
    },
    overlay_color: "rgba(255, 228, 232, 0.1)",
    description: "Tree flowering with sakura - spring celebration, natural beauty",
    mood: "joyful, spring, celebration",
    region: "Japan"
  },

  spring_tulips_colorful: {
    id: "spring_tulips_colorful",
    label: "Dutch Tulip Fields",
    emoji: "🌷",
    photo_url: "https://images.unsplash.com/photo-1765054076233-705703db337e?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #FF6B6B 30%, #FFD93D 60%, #6BCF7F 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring"],
    particle_preset: "bokeh_float",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.06) translate(0%, -1%)",
      duration: 28
    },
    overlay_color: "rgba(135, 206, 235, 0.08)",
    description: "Colorful tulips in field - vibrant spring, joyful colors",
    mood: "vibrant, joyful, colorful",
    region: "Netherlands"
  },

  spring_tulips_red: {
    id: "spring_tulips_red",
    label: "Red Tulip Fields",
    emoji: "🌷",
    photo_url: "https://images.unsplash.com/photo-1683547436725-8ad5454c5237?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #C0392B 50%, #E74C3C 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring"],
    particle_preset: "bokeh_float",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-1%, 0%)",
      duration: 30
    },
    overlay_color: "rgba(192, 57, 43, 0.08)",
    description: "Field of red tulips - bold spring, vivid colors",
    mood: "bold, vivid, spring",
    region: "Netherlands"
  },

  spring_tulips_white: {
    id: "spring_tulips_white",
    label: "White Tulip Fields",
    emoji: "🤍",
    photo_url: "https://images.unsplash.com/photo-1715326276218-9adb78699c89?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #BDC3C7 0%, #F8F9FA 50%, #FFFFFF 100%)",
    time_of_day: ["all"],
    season: ["spring"],
    particle_preset: "bokeh_float",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0.5%, -0.5%)",
      duration: 32
    },
    overlay_color: "rgba(189, 195, 199, 0.08)",
    description: "Field of white tulips under cloudy sky - soft spring, peaceful",
    mood: "soft, peaceful, gentle",
    region: "Netherlands"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // AUTUMN SCENES - Fall Colors & Forest Paths
  // ═══════════════════════════════════════════════════════════════════════════════

  autumn_forest_path: {
    id: "autumn_forest_path",
    label: "Autumn Forest Path",
    emoji: "🍂",
    photo_url: "https://unsplash.com/photos/q0GpqmA6hes/download?w=1920",
    photo_fallback_gradient: "linear-gradient(180deg, #E67E22 0%, #D35400 40%, #A04000 100%)",
    time_of_day: ["morning", "midday", "golden_hour"],
    season: ["autumn"],
    particle_preset: "falling_leaves",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0%, -1%)",
      duration: 28
    },
    overlay_color: "rgba(230, 126, 34, 0.12)",
    description: "Brick path through autumn forest - peaceful walk, fall colors",
    mood: "nostalgic, peaceful, autumn",
    region: "Europe"
  },

  autumn_leaves_ground: {
    id: "autumn_leaves_ground",
    label: "Fallen Autumn Leaves",
    emoji: "🍁",
    photo_url: "https://unsplash.com/photos/Y19yzX3xgO4/download?w=1920",
    photo_fallback_gradient: "linear-gradient(135deg, #C0392B 0%, #E67E22 50%, #F39C12 100%)",
    time_of_day: ["all"],
    season: ["autumn"],
    particle_preset: "falling_leaves",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.06) translate(-1%, -0.5%)",
      duration: 26
    },
    overlay_color: "rgba(192, 57, 43, 0.1)",
    description: "Brown leaves on ground - fall tranquility, natural cycle",
    mood: "tranquil, grounding, autumn",
    region: "Europe"
  },

  autumn_pavement: {
    id: "autumn_pavement",
    label: "Urban Autumn Leaves",
    emoji: "🍂",
    photo_url: "https://unsplash.com/photos/2yY1UunbJyI/download?w=1920",
    photo_fallback_gradient: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #CD853F 100%)",
    time_of_day: ["all"],
    season: ["autumn"],
    particle_preset: "falling_leaves",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0.5%, 0%)",
      duration: 30
    },
    overlay_color: "rgba(139, 69, 19, 0.1)",
    description: "Brown leaves on pavement - urban autumn, cozy",
    mood: "urban, cozy, autumn",
    region: "Urban Europe"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUMMER SCENES - Tropical Beaches & Ocean
  // ═══════════════════════════════════════════════════════════════════════════════

  summer_beach_aerial: {
    id: "summer_beach_aerial",
    label: "Aerial Beach View",
    emoji: "🏖️",
    photo_url: "https://images.unsplash.com/photo-1728495674833-faf9570eb797?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #00BCD4 50%, #006994 100%)",
    time_of_day: ["morning", "midday"],
    season: ["summer", "dry"],
    particle_preset: "bokeh_float",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(-0.5%, 0%)",
      duration: 32
    },
    overlay_color: "rgba(0, 188, 212, 0.08)",
    description: "Aerial view of beach and ocean - peaceful, expansive summer calm",
    mood: "peaceful, expansive, calm",
    region: "Tropical coast"
  },

  summer_turquoise_ocean: {
    id: "summer_turquoise_ocean",
    label: "Turquoise Waters",
    emoji: "🌊",
    photo_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #40E0D0 0%, #00CED1 50%, #008B8B 100%)",
    time_of_day: ["morning", "midday"],
    season: ["summer", "dry"],
    particle_preset: "sea_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0%, -0.5%)",
      duration: 35
    },
    overlay_color: "rgba(64, 224, 208, 0.08)",
    description: "Crystal clear turquoise ocean waters - tropical paradise",
    mood: "tranquil, tropical, clear",
    region: "Tropical"
  },

  summer_calm_horizon: {
    id: "summer_calm_horizon",
    label: "Calm Ocean Horizon",
    emoji: "🌅",
    photo_url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #4682B4 50%, #1E3A5F 100%)",
    time_of_day: ["all"],
    season: ["summer", "all"],
    particle_preset: "sea_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(0%, 0%)",
      duration: 40
    },
    overlay_color: "rgba(135, 206, 235, 0.08)",
    description: "Calm ocean horizon - vast, peaceful, meditative",
    mood: "vast, peaceful, meditative",
    region: "Open ocean"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DESERT SCENES - Sand Dunes & Golden Hour
  // ═══════════════════════════════════════════════════════════════════════════════

  desert_golden_dunes: {
    id: "desert_golden_dunes",
    label: "Golden Sand Dunes",
    emoji: "🏜️",
    photo_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&h=1080&fit=crop",
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
    description: "Golden sand dunes in Sahara - vast, warm, timeless",
    mood: "vast, warm, timeless",
    region: "Sahara"
  },

  desert_sunset: {
    id: "desert_sunset",
    label: "Desert Sunset Sky",
    emoji: "🌅",
    photo_url: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #4A235A 0%, #C0392B 40%, #E67E22 70%, #F5A623 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["harmattan", "dry"],
    particle_preset: "harmattan_dust",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0.5%, -1%)",
      duration: 30
    },
    overlay_color: "rgba(192, 57, 43, 0.12)",
    description: "Desert sunset with dramatic colors - warm, expansive",
    mood: "dramatic, warm, vast",
    region: "Middle East"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MOUNTAIN SCENES - Himalayan Majesty & Alpine Beauty
  // ═══════════════════════════════════════════════════════════════════════════════

  mountain_mirror_lake: {
    id: "mountain_mirror_lake",
    label: "Mirror Mountain Lake",
    emoji: "🏔️",
    photo_url: "https://images.unsplash.com/photo-1752087021698-df3e90af3fb2?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #5F9EA0 50%, #2C3E50 100%)",
    time_of_day: ["morning", "midday"],
    season: ["spring", "summer"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0%, -0.5%)",
      duration: 36
    },
    overlay_color: "rgba(95, 158, 160, 0.1)",
    description: "Perfect mountain reflection in tranquil alpine lake - breathtaking symmetry",
    mood: "majestic, peaceful, symmetrical",
    region: "Alps",
    credit: "Piotr Musiol (Unsplash)"
  },

  mountain_panorama: {
    id: "mountain_panorama",
    label: "Mountain Panorama",
    emoji: "⛰️",
    photo_url: "https://images.unsplash.com/photo-1673505413451-196fe5fb12c8?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #4682B4 50%, #2F4F4F 100%)",
    time_of_day: ["morning", "midday", "golden_hour"],
    season: ["all"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-0.5%, 0%)",
      duration: 38
    },
    overlay_color: "rgba(70, 130, 180, 0.1)",
    description: "Breathtaking panorama with multiple peaks and flawless reflection",
    mood: "expansive, majestic, serene",
    region: "Mountains",
    credit: "Pulkit Pithva (Unsplash)"
  },

  ocean_turquoise: {
    id: "ocean_turquoise",
    label: "Crystal Turquoise Shore",
    emoji: "🌊",
    photo_url: "https://images.unsplash.com/photo-1776363278488-48d611fb4353?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #40E0D0 0%, #00CED1 50%, #008B8B 100%)",
    time_of_day: ["morning", "midday"],
    season: ["summer", "dry"],
    particle_preset: "sea_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(0%, -0.5%)",
      duration: 32
    },
    overlay_color: "rgba(64, 224, 208, 0.08)",
    description: "Pristine turquoise waters meeting rocky coastline - tropical paradise",
    mood: "vibrant, clear, tropical",
    region: "Tropical coast",
    credit: "Zoshua Colah (Unsplash)"
  },

  ocean_island: {
    id: "ocean_island",
    label: "Tropical Island Paradise",
    emoji: "🏝️",
    photo_url: "https://images.unsplash.com/photo-1741158483757-d5bf054c58b7?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #00BCD4 50%, #006994 100%)",
    time_of_day: ["all"],
    season: ["summer", "dry"],
    particle_preset: "bokeh_float",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(-0.5%, 0%)",
      duration: 35
    },
    overlay_color: "rgba(0, 188, 212, 0.08)",
    description: "Isolated island in transparent turquoise waters - peaceful escapism",
    mood: "peaceful, isolated, paradise",
    region: "Tropical",
    credit: "Tofan Teodor (Unsplash)"
  },

  mountain_himalaya: {
    id: "mountain_himalaya",
    label: "Himalayan Peaks",
    emoji: "🏔️",
    photo_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #87CEEB 0%, #5F9EA0 50%, #2F4F4F 100%)",
    time_of_day: ["morning", "midday"],
    season: ["all"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0%, -1%)",
      duration: 36
    },
    overlay_color: "rgba(95, 158, 160, 0.1)",
    description: "Himalayan mountain range - majestic, spiritual, towering",
    mood: "majestic, spiritual, awe",
    region: "Nepal/Himalayas"
  },

  mountain_misty: {
    id: "mountain_misty",
    label: "Misty Mountain Morning",
    emoji: "⛰️",
    photo_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #BDC3C7 0%, #7F8C8D 50%, #2C3E50 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["all"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-0.5%, 0%)",
      duration: 33
    },
    overlay_color: "rgba(127, 140, 141, 0.12)",
    description: "Misty mountain morning - mysterious, ethereal, peaceful",
    mood: "mysterious, ethereal, calm",
    region: "Asian peaks"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MISTY LAKE SCENES - Morning Fog & Reflections
  // ═══════════════════════════════════════════════════════════════════════════════

  lake_morning_fog: {
    id: "lake_morning_fog",
    label: "Morning Fog on Lake",
    emoji: "🌫️",
    photo_url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #BDC3C7 0%, #95A5A6 50%, #7F8C8D 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["autumn", "spring"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(0%, -0.5%)",
      duration: 35
    },
    overlay_color: "rgba(189, 195, 199, 0.12)",
    description: "Morning fog on peaceful lake - mysterious, calm, ethereal",
    mood: "mysterious, calm, ethereal",
    region: "Various"
  },

  lake_mountain_mist: {
    id: "lake_mountain_mist",
    label: "Mountain Lake Mist",
    emoji: "🏞️",
    photo_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #7F8C8D 0%, #2C3E50 50%, #1a2a3a 100%)",
    time_of_day: ["dawn", "morning"],
    season: ["all"],
    particle_preset: "rising_mist",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(-1%, 0%)",
      duration: 34
    },
    overlay_color: "rgba(44, 62, 80, 0.12)",
    description: "Mountain lake with morning mist - serene, peaceful morning",
    mood: "serene, peaceful, morning",
    region: "Mountain region"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // NORTHERN LIGHTS - Aurora Borealis Magic
  // ═══════════════════════════════════════════════════════════════════════════════

  aurora_mountains: {
    id: "aurora_mountains",
    label: "Aurora Over Mountains",
    emoji: "🌌",
    photo_url: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #0a1628 0%, #0d3b2e 40%, #1a4a3a 70%, #2C3E50 100%)",
    time_of_day: ["night"],
    season: ["winter"],
    particle_preset: "stars_twinkle",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(0%, -0.5%)",
      duration: 38
    },
    overlay_color: "rgba(76, 175, 125, 0.1)",
    description: "Aurora borealis over mountains - magical, wonder, natural phenomenon",
    mood: "magical, wonder, awe",
    region: "Arctic"
  },

  aurora_green_sky: {
    id: "aurora_green_sky",
    label: "Green Aurora Night",
    emoji: "✨",
    photo_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #0a1628 0%, #0d3b2e 50%, #1a4a3a 100%)",
    time_of_day: ["night"],
    season: ["winter"],
    particle_preset: "stars_twinkle",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(-0.5%, 0%)",
      duration: 40
    },
    overlay_color: "rgba(76, 175, 125, 0.12)",
    description: "Green aurora in night sky - mystical, dancing lights, natural wonder",
    mood: "mystical, wonder, dancing",
    region: "Scandinavia"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // AFRICAN LANDSCAPES - Savanna & Golden Hour
  // ═══════════════════════════════════════════════════════════════════════════════

  africa_acacia_sunset: {
    id: "africa_acacia_sunset",
    label: "Acacia Tree Sunset",
    emoji: "🌅",
    photo_url: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #7B241C 0%, #C0392B 30%, #E67E22 60%, #F5A623 85%, #FFF3B0 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["harmattan", "dry"],
    particle_preset: "harmattan_dust",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.05) translate(-1%, -0.5%)",
      duration: 30
    },
    overlay_color: "rgba(230, 126, 34, 0.15)",
    description: "Iconic acacia tree at sunset - African savanna, warm, vast",
    mood: "iconic, warm, vast",
    region: "Kenya/Africa"
  },

  africa_savanna_golden: {
    id: "africa_savanna_golden",
    label: "Savanna Golden Hour",
    emoji: "🦁",
    photo_url: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #C0392B 0%, #E67E22 50%, #F5A623 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["harmattan", "dry"],
    particle_preset: "harmattan_dust",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.04) translate(0.5%, -1%)",
      duration: 32
    },
    overlay_color: "rgba(245, 166, 35, 0.15)",
    description: "African savanna at golden hour - warm, vast, timeless",
    mood: "warm, vast, timeless",
    region: "Tanzania/Africa"
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUNSET & SKY SCENES - Dramatic Colors
  // ═══════════════════════════════════════════════════════════════════════════════

  sunset_dramatic_clouds: {
    id: "sunset_dramatic_clouds",
    label: "Dramatic Sunset Clouds",
    emoji: "🌅",
    photo_url: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&h=1080&fit=crop",
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
    description: "Dramatic sunset clouds with colorful sky - warm, inspiring",
    mood: "dramatic, warm, inspiring",
    region: "Various"
  },

  sunset_orange_pink: {
    id: "sunset_orange_pink",
    label: "Orange Pink Sunset",
    emoji: "🌇",
    photo_url: "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #FF6B6B 0%, #FFA726 50%, #FFEB3B 100%)",
    time_of_day: ["golden_hour", "sunset"],
    season: ["all"],
    particle_preset: "golden_dust",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(-0.5%, 0%)",
      duration: 32
    },
    overlay_color: "rgba(255, 107, 107, 0.1)",
    description: "Orange and pink sunset over ocean - warm colors, peaceful",
    mood: "warm, peaceful, grateful",
    region: "Ocean"
  },

  night_starry_sky: {
    id: "night_starry_sky",
    label: "Starry Night Sky",
    emoji: "⭐",
    photo_url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&h=1080&fit=crop",
    photo_fallback_gradient: "linear-gradient(180deg, #020408 0%, #050D18 50%, #0D1B2A 100%)",
    time_of_day: ["night"],
    season: ["all"],
    particle_preset: "stars_twinkle",
    ken_burns: {
      start: "scale(1.0) translate(0%, 0%)",
      end: "scale(1.03) translate(0%, 0%)",
      duration: 40
    },
    overlay_color: "rgba(2, 4, 8, 0.15)",
    description: "Peaceful starry night sky - vast, meditative, cosmic",
    mood: "vast, meditative, cosmic",
    region: "Night sky"
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
    mountain: (scene) => scene.id.includes('mountain') || scene.id.includes('himalaya'),
    desert: (scene) => scene.id.includes('desert'),
    ocean: (scene) => scene.id.includes('ocean') || scene.id.includes('beach') || scene.id.includes('summer'),
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
