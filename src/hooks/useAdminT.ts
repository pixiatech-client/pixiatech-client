'use client';

import { useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import adminTranslations from '@/lib/admin-translations';
import adminTranslationsZhCN from '@/lib/admin-translations-zh-CN';

export function useAdminT() {
  const { locale } = useI18n();

  const t = useCallback((text: string): string => {
    if (locale === 'fr') {
      return adminTranslations[text] || text;
    }
    if (locale === 'zh-CN') {
      return adminTranslationsZhCN[text] || text;
    }
    return text;
  }, [locale]);

  return { t };
}
