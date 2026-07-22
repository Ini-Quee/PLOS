import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import {
  getColorsForMode,
  DarkTheme,
  type AppThemeMode,
  type ColorScheme,
} from '../constants/colors';
import { saveLocal, getLocal } from '../utils/storage';

const STORAGE_KEY = 'theme_mode';

interface ThemeContextValue {
  mode: AppThemeMode; // what the user picked: light | dark | auto
  colors: ColorScheme; // the resolved palette to use
  isDark: boolean;
  setMode: (mode: AppThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  colors: DarkTheme,
  isDark: true,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<AppThemeMode>('dark');

  // Restore the saved preference on launch.
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await getLocal(STORAGE_KEY);
      if (active && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
        setModeState(saved);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: AppThemeMode) => {
    setModeState(next); // instant switch
    saveLocal(STORAGE_KEY, next); // persist
  }, []);

  const colors = getColorsForMode(mode, system);
  const isDark = mode === 'dark' || (mode === 'auto' && system !== 'light');

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Active resolved palette. Use this in screens instead of the static Colors. */
export function useThemeColors(): ColorScheme {
  return useContext(ThemeContext).colors;
}

/** Full theme controls (mode + setMode + isDark). */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
