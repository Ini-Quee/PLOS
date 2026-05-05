export const Colors = {
  // Base backgrounds — woody dark
  background: '#080503',
  surface: '#140C06',
  card: '#16100A',
  border: 'rgba(200, 149, 92, 0.09)',

  // Brand / accent
  amber: '#C8955C',
  amberBright: '#D4A06A',
  purple: '#9B7FD4',
  teal: '#5BA88A',
  tealSoft: '#7ABFB8',
  blue: '#7AAEE8',
  sienna: '#D4A06A',
  coral: '#E05252',
  green: '#4CAF7D',

  // Text hierarchy
  textPrimary: '#EAE0D5',
  textSecondary: '#9B8A7A',
  textMuted: '#5E5048',

  // Semantic
  success: '#4CAF7D',
  warning: '#C8955C',
  error: '#E05252',
  info: '#7AAEE8',
};

export const ModuleColors = {
  personal:  '#C8955C',   // amber
  spiritual: '#9B7FD4',   // muted purple
  budget:    '#5BA88A',   // muted teal/sage
  wellness:  '#7ABFB8',   // soft teal
  goals:     '#7AAEE8',   // muted blue
  business:  '#D4A06A',   // sienna/gold
  // legacy keys
  journal:   '#C8955C',
  habits:    '#4CAF7D',
  sleep:     '#9B7FD4',
  bible:     '#C8955C',
  hydration: '#7AAEE8',
  focus:     '#E05252',
  reading:   '#9B7FD4',
  exercise:  '#4CAF7D',
  prayer:    '#C8955C',
  lumi:      '#C8955C',
  dashboard: '#7AAEE8',
  settings:  '#9B8A7A',
};

export const getColorWithOpacity = (color, opacity) => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const gradients = {
  primary: ['#C8955C', '#D4A06A'],
  success: ['#4CAF7D', '#5BA88A'],
  premium: ['#C8955C', '#D4A06A'],
  calm:    ['#9B7FD4', '#7AAEE8'],
  ocean:   ['#5BA88A', '#7ABFB8'],
  fire:    ['#E05252', '#C8955C'],
};

export const getGradient = (gradientName, direction = '135deg') => {
  const grad = gradients[gradientName];
  if (!grad) return null;
  return `linear-gradient(${direction}, ${grad[0]}, ${grad[1]})`;
};

export const getModuleGlow = (moduleName, intensity = 0.3) => {
  const color = ModuleColors[moduleName] || Colors.amber;
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
