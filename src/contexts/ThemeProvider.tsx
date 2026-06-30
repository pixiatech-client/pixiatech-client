'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DEFAULT_PALETTES } from '@/lib/color-palettes';
import { getActiveGlobalTheme, setActiveGlobalTheme } from '@/app/admin/actions';

interface ThemeContextType {
  activeTheme: (typeof DEFAULT_PALETTES)[number] & { id?: string; isCustom?: boolean } | null;
  setTheme: (themeName: string) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: null,
  setTheme: async () => {},
  isDark: false,
});

const THEME_TRANSITION = 'background-color 400ms ease-out, color 400ms ease-out, border-color 400ms ease-out, box-shadow 400ms ease-out';

const CSS_VAR_MAP: Record<string, string> = {
  adminBackground: '--admin-bg',
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  cardBorder: '--card-border',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  sidebarBg: '--sidebar-bg',
  sidebarText: '--sidebar-text',
  sidebarBorder: '--sidebar-border',
  sidebarActiveBg: '--sidebar-active-bg',
  sidebarActiveText: '--sidebar-active-text',
  sidebarAccent: '--sidebar-accent',
  navBg: '--nav-bg',
  navText: '--nav-text',
  btnPrimaryBg: '--btn-primary-bg',
  btnPrimaryText: '--btn-primary-text',
  btnPrimaryHover: '--btn-primary-hover',
  btnSecondaryBg: '--btn-secondary-bg',
  btnSecondaryText: '--btn-secondary-text',
  btnSecondaryHover: '--btn-secondary-hover',
  success: '--success',
  warning: '--warning',
  error: '--error',
  info: '--info',
  border: '--border',
  input: '--input',
  ring: '--ring',
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<any | null>(null);
  const [isDark, setIsDark] = useState(false);

  const applyTheme = useCallback((theme: typeof DEFAULT_PALETTES[number], customOverrides?: Record<string, string>) => {
    const root = document.documentElement;

    // Save original state before modifying (for cleanup)
    const originals = {
      htmlClasses: root.className,
      bodyClasses: document.body.className,
      inlineStyles: root.getAttribute('style') || '',
      darkClass: root.classList.contains('dark'),
    };
    (root as any).__themeOriginals = originals;

    root.style.transition = THEME_TRANSITION;
    
    if (theme.mode === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      root.classList.remove('dark');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    const colors = { ...theme.colors, ...customOverrides };

    // Standard tailwind variables (space-separated HSL values)
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = CSS_VAR_MAP[key];
      if (cssVar) {
        root.style.setProperty(cssVar, value as string);
      }
    });

    // Custom theme variables (fully resolved CSS values wrapped in hsl() for colors)
    const themeVars: Record<string, string> = {
      '--theme-page-bg': `hsl(${colors.adminBackground})`,
      '--theme-app-bg': `hsl(${colors.adminBackground})`,
      '--theme-card-bg': `hsl(${colors.card})`,
      '--theme-card-border': `hsl(${colors.cardBorder})`,
      '--theme-card-text': `hsl(${colors.cardForeground})`,
      '--theme-hover-bg': `hsl(${colors.secondary})`,
      '--theme-active-bg': `hsl(${colors.btnSecondaryHover})`,
      '--theme-text-primary': `hsl(${colors.foreground})`,
      '--theme-text-secondary': `hsl(${colors.mutedForeground})`,
      '--theme-icon': `hsl(${colors.mutedForeground})`,
      '--theme-sidebar-bg': `hsl(${colors.sidebarBg})`,
      '--theme-sidebar-text': `hsl(${colors.sidebarText})`,
      '--theme-sidebar-border': `hsl(${colors.sidebarBorder})`,
      '--theme-sidebar-active-bg': `hsl(${colors.sidebarActiveBg})`,
      '--theme-sidebar-active-text': `hsl(${colors.sidebarActiveText})`,
      '--theme-btn-primary-bg': `hsl(${colors.btnPrimaryBg})`,
      '--theme-btn-primary-text': `hsl(${colors.btnPrimaryText})`,
      '--theme-btn-primary-hover': `hsl(${colors.btnPrimaryHover})`,
      '--theme-btn-secondary-bg': `hsl(${colors.btnSecondaryBg})`,
      '--theme-btn-secondary-text': `hsl(${colors.btnSecondaryText})`,
      '--theme-btn-secondary-hover': `hsl(${colors.btnSecondaryHover})`,
      '--theme-nav-bg': `hsl(${colors.navBg})`,
      '--theme-nav-text': `hsl(${colors.navText})`,
    };

    Object.entries(themeVars).forEach(([varName, varValue]) => {
      root.style.setProperty(varName, varValue);
    });

    setIsDark(theme.mode === 'dark');
  }, []);

  useEffect(() => {
    async function load() {
      const { themeId } = await getActiveGlobalTheme();
      
      let localCustomThemes: any[] = [];
      let localOverrides: Record<string, Record<string, string>> = {};
      try {
        localCustomThemes = JSON.parse(localStorage.getItem('theme-custom-list') ?? '[]');
      } catch (e) {}
      try {
        localOverrides = JSON.parse(localStorage.getItem('theme-color-overrides') ?? '{}');
      } catch (e) {}

      const allPalettes = [...DEFAULT_PALETTES, ...localCustomThemes];
      const found = allPalettes.find(t => t.name === themeId || (t.id && t.id === themeId)) || allPalettes.find(p => p.isDefault) || allPalettes[0];
      
      if (found) {
        const paletteKey = found.id ?? found.name;
        const activeOverrides = localOverrides[paletteKey] ?? {};
        setActiveTheme(found);
        applyTheme(found, activeOverrides);
      }
    }
    load();

    // Cleanup: restore original CSS variables and classes when leaving admin
    return () => {
      const root = document.documentElement;
      const originals = (root as any).__themeOriginals;
      if (originals) {
        root.className = originals.htmlClasses;
        document.body.className = originals.bodyClasses;
        root.setAttribute('style', originals.inlineStyles);
        delete (root as any).__themeOriginals;
      } else {
        // Fallback: remove dark class and clear inline style overrides
        root.classList.remove('dark');
        document.body.classList.remove('dark-theme', 'light-theme');
        // Remove only the CSS variables that ThemeProvider sets
        Object.values(CSS_VAR_MAP).forEach(v => root.style.removeProperty(v));
        [
          '--theme-page-bg', '--theme-app-bg', '--theme-card-bg', '--theme-card-border',
          '--theme-card-text', '--theme-hover-bg', '--theme-active-bg', '--theme-text-primary',
          '--theme-text-secondary', '--theme-icon', '--theme-sidebar-bg', '--theme-sidebar-text',
          '--theme-sidebar-border', '--theme-sidebar-active-bg', '--theme-sidebar-active-text',
          '--theme-btn-primary-bg', '--theme-btn-primary-text', '--theme-btn-primary-hover',
          '--theme-btn-secondary-bg', '--theme-btn-secondary-text', '--theme-btn-secondary-hover',
          '--theme-nav-bg', '--theme-nav-text',
        ].forEach(v => root.style.removeProperty(v));
        root.style.removeProperty('transition');
      }
    };
  }, [applyTheme]);

  const setTheme = useCallback(async (themeName: string) => {
    let localCustomThemes: any[] = [];
    let localOverrides: Record<string, Record<string, string>> = {};
    try {
      localCustomThemes = JSON.parse(localStorage.getItem('theme-custom-list') ?? '[]');
    } catch (e) {}
    try {
      localOverrides = JSON.parse(localStorage.getItem('theme-color-overrides') ?? '{}');
    } catch (e) {}

    const allPalettes = [...DEFAULT_PALETTES, ...localCustomThemes];
    const theme = allPalettes.find(t => t.name === themeName || (t.id && t.id === themeName));
    if (!theme) return;

    const paletteKey = theme.id ?? theme.name;
    const activeOverrides = localOverrides[paletteKey] ?? {};

    setActiveTheme(theme);
    applyTheme(theme, activeOverrides);
    await setActiveGlobalTheme(themeName);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
