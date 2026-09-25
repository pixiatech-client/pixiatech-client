import type { CmsFieldTranslation, CmsI18nStore, CmsTranslationStatus } from './cms-types';

export interface CmsLanguageConfig {
  code: string;
  label: string;
  flag: string;
  isSource?: boolean;
  dir?: 'ltr' | 'rtl';
}

export const CMS_LANGUAGES: CmsLanguageConfig[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', isSource: true, dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'zh', label: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
];

export const CMS_SOURCE_LANG = 'fr';

/** Langue par défaut de l'éditeur CMS (source FR utilisée comme référence). */
export const CMS_DEFAULT_LANG = CMS_SOURCE_LANG;

/**
 * Normalise les codes de langue (ex: 'FR' -> 'fr', 'en-US' -> 'en', 'zh-CN' -> 'zh').
 */
export function normalizeLang(lang?: string): string {
  if (!lang) return CMS_SOURCE_LANG;
  const l = lang.toLowerCase().trim();
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('ar')) return 'ar';
  if (l.startsWith('es')) return 'es';
  if (l.startsWith('zh')) return 'zh';
  if (l.startsWith('de')) return 'de';
  return l;
}

/**
 * Récupère l'objet de traduction complet d'un champ pour une langue donnée.
 */
export function getCmsFieldTranslation(
  section: Record<string, unknown> | any,
  fieldKey: string,
  lang: string
): CmsFieldTranslation {
  const normLang = normalizeLang(lang);
  const sec = (section && typeof section === 'object') ? (section as Record<string, unknown>) : undefined;
  const i18n = (sec?._i18n as CmsI18nStore | undefined)?.[fieldKey];
  const stored = i18n?.[normLang];

  if (normLang === CMS_SOURCE_LANG) {
    if (stored && typeof stored.value === 'string' && stored.value.length > 0) {
      return stored;
    }
    // Fallback rétrocompatible : lire la racine du champ plat existant
    const rootVal = sec?.[fieldKey];
    if (typeof rootVal === 'string' && rootVal.length > 0) {
      return { value: rootVal, status: 'source' };
    }
    return { value: '', status: 'missing' };
  }

  if (stored && typeof stored.value === 'string' && stored.value.length > 0) {
    return stored;
  }

  return { value: '', status: 'missing' };
}

/**
 * Récupère la valeur textuelle d'un champ pour la langue active avec cascade de fallback.
 */
export function getCmsText(
  section: Record<string, unknown> | any,
  fieldKey: string,
  lang?: string,
  fallback?: string
): string {
  const normLang = normalizeLang(lang);
  const translation = getCmsFieldTranslation(section, fieldKey, normLang);

  if (translation.value && translation.value.trim().length > 0) {
    return translation.value;
  }

  // Si langue cible vide, repli sur la source FR pour éviter un blanc non traduit
  if (normLang !== CMS_SOURCE_LANG) {
    const sourceTrans = getCmsFieldTranslation(section, fieldKey, CMS_SOURCE_LANG);
    if (sourceTrans.value && sourceTrans.value.trim().length > 0) {
      return fallback !== undefined ? fallback : sourceTrans.value;
    }
  }

  return fallback !== undefined ? fallback : '';
}

/**
 * Met à jour un champ dans la section en protégeant les traductions manuelles.
 */
export function setCmsFieldTranslation(
  section: Record<string, unknown>,
  fieldKey: string,
  lang: string,
  value: string,
  options?: {
    isManual?: boolean;
    sourceText?: string;
    forceOverwrite?: boolean;
  }
): Record<string, unknown> {
  const normLang = normalizeLang(lang);
  const now = new Date().toISOString();
  const existingI18n: CmsI18nStore = (section._i18n as CmsI18nStore) || {};
  const fieldStore: Record<string, CmsFieldTranslation> = { ...(existingI18n[fieldKey] || {}) };
  const currentEntry = fieldStore[normLang];

  // Règle d'or : une traduction automatique ne doit JAMAIS écraser une saisie manuelle
  if (
    !options?.forceOverwrite &&
    !options?.isManual &&
    currentEntry?.status === 'manual'
  ) {
    // Ne pas écraser la traduction manuelle de l'utilisateur
    return section;
  }

  const isSource = normLang === CMS_SOURCE_LANG;
  const status: CmsTranslationStatus = isSource
    ? 'source'
    : options?.isManual
    ? 'manual'
    : 'translated';

  fieldStore[normLang] = {
    value,
    status,
    updatedAt: now,
    sourceText: options?.sourceText || (isSource ? value : getCmsFieldTranslation(section, fieldKey, CMS_SOURCE_LANG).value),
  };

  const updatedSection: Record<string, unknown> = {
    ...section,
    _i18n: {
      ...existingI18n,
      [fieldKey]: fieldStore,
    },
  };

  // Rétrocompatibilité absolue : la source FR met également à jour le champ racine plat
  if (isSource) {
    updatedSection[fieldKey] = value;
  }

  return updatedSection;
}
