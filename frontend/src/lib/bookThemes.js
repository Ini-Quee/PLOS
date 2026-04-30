/**
 * Book-Specific Theme Definitions
 * Each book type has unique visuals that adapt to seasons
 */

import { SEASONS } from './seasonDetection';

export const BOOK_TYPES = {
  PERSONAL: 'personal',
  SPIRITUAL: 'spiritual',
  GOALS: 'goals',
  BUSINESS: 'business',
  WELLNESS: 'wellness',
  BUDGET: 'budget',
};

/**
 * Define visual themes for each book type + season combination
 */
export const BOOK_THEMES = {
  // ─── PERSONAL (Everyday Life) ────────────────────────────────────
  [BOOK_TYPES.PERSONAL]: {
    base: {
      name: 'Everyday Life',
      primaryColor: '#5a7a5a',
      accentColor: '#7fb87f',
      mood: 'natural-calm',
    },
    seasons: {
      [SEASONS.HARMATTAN]: {
        gradient1: 'rgba(200, 180, 120, 0.35)',
        gradient2: 'rgba(180, 160, 100, 0.25)',
        particleColor: '#d4c4a0',
        ambience: 'golden-dusty',
        description: 'Dry grass and warm earth',
      },
      [SEASONS.RAINY]: {
        gradient1: 'rgba(100, 150, 100, 0.4)',
        gradient2: 'rgba(127, 184, 127, 0.3)',
        particleColor: '#7fb87f',
        ambience: 'fresh-green',
        description: 'Fresh leaves and rain',
      },
      [SEASONS.SPRING]: {
        gradient1: 'rgba(127, 184, 127, 0.45)',
        gradient2: 'rgba(152, 211, 152, 0.35)',
        particleColor: '#98d398',
        ambience: 'blooming-fresh',
        description: 'New growth and flowers',
      },
      [SEASONS.SUMMER]: {
        gradient1: 'rgba(90, 150, 90, 0.5)',
        gradient2: 'rgba(127, 200, 127, 0.4)',
        particleColor: '#4a9a4a',
        ambience: 'vibrant-lush',
        description: 'Full greenery',
      },
      [SEASONS.FALL]: {
        gradient1: 'rgba(200, 160, 100, 0.45)',
        gradient2: 'rgba(220, 170, 110, 0.35)',
        particleColor: '#d4a060',
        ambience: 'warm-earthy',
        description: 'Falling leaves',
      },
      [SEASONS.WINTER]: {
        gradient1: 'rgba(120, 160, 120, 0.35)',
        gradient2: 'rgba(150, 200, 150, 0.25)',
        particleColor: '#7fb87f',
        ambience: 'quiet-minimal',
        description: 'Still and reflective',
      },
    },
  },

  // ─── SPIRITUAL (Bible & Faith) ────────────────────────────────────
  [BOOK_TYPES.SPIRITUAL]: {
    base: {
      name: 'Bible & Faith',
      primaryColor: '#7a5a3a',
      accentColor: '#F5A623',
      mood: 'sacred-warm',
    },
    seasons: {
      [SEASONS.HARMATTAN]: {
        gradient1: 'rgba(245, 180, 60, 0.4)',
        gradient2: 'rgba(255, 200, 100, 0.3)',
        particleColor: '#ffbe4d',
        ambience: 'golden-sacred',
        description: 'Candlelight and incense',
      },
      [SEASONS.RAINY]: {
        gradient1: 'rgba(180, 140, 80, 0.4)',
        gradient2: 'rgba(160, 120, 70, 0.3)',
        particleColor: '#d4c4a0',
        ambience: 'contemplative-warm',
        description: 'Warm shelter from rain',
      },
      [SEASONS.SPRING]: {
        gradient1: 'rgba(255, 220, 140, 0.4)',
        gradient2: 'rgba(255, 230, 170, 0.3)',
        particleColor: '#f5c878',
        ambience: 'hopeful-light',
        description: 'Easter morning light',
      },
      [SEASONS.SUMMER]: {
        gradient1: 'rgba(245, 180, 50, 0.5)',
        gradient2: 'rgba(255, 200, 80, 0.4)',
        particleColor: '#F5A623',
        ambience: 'bright-blessed',
        description: 'Sunlight through stained glass',
      },
      [SEASONS.FALL]: {
        gradient1: 'rgba(220, 140, 60, 0.45)',
        gradient2: 'rgba(200, 130, 50, 0.35)',
        particleColor: '#d49040',
        ambience: 'harvest-grateful',
        description: 'Thanksgiving warmth',
      },
      [SEASONS.WINTER]: {
        gradient1: 'rgba(160, 120, 80, 0.35)',
        gradient2: 'rgba(140, 100, 70, 0.25)',
        particleColor: '#d4c4a0',
        ambience: 'quiet-reverent',
        description: 'Silent night prayer',
      },
    },
  },

  // ─── GOALS (Vision) ───────────────────────────────────────────────
  [BOOK_TYPES.GOALS]: {
    base: {
      name: 'Goals & Vision',
      primaryColor: '#3a4a7a',
      accentColor: '#9b7fe8',
      mood: 'ambitious-focused',
    },
    seasons: {
      [SEASONS.HARMATTAN]: {
        gradient1: 'rgba(180, 150, 240, 0.4)',
        gradient2: 'rgba(160, 130, 230, 0.3)',
        particleColor: '#b4a0e6',
        ambience: 'clear-focused',
        description: 'Clear horizon, sharp vision',
      },
      [SEASONS.RAINY]: {
        gradient1: 'rgba(120, 140, 200, 0.4)',
        gradient2: 'rgba(100, 120, 180, 0.3)',
        particleColor: '#9ba8d4',
        ambience: 'stormy-determined',
        description: 'Breaking through clouds',
      },
      [SEASONS.SPRING]: {
        gradient1: 'rgba(200, 170, 255, 0.45)',
        gradient2: 'rgba(220, 200, 255, 0.35)',
        particleColor: '#c8b8f5',
        ambience: 'new-beginnings',
        description: 'Fresh possibilities',
      },
      [SEASONS.SUMMER]: {
        gradient1: 'rgba(160, 140, 240, 0.5)',
        gradient2: 'rgba(180, 160, 250, 0.4)',
        particleColor: '#a090e8',
        ambience: 'peak-energy',
        description: 'Mountain summit',
      },
      [SEASONS.FALL]: {
        gradient1: 'rgba(180, 150, 220, 0.45)',
        gradient2: 'rgba(160, 130, 200, 0.35)',
        particleColor: '#b8a0d4',
        ambience: 'harvest-achievement',
        description: 'Reaping rewards',
      },
      [SEASONS.WINTER]: {
        gradient1: 'rgba(100, 120, 180, 0.35)',
        gradient2: 'rgba(120, 140, 200, 0.25)',
        particleColor: '#9ba8d4',
        ambience: 'strategic-planning',
        description: 'Starlit planning',
      },
    },
  },

  // ─── BUSINESS (PLOS Build) ────────────────────────────────────────
  [BOOK_TYPES.BUSINESS]: {
    base: {
      name: 'Business Journal',
      primaryColor: '#7a6a3a',
      accentColor: '#ffbe4d',
      mood: 'innovative-driven',
    },
    seasons: {
      [SEASONS.HARMATTAN]: {
        gradient1: 'rgba(255, 200, 90, 0.4)',
        gradient2: 'rgba(255, 180, 50, 0.3)',
        particleColor: '#ffbe4d',
        ambience: 'focused-grind',
        description: 'Late night coding sessions',
      },
      [SEASONS.RAINY]: {
        gradient1: 'rgba(180, 160, 100, 0.4)',
        gradient2: 'rgba(160, 140, 80, 0.3)',
        particleColor: '#d4c4a0',
        ambience: 'productive-flow',
        description: 'Rain on office windows',
      },
      [SEASONS.SPRING]: {
        gradient1: 'rgba(255, 230, 150, 0.45)',
        gradient2: 'rgba(255, 245, 200, 0.35)',
        particleColor: '#ffe8a0',
        ambience: 'launch-energy',
        description: 'Product launch excitement',
      },
      [SEASONS.SUMMER]: {
        gradient1: 'rgba(255, 200, 90, 0.5)',
        gradient2: 'rgba(255, 220, 140, 0.4)',
        particleColor: '#ffbe4d',
        ambience: 'growth-hustle',
        description: 'Scaling up',
      },
      [SEASONS.FALL]: {
        gradient1: 'rgba(240, 180, 70, 0.45)',
        gradient2: 'rgba(220, 160, 100, 0.35)',
        particleColor: '#e8c060',
        ambience: 'profitable-success',
        description: 'Counting wins',
      },
      [SEASONS.WINTER]: {
        gradient1: 'rgba(180, 160, 100, 0.35)',
        gradient2: 'rgba(160, 140, 80, 0.25)',
        particleColor: '#d4c4a0',
        ambience: 'strategic-pivot',
        description: 'Planning next year',
      },
    },
  },

  // ─── WELLNESS (Mental Health) ─────────────────────────────────────
  [BOOK_TYPES.WELLNESS]: {
    base: {
      name: 'Mental Health',
      primaryColor: '#7a3a5a',
      accentColor: '#e87f9b',
      mood: 'gentle-healing',
    },
    seasons: {
      [SEASONS.HARMATTAN]: {
        gradient1: 'rgba(240, 160, 180, 0.4)',
        gradient2: 'rgba(255, 180, 200, 0.3)',
        particleColor: '#f0a0b4',
        ambience: 'soft-comfort',
        description: 'Gentle self-care',
      },
      [SEASONS.RAINY]: {
        gradient1: 'rgba(160, 210, 180, 0.4)',
        gradient2: 'rgba(180, 230, 200, 0.3)',
        particleColor: '#b0d8c8',
        ambience: 'calm-renewal',
        description: 'Cleansing rain',
      },
      [SEASONS.SPRING]: {
        gradient1: 'rgba(255, 200, 215, 0.45)',
        gradient2: 'rgba(255, 220, 235, 0.35)',
        particleColor: '#ffd8e0',
        ambience: 'blooming-hope',
        description: 'Cherry blossoms',
      },
      [SEASONS.SUMMER]: {
        gradient1: 'rgba(240, 160, 180, 0.5)',
        gradient2: 'rgba(255, 180, 200, 0.4)',
        particleColor: '#f0a0b4',
        ambience: 'vibrant-joy',
        description: 'Sunflower fields',
      },
      [SEASONS.FALL]: {
        gradient1: 'rgba(220, 150, 170, 0.45)',
        gradient2: 'rgba(200, 130, 150, 0.35)',
        particleColor: '#d890a6',
        ambience: 'cozy-safe',
        description: 'Warm tea and blankets',
      },
      [SEASONS.WINTER]: {
        gradient1: 'rgba(180, 100, 130, 0.35)',
        gradient2: 'rgba(160, 80, 110, 0.25)',
        particleColor: '#b06080',
        ambience: 'quiet-reflection',
        description: 'Hibernation and rest',
      },
    },
  },

  // ─── BUDGET (Money Management) ────────────────────────────────────
  [BOOK_TYPES.BUDGET]: {
    base: {
      name: 'Budget Diary',
      primaryColor: '#3a7a6a',
      accentColor: '#00c9a7',
      mood: 'organized-prosperous',
    },
    seasons: {
      [SEASONS.HARMATTAN]: {
        gradient1: 'rgba(40, 220, 190, 0.4)',
        gradient2: 'rgba(20, 200, 170, 0.3)',
        particleColor: '#28dcb8',
        ambience: 'clear-tracking',
        description: 'Counting savings',
      },
      [SEASONS.RAINY]: {
        gradient1: 'rgba(80, 160, 140, 0.4)',
        gradient2: 'rgba(60, 140, 120, 0.3)',
        particleColor: '#50a090',
        ambience: 'growing-wealth',
        description: 'Money growing like plants',
      },
      [SEASONS.SPRING]: {
        gradient1: 'rgba(60, 250, 210, 0.45)',
        gradient2: 'rgba(120, 255, 230, 0.35)',
        particleColor: '#3cfad2',
        ambience: 'new-investments',
        description: 'Seeds of wealth',
      },
      [SEASONS.SUMMER]: {
        gradient1: 'rgba(40, 220, 190, 0.5)',
        gradient2: 'rgba(20, 200, 170, 0.4)',
        particleColor: '#28dcb8',
        ambience: 'abundant-flow',
        description: 'Cash flow streams',
      },
      [SEASONS.FALL]: {
        gradient1: 'rgba(220, 170, 110, 0.45)',
        gradient2: 'rgba(240, 180, 70, 0.35)',
        particleColor: '#dcb060',
        ambience: 'harvest-profit',
        description: 'Reaping financial rewards',
      },
      [SEASONS.WINTER]: {
        gradient1: 'rgba(80, 160, 140, 0.35)',
        gradient2: 'rgba(60, 140, 120, 0.25)',
        particleColor: '#50a090',
        ambience: 'saving-season',
        description: 'Building reserves',
      },
    },
  },
};

/**
 * Get theme configuration for specific book + season
 */
export function getBookTheme(bookType, season) {
  const bookTheme = BOOK_THEMES[bookType];
  if (!bookTheme) return null;

  const seasonalTheme = bookTheme.seasons[season] || bookTheme.seasons[SEASONS.HARMATTAN];

  return {
    ...bookTheme.base,
    ...seasonalTheme,
    season,
  };
}

/**
 * Get book type from journal type
 */
export function getBookTypeFromJournalType(journalType) {
  const typeMap = {
    personal: BOOK_TYPES.PERSONAL,
    spiritual: BOOK_TYPES.SPIRITUAL,
    goals: BOOK_TYPES.GOALS,
    business: BOOK_TYPES.BUSINESS,
    wellness: BOOK_TYPES.WELLNESS,
    budget: BOOK_TYPES.BUDGET,
  };
  return typeMap[journalType] || BOOK_TYPES.PERSONAL;
}

export default {
  BOOK_TYPES,
  BOOK_THEMES,
  getBookTheme,
  getBookTypeFromJournalType,
};
