'use client';

import { useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import adminTranslations from '@/lib/admin-translations';

export function useAdminT() {
  const { locale } = useI18n();

  const t = useCallback((text: string): string => {
    if (locale === 'fr') {
      return adminTranslations[text] || text;
    }
    return text;
  }, [locale]);

  return { t };
}
