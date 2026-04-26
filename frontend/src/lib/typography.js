/**
 * PLOS Typography System
 *
 * Type scale based on 8px grid system.
 * Optimized for mobile readability (16px minimum for body text).
 */

export const Typography = {
  // Display & hero text
  hero: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700', // Bold
    letterSpacing: -0.5,
  },

  // Page titles
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600', // Semibold
    letterSpacing: -0.3,
  },

  // Section headings
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500', // Medium
    letterSpacing: -0.2,
  },

  // Body text
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400', // Regular
    letterSpacing: 0,
  },

  // Secondary text, descriptions
  caption: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400', // Regular
    letterSpacing: 0,
  },

  // Labels, badges, metadata
  micro: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500', // Medium
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Button text
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600', // Semibold
    letterSpacing: 0.2,
  },
};

/**
 * Font weights as numeric values for StyleSheet
 */
export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/**
 * Spacing scale (multiples of 4px)
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

/**
 * Border radius scale
 */
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999, // Fully rounded
};

/**
 * Font families
 */
export const FontFamilies = {
  display: "'DM Serif Display', serif",    // Headings, Lumi's voice
  body: "'Inter', system-ui, sans-serif",  // UI text, buttons, inputs
  handwriting: "'Caveat', cursive",        // Journal dates, affirmations
};

/**
 * Get typography style object
 */
export const getTypography = (name) => {
  const style = Typography[name];
  if (!style) return null;
  
  return {
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    ...(style.textTransform && { textTransform: style.textTransform }),
  };
};

/**
 * Get font family for use case
 */
export const getFontFamily = (useCase) => {
  switch (useCase) {
    case 'display':
    case 'heading':
      return FontFamilies.display;
    case 'handwriting':
    case 'journal':
      return FontFamilies.handwriting;
    case 'body':
    default:
      return FontFamilies.body;
  }
};

export default {
  Typography,
  FontWeights,
  Spacing,
  BorderRadius,
  FontFamilies,
  getTypography,
  getFontFamily,
};
