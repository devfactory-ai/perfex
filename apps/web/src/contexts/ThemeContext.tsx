/**
 * Theme Context - Multi-theme design system
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'modern' | 'classic' | 'minimal' | 'ocean' | 'forest' | 'sunset' | 'midnight';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Available theme presets
export const themePresets: ThemeConfig[] = [
  {
    id: 'modern',
    name: 'Moderne',
    description: 'Design épuré avec des tons bleus professionnels',
    preview: { primary: '#1e40af', secondary: '#3b82f6', accent: '#60a5fa' },
  },
  {
    id: 'classic',
    name: 'Classique',
    description: 'Style intemporel avec des couleurs neutres',
    preview: { primary: '#374151', secondary: '#6b7280', accent: '#9ca3af' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Interface ultra-simple en noir et blanc',
    preview: { primary: '#171717', secondary: '#404040', accent: '#737373' },
  },
  {
    id: 'ocean',
    name: 'Océan',
    description: 'Tons bleu-vert apaisants et rafraîchissants',
    preview: { primary: '#0d9488', secondary: '#14b8a6', accent: '#5eead4' },
  },
  {
    id: 'forest',
    name: 'Forêt',
    description: 'Couleurs vertes naturelles et terreuses',
    preview: { primary: '#166534', secondary: '#22c55e', accent: '#86efac' },
  },
  {
    id: 'sunset',
    name: 'Coucher de soleil',
    description: 'Tons chauds orange et rose vibrants',
    preview: { primary: '#c2410c', secondary: '#f97316', accent: '#fdba74' },
  },
  {
    id: 'midnight',
    name: 'Minuit',
    description: 'Thème sombre avec accents violets',
    preview: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#c4b5fd' },
  },
];

interface ThemeContextType {
  mode: ThemeMode;
  preset: ThemePreset;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  isDark: boolean;
  presets: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'perfex-theme';

interface StoredTheme {
  mode: ThemeMode;
  preset: ThemePreset;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return (JSON.parse(stored) as StoredTheme).mode || 'light';
      } catch {
        return 'light';
      }
    }
    return 'light';
  });

  const [preset, setPresetState] = useState<ThemePreset>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return (JSON.parse(stored) as StoredTheme).preset || 'modern';
      } catch {
        return 'modern';
      }
    }
    return 'modern';
  });

  const [isDark, setIsDark] = useState(false);

  // Determine if dark mode should be active
  useEffect(() => {
    const checkDark = () => {
      if (mode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return mode === 'dark';
    };
    setIsDark(checkDark());

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('dark', 'light');
    themePresets.forEach(t => root.classList.remove(`theme-${t.id}`));

    // Add current theme classes
    root.classList.add(isDark ? 'dark' : 'light');
    root.classList.add(`theme-${preset}`);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, preset }));
  }, [isDark, preset, mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setPreset = (newPreset: ThemePreset) => {
    setPresetState(newPreset);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        preset,
        setMode,
        setPreset,
        isDark,
        presets: themePresets,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
