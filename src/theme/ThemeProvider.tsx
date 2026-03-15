import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { getSettings, updateSettings } from '../db/settingsRepo';
import { darkColors, lightColors } from './colors';
import type { ThemeColors } from './colors';
import type { ThemePreference } from '../types/models';

type ThemeContextValue = {
  colors: ThemeColors;
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (next: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    getSettings()
      .then((settings) => {
        if (active) {
          setPreferenceState(settings.theme);
        }
      })
      .catch(() => {
        if (active) {
          setPreferenceState('system');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const resolvedTheme = preference === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : preference;
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  async function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    const settings = await getSettings();
    await updateSettings({ ...settings, theme: next });
  }

  return (
    <ThemeContext.Provider value={{ colors, preference, resolvedTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
