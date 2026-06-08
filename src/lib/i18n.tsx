
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import fr from './locales/fr.json';
import en from './locales/en.json';

type Locale = 'fr' | 'en';
type Translations = typeof fr;

const translations: Record<Locale, Translations> = { fr, en };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations | string, options?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Intl helpers for locale-aware formatting
export const IntlHelpers = {
  formatGreeting: (userName: string, locale: Locale) => {
    const hour = new Date().getHours();
    const greeting = locale === 'en' ? 'Good' : 'Bonjour';
    return `${greeting}, ${userName}`;
  },
  formatDate: (date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions) => {
    try {
      return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', options || { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  },
  formatDateTime: (date: Date, locale: Locale) => {
    try {
      return date.toLocaleTimeString(locale === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
};

// Helper to get stored locale from localStorage
const getStoredLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('admin-locale');
  if (stored === 'en' || stored === 'fr') return stored;
  return 'en';
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-locale', newLocale);
    }
  }, []);

  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let result: any = translations[locale];
    
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in current locale
        let fallbackResult: any = translations['en'];
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if (fallbackResult === undefined) return key;
        }
        result = fallbackResult;
        break;
      }
    }
    
    if (typeof result === 'string' && options) {
        return Object.entries(options).reduce((acc, [optKey, optValue]) => {
            return acc.replace(`{${optKey}}`, String(optValue));
        }, result);
    }
    
    return result || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
