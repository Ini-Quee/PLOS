/**
 * PLOS Living Background Configuration
 * Time-aware, season-aware, location-aware background system
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIME OF DAY STATES
// ═══════════════════════════════════════════════════════════════════════════════

export const TIME_OF_DAY_CONFIGS = {
  DAWN: {
    hours: [5, 6],
    sky_top: '#1a0a2e',
    sky_mid: '#4a1942',
    sky_horizon: '#FF6B35',
    sky_low: '#FFB347',
    ground_tone: '#1a120a',
    ambient_glow: 'rgba(255,179,71,0.15)',
    particles: 'rising_mist',
    description: 'Dawn - Purple to orange horizon'
  },

  MORNING: {
    hours: [7, 8, 9, 10],
    sky_top: '#1B4F72',
    sky_mid: '#2E86C1',
    sky_horizon: '#AED6F1',
    sky_low: '#FEF9E7',
    ground_tone: '#2d3a2e',
    ambient_glow: 'rgba(255,243,176,0.12)',
    particles: 'birds_flying',
    description: 'Morning - Clear blue sky with birds'
  },

  MIDDAY: {
    hours: [11, 12, 13, 14],
    sky_top: '#0E4D92',
    sky_mid: '#1565C0',
    sky_horizon: '#42A5F5',
    sky_low: '#E3F2FD',
    ground_tone: '#1a3a1a',
    ambient_glow: 'rgba(255,255,255,0.08)',
    particles: 'sun_rays',
    description: 'Midday - Bright sun rays'
  },

  GOLDEN_HOUR: {
    hours: [15, 16, 17, 18],
    sky_top: '#1a1035',
    sky_mid: '#7B241C',
    sky_horizon: '#E67E22',
    sky_low: '#F5A623',
    ground_tone: '#2a1a0a',
    ambient_glow: 'rgba(245,166,35,0.2)',
    particles: 'clouds_drifting',
    description: 'Golden Hour - Warm clouds'
  },

  SUNSET: {
    hours: [19, 20],
    sky_top: '#0D0D0D',
    sky_mid: '#4A235A',
    sky_horizon: '#C0392B',
    sky_low: '#E67E22',
    ground_tone: '#0a0a0a',
    ambient_glow: 'rgba(192,57,43,0.15)',
    particles: 'firefly_glow',
    description: 'Sunset - Deep crimson to black'
  },

  NIGHT: {
    hours: [21, 22, 23, 0, 1, 2, 3, 4],
    sky_top: '#020408',
    sky_mid: '#050D18',
    sky_horizon: '#0D1B2A',
    sky_low: '#0a0f1a',
    ground_tone: '#030303',
    ambient_glow: 'rgba(255,255,255,0.03)',
    particles: 'star_twinkle',
    description: 'Night - Starlit darkness'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEASON CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const SEASON_CONFIGS = {
  // West Africa (Nigeria, Ghana, etc.)
  RAINY: {
    months: [4, 5, 6, 7, 8, 9, 10],
    ground_color: '#1a3a1a',
    horizon_silhouette: 'tropical_treeline',
    overlay_effect: 'tropical_rain',
    accent_color: '#4CAF7D',
    sky_modifier: { darken: 0.3, grey_tint: 'rgba(120,120,120,0.15)' },
    description: 'Rainy Season - Lush tropical green'
  },

  HARMATTAN: {
    months: [11, 12, 1, 2, 3],
    ground_color: '#5C3A1E',
    horizon_silhouette: 'savanna',
    overlay_effect: 'harmattan_dust',
    accent_color: '#C9923A',
    sky_modifier: { haze: 'rgba(210,180,140,0.15)', desaturate: 0.2 },
    description: 'Harmattan - Dusty dry season'
  },

  // Europe/USA Temperate
  SPRING: {
    months: [3, 4, 5],
    ground_color: '#2d5a1b',
    horizon_silhouette: 'rolling_hills',
    overlay_effect: 'cherry_petals',
    accent_color: '#FFB7C5',
    sky_modifier: { warm_tint: 'rgba(255,200,200,0.08)' },
    description: 'Spring - Fresh blooms'
  },

  SUMMER: {
    months: [6, 7, 8],
    ground_color: '#1a5c1a',
    horizon_silhouette: 'full_canopy',
    overlay_effect: 'bokeh_green',
    accent_color: '#27AE60',
    sky_modifier: { saturate: 1.2 },
    description: 'Summer - Vivid green'
  },

  AUTUMN: {
    months: [9, 10, 11],
    ground_color: '#5c2e08',
    horizon_silhouette: 'autumn_trees',
    overlay_effect: 'falling_leaves',
    accent_color: '#E67E22',
    sky_modifier: { warm_tint: 'rgba(230,126,34,0.1)' },
    description: 'Autumn - Golden leaves'
  },

  WINTER: {
    months: [12, 1, 2],
    ground_color: '#E8EEF0',
    horizon_silhouette: 'bare_winter',
    overlay_effect: 'snowfall',
    accent_color: '#AED6F1',
    sky_modifier: { desaturate: 0.3, cold_tint: 'rgba(174,214,241,0.12)' },
    description: 'Winter - Snow and frost'
  },

  // Tropical regions
  DRY_SEASON: {
    months: [11, 12, 1, 2, 3, 4],
    ground_color: '#006994',
    horizon_silhouette: 'beach_horizon',
    overlay_effect: 'ocean_shimmer',
    accent_color: '#00BCD4',
    sky_modifier: {},
    description: 'Dry Season - Turquoise ocean'
  },

  WET_SEASON: {
    months: [5, 6, 7, 8, 9, 10],
    ground_color: '#1a4a2a',
    horizon_silhouette: 'tropical_dense',
    overlay_effect: 'tropical_rain',
    accent_color: '#26A69A',
    sky_modifier: { darken: 0.2 },
    description: 'Wet Season - Dense jungle'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// THEME LIBRARY (User selectable)
// ═══════════════════════════════════════════════════════════════════════════════

export const THEME_LIBRARY = {
  auto: {
    name: 'Auto',
    description: 'Automatic season and location detection',
    override: null
  },

  maldives: {
    name: 'Maldives',
    description: 'Turquoise lagoon, white sand horizon',
    override: {
      sky_horizon: '#00BCD4',
      sky_low: '#E0F7FA',
      horizon_silhouette: 'beach_horizon',
      accent_color: '#26C6DA',
      overlay_effect: 'ocean_shimmer'
    }
  },

  swiss_alps: {
    name: 'Swiss Alps',
    description: 'Snow peaks, deep pine forest',
    override: {
      sky_horizon: '#81D4FA',
      horizon_silhouette: 'pine_forest',
      accent_color: '#B3E5FC',
      overlay_effect: 'snowfall'
    }
  },

  savanna_africa: {
    name: 'African Savanna',
    description: 'Acacia silhouettes, red African sky',
    override: {
      sky_horizon: '#E67E22',
      horizon_silhouette: 'savanna',
      accent_color: '#F5A623',
      overlay_effect: 'heat_shimmer'
    }
  },

  kyoto_japan: {
    name: 'Kyoto',
    description: 'Cherry blossoms, temple horizon',
    override: {
      horizon_silhouette: 'temple_treeline',
      accent_color: '#FFB7C5',
      overlay_effect: 'cherry_petals'
    }
  },

  northern_lights: {
    name: 'Northern Lights',
    description: 'Aurora borealis, dark sky',
    override: {
      sky_top: '#0a1628',
      sky_mid: '#0d3b2e',
      overlay_effect: 'aurora_wave',
      accent_color: '#4CAF7D'
    }
  },

  cozy_cabin: {
    name: 'Cozy Cabin',
    description: 'Firelight glow, snow, pine trees',
    override: {
      sky_top: '#1a0a05',
      overlay_effect: 'snowfall',
      horizon_silhouette: 'pine_forest',
      warm_glow: true,
      accent_color: '#F5A623'
    }
  },

  coffee_shop: {
    name: 'Coffee Shop',
    description: 'Warm amber light, bokeh, cozy interior',
    override: {
      type: 'lifestyle',
      sky_override: { background: 'linear-gradient(180deg, #3d1c08 0%, #6b3424 100%)' },
      overlay_effect: 'bokeh_warm',
      no_silhouette: true,
      warm_glow: true
    }
  },

  city_night: {
    name: 'City Night',
    description: 'City lights, urban night skyline',
    override: {
      sky_override: { background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)' },
      horizon_silhouette: 'city_skyline',
      overlay_effect: 'bokeh_city',
      accent_color: '#4A9EFF'
    }
  },

  highland_mist: {
    name: 'Highland Mist',
    description: 'Scottish mist, rolling dark hills',
    override: {
      sky_horizon: '#7F8C8D',
      sky_low: '#BDC3C7',
      horizon_silhouette: 'rolling_hills',
      overlay_effect: 'rising_mist',
      accent_color: '#95A5A6'
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get time of day state from current hour
 */
export function getTimeOfDay(hour) {
  for (const [state, config] of Object.entries(TIME_OF_DAY_CONFIGS)) {
    if (config.hours.includes(hour)) {
      return { state, ...config };
    }
  }
  return { state: 'NIGHT', ...TIME_OF_DAY_CONFIGS.NIGHT };
}

/**
 * Detect hemisphere and region from timezone offset
 */
export function detectRegion() {
  const offset = -(new Date().getTimezoneOffset() / 60); // Convert to hours from UTC

  // West Africa (Nigeria, Ghana): UTC+0 to UTC+1
  if (offset >= 0 && offset <= 1) {
    return 'WEST_AFRICA';
  }

  // Europe Central: UTC+1 to UTC+2
  if (offset >= 1 && offset <= 2) {
    return 'EUROPE';
  }

  // USA/Americas: UTC-5 to UTC-8
  if (offset >= -8 && offset <= -5) {
    return 'USA';
  }

  // Tropical (Caribbean, Pacific): UTC-4 to UTC-10
  if (offset >= -10 && offset <= -4) {
    return 'TROPICAL';
  }

  // Southern Hemisphere (Australia, South Africa): UTC+2 to UTC+10
  if (offset >= 2 && offset <= 10) {
    return 'SOUTHERN_HEMISPHERE';
  }

  return 'WEST_AFRICA'; // Default
}

/**
 * Get season from month and region
 */
export function getSeason(month, region = null) {
  if (!region) region = detectRegion();

  if (region === 'WEST_AFRICA') {
    // Rainy: April-October
    if (month >= 4 && month <= 10) {
      return { season: 'RAINY', ...SEASON_CONFIGS.RAINY };
    }
    return { season: 'HARMATTAN', ...SEASON_CONFIGS.HARMATTAN };
  }

  if (region === 'TROPICAL') {
    // Dry: November-April
    if (month >= 11 || month <= 4) {
      return { season: 'DRY_SEASON', ...SEASON_CONFIGS.DRY_SEASON };
    }
    return { season: 'WET_SEASON', ...SEASON_CONFIGS.WET_SEASON };
  }

  if (region === 'SOUTHERN_HEMISPHERE') {
    // Flip the seasons
    if (month >= 3 && month <= 5) return { season: 'AUTUMN', ...SEASON_CONFIGS.AUTUMN };
    if (month >= 6 && month <= 8) return { season: 'WINTER', ...SEASON_CONFIGS.WINTER };
    if (month >= 9 && month <= 11) return { season: 'SPRING', ...SEASON_CONFIGS.SPRING };
    return { season: 'SUMMER', ...SEASON_CONFIGS.SUMMER };
  }

  // EUROPE / USA (Northern Hemisphere)
  if (month >= 3 && month <= 5) return { season: 'SPRING', ...SEASON_CONFIGS.SPRING };
  if (month >= 6 && month <= 8) return { season: 'SUMMER', ...SEASON_CONFIGS.SUMMER };
  if (month >= 9 && month <= 11) return { season: 'AUTUMN', ...SEASON_CONFIGS.AUTUMN };
  return { season: 'WINTER', ...SEASON_CONFIGS.WINTER };
}

/**
 * Apply sky modifier to base colors
 */
function applySkyModifier(baseColors, modifier) {
  if (!modifier) return baseColors;

  let colors = { ...baseColors };

  // Apply darken
  if (modifier.darken) {
    Object.keys(colors).forEach(key => {
      if (key.startsWith('sky_')) {
        const factor = 1 - modifier.darken;
        colors[key] = adjustBrightness(colors[key], factor);
      }
    });
  }

  return colors;
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, factor) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);

  return rgbToHex(r, g, b);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Compute complete background configuration
 */
export function computeBackground(hour, month, region, themeName = 'auto') {
  // Get base time of day
  const timeOfDay = getTimeOfDay(hour);

  // Get base season
  const season = getSeason(month, region);

  // Apply theme override if not auto
  let config = {
    ...timeOfDay,
    ...season,
    region
  };

  if (themeName !== 'auto' && THEME_LIBRARY[themeName]) {
    const theme = THEME_LIBRARY[themeName];
    if (theme.override) {
      config = {
        ...config,
        ...theme.override
      };
    }
  }

  // Apply season sky modifier
  if (season.sky_modifier) {
    config = {
      ...config,
      ...applySkyModifier(config, season.sky_modifier)
    };
  }

  return config;
}

export default {
  TIME_OF_DAY_CONFIGS,
  SEASON_CONFIGS,
  THEME_LIBRARY,
  getTimeOfDay,
  detectRegion,
  getSeason,
  computeBackground
};
