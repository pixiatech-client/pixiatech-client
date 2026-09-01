'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { DEFAULT_PALETTES } from '@/lib/color-palettes';
import { getActiveGlobalTheme, setActiveGlobalTheme } from '@/app/admin/actions';
import { resolveTheme, computeThemeVars, THEME_TRANSITION } from '@/lib/theme-utils';

interface ThemeContextType {
  activeTheme: (typeof DEFAULT_PALETTES)[number] & { id?: string; isCustom?: boolean } | null;
  setTheme: (themeName: string) => Promise<boolean>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: null,
  setTheme: async () => true,
  isDark: false,
});

const CUSTOM_THEMES_KEY = 'theme-custom-list';
const OVERRIDES_KEY = 'theme-color-overrides';
const REMOVED_THEME_NAMES = ['Nuage', 'Noir et Or', 'Émeraude', 'SaaS', 'Nord', 'SaaS Sombre', 'Cyberpunk', 'Terre Cuite', 'Vitalité', 'PHOCEA RENT'];

function readLocalOverrides(): Record<string, Record<string, string>> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(OVERRIDES_KEY) ?? '{}') ?? {};
  } catch (e) {
    return {};
  }
}

type LocalCustomTheme = (typeof DEFAULT_PALETTES)[number] & { id?: string; isCustom?: boolean };

function readLocalCustomThemes(): LocalCustomTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(CUSTOM_THEMES_KEY) ?? '[]') ?? [];
  } catch (e) {
    return [];
  }
}

function purgeLocalStorage() {
  if (typeof window === 'undefined') return;
  const customThemes = readLocalCustomThemes();
  const keptIds = new Set(customThemes.filter(t => t.id).map(t => t.id as string));
  const keptNames = new Set(DEFAULT_PALETTES.map(p => p.name));

  const overrides = readLocalOverrides();
  const sanitized: Record<string, Record<string, string>> = {};
  let overridesChanged = false;
  for (const key of Object.keys(overrides)) {
    if (keptNames.has(key) || keptIds.has(key)) {
      sanitized[key] = overrides[key];
    } else {
      overridesChanged = true;
    }
  }
  if (overridesChanged) {
    try { window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(sanitized)); } catch (e) {}
  }

  const filtered = customThemes.filter(t => !REMOVED_THEME_NAMES.includes(t.name));
  if (filtered.length !== customThemes.length) {
    try { window.localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(filtered)); } catch (e) {}
  }
}

export function ThemeProvider({ children, initialThemeName }: { children: React.ReactNode; initialThemeName?: string }) {
  const [activeTheme, setActiveTheme] = useState<any | null>(null);
  const [isDark, setIsDark] = useState(false);
  const hasInitializedRef = useRef(false);

  const applyTheme = useCallback((theme: (typeof DEFAULT_PALETTES)[number], overrides?: Record<string, string>) => {
    const root = document.documentElement;

    // Au premier paint le serveur a déjà appliqué le thème : on n'anime rien.
    // Les transitions ne sont activées que pour les changements suivants.
    root.style.transition = hasInitializedRef.current ? THEME_TRANSITION : 'none';

    if (theme.mode === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      root.classList.remove('dark');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    const colors = theme.colors;
    Object.entries(computeThemeVars(colors, overrides)).forEach(([varName, varValue]) => {
      root.style.setProperty(varName, varValue);
    });

    setIsDark(theme.mode === 'dark');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      purgeLocalStorage();
      const customThemes = readLocalCustomThemes();
      const allPalettes = [...DEFAULT_PALETTES, ...customThemes];

      let themeId = initialThemeName;
      if (!themeId) {
        const res = await getActiveGlobalTheme();
        if (cancelled) return;
        themeId = res.themeId;
      }

      const theme = resolveTheme(themeId, allPalettes);
      if (!theme) return;
      const overrides = readLocalOverrides()[theme.name];
      hasInitializedRef.current = false;
      applyTheme(theme, overrides);
      hasInitializedRef.current = true;
      setActiveTheme(theme);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [applyTheme, initialThemeName]);

  const setTheme = useCallback(
    async (themeName: string) => {
      const customThemes = readLocalCustomThemes();
      const allPalettes = [...DEFAULT_PALETTES, ...customThemes];
      const theme = resolveTheme(themeName, allPalettes);
      if (!theme) return false;

      const overrides = readLocalOverrides()[theme.name];
      hasInitializedRef.current = true;
      applyTheme(theme, overrides);
      setActiveTheme(theme);
      try {
        const res = await setActiveGlobalTheme(themeName);
        return res?.success === true;
      } catch (e) {
        console.error('Error persisting global theme:', e);
        return false;
      }
    },
    [applyTheme],
  );

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}