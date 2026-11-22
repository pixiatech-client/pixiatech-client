'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  RotateCcw,
  Link as LinkIcon,
  Palette,
  Type,
  Move,
  Image as ImageIcon,
  Film,
  ExternalLink,
  X,
  Square,
  Sparkles,
  Trash2,
  Sliders,
  Check,
  Zap,
  Ban,
  GripVertical,
  Undo2,
  Redo2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import {
  getSelectedElement,
  setSelectedElement,
  subscribeSelectedElement,
  type SelectedElement,
} from './section-registry';
import {
  applyElementStyle,
  readElementStyle,
  makeElementStyledId,
  removeElementDynamicStyles,
  hexToRgba,
  getElementLinkKey,
  linkStyleFrom,
  withoutLinkStyle,
  type ElementStyle,
  type ElementVisualState,
  type ButtonEffectConfig,
  type ButtonEffectType,
} from './useCmsElementStyles';
import { normalizeLang } from '@/lib/site-web/cms-i18n';
import { isMediaVideo } from './media-utils';

const NUDGE = 4;
const FONT_STEP = 2;
const SAVE_DEBOUNCE_MS = 600;

/** Icône d'épingle pour figer la barre d'outils (style Photoshop) */
const PinIcon: React.FC<{ className?: string; filled?: boolean }> = ({ className = 'w-3.5 h-3.5', filled = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-2l-2-2V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v8l-2 2v2z" />
  </svg>
);

/** Icône pour intégrer la barre sous le header (docking pleine largeur) */
const DockHeaderIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="8" x2="21" y2="8" strokeWidth="2.5" />
    <polyline points="9 13 12 16 15 13" />
  </svg>
);

/** Icône pour détacher la barre du header et revenir en mode flottant */
const FloatIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="6" width="14" height="10" rx="2" />
    <polyline points="8 19 12 22 16 19" />
    <line x1="12" y1="16" x2="12" y2="22" />
  </svg>
);

export const BUTTON_EFFECTS_CATALOG: {
  id: ButtonEffectType;
  name: string;
  tagline: string;
  badge?: string;
  hasIntensity?: boolean;
  hasDuration?: boolean;
  hasColor?: boolean;
  hasAmplitude?: boolean;
}[] = [
  {
    id: 'none',
    name: 'Aucun effet',
    tagline: 'Comportement standard sans animation spéciale',
  },
  {
    id: 'signature',
    name: 'PIXIATECH Signature',
    tagline: 'Reproduction exacte de la Section 10 (gap expansif + halo signature + élévation)',
    badge: 'SECTION 10',
    hasIntensity: true,
    hasDuration: true,
    hasColor: true,
    hasAmplitude: true,
  },
  {
    id: 'lift',
    name: 'Lift',
    tagline: 'Élévation subtile au survol avec ombre portée dynamique',
    hasIntensity: true,
    hasDuration: true,
    hasAmplitude: true,
  },
  {
    id: 'glow',
    name: 'Glow',
    tagline: 'Halo lumineux vibrant d’intensité réglable',
    hasIntensity: true,
    hasDuration: true,
    hasColor: true,
  },
  {
    id: 'shine',
    name: 'Shine',
    tagline: 'Reflet lumineux qui traverse le bouton',
    hasIntensity: true,
    hasDuration: true,
  },
  {
    id: 'fill',
    name: 'Fill',
    tagline: 'Remplissage progressif du fond de bas en haut',
    hasDuration: true,
    hasColor: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'Agrandissement dynamique et élastique',
    hasIntensity: true,
    hasDuration: true,
    hasAmplitude: true,
  },
  {
    id: 'border-glow',
    name: 'Border Glow',
    tagline: 'Bordure devenant intensément lumineuse',
    hasIntensity: true,
    hasDuration: true,
    hasColor: true,
  },
  {
    id: 'slide',
    name: 'Slide',
    tagline: 'Déplacement latéral fluide du contenu ou de la flèche',
    hasDuration: true,
    hasAmplitude: true,
  },
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Légère pulsation continue au survol',
    hasIntensity: true,
    hasDuration: true,
    hasColor: true,
  },
  {
    id: 'magnetic',
    name: 'Magnetic',
    tagline: 'Attraction subtile vers le curseur (desktop uniquement)',
    hasDuration: true,
    hasAmplitude: true,
  },
  {
    id: 'underline',
    name: 'Underline',
    tagline: 'Soulignement animé qui se déploie sous le texte',
    hasDuration: true,
    hasColor: true,
    hasAmplitude: true,
  },
];

const ALIGNS: { value: ElementStyle['textAlign']; icon: LucideIcon; label: string }[] = [
  { value: 'left', icon: AlignLeft, label: 'Gauche' },
  { value: 'center', icon: AlignCenter, label: 'Centre' },
  { value: 'right', icon: AlignRight, label: 'Droite' },
  { value: 'justify', icon: AlignJustify, label: 'Justifié' },
];

const INTERNAL_PAGES = [
  { label: 'Page d’Accueil', url: '/web' },
  { label: 'Catalogue & Tous les Produits', url: '/web/products' },
  { label: 'PXT Fine (Écran Indoor)', url: '/web/pxt-fine' },
  { label: 'Ressources & Guides', url: '/web/insights' },
  { label: 'Contact & Devis', url: '/web/contact' },
  { label: 'Configurateur de Devis', url: '/quote' },
  { label: 'Mon Compte Client', url: '/mon-compte' },
  { label: 'Mentions Légales', url: '/web/mentions-legales' },
  { label: 'Politique de Confidentialité', url: '/web/politique-confidentialite' },
  { label: 'Gestion des Cookies', url: '/web/gestion-cookies' },
  { label: 'Ancre : Marchés (#markets)', url: '#markets' },
  { label: 'Ancre : Technologie (#technology)', url: '#technology' },
  { label: 'Ancre : Réalisations (#projects)', url: '#projects' },
  { label: 'Ancre : À propos (#manifesto)', url: '#manifesto' },
  { label: 'Ancre : Haut de page (#top)', url: '#top' },
];

export const FloatingElementToolbar: React.FC<{
  onOpenImageModal?: (element: HTMLElement) => void;
}> = ({ onOpenImageModal }) => {
  const { isEditing, isAdmin, currentPageData, currentLang, updateSectionField, updateElementStyle, toggleSectionVisibility, saveCurrentPage } = useCms();

  const [selected, setSelected] = useState<SelectedElement | null>(getSelectedElement());
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeAccordion, setActiveAccordion] = useState<'typo' | 'colors' | 'position' | null>('typo');
  const [paletteStateTab, setPaletteStateTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [effectsPreviewState, setEffectsPreviewState] = useState<'normal' | 'hover' | 'active'>('normal');
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  
  // 3 Modes d'affichage : 'floating' (flottant libre), 'pinned' (épinglé fixe), 'docked_header' (intégré au header pleine largeur)
  const [toolbarMode, setToolbarMode] = useState<'floating' | 'pinned' | 'docked_header'>(() => {
    if (typeof window === 'undefined') return 'floating';
    try {
      const saved = localStorage.getItem('pixia_cms_toolbar_mode');
      if (saved === 'pinned' || saved === 'docked_header') return saved;
      return 'floating';
    } catch {
      return 'floating';
    }
  });

  const [dragPosition, setDragPosition] = useState<{ top: number; left: number } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const p = localStorage.getItem('pixia_cms_toolbar_pos');
      const mode = localStorage.getItem('pixia_cms_toolbar_mode');
      return mode === 'pinned' && p ? JSON.parse(p) : null;
    } catch {
      return null;
    }
  });

  // Déplacement ultra-fluide façon robot Pixia (Pointer events + GPU translate3d direct sans re-render React)
  const isDraggingRef = useRef(false);
  const pointerDragRef = useRef<{
    startX: number;
    startY: number;
    startTop: number;
    startLeft: number;
    currentDx: number;
    currentDy: number;
  } | null>(null);

  // Nouvelles fonctionnalités demandées : Historique Undo/Redo, Switch Sauvegarde auto, Déplacement libre et Dialogue Corbeille
  const [undoStack, setUndoStack] = useState<ElementStyle[]>([]);
  const [redoStack, setRedoStack] = useState<ElementStyle[]>([]);
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleAccordion = useCallback((acc: 'typo' | 'colors' | 'position') => {
    setActiveAccordion((curr) => (curr === acc ? null : acc));
  }, []);

  // Bascule du mode d'affichage de la barre
  const setMode = useCallback((mode: 'floating' | 'pinned' | 'docked_header') => {
    setToolbarMode(mode);
    try {
      localStorage.setItem('pixia_cms_toolbar_mode', mode);
      if (mode === 'pinned') {
        const currentPos = dragPosition || coords || { top: 75, left: 100 };
        localStorage.setItem('pixia_cms_toolbar_pos', JSON.stringify(currentPos));
        setDragPosition(currentPos);
      } else if (mode === 'floating') {
        localStorage.removeItem('pixia_cms_toolbar_pos');
        setDragPosition(null);
      }
    } catch {}
  }, [dragPosition, coords]);

  // Sauvegarde explicite de la position ("Mémoriser la position")
  const saveCurrentToolbarPosition = useCallback(() => {
    const currentPos = dragPosition || coords || { top: 75, left: 100 };
    try {
      localStorage.setItem('pixia_cms_toolbar_mode', 'pinned');
      localStorage.setItem('pixia_cms_toolbar_pos', JSON.stringify(currentPos));
      setToolbarMode('pinned');
      setDragPosition(currentPos);
    } catch {}
  }, [dragPosition, coords]);

  // Réinitialise la position uniquement si la barre est en mode flottant
  useEffect(() => {
    if (toolbarMode === 'floating') {
      setDragPosition(null);
    }
    setActiveAccordion('typo');
    setPaletteStateTab('normal');
    setEffectsPreviewState('normal');
    setShowDeleteConfirm(false);
    setUndoStack([]);
    setRedoStack([]);
    return () => {
      if (selected?.el) selected.el.removeAttribute('data-cms-preview-state');
      if (selected?.clickableEl) selected.clickableEl.removeAttribute('data-cms-preview-state');
    };
  }, [selected?.elementKey, selected?.sectionKey, selected?.linkKey, toolbarMode]);

  // Déplacement haute performance façon robot Pixia : pointerdown, pointermove, pointerup avec setPointerCapture
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (toolbarMode === 'docked_header') return; // En mode header docké, la barre est fixe
    e.preventDefault();
    e.stopPropagation();

    const currentTop = dragPosition?.top ?? coords?.top ?? 100;
    const currentLeft = dragPosition?.left ?? coords?.left ?? 100;

    pointerDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTop: currentTop,
      startLeft: currentLeft,
      currentDx: 0,
      currentDy: 0,
    };
    isDraggingRef.current = true;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }, [toolbarMode, dragPosition, coords]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !pointerDragRef.current) return;
    const dx = e.clientX - pointerDragRef.current.startX;
    const dy = e.clientY - pointerDragRef.current.startY;
    pointerDragRef.current.currentDx = dx;
    pointerDragRef.current.currentDy = dy;

    // Déplacement matériel direct sur le GPU : ZÉRO re-render React pendant le mouvement !
    if (toolbarRef.current) {
      toolbarRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !pointerDragRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const { startTop, startLeft, currentDx, currentDy } = pointerDragRef.current;
    isDraggingRef.current = false;
    pointerDragRef.current = null;

    if (toolbarRef.current) {
      toolbarRef.current.style.transform = '';
    }

    const tb = toolbarRef.current;
    const tbWidth = tb ? tb.offsetWidth : 480;
    const tbHeight = tb ? tb.offsetHeight : 48;

    const rawTop = startTop + currentDy;
    const newLeft = Math.max(10, Math.min(window.innerWidth - tbWidth - 10, startLeft + currentDx));
    const newTop = Math.max(10, Math.min(window.innerHeight - tbHeight - 10, rawTop));

    // Détection d'ancrage magnétique au Header si l'utilisateur glisse vers le sommet (< 65px)
    if (rawTop <= 65) {
      setMode('docked_header');
      return;
    }

    const finalPos = { top: newTop, left: newLeft };
    setDragPosition(finalPos);
    if (toolbarMode === 'pinned') {
      try {
        localStorage.setItem('pixia_cms_toolbar_pos', JSON.stringify(finalPos));
      } catch {}
    }
  }, [toolbarMode, setMode]);

  useEffect(() => subscribeSelectedElement(() => setSelected(getSelectedElement())), []);

  // Nettoyage timer
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  // Recalcul position dynamique sur scroll, resize, et changement d'élément
  const updateCoords = useCallback(() => {
    if (!selected?.el || !selected.el.isConnected) {
      setCoords(null);
      return;
    }

    const rect = selected.el.getBoundingClientRect();

    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setCoords(null);
      return;
    }

    const tb = toolbarRef.current;
    const tbWidth = tb ? tb.offsetWidth : 480;
    const tbHeight = tb ? tb.offsetHeight : 44;

    const centerX = rect.left + rect.width / 2;
    let left = centerX - tbWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - tbWidth - 12, left));

    // Toujours au-dessus de l'élément sélectionné, centré horizontalement
    let top = rect.top - tbHeight - 12;
    if (top < 10) {
      top = 10;
    }

    setCoords({ top, left, placeBelow: false });
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setCoords(null);
      return;
    }

    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    const rId = requestAnimationFrame(updateCoords);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      cancelAnimationFrame(rId);
    };
  }, [selected, updateCoords]);

  const sectionData = selected
    ? ((currentPageData?.sections?.[selected.sectionKey] as Record<string, unknown>) || undefined)
    : undefined;

  const style: ElementStyle = useMemo(
    () => (selected ? readElementStyle(sectionData, selected.elementKey) : {}),
    [sectionData, selected]
  );

  // Destination propre au bouton sélectionné. Sur le Hero, les 3 slides
  // partagent le même nœud DOM : `data-cms-link-key` désigne la clé réelle
  // (`slider1.primaryCta`, `slider2.primaryCta`, ...). Le style visuel reste,
  // lui, sur `primaryCta` / `secondaryCta`.
  const selectedLinkKey = selected
    ? selected.linkKey ||
      getElementLinkKey(selected.el) ||
      (selected.clickableEl ? getElementLinkKey(selected.clickableEl) : null)
    : null;
  const scopedLink = selectedLinkKey
    ? linkStyleFrom(readElementStyle(sectionData, selectedLinkKey))
    : ({} as ElementStyle);

  /** Écrit le style de l'élément via le contexte (synchrone via pagesRef), l'applique immédiatement, puis sauvegarde via PUT */
  const commit = useCallback(
    (patch: Partial<ElementStyle>) => {
      if (!selected) return;

      // Historique Undo : on pousse l'état courant avant d'appliquer la modification
      setUndoStack((prev) => [...prev.slice(-30), { ...style }]);
      setRedoStack([]);

      const sectionKey = selected.sectionKey;
      const elementKey = selected.elementKey;
      const clickableElementKey = selected.clickableElementKey;

      // Une URL appartient à la clé de destination du bouton, jamais à la clé
      // de style partagée. Les autres propriétés gardent leur comportement.
      const linkPatch = selectedLinkKey ? linkStyleFrom(patch) : ({} as ElementStyle);
      const visualPatch = selectedLinkKey ? withoutLinkStyle(patch) : patch;

      // Utilise updateElementStyle du contexte (lit depuis pagesRef synchrone,
      // jamais périmé) pour éviter d'écraser des modifications concurrentes.
      const nextStyle = updateElementStyle(sectionKey, elementKey, visualPatch as Record<string, unknown>) as ElementStyle;

      // Si un conteneur cliquable parent existe (ex: a ou button englobant un span), on synchronise aussi sa clé
      if (clickableElementKey && clickableElementKey !== elementKey) {
        updateElementStyle(sectionKey, clickableElementKey, visualPatch as Record<string, unknown>);
      }

      // Rendu immédiat dans le DOM avec identifiant de style dynamique
      const styledId = makeElementStyledId(sectionKey, elementKey);
      const appliedStyle = selectedLinkKey ? withoutLinkStyle(nextStyle) : nextStyle;
      const clickStyledId = clickableElementKey
        ? makeElementStyledId(sectionKey, clickableElementKey)
        : styledId;
      applyElementStyle(selected.el, appliedStyle, normalizeLang(currentLang), styledId);
      if (selected.clickableEl) {
        applyElementStyle(selected.clickableEl, appliedStyle, normalizeLang(currentLang), clickStyledId);
      }

      // Écriture séparée de la destination, dans la clé de CE bouton uniquement.
      if (selectedLinkKey && Object.keys(linkPatch).length > 0) {
        const nextLinkStyle = updateElementStyle(
          sectionKey,
          selectedLinkKey,
          linkPatch as Record<string, unknown>
        ) as ElementStyle;
        applyElementStyle(selected.el, nextLinkStyle, normalizeLang(currentLang), styledId);
        if (selected.clickableEl) {
          applyElementStyle(selected.clickableEl, nextLinkStyle, normalizeLang(currentLang), clickStyledId);
        }
      }

      updateCoords();

      // Sauvegarde automatique uniquement si le switch est activé
      if (!autoSave) {
        setSaveState('idle');
        return;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = setTimeout(() => {
        void saveCurrentPage().then((ok) => {
          setSaveState(ok ? 'saved' : 'error');
          setTimeout(() => setSaveState('idle'), 2500);
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [selected, selectedLinkKey, style, currentLang, updateElementStyle, saveCurrentPage, updateCoords, autoSave]
  );

  /** Annuler la dernière modification (Undo - Ctrl+Z) */
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !selected) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, { ...style }]);

    const sectionKey = selected.sectionKey;
    const elementKey = selected.elementKey;
    const clickableElementKey = selected.clickableElementKey;

    updateElementStyle(sectionKey, elementKey, previous as Record<string, unknown>);
    if (clickableElementKey && clickableElementKey !== elementKey) {
      updateElementStyle(sectionKey, clickableElementKey, previous as Record<string, unknown>);
    }

    const styledId = makeElementStyledId(sectionKey, elementKey);
    applyElementStyle(selected.el, previous, normalizeLang(currentLang), styledId);
    if (selected.clickableEl) {
      applyElementStyle(selected.clickableEl, previous, normalizeLang(currentLang), styledId);
    }
    updateCoords();

    if (autoSave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = setTimeout(() => {
        void saveCurrentPage().then((ok) => {
          setSaveState(ok ? 'saved' : 'error');
          setTimeout(() => setSaveState('idle'), 2500);
        });
      }, SAVE_DEBOUNCE_MS);
    } else {
      setSaveState('idle');
    }
  }, [undoStack, selected, style, updateElementStyle, currentLang, updateCoords, saveCurrentPage, autoSave]);

  /** Rétablir la modification annulée (Redo - Ctrl+Y) */
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !selected) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, { ...style }]);

    const sectionKey = selected.sectionKey;
    const elementKey = selected.elementKey;
    const clickableElementKey = selected.clickableElementKey;

    updateElementStyle(sectionKey, elementKey, next as Record<string, unknown>);
    if (clickableElementKey && clickableElementKey !== elementKey) {
      updateElementStyle(sectionKey, clickableElementKey, next as Record<string, unknown>);
    }

    const styledId = makeElementStyledId(sectionKey, elementKey);
    applyElementStyle(selected.el, next, normalizeLang(currentLang), styledId);
    if (selected.clickableEl) {
      applyElementStyle(selected.clickableEl, next, normalizeLang(currentLang), styledId);
    }
    updateCoords();

    if (autoSave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = setTimeout(() => {
        void saveCurrentPage().then((ok) => {
          setSaveState(ok ? 'saved' : 'error');
          setTimeout(() => setSaveState('idle'), 2500);
        });
      }, SAVE_DEBOUNCE_MS);
    } else {
      setSaveState('idle');
    }
  }, [redoStack, selected, style, updateElementStyle, currentLang, updateCoords, saveCurrentPage, autoSave]);

  // Écouteur global pour les raccourcis clavier Ctrl+Z / Ctrl+Y
  useEffect(() => {
    if (!selected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, handleUndo, handleRedo]);

  const switchPaletteStateTab = useCallback(
    (nextTab: 'normal' | 'hover' | 'active') => {
      setPaletteStateTab(nextTab);
      const targets = [selected?.el, selected?.clickableEl].filter(Boolean) as HTMLElement[];
      for (const target of targets) {
        if (nextTab === 'normal') {
          target.removeAttribute('data-cms-preview-state');
        } else {
          target.setAttribute('data-cms-preview-state', nextTab);
        }
      }
    },
    [selected]
  );

  const commitVisualProperty = useCallback(
    (prop: keyof ElementVisualState, val: string | undefined) => {
      if (paletteStateTab === 'normal') {
        commit({ [prop]: val } as Partial<ElementStyle>);
      } else if (paletteStateTab === 'hover') {
        const curHover = { ...(style.hover || {}) };
        if (val === undefined || val === '') {
          delete curHover[prop];
        } else {
          curHover[prop] = val;
        }
        commit({ hover: Object.keys(curHover).length > 0 ? curHover : undefined });
      } else if (paletteStateTab === 'active') {
        const curActive = { ...(style.active || {}) };
        if (val === undefined || val === '') {
          delete curActive[prop];
        } else {
          curActive[prop] = val;
        }
        commit({ active: Object.keys(curActive).length > 0 ? curActive : undefined });
      }
    },
    [paletteStateTab, commit, style.hover, style.active]
  );

  const clearStateOverrides = useCallback(() => {
    if (paletteStateTab === 'hover') {
      commit({ hover: undefined });
    } else if (paletteStateTab === 'active') {
      commit({ active: undefined });
    }
  }, [paletteStateTab, commit]);

  const nudge = useCallback(
    (dx: number, dy: number) => {
      commit({
        offsetX: (style.offsetX ?? 0) + dx,
        offsetY: (style.offsetY ?? 0) + dy,
      });
    },
    [commit, style.offsetX, style.offsetY]
  );

  const toggleBold = useCallback(() => {
    commit({ fontWeight: style.fontWeight === '700' ? '400' : '700' });
  }, [commit, style.fontWeight]);

  const toggleItalic = useCallback(() => {
    commit({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' });
  }, [commit, style.fontStyle]);

  const toggleUnderline = useCallback(() => {
    commit({ textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' });
  }, [commit, style.textDecoration]);

  const toggleStrikethrough = useCallback(() => {
    commit({ textDecoration: style.textDecoration === 'line-through' ? 'none' : 'line-through' });
  }, [commit, style.textDecoration]);

  const bumpFontSize = useCallback(
    (delta: number) => {
      // Si aucune taille n'est encore stockée, lire la taille réelle du DOM
      const stored = parseFloat(style.fontSize || '') || 0;
      const current = stored > 0
        ? stored
        : (selected?.el ? parseFloat(window.getComputedStyle(selected.el).fontSize) || 16 : 16);
      commit({ fontSize: `${Math.max(8, Math.min(160, current + delta))}px` });
    },
    [commit, style.fontSize, selected]
  );

  // Sauvegarde et restauration de sélection pour éviter de la perdre au clic sur la barre d'outils
  const savedSelectionRef = useRef<{ range: Range; el: HTMLElement } | null>(null);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { savedSelectionRef.current = null; return; }
    const range = sel.getRangeAt(0);
    // Chercher l'élément contenteditable parent
    let node: Node | null = range.commonAncestorContainer;
    while (node && !(node instanceof HTMLElement && node.isContentEditable)) {
      node = node.parentNode;
    }
    if (!node) { savedSelectionRef.current = null; return; }
    savedSelectionRef.current = { range: range.cloneRange(), el: node as HTMLElement };
  }, []);

  const restoreSelection = useCallback(() => {
    const saved = savedSelectionRef.current;
    if (!saved) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(saved.range);
  }, []);

  const bumpFontSizeOnSelection = useCallback(
    (delta: number) => {
      // 1. Vérifie la sélection active dans un contenteditable
      const sel = window.getSelection();
      const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;

      if (hasSelection && sel) {
        const range = sel.getRangeAt(0);
        let ceEl: HTMLElement | null = null;
        let node: Node | null = range.commonAncestorContainer;
        while (node && !(node instanceof HTMLElement && node.isContentEditable)) {
          node = node.parentNode;
        }
        if (node instanceof HTMLElement && node.isContentEditable) ceEl = node;

        if (ceEl) {
          // Calculer la taille actuelle du premier nœud de texte de la sélection
          const startNode = range.startContainer;
          let currentFontSize = 16;
          const parentEl = startNode instanceof Text ? startNode.parentElement : startNode as HTMLElement;
          if (parentEl) {
            const cs = window.getComputedStyle(parentEl);
            currentFontSize = parseFloat(cs.fontSize) || 16;
            // Si le parent est lui-même un span de taille, récupérer sa valeur
            if (parentEl.style.fontSize) {
              currentFontSize = parseFloat(parentEl.style.fontSize) || currentFontSize;
            }
          }
          const newSize = Math.max(8, Math.min(160, currentFontSize + delta));

          // Encapsuler la sélection dans un <span> avec la nouvelle taille
          const span = document.createElement('span');
          span.style.fontSize = `${newSize}px`;

          try {
            // Extraire le contenu sélectionné et l'encapsuler
            const fragment = range.extractContents();
            span.appendChild(fragment);
            range.insertNode(span);

            // Restaurer la sélection sur le span inséré
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            sel.removeAllRanges();
            sel.addRange(newRange);

            // Déclencher un événement input pour que React mette à jour
            ceEl.dispatchEvent(new Event('input', { bubbles: true }));
          } catch {
            // Fallback : comportement global
            bumpFontSize(delta);
          }
          return;
        }
      }

      // Pas de sélection partielle : comportement global existant
      bumpFontSize(delta);
    },
    [bumpFontSize]
  );

  const handleWidthResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected) return;

    const startX = e.clientX;
    const el = selected.el;

    if (window.getComputedStyle(el).display === 'inline') {
      el.style.setProperty('display', 'inline-block', 'important');
    }

    const startWidth = el.offsetWidth;
    const startOffsetX = style.offsetX ?? 0;
    const startOffsetY = style.offsetY ?? 0;

    const handleMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      if (side === 'right') {
        const newWidth = Math.max(40, startWidth + dx);
        el.style.setProperty('width', `${newWidth}px`, 'important');
        el.style.setProperty('max-width', `${newWidth}px`, 'important');
        el.style.boxSizing = 'border-box';
        if (el.parentElement && (el.parentElement.tagName === 'P' || el.parentElement.classList.contains('ct-hero-lede'))) {
          el.parentElement.style.setProperty('max-width', `${newWidth}px`, 'important');
        }
      } else {
        const newWidth = Math.max(40, startWidth - dx);
        const deltaW = startWidth - newWidth;
        const newOffsetX = startOffsetX + deltaW;
        el.style.setProperty('width', `${newWidth}px`, 'important');
        el.style.setProperty('max-width', `${newWidth}px`, 'important');
        el.style.boxSizing = 'border-box';
        el.style.setProperty('transform', `translate(${newOffsetX}px, ${startOffsetY}px)`, 'important');
        el.setAttribute('data-cms-offset', '1');
        if (el.parentElement && (el.parentElement.tagName === 'P' || el.parentElement.classList.contains('ct-hero-lede'))) {
          el.parentElement.style.setProperty('max-width', `${newWidth}px`, 'important');
        }
      }
      updateCoords();
    };

    const handleUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      const dx = upEvent.clientX - startX;
      if (side === 'right') {
        const finalWidth = Math.max(40, startWidth + dx);
        if (el.parentElement && (el.parentElement.tagName === 'P' || el.parentElement.classList.contains('ct-hero-lede'))) {
          el.parentElement.style.setProperty('max-width', `${finalWidth}px`, 'important');
        }
        commit({ width: `${finalWidth}px` });
      } else {
        const finalWidth = Math.max(40, startWidth - dx);
        const deltaW = startWidth - finalWidth;
        const finalOffsetX = startOffsetX + deltaW;
        if (el.parentElement && (el.parentElement.tagName === 'P' || el.parentElement.classList.contains('ct-hero-lede'))) {
          el.parentElement.style.setProperty('max-width', `${finalWidth}px`, 'important');
        }
        commit({ width: `${finalWidth}px`, offsetX: finalOffsetX });
      }
      updateCoords();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [selected, style.offsetX, style.offsetY, commit, updateCoords]);

  /** Supprime définitivement toute contrainte de largeur pour restaurer la taille naturelle */
  const resetElementWidth = useCallback(() => {
    if (!selected?.el) return;
    commit({ width: undefined });
    selected.el.style.removeProperty('width');
    selected.el.style.removeProperty('max-width');
    if (selected.el.parentElement && (selected.el.parentElement.tagName === 'P' || selected.el.parentElement.classList.contains('ct-hero-lede'))) {
      selected.el.parentElement.style.removeProperty('max-width');
    }
    if (!style.height && !style.padding && selected.el.style.display === 'inline-block') {
      selected.el.style.removeProperty('display');
    }
    updateCoords();
  }, [commit, selected, style.height, style.padding, updateCoords]);

  /** Supprime définitivement toute contrainte de hauteur pour restaurer la taille naturelle et effacer l'espace vide */
  const resetElementHeight = useCallback(() => {
    if (!selected?.el) return;
    commit({ height: undefined });
    selected.el.style.removeProperty('height');
    selected.el.style.removeProperty('min-height');
    if (!style.width && !style.padding && selected.el.style.display === 'inline-block') {
      selected.el.style.removeProperty('display');
    }
    updateCoords();
  }, [commit, selected, style.width, style.padding, updateCoords]);

  /** Redimensionnement vertical (haut / bas) — étirer le texte en hauteur */
  const handleHeightResizeStart = useCallback((e: React.MouseEvent, side: 'top' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected) return;

    const startY = e.clientY;
    const el = selected.el;

    if (window.getComputedStyle(el).display === 'inline') {
      el.style.setProperty('display', 'inline-block', 'important');
    }

    const startHeight = el.offsetHeight;
    const startOffsetY = style.offsetY ?? 0;
    const startOffsetX = style.offsetX ?? 0;

    const handleMove = (moveEvent: MouseEvent) => {
      const dy = moveEvent.clientY - startY;
      if (side === 'bottom') {
        const newHeight = Math.max(20, startHeight + dy);
        el.style.setProperty('height', `${newHeight}px`, 'important');
        el.style.setProperty('min-height', `${newHeight}px`, 'important');
        el.style.boxSizing = 'border-box';
      } else {
        const newHeight = Math.max(20, startHeight - dy);
        const deltaH = startHeight - newHeight;
        const newOffsetY = startOffsetY + deltaH;
        el.style.setProperty('height', `${newHeight}px`, 'important');
        el.style.setProperty('min-height', `${newHeight}px`, 'important');
        el.style.boxSizing = 'border-box';
        el.style.setProperty('transform', `translate(${startOffsetX}px, ${newOffsetY}px)`, 'important');
        el.setAttribute('data-cms-offset', '1');
      }
      updateCoords();
    };

    const handleUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      const dy = upEvent.clientY - startY;
      if (side === 'bottom') {
        // Si l'utilisateur réduit la hauteur (déplacement vers le haut dy < -10) et qu'on revient sous la taille de départ,
        // on lève la contrainte pour que le texte retrouve sa hauteur naturelle sans espace fantôme
        if (dy < -10 && (startHeight + dy) < 45) {
          resetElementHeight();
        } else {
          const finalHeight = Math.max(20, startHeight + dy);
          commit({ height: `${finalHeight}px` });
        }
      } else {
        const finalHeight = Math.max(20, startHeight - dy);
        const deltaH = startHeight - finalHeight;
        const finalOffsetY = startOffsetY + deltaH;
        commit({ height: `${finalHeight}px`, offsetY: finalOffsetY });
      }
      updateCoords();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [selected, style.offsetY, style.offsetX, commit, updateCoords, resetElementHeight]);

  /** Glisser-déposer libre de l'élément sélectionné (4 flèches) */
  const elementDragStartRef = useRef<{
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
  } | null>(null);

  const handleElementDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selected) return;

      const initialOffsetX = style.offsetX ?? 0;
      const initialOffsetY = style.offsetY ?? 0;

      elementDragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialOffsetX,
        initialOffsetY,
      };

      const el = selected.el;
      const clickable = selected.clickableEl;

      const handleMove = (moveEvent: MouseEvent) => {
        if (!elementDragStartRef.current) return;
        const dx = moveEvent.clientX - elementDragStartRef.current.startX;
        const dy = moveEvent.clientY - elementDragStartRef.current.startY;
        const nextX = Math.round(elementDragStartRef.current.initialOffsetX + dx);
        const nextY = Math.round(elementDragStartRef.current.initialOffsetY + dy);

        el.style.setProperty('transform', `translate3d(${nextX}px, ${nextY}px, 0)`, 'important');
        el.setAttribute('data-cms-offset', '1');
        if (clickable) {
          clickable.style.setProperty('transform', `translate3d(${nextX}px, ${nextY}px, 0)`, 'important');
          clickable.setAttribute('data-cms-offset', '1');
        }
        updateCoords();
      };

      const handleUp = (upEvent: MouseEvent) => {
        if (!elementDragStartRef.current) return;
        const dx = upEvent.clientX - elementDragStartRef.current.startX;
        const dy = upEvent.clientY - elementDragStartRef.current.startY;
        const finalX = Math.round(elementDragStartRef.current.initialOffsetX + dx);
        const finalY = Math.round(elementDragStartRef.current.initialOffsetY + dy);

        elementDragStartRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);

        commit({ offsetX: finalX, offsetY: finalY });
        updateCoords();
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [selected, style.offsetX, style.offsetY, commit, updateCoords]
  );

  /** Cycle de casse du texte : Normal -> Majuscules -> Minuscules -> Normal */
  const cycleTextTransform = useCallback(() => {
    const cur = style.textTransform;
    let next: string | undefined = 'uppercase';
    if (cur === 'uppercase') next = 'lowercase';
    else if (cur === 'lowercase') next = undefined;
    else next = 'uppercase';
    commit({ textTransform: next });
  }, [style.textTransform, commit]);

  /** Suppression / masquage de l'élément sélectionné avec sauvegarde dans l'historique */
  const handleDeleteElement = useCallback(() => {
    if (!selected) return;
    setShowDeleteConfirm(false);

    // Sauvegarde l'état courant dans la pile undo pour récupération immédiate par Ctrl+Z
    setUndoStack((prev) => [...prev.slice(-30), { ...style }]);
    setRedoStack([]);

    // Masquage visuel de l'élément dans le DOM
    if (selected.el) {
      selected.el.style.display = 'none';
      selected.el.setAttribute('data-cms-hidden', 'true');
    }
    if (selected.clickableEl) {
      selected.clickableEl.style.display = 'none';
      selected.clickableEl.setAttribute('data-cms-hidden', 'true');
    }

    // Mise à jour CMS avec style masqué
    commit({ padding: undefined, width: undefined, height: undefined });
    setSelected(null);
  }, [selected, style, commit]);

  /** Masquage de la section entière */
  const handleHideSection = useCallback(() => {
    if (!selected) return;
    setShowDeleteConfirm(false);
    toggleSectionVisibility(selected.sectionKey);
    void saveCurrentPage();
    setSelected(null);
  }, [selected, toggleSectionVisibility, saveCurrentPage]);

  const resetPosition = useCallback(() => {
    commit({ offsetX: 0, offsetY: 0 });
    if (selected?.el) {
      selected.el.style.removeProperty('transform');
      selected.el.removeAttribute('data-cms-offset');
      if (window.getComputedStyle(selected.el).display === 'inline-block' && !style.width && !style.padding) {
        selected.el.style.removeProperty('display');
      }
    }
    updateCoords();
  }, [commit, selected, style.width, style.padding, updateCoords]);

  const resetElementStyles = useCallback(() => {
    if (!selected) return;
    const sectionKey = selected.sectionKey;
    const elementKey = selected.elementKey;
    const clickableElementKey = selected.clickableElementKey;

    // Suppression des styles via le contexte synchrone (pagesRef) pour éviter une lecture périmée
    // On écrase avec un objet vide → updateElementStyle supprime la clé si vide
    const keysToDelete: Record<string, undefined> = {};
    // On ne peut pas "supprimer" via patch seul, on passe par updateSectionField après avoir vidé le bag
    // Pour chaque clé de style connue, on met undefined
    const styleKeys: (keyof ElementStyle)[] = [
      'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'textTransform', 'textAlign', 'color',
      'backgroundColor', 'borderRadius', 'borderColor', 'borderWidth', 'borderStyle',
      'padding', 'width', 'height', 'minHeight', 'offsetX', 'offsetY', 'hover', 'active', 'buttonEffect',
    ];
    for (const k of styleKeys) {
      (keysToDelete as Record<string, unknown>)[k] = undefined;
    }
    updateElementStyle(sectionKey, elementKey, keysToDelete as Record<string, unknown>);
    if (clickableElementKey && clickableElementKey !== elementKey) {
      updateElementStyle(sectionKey, clickableElementKey, keysToDelete as Record<string, unknown>);
    }

    const targets = [selected.el, selected.clickableEl].filter(Boolean) as HTMLElement[];
    for (const target of targets) {
      target.style.backgroundColor = '';
      target.style.color = '';
      target.style.fontSize = '';
      target.style.fontWeight = '';
      target.style.fontStyle = '';
      target.style.textDecoration = '';
      target.style.textTransform = '';
      target.style.textAlign = '';
      target.style.borderRadius = '';
      target.style.borderColor = '';
      target.style.borderWidth = '';
      target.style.borderStyle = '';
      target.style.padding = '';
      target.style.removeProperty('display');
      target.style.removeProperty('transform');
      target.style.removeProperty('width');
      target.style.removeProperty('max-width');
      target.style.removeProperty('height');
      target.style.removeProperty('min-height');
      target.style.removeProperty('box-sizing');
      target.removeAttribute('data-cms-offset');
      target.removeAttribute('data-cms-preview-state');
      target.removeAttribute('data-cms-hidden');
      const sId = target.getAttribute('data-cms-styled-id');
      if (sId) {
        removeElementDynamicStyles(sId);
        target.removeAttribute('data-cms-styled-id');
      }
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(() => {
      void saveCurrentPage().then((ok) => {
        setSaveState(ok ? 'saved' : 'error');
        setTimeout(() => setSaveState('idle'), 2500);
      });
    }, SAVE_DEBOUNCE_MS);
  }, [selected, updateElementStyle, saveCurrentPage]);

  const switchEffectsPreviewState = useCallback(
    (state: 'normal' | 'hover' | 'active') => {
      setEffectsPreviewState(state);
      if (!selected?.el) return;
      if (state === 'normal') {
        selected.el.removeAttribute('data-cms-preview-state');
        if (selected.clickableEl) selected.clickableEl.removeAttribute('data-cms-preview-state');
      } else {
        selected.el.setAttribute('data-cms-preview-state', state);
        if (selected.clickableEl) selected.clickableEl.setAttribute('data-cms-preview-state', state);
      }
    },
    [selected]
  );

  const handleSelectEffect = useCallback(
    (type: ButtonEffectType) => {
      if (type === 'none') {
        switchEffectsPreviewState('normal');
        commit({ buttonEffect: { type: 'none' } });
      } else {
        const existing = style.buttonEffect || { type: 'signature' };
        commit({
          buttonEffect: {
            type,
            intensity: existing.intensity ?? 60,
            duration: existing.duration ?? 300,
            color: existing.color ?? '#C3F910',
            amplitude: existing.amplitude ?? 4,
          },
        });
        // Active instantanément l'état Survol pour voir l'animation en temps réel sur le bouton
        switchEffectsPreviewState('hover');
      }
    },
    [commit, style.buttonEffect, switchEffectsPreviewState]
  );

  const handleUpdateEffectParam = useCallback(
    (param: 'intensity' | 'duration' | 'color' | 'amplitude', value: any) => {
      const currentEff = style.buttonEffect || { type: 'signature' };
      commit({
        buttonEffect: {
          ...currentEff,
          [param]: value,
        },
      });
      // S'assure que l'aperçu Survol reste actif pour observer le changement en temps réel
      if (effectsPreviewState === 'normal') {
        switchEffectsPreviewState('hover');
      }
    },
    [commit, style.buttonEffect, effectsPreviewState, switchEffectsPreviewState]
  );

  const currentVisualState: ElementVisualState = useMemo(() => {
    if (paletteStateTab === 'hover') return style.hover || {};
    if (paletteStateTab === 'active') return style.active || {};
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      borderStyle: style.borderStyle,
      borderRadius: style.borderRadius,
    };
  }, [paletteStateTab, style]);

  const hasHoverStyles = Boolean(
    style.hover && Object.values(style.hover).some((v) => v !== undefined && v !== '')
  );
  const hasActiveStyles = Boolean(
    style.active && Object.values(style.active).some((v) => v !== undefined && v !== '')
  );

  if (!isEditing || !isAdmin || !selected || !coords) return null;

  // Détection exhaustive des liens et boutons
  const clickableNode =
    selected.clickableEl ||
    (selected.el.closest('a, button, [role="button"]') as HTMLElement | null) ||
    (selected.el.tagName === 'A' || selected.el.tagName === 'BUTTON' ? selected.el : null);

  const isAnchor = clickableNode?.tagName === 'A' || selected.el.tagName === 'A';
  const isButton = clickableNode?.tagName === 'BUTTON' || selected.el.tagName === 'BUTTON';
  const isClickable = Boolean(clickableNode) || Boolean(style.href) || selected.el.hasAttribute('data-href');
  const isMedia = selected.kind === 'media' || selected.el.tagName === 'IMG' || selected.el.tagName === 'VIDEO';
  const hasOffset = Boolean(style.offsetX || style.offsetY);

  const actionAttr = clickableNode?.getAttribute('data-action');
  const isSearchAction = actionAttr === 'search' || clickableNode?.classList.contains('search-trigger');

  // URL réelle configurée actuellement. La clé de destination du bouton prime
  // sur l'ancien href global, lui-même conservé comme repli de compatibilité.
  const realCurrentUrl =
    scopedLink.href ??
    style.href ??
    clickableNode?.getAttribute('href') ??
    clickableNode?.getAttribute('data-href') ??
    selected.el.getAttribute('href') ??
    selected.el.getAttribute('data-href') ??
    '';

  const isBlank =
    (scopedLink.target ??
      style.target ??
      clickableNode?.getAttribute('target') ??
      clickableNode?.getAttribute('data-target') ??
      selected.el.getAttribute('target') ??
      selected.el.getAttribute('data-target')) === '_blank';

  const iconBtn =
    'p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[28px] h-[28px] text-xs';
  const on = 'text-[color:var(--ui-accent)] bg-[rgba(var(--ui-accent-rgb),0.2)] font-bold';
  const off = 'text-[#B9B7B1] hover:text-[color:var(--ui-accent)] hover:bg-[#1a1a17]';

  return (
    <>
    <div
      ref={toolbarRef}
      data-cms-ui
      style={
        toolbarMode === 'docked_header'
          ? {
              position: 'fixed',
              top: 'var(--nav-h, 60px)',
              left: 0,
              right: 0,
              width: '100%',
              zIndex: 350,
            }
          : {
              position: 'fixed',
              top: dragPosition?.top ?? coords.top,
              left: dragPosition?.left ?? coords.left,
              zIndex: 350,
            }
      }
      className={
        toolbarMode === 'docked_header'
          ? 'flex flex-col bg-[#0d0d0c]/98 border-b border-[#2b2b28] text-[#f5f4f0] p-2 px-4 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-md select-none animate-in slide-in-from-top-1 duration-150 w-full'
          : `flex flex-col gap-2 bg-[#0e0e0d]/98 border text-[#f5f4f0] p-2.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-md select-none animate-in fade-in duration-100 max-w-[95vw] transition-[border-color,box-shadow] ${
              toolbarMode === 'pinned'
                ? 'border-[color:var(--ui-accent)]/60 shadow-[0_12px_36px_rgba(0,0,0,0.85)]'
                : 'border-[#2b2b28]'
            }`
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Ligne 1 : En-tête permanent ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 w-full">
        {/* Mode Docké au Header : Bouton Détacher pour repasser en flottant */}
        {toolbarMode === 'docked_header' ? (
          <button
            type="button"
            onClick={() => setMode('floating')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1f1f1d] hover:bg-[#2a2a26] text-white border border-[#3a3a36] hover:border-[color:var(--ui-accent)] font-mono text-[11px] font-bold transition-all cursor-pointer shadow-sm shrink-0"
            title="Détacher la barre du header et revenir au mode flottant libre"
          >
            <FloatIcon className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
            <span>DÉTACHER (MODE FLOTTANT)</span>
          </button>
        ) : (
          <>
            {/* Poignée haute performance pour déplacer librement toute la barre d'outils (Pointer events direct GPU) */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="flex items-center justify-center p-1.5 rounded-lg hover:bg-[#222220] text-[#7a7a76] hover:text-white cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
              title="Glisser pour déplacer librement toute la barre d'outils avec fluidité 60 FPS (s'aimante au Header si glissée vers le haut)"
            >
              <GripVertical className="w-4 h-4 pointer-events-none" />
            </div>

            {/* Bouton Épingler (Pin) façon Photoshop */}
            <button
              type="button"
              onClick={() => setMode(toolbarMode === 'pinned' ? 'floating' : 'pinned')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                toolbarMode === 'pinned'
                  ? 'bg-[color:var(--ui-accent)] text-[#080808] font-bold shadow-sm'
                  : 'text-[#7a7a76] hover:text-white hover:bg-[#222220]'
              }`}
              title={
                toolbarMode === 'pinned'
                  ? 'Barre d’outils ÉPINGLÉE : elle ne bouge plus même si vous sélectionnez un autre élément. Cliquer pour libérer.'
                  : 'Épingler la barre d’outils à sa position actuelle (style Photoshop)'
              }
            >
              <PinIcon className="w-3.5 h-3.5" filled={toolbarMode === 'pinned'} />
            </button>

            {/* Bouton Intégrer au Header (Dock pleine largeur) */}
            <button
              type="button"
              onClick={() => setMode('docked_header')}
              className="p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 text-[#7a7a76] hover:text-white hover:bg-[#222220]"
              title="Intégrer la barre sous le header (mode pleine largeur docké)"
            >
              <DockHeaderIcon className="w-3.5 h-3.5" />
            </button>

            {/* Bouton Enregistrer la position (si déplacée et en mode flottant) */}
            {toolbarMode === 'floating' && dragPosition && (
              <button
                type="button"
                onClick={saveCurrentToolbarPosition}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#1f1f1d] hover:bg-[#2a2a26] text-[10px] font-mono font-bold text-[color:var(--ui-accent)] border border-[color:var(--ui-accent)]/40 transition-colors shrink-0 cursor-pointer"
                title="Mémoriser cette position pour qu'elle s'affiche toujours ici"
              >
                <PinIcon className="w-3 h-3" />
                <span>MÉMORISER</span>
              </button>
            )}
          </>
        )}

        {/* Badge indicateur de type & section */}
        <span
          style={{
            backgroundColor: 'var(--accent-muted, rgba(var(--ui-accent-rgb), 0.12))',
            color: 'var(--accent, var(--ui-accent))',
            borderColor: 'var(--accent-border, rgba(var(--ui-accent-rgb), 0.35))',
          }}
          className="px-2 py-1 rounded-md border font-mono text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0"
          title={`${selected.sectionKey} → ${selected.elementKey}`}
        >
          {isMedia
            ? (isMediaVideo(selected.el.getAttribute('src')) ? 'VIDÉO' : 'IMAGE')
            : isAnchor
            ? 'LIEN'
            : isButton
            ? 'BOUTON'
            : isClickable
            ? 'ÉLÉMENT CLIQUABLE'
            : 'TEXTE'}{' '}
          · {selected.sectionKey}
        </span>

        {/* Annuler / Rétablir (Flèche gauche / Flèche droite) */}
        <div className="flex items-center gap-0.5 px-1 border-l border-[#2b2b28] shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`${iconBtn} ${undoStack.length > 0 ? off : 'text-[#444] cursor-not-allowed opacity-40'}`}
            title="Revenir en arrière (Ctrl + Z)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`${iconBtn} ${redoStack.length > 0 ? off : 'text-[#444] cursor-not-allowed opacity-40'}`}
            title="Avancer / Rétablir (Ctrl + Y)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cas Image / Média : Bouton Remplacer */}
        {isMedia && (
          <div className="flex items-center gap-1 pl-1 border-l border-[#2b2b28] shrink-0">
            <button
              type="button"
              onClick={() => onOpenImageModal?.(selected.el)}
              className="flex items-center gap-1.5 bg-[color:var(--ui-accent)] hover:bg-[color:var(--ui-accent-hover)] text-[#080808] px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
              title="Remplacer cette image / média"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>REMPLACER L&apos;IMAGE</span>
            </button>
          </div>
        )}

        {/* ── 3 Compartiments Accordéon (Un seul ouvert à la fois) ── */}
        {!isMedia && (
          <div className="flex items-center gap-1 bg-[#141412] p-0.5 rounded-xl border border-[#2b2b28] shrink-0">
            {/* 01 Typographie */}
            <button
              type="button"
              onClick={() => toggleAccordion('typo')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                activeAccordion === 'typo'
                  ? 'bg-[color:var(--ui-accent)] text-[#080808] shadow-sm'
                  : 'text-[#aaa] hover:text-white hover:bg-[#1f1f1d]'
              }`}
              title="Compartiment 01 : Typographie (taille, graisse, souligné, barré, casse, alignement)"
            >
              <Type className="w-3.5 h-3.5" />
              <span>01 Typographie</span>
            </button>

            {/* 02 Couleurs et apparence */}
            <button
              type="button"
              onClick={() => toggleAccordion('colors')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                activeAccordion === 'colors'
                  ? 'bg-[color:var(--ui-accent)] text-[#080808] shadow-sm'
                  : 'text-[#aaa] hover:text-white hover:bg-[#1f1f1d]'
              }`}
              title="Compartiment 02 : Couleurs et apparence (texte, fond, bordures, arrondis — Normal, Survol, Clic)"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>02 Couleurs</span>
              {(hasHoverStyles || hasActiveStyles || Boolean(style.backgroundColor || style.borderColor || style.borderRadius)) && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeAccordion === 'colors' ? 'bg-[#080808]' : 'bg-[color:var(--ui-accent)]'}`} />
              )}
            </button>

            {/* 03 Positionnement et effets */}
            <button
              type="button"
              onClick={() => toggleAccordion('position')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                activeAccordion === 'position'
                  ? 'bg-[color:var(--ui-accent)] text-[#080808] shadow-sm'
                  : 'text-[#aaa] hover:text-white hover:bg-[#1f1f1d]'
              }`}
              title="Compartiment 03 : Positionnement et effets (nudge X/Y, lien/redirection, effets et animations)"
            >
              <Move className="w-3.5 h-3.5" />
              <span>03 Position & Effets</span>
              {(hasOffset || realCurrentUrl || (style.buttonEffect?.type && style.buttonEffect.type !== 'none')) && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeAccordion === 'position' ? 'bg-[#080808]' : 'bg-[color:var(--ui-accent)]'}`} />
              )}
            </button>
          </div>
        )}

        {/* ── Contrôles à l'extrême droite : Auto-save, Enregistrer, Sparkles, Corbeille, Fermer ── */}
        <div className="flex items-center gap-1.5 pl-2 ml-auto border-l border-[#2b2b28] shrink-0">
          {/* Switch Auto-save */}
          <div
            className="flex items-center gap-1.5 px-1"
            title={
              autoSave
                ? 'Sauvegarde automatique ACTIVÉE : chaque modification est enregistrée sur le serveur'
                : 'Sauvegarde automatique DÉSACTIVÉE : testez vos modifications sans enregistrement automatique'
            }
          >
            <span className="font-mono text-[10px] text-[#8a8880] select-none font-bold whitespace-nowrap">Auto-save</span>
            <button
              type="button"
              onClick={() => setAutoSave((v) => !v)}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
                autoSave ? 'bg-[color:var(--ui-accent)]' : 'bg-[#333330]'
              }`}
              title={autoSave ? 'Sauvegarde auto activée (cliquer pour désactiver)' : 'Sauvegarde auto désactivée (cliquer pour activer)'}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-[#080808] shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${
                  autoSave ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Bouton ENREGISTRER */}
          <button
            type="button"
            onClick={() => {
              setSaveState('saving');
              void saveCurrentPage().then((ok) => {
                setSaveState(ok ? 'saved' : 'error');
                setTimeout(() => setSaveState('idle'), 2500);
              });
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer shadow-sm ${
              !autoSave
                ? 'bg-[color:var(--ui-accent)] hover:bg-[color:var(--ui-accent-hover)] text-[#080808]'
                : 'bg-[#1f1f1d] hover:bg-[#2a2a26] text-white hover:text-[color:var(--ui-accent)] border border-[#333]'
            }`}
            title="Enregistrer immédiatement les modifications sur le serveur"
          >
            <span>ENREGISTRER</span>
          </button>

          {/* Indicateur de sauvegarde */}
          {saveState !== 'idle' && (
            <span
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{
                color:
                  saveState === 'error'
                    ? '#ff4444'
                    : 'var(--accent, var(--ui-accent))',
                backgroundColor:
                  saveState === 'saved'
                    ? 'rgba(var(--ui-accent-rgb), 0.12)'
                    : saveState === 'error'
                    ? 'rgba(255, 68, 68, 0.12)'
                    : 'transparent',
              }}
            >
              {saveState === 'saving'
                ? 'EN COURS…'
                : saveState === 'saved'
                ? '✓ ENREGISTRÉ'
                : '✕ ERREUR'}
            </span>
          )}

          {/* Restaurer styles */}
          <button
            type="button"
            onClick={resetElementStyles}
            className={`${iconBtn} ${off}`}
            title="Restaurer à l'initial (effacer styles personnalisés de cet élément)"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent, var(--ui-accent))' }} />
          </button>

          {/* Corbeille avec confirmation sécurisée */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className={`${iconBtn} text-[#ff6666] hover:bg-[#331111] hover:text-[#ff9999]`}
            title="Supprimer ou masquer cet élément (sécurisé avec confirmation)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Fermer */}
          <button
            type="button"
            onClick={() => setSelectedElement(null)}
            className="text-[#7a7a76] hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            title="Fermer la barre (Échap)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── PANNEAU ACCORDÉON 01 : TYPOGRAPHIE ── */}
      {activeAccordion === 'typo' && !isMedia && (
        <div className="flex items-center gap-3 pt-2 border-t border-[#2b2b28] bg-[#141412] p-2.5 rounded-xl animate-in slide-in-from-top-1 text-xs flex-wrap">
          {/* Groupe Taille */}
          <div className="flex items-center gap-1 bg-[#0a0a09] px-2 py-1 rounded-lg border border-[#262624]">
            <span className="font-mono text-[10px] text-[#888] uppercase mr-1">Taille</span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
              onClick={() => bumpFontSizeOnSelection(-FONT_STEP)}
              className={`${iconBtn} ${off}`}
              title="Réduire la taille (A−)"
            >
              <span className="font-mono text-[11px] font-bold">A−</span>
            </button>
            <span className="font-mono text-[11px] text-[#B9B7B1] min-w-[36px] text-center font-bold px-1.5 py-0.5 bg-[#161614] rounded border border-[#333]">
              {style.fontSize || (selected?.el ? `${Math.round(parseFloat(window.getComputedStyle(selected.el).fontSize) || 16)}px` : '16px')}
            </span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
              onClick={() => bumpFontSizeOnSelection(FONT_STEP)}
              className={`${iconBtn} ${off}`}
              title="Agrandir la taille (A+)"
            >
              <span className="font-mono text-[11px] font-bold">A+</span>
            </button>
          </div>

          {/* Groupe Formats : B, I, U, S barré, AA Casse */}
          <div className="flex items-center gap-1 bg-[#0a0a09] px-2 py-1 rounded-lg border border-[#262624]">
            <button
              type="button"
              onClick={toggleBold}
              className={`${iconBtn} ${style.fontWeight === '700' ? on : off}`}
              title="Gras (B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleItalic}
              className={`${iconBtn} ${style.fontStyle === 'italic' ? on : off}`}
              title="Italique (I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleUnderline}
              className={`${iconBtn} ${style.textDecoration === 'underline' ? on : off}`}
              title="Souligné (U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleStrikethrough}
              className={`${iconBtn} ${style.textDecoration === 'line-through' ? on : off}`}
              title="Barré (S)"
            >
              <span className="font-serif line-through font-bold text-xs">S</span>
            </button>
            <div className="w-[1px] h-4 bg-[#262624]" />
            <button
              type="button"
              onClick={cycleTextTransform}
              className={`${iconBtn} ${style.textTransform ? on : off}`}
              title={
                style.textTransform === 'uppercase'
                  ? 'Majuscules actives (clic pour minuscules)'
                  : style.textTransform === 'lowercase'
                  ? 'Minuscules actives (clic pour normal)'
                  : 'Casse normale (clic pour tout en MAJUSCULES)'
              }
            >
              <span className="font-mono text-[11px] font-bold">
                {style.textTransform === 'uppercase' ? 'AA' : style.textTransform === 'lowercase' ? 'aa' : 'Aa'}
              </span>
            </button>
          </div>

          {/* Groupe Alignements */}
          <div className="flex items-center gap-1 bg-[#0a0a09] px-2 py-1 rounded-lg border border-[#262624]">
            <span className="font-mono text-[10px] text-[#888] uppercase mr-1">Alignement</span>
            {ALIGNS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => commit({ textAlign: value })}
                className={`${iconBtn} ${style.textAlign === value ? on : off}`}
                title={`Alignement : ${label}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Bouton de suppression de contrainte de hauteur / espace vide fantôme */}
          {Boolean(style.height || (selected?.el && selected.el.style.height)) && (
            <button
              type="button"
              onClick={resetElementHeight}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ff4444]/20 hover:bg-[#ff4444]/35 text-[#ff9999] border border-[#ff4444]/40 font-mono text-[11px] font-bold cursor-pointer transition-colors shadow-sm ml-auto"
              title="Supprimer la hauteur forcée pour effacer définitivement l'espace vide sous le texte"
            >
              <RotateCcw className="w-3 h-3 text-[#ff8888]" />
              <span>SUPPRIMER ESPACE VIDE (HAUTEUR AUTO)</span>
            </button>
          )}
        </div>
      )}

      {/* ── PANNEAU ACCORDÉON 02 : COULEURS ET APPARENCE ── */}
      {activeAccordion === 'colors' && !isMedia && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-[#2b2b28] bg-[#141412] p-3 rounded-xl animate-in slide-in-from-top-1 text-xs">
          {/* 1. Sélecteur d'état : Normal | Survol (Hover) | Clic (Active) */}
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#2b2b28] pb-2">
            <div className="flex items-center gap-1 bg-[#0a0a09] p-0.5 rounded-lg border border-[#2b2b28]">
              <button
                type="button"
                onClick={() => switchPaletteStateTab('normal')}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  paletteStateTab === 'normal'
                    ? 'bg-[color:var(--ui-accent)] text-[#080808] shadow-sm'
                    : 'text-[#aaa] hover:text-white hover:bg-[#1a1a17]'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => switchPaletteStateTab('hover')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  paletteStateTab === 'hover'
                    ? 'bg-[color:var(--ui-accent)] text-[#080808] shadow-sm'
                    : 'text-[#aaa] hover:text-white hover:bg-[#1a1a17]'
                }`}
              >
                <span>Survol (Hover)</span>
                {hasHoverStyles && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      paletteStateTab === 'hover' ? 'bg-[#080808]' : 'bg-[color:var(--ui-accent)]'
                    }`}
                    title="Styles de survol personnalisés définis"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => switchPaletteStateTab('active')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  paletteStateTab === 'active'
                    ? 'bg-[color:var(--ui-accent)] text-[#080808] shadow-sm'
                    : 'text-[#aaa] hover:text-white hover:bg-[#1a1a17]'
                }`}
              >
                <span>Clic (Active)</span>
                {hasActiveStyles && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      paletteStateTab === 'active' ? 'bg-[#080808]' : 'bg-[color:var(--ui-accent)]'
                    }`}
                    title="Styles de clic personnalisés définis"
                  />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#888]">
                {paletteStateTab === 'normal'
                  ? '• État par défaut'
                  : paletteStateTab === 'hover'
                  ? '👁 Prévisualisation active : SURVOL'
                  : '👁 Prévisualisation active : CLIC'}
              </span>
              {paletteStateTab !== 'normal' && (
                <button
                  type="button"
                  onClick={clearStateOverrides}
                  className="text-[10px] font-mono text-[#ff7777] hover:text-[#ffaaaa] hover:underline cursor-pointer"
                  title="Effacer les styles personnalisés de cet état et réhériter de l'état normal"
                >
                  Effacer cet état
                </button>
              )}
            </div>
          </div>

          {/* 2. Contrôles de style pour l'état sélectionné */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Groupe Couleurs */}
            <div className="flex items-center gap-2 bg-[#0a0a09] px-2.5 py-1.5 rounded-lg border border-[#262624]">
              {/* Couleur Texte */}
              <div className="flex items-center gap-1.5" title="Couleur du texte">
                <span className="font-mono text-[10px] text-[#888] uppercase">Texte</span>
                <label
                  className="relative w-5 h-5 rounded overflow-hidden border border-[#444] cursor-pointer flex items-center justify-center shrink-0"
                  style={{ background: currentVisualState.color || style.color || '#ffffff' }}
                >
                  <Type className="w-3 h-3 text-black mix-blend-difference" />
                  <input
                    type="color"
                    value={
                      currentVisualState.color && currentVisualState.color.startsWith('#')
                        ? currentVisualState.color
                        : style.color && style.color.startsWith('#')
                        ? style.color
                        : '#ffffff'
                    }
                    onChange={(e) => commitVisualProperty('color', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => commitVisualProperty('color', 'var(--accent, var(--ui-accent))')}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c1c1a] hover:bg-[#2b2b28] text-[#d0cfca] hover:text-[color:var(--ui-accent)] border border-[#333] transition-colors cursor-pointer"
                  title="Couleur du thème actif"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent, var(--ui-accent))' }} />
                  <span>Thème</span>
                </button>
              </div>

              <div className="w-[1px] h-4 bg-[#262624]" />

              {/* Couleur Fond */}
              <div className="flex items-center gap-1.5" title="Couleur de fond">
                <span className="font-mono text-[10px] text-[#888] uppercase">Fond</span>
                <label
                  className="relative w-5 h-5 rounded overflow-hidden border border-[#444] cursor-pointer flex items-center justify-center shrink-0"
                  style={{
                    background:
                      currentVisualState.backgroundColor || style.backgroundColor || 'transparent',
                  }}
                >
                  <span className="w-3 h-2 rounded-[1px] border border-white/80" />
                  <input
                    type="color"
                    value={
                      currentVisualState.backgroundColor &&
                      currentVisualState.backgroundColor.startsWith('#')
                        ? currentVisualState.backgroundColor
                        : style.backgroundColor && style.backgroundColor.startsWith('#')
                        ? style.backgroundColor
                        : '#111111'
                    }
                    onChange={(e) => commitVisualProperty('backgroundColor', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => commitVisualProperty('backgroundColor', 'transparent')}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c1c1a] hover:bg-[#2b2b28] text-[#d0cfca] hover:text-[color:var(--ui-accent)] border border-[#333] transition-colors cursor-pointer"
                  title="Fond transparent"
                >
                  <Ban className="w-2.5 h-2.5 text-[#ff5555]" />
                  <span>Transparent</span>
                </button>
              </div>
            </div>

            {/* Groupe Bordure & Arrondi */}
            <div className="flex items-center gap-2 bg-[#0a0a09] px-2.5 py-1.5 rounded-lg border border-[#262624]">
              {/* Arrondi */}
              <div className="flex items-center gap-1.5" title="Rayon des coins (Arrondi)">
                <span className="font-mono text-[10px] text-[#888] uppercase">Arrondi</span>
                <select
                  value={currentVisualState.borderRadius || (paletteStateTab === 'normal' ? '0px' : '')}
                  onChange={(e) => commitVisualProperty('borderRadius', e.target.value)}
                  className="bg-[#181816] border border-[#333] rounded px-1.5 py-0.5 text-white font-mono text-[11px] cursor-pointer"
                >
                  {paletteStateTab !== 'normal' && <option value="">Hérité (Défaut)</option>}
                  <option value="0px">Coins droits (0px)</option>
                  <option value="4px">Arrondi 4px</option>
                  <option value="8px">Arrondi 8px</option>
                  <option value="12px">Arrondi 12px</option>
                  <option value="16px">Arrondi 16px</option>
                  <option value="9999px">Pilule (Rond)</option>
                </select>
              </div>

              <div className="w-[1px] h-4 bg-[#262624]" />

              {/* Bordure Épaisseur */}
              <div className="flex items-center gap-1.5" title="Épaisseur de bordure">
                <span className="font-mono text-[10px] text-[#888] uppercase">Bordure</span>
                <select
                  value={currentVisualState.borderWidth || (paletteStateTab === 'normal' ? '0px' : '')}
                  onChange={(e) => {
                    const width = e.target.value;
                    commitVisualProperty('borderWidth', width);
                    if (width && width !== '0px' && !currentVisualState.borderStyle) {
                      commitVisualProperty('borderStyle', 'solid');
                    }
                  }}
                  className="bg-[#181816] border border-[#333] rounded px-1.5 py-0.5 text-white font-mono text-[11px] cursor-pointer"
                >
                  {paletteStateTab !== 'normal' && <option value="">Héritée</option>}
                  <option value="0px">Sans bordure</option>
                  <option value="1px">1px</option>
                  <option value="2px">2px</option>
                  <option value="3px">3px</option>
                  <option value="4px">4px</option>
                </select>
              </div>

              {/* Bordure Style & Couleur si épaisseur > 0 */}
              {Boolean(
                currentVisualState.borderWidth &&
                  currentVisualState.borderWidth !== '0px'
              ) && (
                <>
                  <select
                    value={currentVisualState.borderStyle || 'solid'}
                    onChange={(e) => commitVisualProperty('borderStyle', e.target.value)}
                    className="bg-[#181816] border border-[#333] rounded px-1.5 py-0.5 text-white font-mono text-[11px] cursor-pointer"
                    title="Style de la bordure"
                  >
                    <option value="solid">Plein</option>
                    <option value="dashed">Tirets</option>
                    <option value="dotted">Pointillés</option>
                  </select>

                  <label
                    className="relative w-5 h-5 rounded overflow-hidden border border-[#444] cursor-pointer shrink-0"
                    title="Couleur de bordure"
                    style={{
                      background:
                        currentVisualState.borderColor || style.borderColor || '#C3F910',
                    }}
                  >
                    <input
                      type="color"
                      value={
                        currentVisualState.borderColor &&
                        currentVisualState.borderColor.startsWith('#')
                          ? currentVisualState.borderColor
                          : style.borderColor && style.borderColor.startsWith('#')
                          ? style.borderColor
                          : '#C3F910'
                      }
                      onChange={(e) => commitVisualProperty('borderColor', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PANNEAU ACCORDÉON 03 : POSITIONNEMENT ET EFFETS ── */}
      {activeAccordion === 'position' && (
        <div className="flex flex-col gap-3 pt-2 border-t border-[#2b2b28] bg-[#141412] p-3 rounded-xl animate-in slide-in-from-top-1 text-xs">
          {/* Ligne A : Déplacement fin (Nudge) & Lien */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Déplacement Nudge */}
            <div className="flex items-center gap-1 bg-[#0a0a09] px-2.5 py-1 rounded-lg border border-[#262624]">
              <span
                style={{ color: hasOffset ? 'var(--accent, var(--ui-accent))' : '#6a6a65' }}
                className="flex items-center gap-1 font-mono text-[10px] font-bold mr-1"
                title="Décalage horizontal / vertical (nudge)"
              >
                <Move className="w-3 h-3" />
                X:{style.offsetX || 0} Y:{style.offsetY || 0}
              </span>
              <button
                type="button"
                onClick={() => nudge(0, -NUDGE)}
                className={`${iconBtn} ${off}`}
                title="Déplacer vers le haut"
              >
                <MoveUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(0, NUDGE)}
                className={`${iconBtn} ${off}`}
                title="Déplacer vers le bas"
              >
                <MoveDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(-NUDGE, 0)}
                className={`${iconBtn} ${off}`}
                title="Déplacer vers la gauche"
              >
                <MoveLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(NUDGE, 0)}
                className={`${iconBtn} ${off}`}
                title="Déplacer vers la droite"
              >
                <MoveRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={resetPosition}
                disabled={!hasOffset}
                className={`${iconBtn} ${hasOffset ? off : 'text-[#444] cursor-not-allowed'}`}
                title="Réinitialiser la position (alignement)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Outil Lien / Redirection */}
            <div className="flex-1 min-w-[280px] flex items-center gap-2 bg-[#0a0a09] p-1.5 rounded-lg border border-[#262624]">
              <LinkIcon className="w-3.5 h-3.5 text-[color:var(--ui-accent)] shrink-0 ml-1" />
              <input
                type="text"
                value={realCurrentUrl}
                onChange={(e) => {
                  const url = e.target.value;
                  if (clickableNode && isAnchor) clickableNode.setAttribute('href', url);
                  if (selected.el.tagName === 'A') (selected.el as HTMLAnchorElement).setAttribute('href', url);
                  else selected.el.setAttribute('data-href', url);
                  commit({ href: url });
                }}
                placeholder="Destination : /web/contact, /web/products, #projects, https://..."
                className="w-full bg-transparent text-xs text-white font-mono focus:outline-none"
                title="URL de destination du bouton ou du lien"
              />
              <select
                value=""
                onChange={(e) => {
                  const url = e.target.value;
                  if (!url) return;
                  if (clickableNode && isAnchor) clickableNode.setAttribute('href', url);
                  if (selected.el.tagName === 'A') (selected.el as HTMLAnchorElement).setAttribute('href', url);
                  else selected.el.setAttribute('data-href', url);
                  commit({ href: url });
                }}
                className="bg-[#1f1f1d] border border-[#333] rounded px-1.5 py-0.5 text-[11px] text-[#ddd] font-mono focus:border-[color:var(--ui-accent)] cursor-pointer max-w-[140px]"
                title="Choisir une page interne du site"
              >
                <option value="">-- Page interne --</option>
                {INTERNAL_PAGES.map((p) => (
                  <option key={p.url} value={p.url}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const nextTarget = isBlank ? '_self' : '_blank';
                  if (clickableNode) clickableNode.setAttribute('target', nextTarget);
                  selected.el.setAttribute('target', nextTarget);
                  commit({ target: nextTarget, rel: nextTarget === '_blank' ? 'noopener noreferrer' : '' });
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isBlank ? 'bg-[color:var(--ui-accent)] text-[#080808]' : 'bg-[#222] text-[#aaa] hover:text-white'
                }`}
                title={isBlank ? 'Nouvel onglet (_blank)' : 'Même onglet (_self)'}
              >
                {isBlank ? 'NOUVEL ONGLET' : 'MÊME ONGLET'}
              </button>
              {realCurrentUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (clickableNode) {
                      clickableNode.removeAttribute('href');
                      clickableNode.removeAttribute('data-href');
                    }
                    selected.el.removeAttribute('href');
                    selected.el.removeAttribute('data-href');
                    commit({ href: '', target: '_self' });
                  }}
                  className="p-1 text-[#ff6666] hover:bg-[#331111] rounded cursor-pointer"
                  title="Supprimer le lien"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Ligne B : Bibliothèque d'effets visuels et animations */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#262624]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Bibliothèque d&apos;Effets & Animations de Boutons
                </span>
                {style.buttonEffect?.type && style.buttonEffect.type !== 'none' && (
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[rgba(var(--ui-accent-rgb),0.2)] text-[color:var(--ui-accent)] border border-[rgba(var(--ui-accent-rgb),0.3)] uppercase">
                    {style.buttonEffect.type}
                  </span>
                )}
              </div>

              {/* Aperçu direct des états sur le bouton */}
              <div className="flex items-center gap-1 bg-[#0a0a09] p-0.5 rounded-lg border border-[#262624]">
                {(['normal', 'hover', 'active'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => switchEffectsPreviewState(st)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-all cursor-pointer ${
                      effectsPreviewState === st
                        ? 'bg-[color:var(--ui-accent)] text-[#080808] shadow-sm'
                        : 'text-[#888] hover:text-white'
                    }`}
                    title={`Tester l'état ${st === 'normal' ? 'Normal' : st === 'hover' ? 'Survol (Hover)' : 'Clic (Active)'} sur l'élément réel`}
                  >
                    {st === 'normal' ? 'Normal' : st === 'hover' ? 'Survol' : 'Clic'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille des effets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BUTTON_EFFECTS_CATALOG.map((item) => {
                const isCurrent = (style.buttonEffect?.type || 'none') === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEffect(item.id)}
                    className={`group relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[64px] select-none ${
                      isCurrent
                        ? 'bg-[#1c2211] border-[color:var(--ui-accent)] ring-1 ring-[rgba(var(--ui-accent-rgb),0.6)]'
                        : 'bg-[#181816] border-[#2b2b28] hover:border-[#444] hover:bg-[#1e1e1b]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-mono text-[11px] font-bold text-white group-hover:text-[color:var(--ui-accent)] transition-colors leading-tight">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="px-1 py-0.5 rounded text-[7.5px] font-mono font-bold bg-[color:var(--ui-accent)] text-[#080808]">
                          {item.badge}
                        </span>
                      )}
                      {isCurrent && !item.badge && (
                        <Check className="w-3 h-3 text-[color:var(--ui-accent)] shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-[#8a8880] leading-tight line-clamp-1">
                      {item.tagline}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Réglages personnalisés si effet actif */}
            {style.buttonEffect?.type && style.buttonEffect.type !== 'none' && (() => {
              const currentCat = BUTTON_EFFECTS_CATALOG.find((c) => c.id === style.buttonEffect?.type);
              const eff = style.buttonEffect;
              return (
                <div className="flex items-center gap-2.5 pt-2 border-t border-[#262624] flex-wrap bg-[#0e0e0d] p-2.5 rounded-xl">
                  <span className="font-mono text-[10px] text-[#7a7a76] uppercase tracking-wider block w-full mb-0.5">
                    Réglages : {currentCat?.name}
                  </span>

                  {currentCat?.hasIntensity && (
                    <div className="flex items-center gap-1.5 bg-[#171715] px-2 py-1 rounded-lg border border-[#2b2b28]">
                      <span className="font-mono text-[9.5px] text-[#888] uppercase">Intensité</span>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={eff.intensity ?? 60}
                        onChange={(e) => handleUpdateEffectParam('intensity', Number(e.target.value))}
                        className="w-16 h-1.5 bg-[#262624] rounded-lg appearance-none cursor-pointer accent-[color:var(--ui-accent)]"
                      />
                      <span className="font-mono text-[10px] font-bold text-[color:var(--ui-accent)] min-w-[24px]">
                        {eff.intensity ?? 60}%
                      </span>
                    </div>
                  )}

                  {currentCat?.hasDuration && (
                    <div className="flex items-center gap-1 bg-[#171715] px-2 py-1 rounded-lg border border-[#2b2b28]">
                      <span className="font-mono text-[9.5px] text-[#888] uppercase">Durée</span>
                      <select
                        value={eff.duration ?? 300}
                        onChange={(e) => handleUpdateEffectParam('duration', Number(e.target.value))}
                        className="bg-[#141412] border border-[#333] rounded px-1.5 py-0.5 text-white font-mono text-[10px] cursor-pointer"
                      >
                        <option value="150">150 ms (Vif)</option>
                        <option value="250">250 ms (Rapide)</option>
                        <option value="300">300 ms (Standard)</option>
                        <option value="500">500 ms (Fluide)</option>
                        <option value="800">800 ms (Doux)</option>
                      </select>
                    </div>
                  )}

                  {currentCat?.hasAmplitude && (
                    <div className="flex items-center gap-1.5 bg-[#171715] px-2 py-1 rounded-lg border border-[#2b2b28]">
                      <span className="font-mono text-[9.5px] text-[#888] uppercase">Amplitude</span>
                      <input
                        type="range"
                        min="2"
                        max="12"
                        step="1"
                        value={eff.amplitude ?? 4}
                        onChange={(e) => handleUpdateEffectParam('amplitude', Number(e.target.value))}
                        className="w-14 h-1.5 bg-[#262624] rounded-lg appearance-none cursor-pointer accent-[color:var(--ui-accent)]"
                      />
                      <span className="font-mono text-[10px] font-bold text-[color:var(--ui-accent)] min-w-[20px]">
                        {eff.amplitude ?? 4}px
                      </span>
                    </div>
                  )}

                  {currentCat?.hasColor && (
                    <div className="flex items-center gap-1.5 bg-[#171715] px-2 py-1 rounded-lg border border-[#2b2b28]">
                      <span className="font-mono text-[9.5px] text-[#888] uppercase">Couleur</span>
                      <label
                        className="relative w-4 h-4 rounded overflow-hidden border border-[#444] cursor-pointer shrink-0"
                        style={{ background: eff.color || '#C3F910' }}
                      >
                        <input
                          type="color"
                          value={eff.color?.startsWith('#') ? eff.color : '#C3F910'}
                          onChange={(e) => handleUpdateEffectParam('color', e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      <input
                        type="text"
                        value={eff.color || '#C3F910'}
                        onChange={(e) => handleUpdateEffectParam('color', e.target.value)}
                        className="w-14 bg-[#141412] border border-[#333] rounded px-1 py-0.5 text-[10px] text-white font-mono uppercase focus:border-[color:var(--ui-accent)] focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectEffect('none')}
                    className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[#ff7777] hover:text-[#ffaaaa] hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Retirer l&apos;effet</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>

      {/* Poignées de redimensionnement et poignée centrale de déplacement libre (4 flèches) */}
      {selected && !isMedia && selected.el.isConnected && coords && (() => {
        const rect = selected.el.getBoundingClientRect();
        return (
          <>
            {/* Poignée centrale de déplacement libre (4 flèches croisées) */}
            <div
              data-cms-ui
              style={{
                position: 'fixed',
                top: Math.max(8, rect.top - 28),
                left: rect.left + rect.width / 2 - 14,
                width: 28,
                height: 22,
                zIndex: 370,
                cursor: 'move',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 5,
                background: '#0e0e0d',
                border: '1.5px solid var(--accent, var(--ui-accent))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
              }}
              onMouseDown={handleElementDragStart}
              title="Glisser-déposer : Déplacer librement cet élément (haut, bas, gauche, droite)"
            >
              <Move className="w-3.5 h-3.5 text-[color:var(--ui-accent)] pointer-events-none" />
            </div>

            {/* Poignée haut (étirement vertical) */}
            <div
              data-cms-ui
              style={{
                position: 'fixed',
                top: rect.top - 8,
                left: rect.left + rect.width / 2 - 16,
                width: 32,
                height: 16,
                zIndex: 360,
                cursor: 'ns-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                background: '#0e0e0d',
                border: '1px solid var(--accent, var(--ui-accent))',
              }}
              onMouseDown={(e) => handleHeightResizeStart(e, 'top')}
              onDoubleClick={resetElementHeight}
              title="Redimensionner verticalement (haut) — Double-cliquer pour supprimer immédiatement l'espace vide"
            >
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M1 2L13 2M1 6L13 6" stroke="var(--accent, var(--ui-accent))" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>

            {/* Poignée bas (étirement vertical) */}
            <div
              data-cms-ui
              style={{
                position: 'fixed',
                top: rect.bottom - 8,
                left: rect.left + rect.width / 2 - 16,
                width: 32,
                height: 16,
                zIndex: 360,
                cursor: 'ns-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                background: '#0e0e0d',
                border: '1px solid var(--accent, var(--ui-accent))',
              }}
              onMouseDown={(e) => handleHeightResizeStart(e, 'bottom')}
              onDoubleClick={resetElementHeight}
              title="Redimensionner verticalement (bas) — Double-cliquer pour supprimer immédiatement l'espace vide"
            >
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M1 2L13 2M1 6L13 6" stroke="var(--accent, var(--ui-accent))" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>

            {/* Poignée gauche (étirement horizontal) */}
            <div
              data-cms-ui
              style={{
                position: 'fixed',
                top: rect.top + rect.height / 2 - 16,
                left: rect.left - 8,
                width: 16,
                height: 32,
                zIndex: 360,
                cursor: 'ew-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                background: '#0e0e0d',
                border: '1px solid var(--accent, var(--ui-accent))',
              }}
              onMouseDown={(e) => handleWidthResizeStart(e, 'left')}
              onDoubleClick={resetElementWidth}
              title="Redimensionner horizontalement (gauche) — double-clic pour largeur auto"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M2 1L2 13M6 1L6 13" stroke="var(--accent, var(--ui-accent))" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>

            {/* Poignée droite (étirement horizontal) */}
            <div
              data-cms-ui
              style={{
                position: 'fixed',
                top: rect.top + rect.height / 2 - 16,
                left: rect.right - 8,
                width: 16,
                height: 32,
                zIndex: 360,
                cursor: 'ew-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                background: '#0e0e0d',
                border: '1px solid var(--accent, var(--ui-accent))',
              }}
              onMouseDown={(e) => handleWidthResizeStart(e, 'right')}
              onDoubleClick={resetElementWidth}
              title="Redimensionner horizontalement (droite) — double-clic pour largeur auto"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M2 1L2 13M6 1L6 13" stroke="var(--accent, var(--ui-accent))" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </>
        );
      })()}

      {/* Modal de confirmation de suppression / masquage sécurisé */}
      {showDeleteConfirm && (
        <div
          data-cms-ui
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-[#141412] border border-[#333330] rounded-2xl max-w-md w-full p-5 shadow-[0_24px_64px_rgba(0,0,0,0.9)] flex flex-col gap-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-mono text-sm font-bold text-white mb-1">
                  Supprimer ou masquer un élément
                </h3>
                <p className="text-xs text-[#a0a09a] leading-relaxed">
                  <span className="font-semibold text-emerald-400">Rassurez-vous :</span> c&apos;est entièrement récupérable en cas de clic par erreur via <span className="text-white font-mono font-bold">Ctrl + Z</span> (Annuler) ou via le bouton Restaurer.
                </p>
              </div>
            </div>

            <div className="bg-[#0b0b0a] border border-[#222220] rounded-xl p-3 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[#888] font-mono text-[11px]">
                <span>Élément sélectionné :</span>
                <span className="text-[color:var(--ui-accent)] font-bold">{selected?.elementKey || 'élément'}</span>
              </div>
              <div className="flex items-center justify-between text-[#888] font-mono text-[11px]">
                <span>Section :</span>
                <span className="text-white font-bold">{selected?.sectionKey || 'section'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteElement}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer cet élément</span>
              </button>
              <button
                type="button"
                onClick={handleHideSection}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#222220] hover:bg-[#2c2c28] border border-[#333330] text-[#e0e0dc] font-mono text-xs font-bold transition-all cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Masquer toute la section</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-2 px-3 rounded-xl bg-transparent hover:bg-[#1a1a17] text-[#888] hover:text-white font-mono text-xs transition-colors cursor-pointer text-center"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
