/**
 * PLOS Atmosphere System
 * Each scene is a complete emotional environment.
 * UI adapts its color palette to the scene — nothing feels "slapped on".
 */

export const SCENES = {

  // ─── MORNING ─────────────────────────────────────────────────────────────────

  morning_coffee: {
    id: 'morning_coffee',
    label: 'Morning Coffee',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(160deg, #2C1810 0%, #4A2C1A 35%, #7A4A28 65%, #C4885A 100%)',
    overlay: 'rgba(28, 14, 4, 0.32)',
    particles: null,
    palette: {
      accent: '#C8955C',
      accentRgb: '200,149,92',
      surface: 'rgba(20, 12, 6, 0.52)',
      border: 'rgba(255,220,160,0.08)',
      glow: 'rgba(200,149,92,0.18)',
      text: '#F0EAE0',
      muted: '#8A7A6A',
    },
    time: ['dawn', 'morning'],
    season: ['all'],
    section: ['dashboard', 'all'],
    region: ['all'],
  },

  morning_mountain_mist: {
    id: 'morning_mountain_mist',
    label: 'Mountain Mist',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #c9d6df 0%, #8a9eae 40%, #4a6070 70%, #1e3040 100%)',
    overlay: 'rgba(20, 32, 44, 0.28)',
    particles: 'mist',
    palette: {
      accent: '#90A8BC',
      accentRgb: '144,168,188',
      surface: 'rgba(12, 20, 30, 0.52)',
      border: 'rgba(180,210,230,0.08)',
      glow: 'rgba(144,168,188,0.15)',
      text: '#E8EEF4',
      muted: '#7A90A0',
    },
    time: ['dawn', 'morning'],
    season: ['spring', 'summer', 'fall'],
    section: ['all'],
    region: ['usa', 'europe', 'southern_hemisphere'],
  },

  // ─── RAIN / COZY ─────────────────────────────────────────────────────────────

  rain_window: {
    id: 'rain_window',
    label: 'Rain on the Window',
    photo: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #101520 0%, #1a2030 40%, #141c2c 80%, #0c1018 100%)',
    overlay: 'rgba(12, 16, 28, 0.38)',
    particles: 'rain',
    palette: {
      accent: '#7EB8C4',
      accentRgb: '126,184,196',
      surface: 'rgba(10, 14, 24, 0.58)',
      border: 'rgba(160,200,220,0.07)',
      glow: 'rgba(126,184,196,0.15)',
      text: '#DDE8EE',
      muted: '#6A8898',
    },
    time: ['all'],
    season: ['rainy', 'wet', 'fall', 'spring'],
    section: ['journal', 'all'],
    region: ['all'],
  },

  tropical_rain_forest: {
    id: 'tropical_rain_forest',
    label: 'Forest Rain',
    photo: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #060e06 0%, #0f1e0f 30%, #1a3a1a 60%, #2a5020 100%)',
    overlay: 'rgba(8, 18, 8, 0.32)',
    particles: 'rain',
    palette: {
      accent: '#7FB87F',
      accentRgb: '127,184,127',
      surface: 'rgba(6, 14, 6, 0.58)',
      border: 'rgba(160,220,160,0.07)',
      glow: 'rgba(127,184,127,0.15)',
      text: '#D8EED8',
      muted: '#5A8A5A',
    },
    time: ['all'],
    season: ['rainy', 'wet'],
    section: ['all'],
    region: ['nigeria', 'tropics'],
  },

  // ─── LIBRARY / READING ───────────────────────────────────────────────────────

  cozy_library: {
    id: 'cozy_library',
    label: 'The Library',
    photo: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(160deg, #180c04 0%, #2c1a08 30%, #3e2a10 60%, #5a3a18 100%)',
    overlay: 'rgba(18, 10, 3, 0.38)',
    particles: null,
    palette: {
      accent: '#C8955C',
      accentRgb: '200,149,92',
      surface: 'rgba(16, 9, 3, 0.58)',
      border: 'rgba(220,180,120,0.08)',
      glow: 'rgba(200,149,92,0.2)',
      text: '#EEE0CC',
      muted: '#8A6A4A',
    },
    time: ['all'],
    season: ['all'],
    section: ['books', 'journal'],
    region: ['all'],
  },

  // ─── SUNSET / GOLDEN HOUR ────────────────────────────────────────────────────

  harmattan_sunset: {
    id: 'harmattan_sunset',
    label: 'Harmattan Sunset',
    photo: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #180500 0%, #4a1200 20%, #8B3A0A 48%, #D4700A 72%, #E8A050 100%)',
    overlay: 'rgba(26, 8, 0, 0.28)',
    particles: 'dust',
    palette: {
      accent: '#D4845A',
      accentRgb: '212,132,90',
      surface: 'rgba(18, 6, 0, 0.52)',
      border: 'rgba(240,180,100,0.08)',
      glow: 'rgba(212,132,90,0.22)',
      text: '#F0E0CC',
      muted: '#9A6844',
    },
    time: ['golden_hour', 'sunset'],
    season: ['harmattan', 'dry', 'hot'],
    section: ['all'],
    region: ['nigeria', 'tropics', 'middle_east'],
  },

  beach_sunset: {
    id: 'beach_sunset',
    label: 'Beach Sunset',
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #080020 0%, #3a0e55 28%, #982840 55%, #D85820 78%, #F09838 100%)',
    overlay: 'rgba(8, 4, 18, 0.28)',
    particles: null,
    palette: {
      accent: '#E07850',
      accentRgb: '224,120,80',
      surface: 'rgba(6, 3, 16, 0.52)',
      border: 'rgba(240,160,100,0.08)',
      glow: 'rgba(224,120,80,0.2)',
      text: '#F4E8D8',
      muted: '#9A6850',
    },
    time: ['golden_hour', 'sunset'],
    season: ['all'],
    section: ['all'],
    region: ['usa', 'europe', 'tropics', 'southern_hemisphere'],
  },

  // ─── NIGHT ───────────────────────────────────────────────────────────────────

  night_starfield: {
    id: 'night_starfield',
    label: 'Starry Night',
    photo: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #020408 0%, #040A1C 45%, #060E20 100%)',
    overlay: 'rgba(2, 4, 14, 0.32)',
    particles: 'stars',
    palette: {
      accent: '#8AAED4',
      accentRgb: '138,174,212',
      surface: 'rgba(2, 4, 16, 0.62)',
      border: 'rgba(140,180,220,0.07)',
      glow: 'rgba(138,174,212,0.12)',
      text: '#D8E4EE',
      muted: '#5A7090',
    },
    time: ['night', 'blue_hour'],
    season: ['all'],
    section: ['all'],
    region: ['all'],
  },

  fireplace_cabin: {
    id: 'fireplace_cabin',
    label: 'Cabin Fireplace',
    photo: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(160deg, #0a0300 0%, #2a0d00 32%, #5a2008 60%, #C84808 88%, #E87820 100%)',
    overlay: 'rgba(14, 5, 0, 0.28)',
    particles: 'embers',
    palette: {
      accent: '#D4845A',
      accentRgb: '212,132,90',
      surface: 'rgba(10, 4, 0, 0.58)',
      border: 'rgba(240,180,120,0.09)',
      glow: 'rgba(212,132,90,0.28)',
      text: '#EEE0CC',
      muted: '#9A6840',
    },
    time: ['night', 'blue_hour'],
    season: ['winter', 'harmattan', 'fall', 'cool'],
    section: ['all'],
    region: ['all'],
  },

  // ─── SEASONAL ────────────────────────────────────────────────────────────────

  cherry_blossoms: {
    id: 'cherry_blossoms',
    label: 'Cherry Blossoms',
    photo: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #6ab0d8 0%, #c8a0c0 40%, #f0b8cc 70%, #ffd0dc 100%)',
    overlay: 'rgba(50, 25, 42, 0.18)',
    particles: 'petals',
    palette: {
      accent: '#D4789A',
      accentRgb: '212,120,154',
      surface: 'rgba(36, 16, 28, 0.52)',
      border: 'rgba(240,180,210,0.08)',
      glow: 'rgba(212,120,154,0.2)',
      text: '#F4E8F0',
      muted: '#9A6888',
    },
    time: ['morning', 'midday'],
    season: ['spring'],
    section: ['all'],
    region: ['all'],
  },

  snowy_forest: {
    id: 'snowy_forest',
    label: 'Snowy Forest',
    photo: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(180deg, #c8dce8 0%, #98b8cc 38%, #5a7e94 70%, #243848 100%)',
    overlay: 'rgba(24, 38, 52, 0.2)',
    particles: 'snow',
    palette: {
      accent: '#A8C4D8',
      accentRgb: '168,196,216',
      surface: 'rgba(16, 28, 40, 0.58)',
      border: 'rgba(190,220,240,0.08)',
      glow: 'rgba(168,196,216,0.15)',
      text: '#E4EEF4',
      muted: '#6A8898',
    },
    time: ['morning', 'midday', 'golden_hour'],
    season: ['winter'],
    section: ['all'],
    region: ['usa', 'europe', 'southern_hemisphere'],
  },

  autumn_forest: {
    id: 'autumn_forest',
    label: 'Autumn Forest',
    photo: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1920&q=85&fit=crop&auto=format',
    fallback: 'linear-gradient(160deg, #180a00 0%, #3c1a04 30%, #6e3a10 60%, #a05820 100%)',
    overlay: 'rgba(18, 8, 2, 0.32)',
    particles: 'leaves',
    palette: {
      accent: '#C8855A',
      accentRgb: '200,133,90',
      surface: 'rgba(14, 6, 2, 0.58)',
      border: 'rgba(230,180,120,0.08)',
      glow: 'rgba(200,133,90,0.2)',
      text: '#EEE0CC',
      muted: '#8A6048',
    },
    time: ['morning', 'midday', 'golden_hour'],
    season: ['fall'],
    section: ['books', 'journal', 'all'],
    region: ['usa', 'europe'],
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

// ─── Scene Picker ─────────────────────────────────────────────────────────────
export function pickScene({ section = 'all' } = {}) {
  const override = localStorage.getItem('plos_atmos_scene');
  if (override && SCENES[override]) return SCENES[override];

  const time   = getTimeOfDay();
  const season = localStorage.getItem('currentSeason') || 'harmattan';
  const region = (localStorage.getItem('userCountry') || 'NG') === 'NG' ? 'nigeria' : 'usa';

  const all = Object.values(SCENES);

  // Score each scene: time match + season match + section match + region match
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
