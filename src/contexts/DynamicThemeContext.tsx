'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@/firebase';
import type { ThemeSettings } from '@/lib/types';
import { updateUser } from '@/app/admin/actions';

interface DynamicThemeContextType {
  themeSettings: ThemeSettings;
  updateTheme: (newSettings: Partial<ThemeSettings>) => void;
  saveTheme: () => Promise<void>;
  resetToDefault: () => void;
  isSaving: boolean;
}

export const DEFAULT_THEME: ThemeSettings = {
  cardBg: '#ffffff',
  cardBorder: '#f1f5f9',
  cardText: '#0f172a',
  btnPrimaryBg: '#000000',
  btnPrimaryText: '#ffffff',
  btnPrimaryHover: '#333333',
  btnSecondaryBg: '#f1f5f9',
  btnSecondaryText: '#0f172a',
  btnSecondaryHover: '#e2e8f0',
  accentPrimary: '#ec4899',
  pageBg: '#E8F3EB',
  navBg: '#ffffff',
  navText: '#111827',
  sidebarBg: '#ffffff',
  sidebarText: '#64748b',
  sidebarBorder: '#f1f5f9',
  sidebarAccent: '#000000',
  sidebarActiveBg: '#000000',
  sidebarActiveText: '#ffffff',
};

const DynamicThemeContext = createContext<DynamicThemeContextType | undefined>(undefined);

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useUser();
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.themeSettings) {
      setThemeSettings(userProfile.themeSettings);
    }
  }, [userProfile]);

  const applyTheme = useCallback((settings: ThemeSettings) => {
    const root = document.documentElement;
    Object.entries(settings).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }, []);

  useEffect(() => {
    applyTheme(themeSettings);
  }, [themeSettings, applyTheme]);

  const updateTheme = (newSettings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveTheme = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUser({ uid: user.uid, themeSettings });
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    setThemeSettings(DEFAULT_THEME);
  };

  return (
    <DynamicThemeContext.Provider value={{ themeSettings, updateTheme, saveTheme, resetToDefault, isSaving }}>
      <div className="transition-colors duration-500 ease-in-out min-h-screen">
        {children}
      </div>
    </DynamicThemeContext.Provider>
  );
}

export function useDynamicTheme() {
  const context = useContext(DynamicThemeContext);
  if (context === undefined) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider');
  }
  return context;
}
