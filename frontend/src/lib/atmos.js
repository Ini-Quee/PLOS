/**
 * PLOS Atmosphere System
 * Real curated scenic wallpapers — like Windows wallpapers but moodier.
 * Photos from Unsplash & Pexels — cinematic landscapes people save to vision boards.
 */

export const SCENES = {

  // ─── MORNING ─────────────────────────────────────────────────────────────────

  morning_coffee: {
    id: 'morning_coffee',
    label: 'Morning Coffee',
    photo: 'https://images.unsplash.com/premium_photo-1661963004511-dfef3e05b8de?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(160deg, #2C1810 0%, #4A2C1A 35%, #7A4A28 65%, #C4885A 100%)',
    overlay: 'rgba(28, 14, 4, 0.50)',
    particles: null,
    palette: {
      accent: '#C8955C', accentRgb: '200,149,92',
      surface: 'rgba(20, 12, 6, 0.88)', border: 'rgba(255,220,160,0.10)',
      glow: 'rgba(200,149,92,0.18)', text: '#F5EDE2', muted: '#C4A882',
    },
    time: ['dawn', 'morning'], season: ['all'], section: ['all'], region: ['all'],
  },

  morning_mountain: {
    id: 'morning_mountain',
    label: 'Mountain Dawn',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #c9d6df 0%, #8a9eae 40%, #4a6070 70%, #1e3040 100%)',
    overlay: 'rgba(20, 32, 44, 0.45)',
    particles: 'mist',
    palette: {
      accent: '#90A8BC', accentRgb: '144,168,188',
      surface: 'rgba(12, 20, 30, 0.88)', border: 'rgba(180,210,230,0.12)',
      glow: 'rgba(144,168,188,0.15)', text: '#E8EEF4', muted: '#7A90A0',
    },
    time: ['dawn', 'morning'], season: ['spring', 'summer', 'fall'], section: ['all'], region: ['all'],
  },

  morning_forest_sunlight: {
    id: 'morning_forest_sunlight',
    label: 'Sunlit Forest',
    photo: 'https://images.unsplash.com/photo-1607087925457-c2031e363bfe?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(135deg, #F5A623 0%, #8B6F47 50%, #2d5a2d 100%)',
    overlay: 'rgba(245, 166, 35, 0.42)',
    particles: null,
    palette: {
      accent: '#C8955C', accentRgb: '200,149,92',
      surface: 'rgba(20, 12, 6, 0.88)', border: 'rgba(200,180,120,0.12)',
      glow: 'rgba(200,149,92,0.18)', text: '#F0EAE0', muted: '#8A7A6A',
    },
    time: ['morning', 'golden_hour'], season: ['spring', 'summer', 'fall'], section: ['all'], region: ['all'],
  },

  // ─── RAIN / COZY ─────────────────────────────────────────────────────────────

  rain_window: {
    id: 'rain_window',
    label: 'Rainy Window',
    photo: 'https://images.unsplash.com/photo-1643287146701-93c795880dda?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #101520 0%, #1a2030 40%, #141c2c 80%, #0c1018 100%)',
    overlay: 'rgba(12, 16, 28, 0.52)',
    particles: 'rain',
    palette: {
      accent: '#7EB8C4', accentRgb: '126,184,196',
      surface: 'rgba(10, 14, 24, 0.90)', border: 'rgba(160,200,220,0.12)',
      glow: 'rgba(126,184,196,0.15)', text: '#DDE8EE', muted: '#6A8898',
    },
    time: ['all'], season: ['rainy', 'wet', 'fall', 'spring'], section: ['all'], region: ['all'],
  },

  forest_rain: {
    id: 'forest_rain',
    label: 'Forest Rain',
    photo: 'https://images.unsplash.com/photo-1599926720612-9c4774375a9f?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #060e06 0%, #0f1e0f 30%, #1a3a1a 60%, #2a5020 100%)',
    overlay: 'rgba(8, 18, 8, 0.50)',
    particles: 'rain',
    palette: {
      accent: '#7FB87F', accentRgb: '127,184,127',
      surface: 'rgba(6, 14, 6, 0.90)', border: 'rgba(160,220,160,0.12)',
      glow: 'rgba(127,184,127,0.15)', text: '#D8EED8', muted: '#5A8A5A',
    },
    time: ['all'], season: ['rainy', 'wet'], section: ['all'], region: ['all'],
  },

  rain_fresh_leaves: {
    id: 'rain_fresh_leaves',
    label: 'Fresh Dewdrops',
    photo: 'https://images.pexels.com/photos/23414835/pexels-photo-23414835.jpeg?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(135deg, #2d5a2d 0%, #4a7a4a 50%, #6a9a6a 100%)',
    overlay: 'rgba(45, 90, 45, 0.40)',
    particles: null,
    palette: {
      accent: '#6BBF8A', accentRgb: '107,191,138',
      surface: 'rgba(6, 20, 10, 0.90)', border: 'rgba(140,210,160,0.12)',
      glow: 'rgba(107,191,138,0.15)', text: '#D4EED8', muted: '#527A5A',
    },
    time: ['morning', 'midday'], season: ['rainy', 'spring', 'summer'], section: ['all'], region: ['all'],
  },

  // ─── LIBRARY / READING ───────────────────────────────────────────────────────

  cozy_library: {
    id: 'cozy_library',
    label: 'The Library',
    photo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(160deg, #180c04 0%, #2c1a08 30%, #3e2a10 60%, #5a3a18 100%)',
    overlay: 'rgba(18, 10, 3, 0.52)',
    particles: null,
    palette: {
      accent: '#C8955C', accentRgb: '200,149,92',
      surface: 'rgba(16, 9, 3, 0.90)', border: 'rgba(220,180,120,0.12)',
      glow: 'rgba(200,149,92,0.2)', text: '#EEE0CC', muted: '#8A6A4A',
    },
    time: ['all'], season: ['all'], section: ['books', 'journal'], region: ['all'],
  },

  // ─── SUNSET / GOLDEN HOUR ────────────────────────────────────────────────────

  sunset_field: {
    id: 'sunset_field',
    label: 'Golden Field',
    photo: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #180500 0%, #4a1200 20%, #8B3A0A 48%, #D4700A 72%, #E8A050 100%)',
    overlay: 'rgba(26, 8, 0, 0.48)',
    particles: 'dust',
    palette: {
      accent: '#D4845A', accentRgb: '212,132,90',
      surface: 'rgba(18, 6, 0, 0.88)', border: 'rgba(240,180,100,0.12)',
      glow: 'rgba(212,132,90,0.22)', text: '#F0E0CC', muted: '#9A6844',
    },
    time: ['golden_hour', 'sunset'], season: ['all'], section: ['all'], region: ['all'],
  },

  beach_sunset: {
    id: 'beach_sunset',
    label: 'Beach Sunset',
    photo: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #080020 0%, #3a0e55 28%, #982840 55%, #D85820 78%, #F09838 100%)',
    overlay: 'rgba(8, 4, 18, 0.48)',
    particles: null,
    palette: {
      accent: '#E07850', accentRgb: '224,120,80',
      surface: 'rgba(6, 3, 16, 0.88)', border: 'rgba(240,160,100,0.12)',
      glow: 'rgba(224,120,80,0.2)', text: '#F4E8D8', muted: '#9A6850',
    },
    time: ['golden_hour', 'sunset'], season: ['all'], section: ['all'], region: ['all'],
  },

  desert_sunset: {
    id: 'desert_sunset',
    label: 'Desert Sunset',
    photo: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #4A235A 0%, #C0392B 40%, #E67E22 70%, #F5A623 100%)',
    overlay: 'rgba(192, 57, 43, 0.42)',
    particles: 'dust',
    palette: {
      accent: '#E07850', accentRgb: '224,120,80',
      surface: 'rgba(18, 6, 0, 0.88)', border: 'rgba(240,160,100,0.12)',
      glow: 'rgba(224,120,80,0.2)', text: '#F4E8D8', muted: '#9A6850',
    },
    time: ['golden_hour', 'sunset'], season: ['harmattan', 'dry'], section: ['all'], region: ['all'],
  },

  // ─── NIGHT ───────────────────────────────────────────────────────────────────

  night_sky: {
    id: 'night_sky',
    label: 'Starry Night',
    photo: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #020408 0%, #040A1C 45%, #060E20 100%)',
    overlay: 'rgba(2, 4, 14, 0.50)',
    particles: 'stars',
    palette: {
      accent: '#8AAED4', accentRgb: '138,174,212',
      surface: 'rgba(2, 4, 16, 0.92)', border: 'rgba(140,180,220,0.12)',
      glow: 'rgba(138,174,212,0.12)', text: '#D8E4EE', muted: '#5A7090',
    },
    time: ['night', 'blue_hour'], season: ['all'], section: ['all'], region: ['all'],
  },

  fireplace: {
    id: 'fireplace',
    label: 'Cabin Fireplace',
    photo: 'https://images.unsplash.com/photo-1640557283858-59d8db7327ad?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(160deg, #0a0300 0%, #2a0d00 32%, #5a2008 60%, #C84808 88%, #E87820 100%)',
    overlay: 'rgba(14, 5, 0, 0.48)',
    particles: 'embers',
    palette: {
      accent: '#D4845A', accentRgb: '212,132,90',
      surface: 'rgba(10, 4, 0, 0.90)', border: 'rgba(240,180,120,0.12)',
      glow: 'rgba(212,132,90,0.28)', text: '#EEE0CC', muted: '#9A6840',
    },
    time: ['night', 'blue_hour'], season: ['winter', 'harmattan', 'fall', 'cool'], section: ['all'], region: ['all'],
  },

  night_city: {
    id: 'night_city',
    label: 'City Lights',
    photo: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #060810 0%, #0c1420 40%, #1a2030 80%, #0a0e18 100%)',
    overlay: 'rgba(6, 8, 16, 0.50)',
    particles: null,
    palette: {
      accent: '#7A9EC4', accentRgb: '122,158,196',
      surface: 'rgba(6, 8, 16, 0.90)', border: 'rgba(140,170,200,0.12)',
      glow: 'rgba(122,158,196,0.15)', text: '#D8E0EE', muted: '#5A6A80',
    },
    time: ['night', 'blue_hour'], season: ['all'], section: ['all'], region: ['all'],
  },

  aurora_mountains: {
    id: 'aurora_mountains',
    label: 'Aurora Borealis',
    photo: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #0a1628 0%, #0d3b2e 40%, #1a4a3a 70%, #2C3E50 100%)',
    overlay: 'rgba(76, 175, 125, 0.40)',
    particles: 'stars',
    palette: {
      accent: '#6BBF8A', accentRgb: '107,191,138',
      surface: 'rgba(4, 12, 16, 0.90)', border: 'rgba(120,200,160,0.12)',
      glow: 'rgba(107,191,138,0.15)', text: '#D4EEE0', muted: '#5A8A6A',
    },
    time: ['night'], season: ['winter'], section: ['all'], region: ['all'],
  },

  // ─── SEASONAL ────────────────────────────────────────────────────────────────

  cherry_blossoms: {
    id: 'cherry_blossoms',
    label: 'Cherry Blossoms',
    photo: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #6ab0d8 0%, #c8a0c0 40%, #f0b8cc 70%, #ffd0dc 100%)',
    overlay: 'rgba(50, 25, 42, 0.42)',
    particles: 'petals',
    palette: {
      accent: '#D4789A', accentRgb: '212,120,154',
      surface: 'rgba(36, 16, 28, 0.88)', border: 'rgba(240,180,210,0.12)',
      glow: 'rgba(212,120,154,0.2)', text: '#F4E8F0', muted: '#9A6888',
    },
    time: ['morning', 'midday'], season: ['spring'], section: ['all'], region: ['all'],
  },

  snowy_forest: {
    id: 'snowy_forest',
    label: 'Snowy Forest',
    photo: 'https://images.unsplash.com/photo-1554190907-650057d92a1a?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #c8dce8 0%, #98b8cc 38%, #5a7e94 70%, #243848 100%)',
    overlay: 'rgba(24, 38, 52, 0.45)',
    particles: 'snow',
    palette: {
      accent: '#A8C4D8', accentRgb: '168,196,216',
      surface: 'rgba(16, 28, 40, 0.90)', border: 'rgba(190,220,240,0.12)',
      glow: 'rgba(168,196,216,0.15)', text: '#E4EEF4', muted: '#6A8898',
    },
    time: ['morning', 'midday', 'golden_hour'], season: ['winter'], section: ['all'], region: ['all'],
  },

  autumn_leaves: {
    id: 'autumn_leaves',
    label: 'Autumn Forest',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(160deg, #180a00 0%, #3c1a04 30%, #6e3a10 60%, #a05820 100%)',
    overlay: 'rgba(18, 8, 2, 0.50)',
    particles: 'leaves',
    palette: {
      accent: '#C8855A', accentRgb: '200,133,90',
      surface: 'rgba(14, 6, 2, 0.90)', border: 'rgba(230,180,120,0.12)',
      glow: 'rgba(200,133,90,0.2)', text: '#EEE0CC', muted: '#8A6048',
    },
    time: ['morning', 'midday', 'golden_hour'], season: ['fall'], section: ['all'], region: ['all'],
  },

  tropical_green: {
    id: 'tropical_green',
    label: 'Tropical Green',
    photo: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #061a0a 0%, #0e2e14 30%, #1a4a22 60%, #2a6030 100%)',
    overlay: 'rgba(6, 20, 10, 0.48)',
    particles: null,
    palette: {
      accent: '#6BBF8A', accentRgb: '107,191,138',
      surface: 'rgba(6, 20, 10, 0.90)', border: 'rgba(140,210,160,0.12)',
      glow: 'rgba(107,191,138,0.15)', text: '#D4EED8', muted: '#527A5A',
    },
    time: ['all'], season: ['rainy', 'wet'], section: ['all'], region: ['nigeria', 'tropics'],
  },

  ocean_blue: {
    id: 'ocean_blue',
    label: 'Deep Ocean',
    photo: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #020810 0%, #041828 30%, #0a2840 60%, #0e3858 100%)',
    overlay: 'rgba(2, 8, 16, 0.50)',
    particles: null,
    palette: {
      accent: '#5BA8C8', accentRgb: '91,168,200',
      surface: 'rgba(4, 12, 24, 0.90)', border: 'rgba(120,180,220,0.12)',
      glow: 'rgba(91,168,200,0.15)', text: '#D4E8F0', muted: '#5A8098',
    },
    time: ['all'], season: ['all'], section: ['all'], region: ['all'],
  },

  mountain_lake: {
    id: 'mountain_lake',
    label: 'Mountain Lake',
    photo: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #87CEEB 0%, #5F9EA0 50%, #2C3E50 100%)',
    overlay: 'rgba(44, 62, 80, 0.42)',
    particles: 'mist',
    palette: {
      accent: '#90A8BC', accentRgb: '144,168,188',
      surface: 'rgba(12, 20, 30, 0.90)', border: 'rgba(180,210,230,0.12)',
      glow: 'rgba(144,168,188,0.15)', text: '#E8EEF4', muted: '#7A90A0',
    },
    time: ['dawn', 'morning'], season: ['spring', 'summer'], section: ['all'], region: ['all'],
  },

  african_savanna: {
    id: 'african_savanna',
    label: 'Savanna Sunset',
    photo: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #7B241C 0%, #C0392B 30%, #E67E22 60%, #F5A623 85%, #FFF3B0 100%)',
    overlay: 'rgba(230, 126, 34, 0.42)',
    particles: 'dust',
    palette: {
      accent: '#D4845A', accentRgb: '212,132,90',
      surface: 'rgba(18, 6, 0, 0.88)', border: 'rgba(240,180,100,0.12)',
      glow: 'rgba(212,132,90,0.22)', text: '#F0E0CC', muted: '#9A6844',
    },
    time: ['golden_hour', 'sunset'], season: ['harmattan', 'dry'], section: ['all'], region: ['nigeria', 'africa'],
  },

  desert_dunes: {
    id: 'desert_dunes',
    label: 'Golden Dunes',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&h=1080&fit=crop',
    fallback: 'linear-gradient(180deg, #F5A623 0%, #E67E22 50%, #D35400 100%)',
    overlay: 'rgba(245, 166, 35, 0.42)',
    particles: 'dust',
    palette: {
      accent: '#D4845A', accentRgb: '212,132,90',
      surface: 'rgba(18, 6, 0, 0.88)', border: 'rgba(240,180,100,0.12)',
      glow: 'rgba(212,132,90,0.22)', text: '#F0E0CC', muted: '#9A6844',
    },
    time: ['golden_hour', 'sunset'], season: ['harmattan', 'dry', 'summer'], section: ['all'], region: ['all'],
  },
};

// ─── Time Detection ───────────────────────────────────────────────────────────
export function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5  && h < 7)  return 'dawn';
  if (h >= 7  && h < 11) return 'morning';
  if (h >= 11 && h < 15) return 'midday';
  if (h >= 15 && h < 18) return 'golden_hour';
  if (h >= 18 && h < 20) return 'sunset';
  if (h >= 20 && h < 22) return 'blue_hour';
  return 'night';
}

// ─── Plain scene (no photo, calm gradient) ───────────────────────────────────
const PLAIN_SCENE = {
  id: 'plain',
  label: 'Plain',
  photo: null,
  fallback: 'linear-gradient(180deg, #080503 0%, #0F0804 50%, #080503 100%)',
  overlay: 'rgba(8, 5, 3, 0.4)',
  particles: null,
  palette: {
    accent: '#C8955C', accentRgb: '200,149,92',
    surface: 'rgba(20, 12, 6, 0.88)', border: 'rgba(200,149,92,0.12)',
    glow: 'rgba(200,149,92,0.18)', text: '#EAE0D5', muted: '#9B8A7A',
  },
  time: ['all'], season: ['all'], section: ['all'], region: ['all'],
};

// ─── Scene Picker ─────────────────────────────────────────────────────────────
export function pickScene({ section = 'all' } = {}) {
  try {
    const customRaw = localStorage.getItem('plos_custom_scene');
    if (customRaw) {
      const custom = JSON.parse(customRaw);
      if (custom?.photo) {
        return { ...SCENES.morning_coffee, ...custom, id: 'custom', particles: null };
      }
    }
  } catch {}

  const override = localStorage.getItem('plos_atmos_scene');
  if (override === 'plain') return PLAIN_SCENE;
  if (override && SCENES[override]) return SCENES[override];

  const time   = getTimeOfDay();
  const season = localStorage.getItem('currentSeason') || 'harmattan';
  const region = (localStorage.getItem('userCountry') || 'NG') === 'NG' ? 'nigeria' : 'usa';

  const all = Object.values(SCENES);

  const scored = all.map(scene => {
    let score = 0;
    if (scene.time.includes(time))           score += 4;
    if (scene.time.includes('all'))          score += 1;
    if (scene.season.includes(season))       score += 4;
    if (scene.season.includes('all'))        score += 1;
    if (scene.section.includes(section))     score += 3;
    if (scene.region.includes(region))       score += 2;
    if (scene.region.includes('all'))        score += 1;
    return { scene, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].scene;
}

export const DEFAULT_PALETTE = SCENES.morning_coffee.palette;
