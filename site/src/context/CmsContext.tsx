import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CmsSectionHero {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  heroImage: string;
  heroBgColor?: string;
  titleFontSize?: number;
  textColor?: string;
}

export interface CmsSectionOverview {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  stats: Array<{ val: string; label: string }>;
}

export interface CmsSectionDesign {
  eyebrow: string;
  title: string;
  cabinetDim: string;
  weight: string;
  material: string;
  image: string;
}

export interface CmsSectionFeatures {
  eyebrow: string;
  title: string;
  stages: Array<{ id: string; title: string; desc: string; media: string }>;
}

export interface CmsPageData {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  meta: {
    title: string;
    description: string;
  };
  sections: {
    hero?: any;
    overview?: any;
    design?: any;
    features?: any;
    showreel?: any;
    markets?: any;
    kinetic?: any;
    manifesto?: any;
    fieldwork?: any;
    [key: string]: any;
  };
}

export interface CmsBackendSettings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  officeHours: string;
  accentColor: string;
  backendName: string;
  backendApiUrl: string;
}

interface CmsContextType {
  isAdmin: boolean;
  isEditing: boolean;
  selectedBlockId: string | null;
  activeTab: "content" | "media" | "style" | "backend";
  pages: Record<string, CmsPageData>;
  currentPageId: string;
  currentPageData: CmsPageData | null;
  settings: CmsBackendSettings;
  saveStatus: "idle" | "saving" | "saved" | "error";
  backendConnected: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  toggleEditing: () => void;
  setIsEditing: (val: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;
  setActiveTab: (tab: "content" | "media" | "style" | "backend") => void;
  setCurrentPageId: (pageId: string) => void;
  updateSectionField: (sectionKey: string, fieldKey: string, value: any) => void;
  updateNestedField: (path: string[], value: any) => void;
  saveCurrentPage: () => Promise<boolean>;
  uploadMedia: (file: File) => Promise<string>;
  exportPagesJson: () => string;
  importPagesJson: (json: string) => boolean;
  resetPageToDefault: (pageId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<CmsBackendSettings>) => void;
}

const STORAGE_KEY = "pixiatech_pixel_tech_web_pages_v2";
const AUTH_STORAGE_KEY = "pixiatech_admin_auth_v2";
const SETTINGS_STORAGE_KEY = "pixiatech_backend_settings_v2";

const DEFAULT_SETTINGS: CmsBackendSettings = {
  companyName: "PIXIATECH",
  tagline: "Systèmes LED Architecturaux de Pointe",
  email: "contact@pixiatech.com",
  phone: "+33 1 89 70 42 00",
  address: "75008 Paris, France",
  officeHours: "Lun - Ven, 09h00 - 19h00 CET",
  accentColor: "#C3F910",
  backendName: "Pixel Tech Web",
  backendApiUrl: "/api/pixel-tech-web",
};

const CmsContext = createContext<CmsContextType | null>(null);

export const CmsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "media" | "style" | "backend">("content");
  const [currentPageId, setCurrentPageId] = useState<string>("home");
  const [pages, setPages] = useState<Record<string, CmsPageData>>({});
  const [settings, setSettings] = useState<CmsBackendSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  // Check backend connectivity and fetch initial page data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. Try local storage first for quick display
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed === "object") {
            setPages(parsed);
          }
        }
        const localSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (localSettings) {
          setSettings(JSON.parse(localSettings));
        }
      } catch (err) {
        console.warn("Could not load from localStorage:", err);
      }

      // 2. Fetch from backend Pixel Tech Web API
      try {
        const res = await fetch("/api/pixel-tech-web/pages");
        if (res.ok) {
          const data = await res.json();
          if (data && data.pages && Object.keys(data.pages).length > 0 && isMounted) {
            setPages(data.pages);
            setBackendConnected(true);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.pages));
            } catch (e) {
              // ignore quota
            }
          }
        } else {
          setBackendConnected(false);
        }
      } catch (err) {
        console.warn("Pixel Tech Web backend not reached, using offline storage:", err);
        setBackendConnected(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keyboard shortcut: Alt + E to toggle Admin Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === "e") || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e")) {
        e.preventDefault();
        setIsAdmin((prev) => {
          const next = !prev;
          localStorage.setItem(AUTH_STORAGE_KEY, String(next));
          if (!next) setIsEditing(false);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const login = (password: string): boolean => {
    const clean = password.trim().toLowerCase();
    if (clean === "admin" || clean === "pixiatech" || clean === "pixeltech" || clean === "pixiatech2026") {
      setIsAdmin(true);
      setIsEditing(true);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setIsEditing(false);
    setSelectedBlockId(null);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, "false");
    } catch {
      // ignore
    }
  };

  const toggleEditing = () => {
    if (!isAdmin) return;
    setIsEditing((prev) => !prev);
  };

  const updateSectionField = useCallback((sectionKey: string, fieldKey: string, value: any) => {
    setPages((prev) => {
      const activePage = prev[currentPageId] || {
        id: currentPageId,
        name: currentPageId,
        slug: `/${currentPageId}`,
        updatedAt: new Date().toISOString(),
        meta: { title: "Page PIXIATECH", description: "" },
        sections: {},
      };

      const curSection = activePage.sections[sectionKey] || {};
      const updatedSection = { ...curSection, [fieldKey]: value };

      const updatedPage = {
        ...activePage,
        updatedAt: new Date().toISOString(),
        sections: {
          ...activePage.sections,
          [sectionKey]: updatedSection,
        },
      };

      const nextPages = {
        ...prev,
        [currentPageId]: updatedPage,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPages));
      } catch {
        // ignore
      }

      return nextPages;
    });
  }, [currentPageId]);

  const updateNestedField = useCallback((path: string[], value: any) => {
    if (path.length === 0) return;
    setPages((prev) => {
      const activePage = prev[currentPageId] || {
        id: currentPageId,
        name: currentPageId,
        slug: `/${currentPageId}`,
        updatedAt: new Date().toISOString(),
        meta: { title: "Page PIXIATECH", description: "" },
        sections: {},
      };

      // Deep clone sections
      const sections = JSON.parse(JSON.stringify(activePage.sections || {}));
      let cursor = sections;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!cursor[key] || typeof cursor[key] !== "object") {
          cursor[key] = {};
        }
        cursor = cursor[key];
      }
      cursor[path[path.length - 1]] = value;

      const updatedPage = {
        ...activePage,
        updatedAt: new Date().toISOString(),
        sections,
      };

      const nextPages = { ...prev, [currentPageId]: updatedPage };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPages));
      } catch {
        // ignore
      }
      return nextPages;
    });
  }, [currentPageId]);

  const saveCurrentPage = async (): Promise<boolean> => {
    setSaveStatus("saving");
    const activePage = pages[currentPageId];
    if (!activePage) {
      setSaveStatus("error");
      return false;
    }

    try {
      // 1. Save locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      // 2. Push to Pixel Tech Web backend
      const res = await fetch(`/api/pixel-tech-web/pages/${currentPageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activePage),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setBackendConnected(true);
        setTimeout(() => setSaveStatus("idle"), 3000);
        return true;
      } else {
        // Local save succeeded even if remote failed
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return true;
      }
    } catch (err) {
      console.warn("Error sending to backend, local save kept:", err);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return true;
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          // Attempt backend upload endpoint
          const res = await fetch("/api/pixel-tech-web/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64Data,
              filename: file.name,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            resolve(data.url || base64Data);
            return;
          }
        } catch (e) {
          console.warn("Backend upload failed, using in-memory base64 data URL", e);
        }
        // Fallback to data URL
        resolve(base64Data);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const exportPagesJson = (): string => {
    return JSON.stringify(
      {
        backend: "Pixel Tech Web",
        version: "2.4.0",
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.pages));
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed.settings));
      }
      return true;
    } catch (err) {
      console.error("Invalid JSON import:", err);
      return false;
    }
  };

  const resetPageToDefault = async (pageId: string): Promise<void> => {
    try {
      const res = await fetch("/api/pixel-tech-web/pages");
      if (res.ok) {
        const data = await res.json();
        if (data.pages && data.pages[pageId]) {
          setPages((prev) => ({
            ...prev,
            [pageId]: data.pages[pageId],
          }));
        }
      }
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const updateSettings = (newSettings: Partial<CmsBackendSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const currentPageData = pages[currentPageId] || null;

  return (
    <CmsContext.Provider
      value={{
        isAdmin,
        isEditing,
        selectedBlockId,
        activeTab,
        pages,
        currentPageId,
        currentPageData,
        settings,
        saveStatus,
        backendConnected,
        login,
        logout,
        toggleEditing,
        setIsEditing,
        setSelectedBlockId,
        setActiveTab,
        setCurrentPageId,
        updateSectionField,
        updateNestedField,
        saveCurrentPage,
        uploadMedia,
        exportPagesJson,
        importPagesJson,
        resetPageToDefault,
        updateSettings,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = (): CmsContextType => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error("useCms must be used within a CmsProvider");
  }
  return context;
};
