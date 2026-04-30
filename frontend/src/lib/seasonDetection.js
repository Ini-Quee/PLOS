/**
 * Global Season Detection System
 * Detects user's location and determines current season
 */

// Season definitions by region
export const REGIONS = {
  NIGERIA: 'nigeria',
  USA: 'usa',
  EUROPE: 'europe',
  TROPICS: 'tropics',
  MIDDLE_EAST: 'middle_east',
  SOUTHERN_HEMISPHERE: 'southern_hemisphere',
};

export const SEASONS = {
  // Nigeria-specific
  HARMATTAN: 'harmattan',
  RAINY: 'rainy',
  // Temperate (USA/Europe)
  SPRING: 'spring',
  SUMMER: 'summer',
  FALL: 'fall',
  WINTER: 'winter',
  // Tropical
  WET: 'wet',
  DRY: 'dry',
  // Middle East
  HOT: 'hot',
  COOL: 'cool',
};

// Country to region mapping
const COUNTRY_REGIONS = {
  NG: REGIONS.NIGERIA,
  US: REGIONS.USA,
  CA: REGIONS.USA,
  GB: REGIONS.EUROPE,
  DE: REGIONS.EUROPE,
  FR: REGIONS.EUROPE,
  IT: REGIONS.EUROPE,
  ES: REGIONS.EUROPE,
  NL: REGIONS.EUROPE,
  AE: REGIONS.MIDDLE_EAST,
  SA: REGIONS.MIDDLE_EAST,
  QA: REGIONS.MIDDLE_EAST,
  BR: REGIONS.TROPICS,
  SG: REGIONS.TROPICS,
  ID: REGIONS.TROPICS,
  TH: REGIONS.TROPICS,
  AU: REGIONS.SOUTHERN_HEMISPHERE,
  NZ: REGIONS.SOUTHERN_HEMISPHERE,
  ZA: REGIONS.SOUTHERN_HEMISPHERE,
  AR: REGIONS.SOUTHERN_HEMISPHERE,
  CL: REGIONS.SOUTHERN_HEMISPHERE,
};

/**
 * Detect user's country via IP geolocation
 */
export async function detectUserCountry() {
  try {
    // Try ipapi.co first (free, no API key needed)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'NG'; // Default to Nigeria
  } catch (error) {
    console.error('Geolocation failed:', error);
    // Fallback: try timezone-based detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Lagos') || timezone.includes('Africa')) return 'NG';
    if (timezone.includes('New_York') || timezone.includes('Chicago') || timezone.includes('Los_Angeles')) return 'US';
    if (timezone.includes('London') || timezone.includes('Paris') || timezone.includes('Berlin')) return 'GB';
    return 'NG'; // Ultimate fallback
  }
}

/**
 * Determine current season based on country and date
 */
export function getCurrentSeason(countryCode) {
  const region = COUNTRY_REGIONS[countryCode] || REGIONS.NIGERIA;
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  switch (region) {
    case REGIONS.NIGERIA:
      // Harmattan: November to February (dry, dusty, cool)
      // Rainy: March to October (wet, humid, green)
      if (month >= 11 || month <= 2) return SEASONS.HARMATTAN;
      return SEASONS.RAINY;

    case REGIONS.USA:
    case REGIONS.EUROPE:
      // Spring: March 20 - June 20
      // Summer: June 21 - September 22
      // Fall: September 23 - December 20
      // Winter: December 21 - March 19
      if ((month === 3 && day >= 20) || (month > 3 && month < 6)) return SEASONS.SPRING;
      if ((month === 6 && day >= 21) || (month > 6 && month < 9)) return SEASONS.SUMMER;
      if ((month === 9 && day >= 23) || (month > 9 && month < 12)) return SEASONS.FALL;
      if ((month === 12 && day >= 21) || month < 3) return SEASONS.WINTER;
      return SEASONS.SPRING;

    case REGIONS.TROPICS:
      // Simplified: Wet (May-Oct), Dry (Nov-Apr)
      if (month >= 5 && month <= 10) return SEASONS.WET;
      return SEASONS.DRY;

    case REGIONS.MIDDLE_EAST:
      // Hot: May-September, Cool: October-April
      if (month >= 5 && month <= 9) return SEASONS.HOT;
      return SEASONS.COOL;

    case REGIONS.SOUTHERN_HEMISPHERE:
      // Reversed from Northern Hemisphere
      if (month >= 3 && month <= 5) return SEASONS.FALL;
      if (month >= 6 && month <= 8) return SEASONS.WINTER;
      if (month >= 9 && month <= 11) return SEASONS.SPRING;
      return SEASONS.SUMMER;

    default:
      return SEASONS.HARMATTAN;
  }
}

/**
 * Get season display name and emoji
 */
export function getSeasonInfo(season) {
  const seasonData = {
    [SEASONS.HARMATTAN]: {
      name: 'Harmattan',
      emoji: '🌾',
      description: 'Dry, dusty winds from the Sahara',
      mood: 'warm-dusty',
    },
    [SEASONS.RAINY]: {
      name: 'Rainy Season',
      emoji: '🌧️',
      description: 'Fresh tropical rains',
      mood: 'cool-wet',
    },
    [SEASONS.SPRING]: {
      name: 'Spring',
      emoji: '🌸',
      description: 'Renewal and growth',
      mood: 'fresh-blooming',
    },
    [SEASONS.SUMMER]: {
      name: 'Summer',
      emoji: '☀️',
      description: 'Warm and vibrant',
      mood: 'bright-energetic',
    },
    [SEASONS.FALL]: {
      name: 'Fall',
      emoji: '🍂',
      description: 'Harvest and transition',
      mood: 'cozy-amber',
    },
    [SEASONS.WINTER]: {
      name: 'Winter',
      emoji: '❄️',
      description: 'Quiet and reflective',
      mood: 'cold-minimal',
    },
    [SEASONS.WET]: {
      name: 'Wet Season',
      emoji: '🌴',
      description: 'Tropical rains',
      mood: 'humid-green',
    },
    [SEASONS.DRY]: {
      name: 'Dry Season',
      emoji: '☀️',
      description: 'Clear and warm',
      mood: 'bright-dry',
    },
    [SEASONS.HOT]: {
      name: 'Hot Season',
      emoji: '🔥',
      description: 'Desert heat',
      mood: 'intense-warm',
    },
    [SEASONS.COOL]: {
      name: 'Cool Season',
      emoji: '🌙',
      description: 'Pleasant evenings',
      mood: 'mild-comfortable',
    },
  };

  return seasonData[season] || seasonData[SEASONS.HARMATTAN];
}

/**
 * Initialize season detection
 * Call this once when app loads
 */
export async function initializeSeasonDetection() {
  try {
    // Check cache first (avoid multiple API calls)
    const cachedCountry = localStorage.getItem('userCountry');
    const cachedSeason = localStorage.getItem('currentSeason');
    const cacheTime = localStorage.getItem('seasonCacheTime');

    // Cache valid for 24 hours (86400000 ms)
    const now = Date.now();
    if (cachedCountry && cachedSeason && cacheTime && (now - parseInt(cacheTime)) < 86400000) {
      return {
        countryCode: cachedCountry,
        season: cachedSeason,
        seasonInfo: getSeasonInfo(cachedSeason),
      };
    }

    // Fresh detection
    const countryCode = await detectUserCountry();
    const season = getCurrentSeason(countryCode);
    const seasonInfo = getSeasonInfo(season);

    // Store in localStorage with timestamp
    localStorage.setItem('userCountry', countryCode);
    localStorage.setItem('currentSeason', season);
    localStorage.setItem('seasonCacheTime', now.toString());

    return { countryCode, season, seasonInfo };
  } catch (error) {
    console.error('Season initialization failed:', error);
    return {
      countryCode: 'NG',
      season: SEASONS.HARMATTAN,
      seasonInfo: getSeasonInfo(SEASONS.HARMATTAN),
    };
  }
}

/**
 * Get cached season (fast, no API call)
 */
export function getCachedSeason() {
  const season = localStorage.getItem('currentSeason') || SEASONS.HARMATTAN;
  return getSeasonInfo(season);
}

/**
 * Get cached country
 */
export function getCachedCountry() {
  return localStorage.getItem('userCountry') || 'NG';
}

/**
 * Override season manually
 */
export function setSeasonOverride(season) {
  localStorage.setItem('currentSeason', season);
  return getSeasonInfo(season);
}

/**
 * Clear season override
 */
export function clearSeasonOverride() {
  localStorage.removeItem('currentSeason');
}

export default {
  REGIONS,
  SEASONS,
  detectUserCountry,
  getCurrentSeason,
  getSeasonInfo,
  initializeSeasonDetection,
  getCachedSeason,
  getCachedCountry,
  setSeasonOverride,
  clearSeasonOverride,
};
