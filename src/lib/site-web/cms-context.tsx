'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_CMS_SETTINGS, type CmsBackendSettings, type CmsPageData } from './cms-types';

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
  activeTab: 'content' | 'media' | 'style' | 'backend';
  pages: Record<string, CmsPageData>;
  currentPageId: string;
  currentPageData: CmsPageData | null;
  settings: CmsBackendSettings;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  backendConnected: boolean;
  setIsEditing: (val: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;
  setActiveTab: (tab: 'content' | 'media' | 'style' | 'backend') => void;
  setCurrentPageId: (pageId: string) => void;
  updateSectionField: (sectionKey: string, fieldKey: string, value: unknown) => void;
  updateNestedField: (path: string[], value: unknown) => void;
  updateSectionOrder: (newOrder: string[]) => void;
  toggleSectionVisibility: (sectionKey: string) => void;
  saveCurrentPage: () => Promise<boolean>;
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
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'style' | 'backend'>('content');
  const [currentPageId, setCurrentPageId] = useState<string>('home');
  const [pages, setPages] = useState<Record<string, CmsPageData>>({});
  const [settings, setSettings] = useState<CmsBackendSettings>(settingsWithLocal);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

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
      const local = loadLocalPages();
      if (local) setPages(local);
      if (mounted) {
        try {
          const res = await fetch('/api/site-web/pages');
          if (res.ok) {
            const data = await res.json();
            if (data?.pages && typeof data.pages === 'object' && mounted) {
              setPages(data.pages);
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

  const updateSectionField = useCallback(
    (sectionKey: string, fieldKey: string, value: unknown) => {
      setPages((prev) => {
        const active = prev[currentPageId] || {
          id: currentPageId,
          name: currentPageId,
          slug: `/${currentPageId}`,
          updatedAt: new Date().toISOString(),
          meta: { title: 'Page PIXIATECH', description: '' },
          sections: {},
        };
        const section = { ...(active.sections?.[sectionKey] as Record<string, unknown> | undefined), [fieldKey]: value };
        const updated: CmsPageData = {
          ...active,
          updatedAt: new Date().toISOString(),
          sections: { ...(active.sections || {}), [sectionKey]: section },
        };
        const next = { ...prev, [currentPageId]: updated };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore quota
        }
        return next;
      });
    },
    [currentPageId]
  );

  const updateSectionOrder = useCallback(
    (newOrder: string[]) => {
      setPages((prev) => {
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
        const next = { ...prev, [currentPageId]: updated };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore quota
        }
        return next;
      });
    },
    [currentPageId]
  );

  const toggleSectionVisibility = useCallback(
    (sectionKey: string) => {
      setPages((prev) => {
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
        const next = { ...prev, [currentPageId]: updated };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore quota
        }
        return next;
      });
    },
    [currentPageId]
  );

  const updateNestedField = useCallback(
    (path: string[], value: unknown) => {
      if (path.length === 0) return;
      setPages((prev) => {
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
        const next = { ...prev, [currentPageId]: updated };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore quota
        }
        return next;
      });
    },
    [currentPageId]
  );

  const saveCurrentPage = async (): Promise<boolean> => {
    const activePage = pages[currentPageId];
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
        if (data?.page) setPages((prev) => ({ ...prev, [currentPageId]: data.page }));
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
        setPages(parsed.pages);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.pages));
        } catch {
          // ignore
        }
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
      const res = await fetch(`/api/site-web/pages/${pageId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.page) {
          setPages((prev) => ({ ...prev, [pageId]: data.page }));
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
        activeTab,
        pages,
        currentPageId,
        currentPageData,
        settings,
        saveStatus,
        backendConnected,
        setIsEditing,
        setSelectedBlockId,
        setActiveTab,
        setCurrentPageId,
        updateSectionField,
        updateNestedField,
        updateSectionOrder,
        toggleSectionVisibility,
        saveCurrentPage,
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
