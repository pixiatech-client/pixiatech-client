import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ProductWPData } from '../types/product';
import { defaultProductData } from '../data/defaultProductData';
import { IconPickerModal } from '../components/admin/IconPickerModal';

interface IconModalState {
  isOpen: boolean;
  currentIcon: string;
  onSelect: (icon: string) => void;
  title?: string;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ProductContextType {
  data: ProductWPData;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  isVisitorPreview: boolean;
  setIsVisitorPreview: (val: boolean) => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;
  hiddenCount: number;
  updateData: (updater: (prev: ProductWPData) => ProductWPData) => void;
  updateField: (section: keyof ProductWPData, field: string, value: any) => void;
  toggleSectionVisibility: (sectionKey: keyof ProductWPData) => void;
  toggleItemVisibility: (sectionKey: keyof ProductWPData, listKey: string, itemId: string) => void;
  setItemIcon: (sectionKey: keyof ProductWPData, listKey: string, itemId: string, newIcon: string) => void;
  openIconPicker: (currentIcon: string, onSelect: (icon: string) => void, title?: string) => void;
  closeIconPicker: () => void;
  saveChanges: () => Promise<boolean>;
  resetToFactory: () => Promise<boolean>;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isQuoteModalOpen: boolean;
  setIsQuoteModalOpen: (open: boolean) => void;
  isSpecSheetModalOpen: boolean;
  setIsSpecSheetModalOpen: (open: boolean) => void;
  quotePrefillData: any;
  setQuotePrefillData: (data: any) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ProductWPData>(defaultProductData);
  const [savedDataSnapshot, setSavedDataSnapshot] = useState<string>(JSON.stringify(defaultProductData));
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isVisitorPreview, setIsVisitorPreview] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Quote and SpecSheet modal states
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSpecSheetModalOpen, setIsSpecSheetModalOpen] = useState(false);
  const [quotePrefillData, setQuotePrefillData] = useState<any>(null);

  // Icon modal state
  const [iconModal, setIconModal] = useState<IconModalState>({
    isOpen: false,
    currentIcon: 'Sparkles',
    onSelect: () => {},
    title: ''
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch initial data from Express backend API
  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/product/wp');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json && json.hero) {
            setData(json);
            setSavedDataSnapshot(JSON.stringify(json));
          }
        } else {
          console.warn('API /api/product/wp responded with error, using default data fallback');
        }
      } catch (err) {
        console.warn('Could not fetch from backend API, using client default state:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(data) !== savedDataSnapshot;
  }, [data, savedDataSnapshot]);

  // Calculate total hidden elements
  const hiddenCount = useMemo(() => {
    let count = 0;
    if (!data.hero?.visible) count++;
    if (!data.metrics?.visible) count++;
    if (!data.features?.visible) count++;
    if (!data.configurator?.visible) count++;
    if (!data.applications?.visible) count++;
    if (!data.specifications?.visible) count++;
    if (!data.faq?.visible) count++;

    data.metrics?.cards?.forEach(c => { if (!c.visible) count++; });
    data.features?.items?.forEach(f => { if (!f.visible) count++; });
    data.applications?.cases?.forEach(a => { if (!a.visible) count++; });
    data.specifications?.rows?.forEach(r => { if (!r.visible) count++; });
    data.faq?.items?.forEach(q => { if (!q.visible) count++; });
    return count;
  }, [data]);

  const updateData = useCallback((updater: (prev: ProductWPData) => ProductWPData) => {
    setData(prev => updater(prev));
  }, []);

  const updateField = useCallback((section: keyof ProductWPData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  }, []);

  const toggleSectionVisibility = useCallback((sectionKey: keyof ProductWPData) => {
    setData(prev => {
      const section = prev[sectionKey] as any;
      if (!section || typeof section.visible === 'undefined') return prev;
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          visible: !section.visible
        }
      };
    });
  }, []);

  const toggleItemVisibility = useCallback((sectionKey: keyof ProductWPData, listKey: string, itemId: string) => {
    setData(prev => {
      const section = prev[sectionKey] as any;
      if (!section || !Array.isArray(section[listKey])) return prev;
      const updatedList = section[listKey].map((item: any) => {
        if (item.id === itemId) {
          return { ...item, visible: !item.visible };
        }
        return item;
      });
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          [listKey]: updatedList
        }
      };
    });
  }, []);

  const setItemIcon = useCallback((sectionKey: keyof ProductWPData, listKey: string, itemId: string, newIcon: string) => {
    setData(prev => {
      const section = prev[sectionKey] as any;
      if (!section || !Array.isArray(section[listKey])) return prev;
      const updatedList = section[listKey].map((item: any) => {
        if (item.id === itemId) {
          return { ...item, icon: newIcon };
        }
        return item;
      });
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          [listKey]: updatedList
        }
      };
    });
    showToast(`Icône mise à jour : ${newIcon}`, 'info');
  }, [showToast]);

  const openIconPicker = useCallback((currentIcon: string, onSelect: (icon: string) => void, title?: string) => {
    setIconModal({
      isOpen: true,
      currentIcon,
      onSelect,
      title: title || 'Choisir une icône'
    });
  }, []);

  const closeIconPicker = useCallback(() => {
    setIconModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/product/wp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setSavedDataSnapshot(JSON.stringify(data));
        showToast('Modifications enregistrées avec succès dans le backend !', 'success');
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.error || 'Erreur lors de la sauvegarde.', 'error');
        return false;
      }
    } catch (e: any) {
      showToast('Impossible de contacter le serveur Express: ' + e.message, 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data, showToast]);

  const resetToFactory = useCallback(async () => {
    if (!window.confirm('Voulez-vous vraiment réinitialiser toutes les données aux valeurs d\'usine PixiaTech Série WP ?')) {
      return false;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/product/wp/reset', {
        method: 'POST'
      });
      if (res.ok) {
        const resJson = await res.json();
        const resetData = resJson.data || defaultProductData;
        setData(resetData);
        setSavedDataSnapshot(JSON.stringify(resetData));
        showToast('Données réinitialisées aux paramètres d\'usine PixiaTech !', 'success');
        return true;
      } else {
        showToast('Erreur serveur lors de la réinitialisation.', 'error');
        return false;
      }
    } catch (e: any) {
      showToast('Erreur réinitialisation: ' + e.message, 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [showToast]);

  return (
    <ProductContext.Provider
      value={{
        data,
        isEditMode,
        setIsEditMode,
        isVisitorPreview,
        setIsVisitorPreview,
        hasUnsavedChanges,
        isSaving,
        isLoading,
        hiddenCount,
        updateData,
        updateField,
        toggleSectionVisibility,
        toggleItemVisibility,
        setItemIcon,
        openIconPicker,
        closeIconPicker,
        saveChanges,
        resetToFactory,
        toast,
        showToast,
        isQuoteModalOpen,
        setIsQuoteModalOpen,
        isSpecSheetModalOpen,
        setIsSpecSheetModalOpen,
        quotePrefillData,
        setQuotePrefillData
      }}
    >
      {children}
      {/* Global Icon Picker Modal */}
      <IconPickerModal
        isOpen={iconModal.isOpen}
        currentIcon={iconModal.currentIcon}
        onSelect={iconModal.onSelect}
        onClose={closeIconPicker}
        title={iconModal.title}
      />
    </ProductContext.Provider>
  );
};

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

