'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_CMS_SETTINGS, type CmsBackendSettings, type CmsFieldTranslation, type CmsPageData } from './cms-types';
import {
  CMS_DEFAULT_LANG,
  CMS_LANGUAGES,
  CMS_SOURCE_LANG,
  getCmsFieldTranslation,
  getCmsText,
  normalizeLang,
  setCmsFieldTranslation,
} from './cms-i18n';

const STORAGE_KEY = 'pixiatech_site_web_pages_v3';
const SETTINGS_STORAGE_KEY = 'pixiatech_site_web_settings_v3';

// Fallback localStorage de données UNIQUEMENT (jamais utilisé comme preuve d'authentification).
function loadLocalPages(): Record<string, CmsPageData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function loadLocalSettings(): Partial<CmsBackendSettings> | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface CmsContextType {
  isAdmin: boolean;
  adminChecked: boolean;
  isEditing: boolean;
  selectedBlockId: string | null;
  pages: Record<string, CmsPageData>;
  currentPageId: string;
  currentPageData: CmsPageData | null;
  settings: CmsBackendSettings;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  backendConnected: boolean;
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  getText: (sectionKey: string, fieldKey: string, fallback?: string, lang?: string) => string;
  setIsEditing: (val: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;
  setCurrentPageId: (pageId: string) => void;
  updateSectionField: (sectionKey: string, fieldKey: string, value: unknown) => void;
  updateElementStyle: (sectionKey: string, elementKey: string, patch: Record<string, unknown>) => Record<string, unknown>;
  updateSectionFieldLocalized: (sectionKey: string, fieldKey: string, value: unknown, lang?: string, isManual?: boolean) => void;
  getFieldTranslation: (sectionKey: string, fieldKey: string, lang?: string) => CmsFieldTranslation;
  autoTranslateField: (sectionKey: string, fieldKey: string, targetLangs?: string[]) => Promise<boolean>;
  autoTranslateSection: (sectionKey: string, targetLangs?: string[]) => Promise<boolean>;
  updateNestedField: (path: string[], value: unknown) => void;
  updateSectionOrder: (newOrder: string[]) => void;
  toggleSectionVisibility: (sectionKey: string) => void;
  saveCurrentPage: (pageOverride?: CmsPageData) => Promise<boolean>;
  restorePageFromServer: () => Promise<boolean>;
  uploadMedia: (file: File) => Promise<string>;
  exportPagesJson: () => string;
  importPagesJson: (json: string) => boolean;
  resetPageToDefault: (pageId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<CmsBackendSettings>) => void;
  saveSettings: () => Promise<boolean>;
}

const CmsContext = createContext<CmsContextType | null>(null);

function settingsWithLocal(): CmsBackendSettings {
  return { ...DEFAULT_CMS_SETTINGS, ...(loadLocalSettings() || {}) };
}

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // isAdmin = décision serveur UNIQUEMENT (GET /api/site-web/status, protégé par requireAdmin).
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminChecked, setAdminChecked] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>('home');
  const [pages, setPages] = useState<Record<string, CmsPageData>>({});
  // Miroir synchrone de `pages`. Indispensable : une édition inline appelle
  // `updateSectionField()` puis `saveCurrentPage()` dans le même tick. Le
  // `setState` est asynchrone, donc `saveCurrentPage()` lirait sinon un état
  // périmé et n'enverrait pas la valeur réellement modifiée au serveur.
  const pagesRef = useRef<Record<string, CmsPageData>>({});
  pagesRef.current = pages;

  /**
   * Applique une mutation de pages de façon synchrone : le miroir `pagesRef`
   * est écrit immédiatement (pour qu'un `saveCurrentPage()` appelé dans le même
   * tick envoie la bonne valeur), puis l'état React et le cache localStorage.
   * `localStorage` reste un cache de premier paint, jamais la source de vérité :
   * la persistance réelle est le PUT vers /api/site-web/pages/[pageId].
   */
  const commitPages = useCallback(
    (updater: (prev: Record<string, CmsPageData>) => Record<string, CmsPageData>) => {
      const next = updater(pagesRef.current);
      pagesRef.current = next;
      setPages(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota
      }
      return next;
    },
    []
  );
  const [currentLang, setCurrentLangState] = useState<string>('fr');
  const [settings, setSettings] = useState<CmsBackendSettings>(settingsWithLocal);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  const setCurrentLang = useCallback((l: string) => {
    setCurrentLangState(normalizeLang(l));
  }, []);

  // 1. Vérifie la session admin côté serveur (source de vérité unique).
  useEffect(() => {
    let mounted = true;
    async function checkAdmin() {
      try {
        const res = await fetch('/api/site-web/status');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data?.isAdmin) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.warn('[CMS] Status check failed (treating as public):', err);
      } finally {
        if (mounted) setAdminChecked(true);
      }
    }
    checkAdmin();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Charge les données CMS (public) — fallback localStorage pour le premier paint.
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      // Premier paint depuis localStorage (peut être périmé, sera corrigé par le réseau).
      const local = loadLocalPages();
      if (local) commitPages(() => local);
      if (mounted) {
        try {
          const res = await fetch('/api/site-web/pages', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data?.pages && typeof data.pages === 'object' && mounted) {
              // Les données serveur fraîches écrasent le fallback local
              commitPages((prev) => ({ ...prev, ...data.pages }));
              setBackendConnected(true);
            }
          }
        } catch (err) {
          console.warn('[CMS] Pages fetch failed, using local fallback:', err);
        }
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // 3. Re-fetch la page courante depuis le serveur à chaque changement de currentPageId.
  //    Garantit que toute modification réseau/serveur est immédiatement injectée dans l'état et le localStorage.
  useEffect(() => {
    if (!currentPageId) return;
    let mounted = true;
    async function refreshCurrentPage() {
      try {
        const res = await fetch(`/api/site-web/pages/${currentPageId}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.page && mounted) {
            commitPages((prev) => ({ ...prev, [currentPageId]: data.page }));
            setBackendConnected(true);
          }
        }
      } catch {
        // Silencieux : on garde l'état en mémoire si le réseau est indisponible.
      }
    }
    refreshCurrentPage();
    return () => {
      mounted = false;
    };
  }, [currentPageId]);

  const updateSectionFieldLocalized = useCallback(
    (sectionKey: string, fieldKey: string, value: unknown, lang?: string, isManual: boolean = true) => {
      const targetLang = normalizeLang(lang || currentLang);
      commitPages((prev) => {
        const active = prev[currentPageId] || {
          id: currentPageId,
          name: currentPageId,
          slug: `/${currentPageId}`,
          updatedAt: new Date().toISOString(),
          meta: { title: 'Page PIXIATECH', description: '' },
          sections: {},
        };
        const currentSection = (active.sections?.[sectionKey] as Record<string, unknown> | undefined) || {};
        let updatedSection: Record<string, unknown>;
        if (typeof value === 'string') {
          // Écrit dans la langue active uniquement : les autres langues ne sont
          // jamais écrasées ni recopiées (indépendance FR/EN).
          updatedSection = setCmsFieldTranslation(currentSection, fieldKey, targetLang, value, {
            isManual,
            forceOverwrite: isManual,
          });
        } else {
          updatedSection = { ...currentSection, [fieldKey]: value };
        }

        const updated: CmsPageData = {
          ...active,
          updatedAt: new Date().toISOString(),
          sections: { ...(active.sections || {}), [sectionKey]: updatedSection },
        };
        return { ...prev, [currentPageId]: updated };
      });
    },
    [currentPageId, currentLang, commitPages]
  );

  const updateSectionField = useCallback(
    (sectionKey: string, fieldKey: string, value: unknown) => {
      updateSectionFieldLocalized(sectionKey, fieldKey, value, currentLang, true);
    },
    [updateSectionFieldLocalized, currentLang]
  );

  /**
   * Lecture-écriture atomique d'un style dans `sections[sectionKey]._elements[elementKey]`.
   *
   * Indispensable : la barre contextuelle et l'édition inline_write toutes les
   * deux dans le même sac. Si chacune rebuild le sac depuis `currentPageData`
   * (état au rendu), la seconde écrase la première et un style disparaît
   * silencieusement. Ici on part du miroir synchrone `pagesRef`, donc jamais
   * périmé, et le PUT qui suit porte la valeur réellement écrite.
   */
  const updateElementStyle = useCallback(
    (sectionKey: string, elementKey: string, patch: Record<string, unknown>) => {
      const active = pagesRef.current[currentPageId];
      const sections = (active?.sections || {}) as Record<string, Record<string, unknown>>;
      const section = sections[sectionKey] || {};
      const bag = (section._elements as Record<string, Record<string, unknown>>) || {};
      const next: Record<string, Record<string, unknown>> = {
        ...bag,
        [elementKey]: { ...(bag[elementKey] || {}), ...patch },
      };
      const updatedPage: CmsPageData = {
        ...(active || { id: currentPageId, name: currentPageId, slug: `/${currentPageId}` }),
        updatedAt: new Date().toISOString(),
        sections: { ...sections, [sectionKey]: { ...section, _elements: next } },
      };
      commitPages((prev) => ({ ...prev, [currentPageId]: updatedPage }));
      return next[elementKey];
    },
    [currentPageId, commitPages]
  );

  const getFieldTranslation = useCallback(
    (sectionKey: string, fieldKey: string, lang?: string): CmsFieldTranslation => {
      const targetLang = normalizeLang(lang || currentLang);
      const active = pages[currentPageId];
      const section = active?.sections?.[sectionKey] as Record<string, unknown> | undefined;
      return getCmsFieldTranslation(section, fieldKey, targetLang);
    },
    [pages, currentPageId, currentLang]
  );

  const getText = useCallback(
    (sectionKey: string, fieldKey: string, fallback?: string, lang?: string): string => {
      const targetLang = normalizeLang(lang || currentLang);
      const active = pages[currentPageId];
      const section = active?.sections?.[sectionKey] as Record<string, unknown> | undefined;
      return getCmsText(section, fieldKey, targetLang, fallback);
    },
    [pages, currentPageId, currentLang]
  );

  const autoTranslateField = useCallback(
    async (sectionKey: string, fieldKey: string, targetLangs?: string[]): Promise<boolean> => {
      const active = pagesRef.current[currentPageId];
      const section = active?.sections?.[sectionKey] as Record<string, unknown> | undefined;
      const sourceTrans = getCmsFieldTranslation(section, fieldKey, CMS_SOURCE_LANG);
      const sourceText = sourceTrans.value;
      if (!sourceText || sourceText.trim() === '') return false;

      const allTargets = targetLangs || CMS_LANGUAGES.filter((l) => !l.isSource).map((l) => l.code);
      const targetsToTranslate = allTargets.filter((l) => {
        const trans = getCmsFieldTranslation(section, fieldKey, l);
        if (trans.status === 'manual' && (!targetLangs || targetLangs.length > 1)) {
          return false;
        }
        return true;
      });

      if (targetsToTranslate.length === 0) return true;

      try {
        const res = await fetch('/api/site-web/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sourceText,
            from: CMS_SOURCE_LANG,
            targets: targetsToTranslate,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.translations && typeof data.translations === 'object') {
            commitPages((prev) => {
              const activePage = prev[currentPageId];
              if (!activePage) return prev;
              let currentSec = (activePage.sections?.[sectionKey] as Record<string, unknown>) || {};
              for (const [l, val] of Object.entries(data.translations as Record<string, string>)) {
                currentSec = setCmsFieldTranslation(currentSec, fieldKey, l, val, {
                  isManual: false,
                  sourceText,
                  forceOverwrite: targetLangs && targetLangs.length === 1,
                });
              }
              const updatedPage: CmsPageData = {
                ...activePage,
                updatedAt: new Date().toISOString(),
                sections: { ...(activePage.sections || {}), [sectionKey]: currentSec },
              };
              return { ...prev, [currentPageId]: updatedPage };
            });
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('[CMS] autoTranslateField error:', err);
        return false;
      }
    },
    [pages, currentPageId, commitPages]
  );

  const autoTranslateSection = useCallback(
    async (sectionKey: string, targetLangs?: string[]): Promise<boolean> => {
      const active = pagesRef.current[currentPageId];
      const section = active?.sections?.[sectionKey] as Record<string, unknown> | undefined;
      if (!section) return false;

      const ignorable = new Set([
        'image',
        'heroImage',
        'primaryImage',
        'billboardImage',
        'layout',
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'minHeight',
        'visible',
        'heroBgColor',
        'accentColor',
        'textColor',
        '_i18n',
      ]);
      const textFields: Record<string, string> = {};
      for (const [k, v] of Object.entries(section)) {
        if (
          !ignorable.has(k) &&
          typeof v === 'string' &&
          v.trim().length > 0 &&
          !v.startsWith('http') &&
          !v.endsWith('.jpg') &&
          !v.endsWith('.png') &&
          !v.endsWith('.webp')
        ) {
          const sourceTrans = getCmsFieldTranslation(section, k, CMS_SOURCE_LANG);
          if (sourceTrans.value) {
            textFields[k] = sourceTrans.value;
          }
        }
      }

      if (Object.keys(textFields).length === 0) return true;
      const targets = targetLangs || CMS_LANGUAGES.filter((l) => !l.isSource).map((l) => l.code);

      try {
        const res = await fetch('/api/site-web/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: textFields,
            from: CMS_SOURCE_LANG,
            targets,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.translations) {
            commitPages((prev) => {
              const activePage = prev[currentPageId];
              if (!activePage) return prev;
              let currentSec = (activePage.sections?.[sectionKey] as Record<string, unknown>) || {};
              for (const [fieldKey, langMap] of Object.entries(
                data.translations as Record<string, Record<string, string>>
              )) {
                for (const [l, val] of Object.entries(langMap)) {
                  currentSec = setCmsFieldTranslation(currentSec, fieldKey, l, val, {
                    isManual: false,
                    sourceText: textFields[fieldKey],
                  });
                }
              }
              const updatedPage: CmsPageData = {
                ...activePage,
                updatedAt: new Date().toISOString(),
                sections: { ...(activePage.sections || {}), [sectionKey]: currentSec },
              };
              return { ...prev, [currentPageId]: updatedPage };
            });
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('[CMS] autoTranslateSection error:', err);
        return false;
      }
    },
    [currentPageId, commitPages]
  );

  const updateSectionOrder = useCallback(
    (newOrder: string[]) => {
      commitPages((prev) => {
        const active = prev[currentPageId] || {
          id: currentPageId,
          name: currentPageId,
          slug: `/${currentPageId}`,
          updatedAt: new Date().toISOString(),
          meta: { title: 'Page PIXIATECH', description: '' },
          sections: {},
        };
        const updated: CmsPageData = {
          ...active,
          updatedAt: new Date().toISOString(),
          sectionOrder: newOrder,
        };
        return { ...prev, [currentPageId]: updated };
      });
    },
    [currentPageId, commitPages]
  );

  const toggleSectionVisibility = useCallback(
    (sectionKey: string) => {
      commitPages((prev) => {
        const active = prev[currentPageId] || {
          id: currentPageId,
          name: currentPageId,
          slug: `/${currentPageId}`,
          updatedAt: new Date().toISOString(),
          meta: { title: 'Page PIXIATECH', description: '' },
          sections: {},
        };
        const section = ((active.sections || {})[sectionKey] as Record<string, unknown> | undefined) || {};
        const currentVis = section.visible !== false && (section.layout as { visible?: boolean } | undefined)?.visible !== false;
        const newVis = !currentVis;
        const updatedSection = {
          ...section,
          visible: newVis,
          layout: {
            ...((section.layout as Record<string, unknown> | undefined) || {}),
            visible: newVis,
          },
        };
        const updated: CmsPageData = {
          ...active,
          updatedAt: new Date().toISOString(),
          sections: { ...(active.sections || {}), [sectionKey]: updatedSection },
        };
        return { ...prev, [currentPageId]: updated };
      });
    },
    [currentPageId, commitPages]
  );

  const updateNestedField = useCallback(
    (path: string[], value: unknown) => {
      if (path.length === 0) return;
      commitPages((prev) => {
        const active = prev[currentPageId] || {
          id: currentPageId,
          name: currentPageId,
          slug: `/${currentPageId}`,
          updatedAt: new Date().toISOString(),
          meta: { title: 'Page PIXIATECH', description: '' },
          sections: {},
        };
        const sections = JSON.parse(JSON.stringify(active.sections || {})) as Record<string, unknown>;
        let cursor: Record<string, unknown> = sections;
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
          cursor = cursor[key] as Record<string, unknown>;
        }
        cursor[path[path.length - 1]] = value;
        const updated: CmsPageData = { ...active, updatedAt: new Date().toISOString(), sections };
        return { ...prev, [currentPageId]: updated };
      });
    },
    [currentPageId, commitPages]
  );

  const saveCurrentPage = async (pageOverride?: CmsPageData): Promise<boolean> => {
    // Le miroir synchrone garantit qu'on envoie la page réellement modifiée,
    // y compris quand l'appel vient d'`updateSectionField()` dans le même tick.
    const activePage = pageOverride ?? pagesRef.current[currentPageId];
    if (!activePage) {
      setSaveStatus('error');
      return false;
    }
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/site-web/pages/${currentPageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activePage),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.page) {
          commitPages((prev) => ({ ...prev, [currentPageId]: data.page }));
        }
        setSaveStatus('saved');
        setBackendConnected(true);
        setTimeout(() => setSaveStatus('idle'), 3000);
        return true;
      }
      setSaveStatus('error');
      return false;
    } catch (err) {
      console.warn('[CMS] Save failed:', err);
      setSaveStatus('error');
      return false;
    }
  };

  /**
   * Restaure la page depuis la DERNIÈRE VERSION ENREGISTRÉE CÔTÉ SERVEUR.
   *
   * Ce n'est pas un reset : aucune écriture n'est envoyée. On relit le fichier
   * JSON via GET `no-store` et on remplace l'état local par cette version.
   * `localStorage` et l'état React courant sont donc ignorés — le serveur est
   * la seule source de vérité.
   */
  const restorePageFromServer = async (): Promise<boolean> => {
    if (!currentPageId) return false;
    try {
      const res = await fetch(`/api/site-web/pages/${currentPageId}`, { cache: 'no-store' });
      if (!res.ok) {
        setSaveStatus('error');
        return false;
      }
      const data = await res.json();
      if (!data?.page) {
        setSaveStatus('error');
        return false;
      }
      commitPages((prev) => ({ ...prev, [currentPageId]: data.page }));
      setBackendConnected(true);
      setSaveStatus('idle');
      return true;
    } catch (err) {
      console.warn('[CMS] Restore failed:', err);
      setSaveStatus('error');
      return false;
    }
  };

  const saveSettings = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/site-web/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.settings) setSettings(data.settings);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[CMS] Settings save failed:', err);
      return false;
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/site-web/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, filename: file.name }),
          });
          if (res.ok) {
            const data = await res.json();
            resolve(data.url || base64);
            return;
          }
        } catch (err) {
          console.warn('[CMS] Upload failed, falling back to data URL:', err);
        }
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const exportPagesJson = (): string => {
    return JSON.stringify(
      {
        backend: 'Pixel Tech Web',
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        settings,
        pages,
      },
      null,
      2
    );
  };

  const importPagesJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.pages) {
        commitPages(() => parsed.pages);
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      return true;
    } catch (err) {
      console.error('[CMS] Invalid JSON import:', err);
      return false;
    }
  };

  const resetPageToDefault = async (pageId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/site-web/pages/${pageId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.page) {
          commitPages((prev) => ({ ...prev, [pageId]: data.page }));
        }
      }
    } catch (err) {
      console.error('[CMS] Reset error:', err);
    }
  };

  const updateSettings = (newSettings: Partial<CmsBackendSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota
      }
      return next;
    });
  };

  const currentPageData = pages[currentPageId] || null;

  return (
    <CmsContext.Provider
      value={{
        isAdmin,
        adminChecked,
        isEditing,
        selectedBlockId,
        pages,
        currentPageId,
        currentPageData,
        settings,
        saveStatus,
        backendConnected,
        currentLang,
        setCurrentLang,
        getText,
        setIsEditing,
        setSelectedBlockId,
        setCurrentPageId,
        updateSectionField,
        updateElementStyle,
        updateSectionFieldLocalized,
        getFieldTranslation,
        autoTranslateField,
        autoTranslateSection,
        updateNestedField,
        updateSectionOrder,
        toggleSectionVisibility,
        saveCurrentPage,
    restorePageFromServer,
        uploadMedia,
        exportPagesJson,
        importPagesJson,
        resetPageToDefault,
        updateSettings,
        saveSettings,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = (): CmsContextType => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
