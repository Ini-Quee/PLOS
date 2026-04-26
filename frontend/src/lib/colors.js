/**
 * PLOS Color System
 *
 * Dark theme optimized for OLED displays and low-light usage.
 * All colors tested for WCAG AA accessibility.
 */

export const Colors = {
  // Base backgrounds
  background: '#0A0A0F',     // Deepest black - main app background
  surface: '#13131A',        // Elevated surfaces (tab bar, modals)
  card: '#1C1C27',           // Cards and containers
  border: '#2D2D3A',         // Borders and dividers

  // Brand colors
  blue: '#4A9EFF',           // Primary actions, links
  purple: '#8B5CF6',         // Journal, creativity, AI
  teal: '#14B8A6',           // Budget, money, growth
  green: '#10B981',          // Habits, health, success
  gold: '#F5A623',           // Premium, Bible, achievements (Lumi's color)
  coral: '#F87171',          // Warnings, limits, errors
  indigo: '#6366F1',         // Sleep, evening, calm

  // Text hierarchy
  textPrimary: '#FFFFFF',      // Headings, important text
  textSecondary: '#9CA3AF',    // Body text, descriptions
  textMuted: '#4B5563',        // Placeholder, disabled text

  // Semantic colors
  success: '#10B981',
  warning: '#F5A623',
  error: '#F87171',
  info: '#4A9EFF',
};

/**
 * Module-specific accent colors
 * Used for left borders, badges, and feature identification
 */
export const ModuleColors = {
  journal: '#8B5CF6',     // Purple - introspection
  budget: '#14B8A6',      // Teal - growth/money
  habits: '#10B981',      // Green - health/progress
  sleep: '#6366F1',       // Indigo - calm/rest
  bible: '#F5A623',       // Gold - sacred/premium
  hydration: '#4A9EFF',   // Blue - water
  focus: '#F87171',       // Coral - energy/attention
  reading: '#8B5CF6',     // Purple - knowledge
  exercise: '#10B981',    // Green - vitality
  prayer: '#F5A623',      // Gold - spiritual
  lumi: '#F5A623',        // Gold - Lumi's signature color
  dashboard: '#4A9EFF',   // Blue - main hub
  settings: '#9CA3AF',    // Gray - neutral
};

/**
 * Color utilities for dynamic theming
 */
export const getColorWithOpacity = (color, opacity) => {
  // Convert hex to rgba with opacity
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const gradients = {
  primary: ['#4A9EFF', '#8B5CF6'],    // Blue to purple
  success: ['#10B981', '#14B8A6'],    // Green to teal
  premium: ['#F5A623', '#F87171'],    // Gold to coral
  calm: ['#6366F1', '#8B5CF6'],        // Indigo to purple
  ocean: ['#14B8A6', '#4A9EFF'],       // Teal to blue
  fire: ['#F87171', '#F5A623'],        // Coral to gold
};

/**
 * Get gradient CSS string
 */
export const getGradient = (gradientName, direction = '135deg') => {
  const grad = gradients[gradientName];
  if (!grad) return null;
  return `linear-gradient(${direction}, ${grad[0]}, ${grad[1]})`;
};

/**
 * Get glow color for module
 */
export const getModuleGlow = (moduleName, intensity = 0.3) => {
  const color = ModuleColors[moduleName] || Colors.gold;
  return getColorWithOpacity(color, intensity);
};

export default {
  Colors,
  ModuleColors,
  getColorWithOpacity,
  gradients,
  getGradient,
  getModuleGlow,
};
