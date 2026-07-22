import { useColorScheme } from 'react-native';

// ─── Dark Theme (default) ──────────────────────────────────────────────────
const DarkTheme = {
  background: '#080503',
  surface: '#140C06',
  card: 'rgba(20, 12, 6, 0.90)',
  border: 'rgba(200, 149, 92, 0.09)',

  amber: '#C8955C',
  amberBright: '#D4A06A',
  purple: '#9B7FD4',
  teal: '#5BA88A',
  tealSoft: '#7ABFB8',
  blue: '#7AAEE8',
  gold: '#D4A06A',
  coral: '#E05252',
  green: '#4CAF7D',

  white: '#F5EDE2',
  textPrimary: '#EAE0D5',
  textSecondary: '#9B8A7A',
  textMuted: '#5E5048',

  tabBar: '#0D0A07',
  tabActive: '#C8955C',
  tabInactive: '#5E5048',
};

// ─── Coloured Theme — warm woody with richer accents ─────────────────────
const ColouredTheme = {
  background: '#0F0804',
  surface: '#1E1208',
  card: 'rgba(30, 18, 8, 0.92)',
  border: 'rgba(212, 160, 106, 0.15)',

  amber: '#D4A06A',
  amberBright: '#E0B080',
  purple: '#9B7FD4',
  teal: '#5BA88A',
  tealSoft: '#7ABFB8',
  blue: '#7AAEE8',
  gold: '#D4A06A',
  coral: '#E05252',
  green: '#4CAF7D',

  white: '#F5EDE2',
  textPrimary: '#F5EDE2',
  textSecondary: '#C4A882',
  textMuted: '#7A6450',

  tabBar: '#120804',
  tabActive: '#D4A06A',
  tabInactive: '#7A6450',
};

// ─── Light Theme (new) — warm, bright, morning energy ─────────────────────
export const LightTheme = {
  background: '#FBF6EF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: 'rgba(60, 40, 20, 0.08)',

  amber: '#B07A3C',
  amberBright: '#C8955C',
  purple: '#7A5FB0',
  teal: '#3E8C72',
  tealSoft: '#5BA88A',
  blue: '#185FA5',
  gold: '#B07A3C',
  coral: '#D85A30',
  green: '#3B6D11',

  white: '#2B2018',
  textPrimary: '#2B2018',
  textSecondary: '#6B5A48',
  textMuted: '#9A8A78',

  tabBar: '#FBF6EF',
  tabActive: '#B07A3C',
  tabInactive: '#9A8A78',
};

// A resolved palette has the same shape as the dark theme.
export type ColorScheme = typeof DarkTheme;
export type AppThemeMode = 'light' | 'dark' | 'auto';

// Resolve which palette to use for a chosen mode + the OS appearance.
export function getColorsForMode(
  mode: AppThemeMode,
  systemScheme: 'light' | 'dark' | null | undefined
): ColorScheme {
  if (mode === 'light') return LightTheme;
  if (mode === 'dark') return DarkTheme;
  return systemScheme === 'light' ? LightTheme : DarkTheme; // auto
}

export { DarkTheme };

// ─── Color constants (theme-independent) ──────────────────────────────────
export const Colors = {
  ...DarkTheme,

  // Module accents (constant across themes)
  modulePersonal: '#C8955C',
  moduleSpiritual: '#9B7FD4',
  moduleBudget: '#5BA88A',
  moduleWellness: '#7ABFB8',
  moduleGoals: '#7AAEE8',
  moduleBusiness: '#D4A06A',
};

// ─── Theme hook ──────────────────────────────────────────────────────────
export type ThemeMode = 'coloured' | 'dark' | 'auto';

export function useTheme(mode: ThemeMode = 'auto') {
  const systemScheme = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'auto' && systemScheme === 'dark');
  return isDark ? DarkTheme : ColouredTheme;
}

export function getTheme(mode: ThemeMode, systemScheme: 'light' | 'dark' | null | undefined) {
  const isDark = mode === 'dark' || (mode === 'auto' && systemScheme !== 'light');
  return isDark ? DarkTheme : ColouredTheme;
}

export const ModuleColors = {
  personal: '#C8955C',
  spiritual: '#9B7FD4',
  budget: '#5BA88A',
  wellness: '#7ABFB8',
  goals: '#7AAEE8',
  business: '#D4A06A',
  journal: '#C8955C',
  habits: '#4CAF7D',
  sleep: '#9B7FD4',
  bible: '#C8955C',
  hydration: '#7AAEE8',
  focus: '#E05252',
  reading: '#9B7FD4',
  exercise: '#4CAF7D',
  prayer: '#C8955C',
  lumi: '#C8955C',
  dashboard: '#7AAEE8',
  settings: '#9B8A7A',
};

export const getColorWithOpacity = (color: string, opacity: number) => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const gradients = {
  primary: ['#C8955C', '#D4A06A'],
  success: ['#4CAF7D', '#5BA88A'],
  premium: ['#D4A06A', '#E0B080'],
  calm: ['#9B7FD4', '#7AAEE8'],
  ocean: ['#5BA88A', '#7ABFB8'],
  fire: ['#E05252', '#D4A06A'],
};

export const getGradient = (gradientName: string, direction = '135deg') => {
  const grad = gradients[gradientName as keyof typeof gradients];
  if (!grad) return null;
  return `linear-gradient(${direction}, ${grad[0]}, ${grad[1]})`;
};

export const getModuleGlow = (moduleName: string, intensity = 0.3) => {
  const color = ModuleColors[moduleName as keyof typeof ModuleColors] || Colors.amber;
  return getColorWithOpacity(color, intensity);
};

export default {
  Colors,
  ModuleColors,
  getColorWithOpacity,
  gradients,
  getGradient,
  getModuleGlow,
  useTheme,
  getTheme,
};
