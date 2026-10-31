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
  type ElementStyle,
  type ElementVisualState,
} from './useCmsElementStyles';
import { normalizeLang } from '@/lib/site-web/cms-i18n';

const NUDGE = 4;
const FONT_STEP = 2;
const SAVE_DEBOUNCE_MS = 600;

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
  const { isEditing, isAdmin, currentPageData, currentLang, updateSectionField, saveCurrentPage } = useCms();

  const [selected, setSelected] = useState<SelectedElement | null>(getSelectedElement());
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showPalettePanel, setShowPalettePanel] = useState(false);
  const [paletteStateTab, setPaletteStateTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ top: number; left: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; startTop: number; startLeft: number } | null>(null);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Réinitialise la position personnalisée lorsqu'un nouvel élément est sélectionné
  useEffect(() => {
    setDragPosition(null);
    setPaletteStateTab('normal');
    return () => {
      if (selected?.el) selected.el.removeAttribute('data-cms-preview-state');
      if (selected?.clickableEl) selected.clickableEl.removeAttribute('data-cms-preview-state');
    };
  }, [selected?.elementKey, selected?.sectionKey]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const currentTop = dragPosition?.top ?? coords?.top ?? 100;
      const currentLeft = dragPosition?.left ?? coords?.left ?? 100;

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTop: currentTop,
        startLeft: currentLeft,
      };
      setIsDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dx = moveEvent.clientX - dragStartRef.current.startX;
        const dy = moveEvent.clientY - dragStartRef.current.startY;

        const tb = toolbarRef.current;
        const tbWidth = tb ? tb.offsetWidth : 480;
        const tbHeight = tb ? tb.offsetHeight : 48;

        const newTop = Math.max(
          10,
          Math.min(window.innerHeight - tbHeight - 10, dragStartRef.current.startTop + dy)
        );
        const newLeft = Math.max(
          10,
          Math.min(window.innerWidth - tbWidth - 10, dragStartRef.current.startLeft + dx)
        );

        setDragPosition({ top: newTop, left: newLeft });
      };

      const handleMouseUp = () => {
        dragStartRef.current = null;
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [coords, dragPosition]
  );

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

    const spaceAbove = rect.top - 80;
    const placeBelow = spaceAbove < tbHeight + 12;

    let top = placeBelow ? rect.bottom + 10 : rect.top - tbHeight - 10;
    top = Math.max(84, Math.min(window.innerHeight - tbHeight - 12, top));

    const centerX = rect.left + rect.width / 2;
    let left = centerX - tbWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - tbWidth - 12, left));

    setCoords({ top, left, placeBelow });
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

  /** Écrit le style de l'élément, l'applique immédiatement, puis sauvegarde via PUT */
  const commit = useCallback(
    (patch: Partial<ElementStyle>) => {
      if (!selected) return;

      const sectionKey = selected.sectionKey;
      const elementKey = selected.elementKey;
      const clickableElementKey = selected.clickableElementKey;

      const currentSections = (currentPageData?.sections || {}) as Record<string, Record<string, unknown>>;
      const currentSection = currentSections[sectionKey] || {};
      const currentBag = (currentSection._elements as Record<string, ElementStyle>) || {};

      const nextStyle: ElementStyle = { ...currentBag[elementKey], ...patch };
      const nextBag: Record<string, ElementStyle> = { ...currentBag, [elementKey]: nextStyle };

      // Si un conteneur cliquable parent existe (ex: a ou button englobant un span), on synchronise aussi sa clé
      if (clickableElementKey && clickableElementKey !== elementKey) {
        nextBag[clickableElementKey] = { ...currentBag[clickableElementKey], ...patch };
      }

      // Rendu immédiat dans le DOM avec identifiant de style dynamique
      const styledId = makeElementStyledId(sectionKey, elementKey);
      applyElementStyle(selected.el, nextStyle, normalizeLang(currentLang), styledId);
      if (selected.clickableEl) {
        const clickStyledId = clickableElementKey
          ? makeElementStyledId(sectionKey, clickableElementKey)
          : styledId;
        applyElementStyle(selected.clickableEl, nextStyle, normalizeLang(currentLang), clickStyledId);
      }

      updateSectionField(sectionKey, '_elements', nextBag);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = setTimeout(() => {
        void saveCurrentPage().then((ok) => {
          setSaveState(ok ? 'saved' : 'error');
          setTimeout(() => setSaveState('idle'), 2500);
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [selected, currentPageData, currentLang, updateSectionField, saveCurrentPage]
  );

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

  const bumpFontSize = useCallback(
    (delta: number) => {
      const current = parseFloat(style.fontSize || '') || 16;
      commit({ fontSize: `${Math.max(8, Math.min(160, current + delta))}px` });
    },
    [commit, style.fontSize]
  );

  const resetPosition = useCallback(() => {
    commit({ offsetX: 0, offsetY: 0 });
  }, [commit]);

  const resetElementStyles = useCallback(() => {
    if (!selected) return;
    const sectionKey = selected.sectionKey;
    const elementKey = selected.elementKey;
    const clickableElementKey = selected.clickableElementKey;

    const currentSections = (currentPageData?.sections || {}) as Record<string, Record<string, unknown>>;
    const currentSection = currentSections[sectionKey] || {};
    const currentBag = { ...((currentSection._elements as Record<string, ElementStyle>) || {}) };

    delete currentBag[elementKey];
    if (clickableElementKey) {
      delete currentBag[clickableElementKey];
    }

    const targets = [selected.el, selected.clickableEl].filter(Boolean) as HTMLElement[];
    for (const target of targets) {
      target.style.backgroundColor = '';
      target.style.color = '';
      target.style.fontSize = '';
      target.style.fontWeight = '';
      target.style.fontStyle = '';
      target.style.textDecoration = '';
      target.style.textAlign = '';
      target.style.borderRadius = '';
      target.style.borderColor = '';
      target.style.borderWidth = '';
      target.style.borderStyle = '';
      target.style.padding = '';
      target.style.transform = '';
      target.removeAttribute('data-cms-preview-state');
      const sId = target.getAttribute('data-cms-styled-id');
      if (sId) {
        removeElementDynamicStyles(sId);
        target.removeAttribute('data-cms-styled-id');
      }
    }

    updateSectionField(sectionKey, '_elements', currentBag);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(() => {
      void saveCurrentPage().then((ok) => {
        setSaveState(ok ? 'saved' : 'error');
        setTimeout(() => setSaveState('idle'), 2500);
      });
    }, SAVE_DEBOUNCE_MS);
  }, [selected, currentPageData, updateSectionField, saveCurrentPage]);

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

  // URL réelle configurée actuellement
  const realCurrentUrl =
    style.href ??
    clickableNode?.getAttribute('href') ??
    clickableNode?.getAttribute('data-href') ??
    selected.el.getAttribute('href') ??
    selected.el.getAttribute('data-href') ??
    '';

  const isBlank =
    (style.target ??
      clickableNode?.getAttribute('target') ??
      clickableNode?.getAttribute('data-target') ??
      selected.el.getAttribute('target') ??
      selected.el.getAttribute('data-target')) === '_blank';

  const iconBtn =
    'p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[28px] h-[28px] text-xs';
  const on = 'text-[#C3F910] bg-[#C3F910]/20 font-bold';
  const off = 'text-[#B9B7B1] hover:text-[#C3F910] hover:bg-[#1a1a17]';

  return (
    <div
      ref={toolbarRef}
      data-cms-ui
      style={{
        position: 'fixed',
        top: dragPosition ? dragPosition.top : coords.top,
        left: dragPosition ? dragPosition.left : coords.left,
        zIndex: 350,
        cursor: isDragging ? 'grabbing' : undefined,
      }}
      className="flex flex-col gap-1.5 bg-[#0e0e0d]/98 border border-[#2b2b28] text-[#f5f4f0] p-2 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.92)] backdrop-blur-md select-none animate-in fade-in duration-100 max-w-[95vw]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Ligne 1 : Contrôles principaux ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {/* Poignée de déplacement (Click & Drag) */}
        <div
          onMouseDown={handleDragStart}
          onDoubleClick={() => setDragPosition(null)}
          className="flex items-center justify-center p-1 rounded-md text-[#7A7A75] hover:text-[#C3F910] hover:bg-[#1C1C19] active:cursor-grabbing cursor-grab transition-colors select-none shrink-0"
          title="Cliquer et glisser pour déplacer la barre (Double-clic pour réaligner)"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        {/* Badge indicateur de type & section */}
        <span
          className="px-2 py-1 rounded-md bg-[#C3F910]/15 border border-[#C3F910]/30 text-[#C3F910] font-mono text-[10px] font-bold tracking-wider uppercase whitespace-nowrap"
          title={`${selected.sectionKey} → ${selected.elementKey}`}
        >
          {isMedia
            ? 'IMAGE'
            : isAnchor
            ? 'LIEN'
            : isButton
            ? 'BOUTON'
            : isClickable
            ? 'ÉLÉMENT CLIQUABLE'
            : 'TEXTE'}{' '}
          · {selected.sectionKey}
        </span>

        {/* ── Cas 1 : IMAGE / MÉDIA ── */}
        {isMedia && (
          <div className="flex items-center gap-1 pl-1 border-l border-[#2b2b28]">
            <button
              type="button"
              onClick={() => onOpenImageModal?.(selected.el)}
              className="flex items-center gap-1.5 bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
              title="Remplacer cette image / média"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>REMPLACER L&apos;IMAGE</span>
            </button>
          </div>
        )}

        {/* ── Cas 2 : TEXTE (Taille, Graisse, Alignement) ── */}
        {!isMedia && (
          <>
            {/* Taille police */}
            <div className="flex items-center gap-0.5 px-1 border-l border-[#2b2b28]">
              <button
                type="button"
                onClick={() => bumpFontSize(-FONT_STEP)}
                className={`${iconBtn} ${off}`}
                title="Réduire la taille (A−)"
              >
                <span className="font-mono text-[11px] font-bold">A−</span>
              </button>
              <span className="font-mono text-[10px] text-[#B9B7B1] min-w-[32px] text-center font-bold">
                {style.fontSize || '16px'}
              </span>
              <button
                type="button"
                onClick={() => bumpFontSize(FONT_STEP)}
                className={`${iconBtn} ${off}`}
                title="Agrandir la taille (A+)"
              >
                <span className="font-mono text-[11px] font-bold">A+</span>
              </button>
            </div>

            {/* Style texte : B, I, U */}
            <div className="flex items-center gap-0.5 px-1 border-l border-[#2b2b28]">
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
            </div>

            {/* Alignement texte */}
            <div className="flex items-center gap-0.5 px-1 border-l border-[#2b2b28]">
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

            {/* Palette complète : Normal, Survol, Clic (Couleur, Fond, Bordures, Arrondis) */}
            <div className="flex items-center gap-1 px-1 border-l border-[#2b2b28]">
              <button
                type="button"
                onClick={() => setShowPalettePanel((v) => !v)}
                className={`${iconBtn} ${showPalettePanel ? on : off}`}
                title="Palette & Styles visuels (Couleurs, Fond, Bordures, Arrondis — Normal, Survol, Clic)"
              >
                <Palette className="w-3.5 h-3.5" />
                {(hasHoverStyles || hasActiveStyles || Boolean(style.backgroundColor || style.borderColor || style.borderRadius)) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C3F910] ml-0.5" />
                )}
              </button>
            </div>
          </>
        )}

        {/* ── Outil LIEN / REDIRECTION (Disponible pour tout élément texte, bouton ou média) ── */}
        <div className="flex items-center gap-1.5 px-1 border-l border-[#2b2b28]">
          <button
            type="button"
            onClick={() => setShowLinkEditor((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              showLinkEditor || realCurrentUrl
                ? 'bg-[#C3F910]/20 text-[#C3F910] border border-[#C3F910]/40'
                : off
            }`}
            title="Éditer le lien de redirection de cet élément (URL / Page interne)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>LIEN</span>
            {realCurrentUrl && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C3F910]" title={`Lien : ${realCurrentUrl}`} />
            )}
          </button>
        </div>

        {/* ── Cas 4 : DÉPLACEMENT (NUDGE TRANSFORM) ── */}
        <div className="flex items-center gap-0.5 px-1 border-l border-[#2b2b28]">
          <span
            className={`flex items-center gap-1 font-mono text-[10px] font-bold ${
              hasOffset ? 'text-[#C3F910]' : 'text-[#6a6a65]'
            }`}
            title="Décalage horizontal / vertical (nudge)"
          >
            <Move className="w-3 h-3" />
            {style.offsetX || 0},{style.offsetY || 0}
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
          <button
            type="button"
            onClick={resetElementStyles}
            className={`${iconBtn} ${off}`}
            title="Réinitialiser tous les styles de l'élément (effacer fond, couleur, bordures, etc.)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C3F910]" />
          </button>
        </div>

        {/* ── Indicateur de statut de sauvegarde ── */}
        <div className="flex items-center gap-1 pl-1 border-l border-[#2b2b28]">
          <span
            className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color:
                saveState === 'error'
                  ? '#ff4444'
                  : saveState === 'saving'
                  ? '#C3F910'
                  : saveState === 'saved'
                  ? '#C3F910'
                  : '#7a7a76',
              backgroundColor:
                saveState === 'saved'
                  ? 'rgba(195, 249, 16, 0.12)'
                  : saveState === 'error'
                  ? 'rgba(255, 68, 68, 0.12)'
                  : 'transparent',
            }}
          >
            {saveState === 'saving'
              ? 'ENREGISTREMENT…'
              : saveState === 'saved'
              ? '✓ ENREGISTRÉ'
              : saveState === 'error'
              ? '✕ ERREUR'
              : ''}
          </span>

          {/* Bouton Fermer / Désélectionner */}
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

      {/* ── Ligne 2 (Conditionnelle) : Panneau Complet Palette & Styles Visuels (Normal, Survol, Clic) ── */}
      {showPalettePanel && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-[#2b2b28] bg-[#141412] p-3 rounded-lg animate-in slide-in-from-top-1 text-xs">
          {/* 1. Sélecteur d'état : Normal | Survol (Hover) | Clic (Active) */}
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#2b2b28] pb-2">
            <div className="flex items-center gap-1 bg-[#0a0a09] p-0.5 rounded-lg border border-[#2b2b28]">
              <button
                type="button"
                onClick={() => switchPaletteStateTab('normal')}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  paletteStateTab === 'normal'
                    ? 'bg-[#C3F910] text-[#080808] shadow-sm'
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
                    ? 'bg-[#C3F910] text-[#080808] shadow-sm'
                    : 'text-[#aaa] hover:text-white hover:bg-[#1a1a17]'
                }`}
              >
                <span>Survol (Hover)</span>
                {hasHoverStyles && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      paletteStateTab === 'hover' ? 'bg-[#080808]' : 'bg-[#C3F910]'
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
                    ? 'bg-[#C3F910] text-[#080808] shadow-sm'
                    : 'text-[#aaa] hover:text-white hover:bg-[#1a1a17]'
                }`}
              >
                <span>Clic (Active)</span>
                {hasActiveStyles && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      paletteStateTab === 'active' ? 'bg-[#080808]' : 'bg-[#C3F910]'
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
            <div className="flex items-center gap-2 bg-[#0a0a09] px-2.5 py-1.5 rounded border border-[#262624]">
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
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c1c1a] hover:bg-[#2b2b28] text-[#d0cfca] hover:text-[#C3F910] border border-[#333] transition-colors cursor-pointer"
                  title="Fond transparent"
                >
                  <Ban className="w-2.5 h-2.5 text-[#ff5555]" />
                  <span>Transparent</span>
                </button>
              </div>
            </div>

            {/* Groupe Bordure & Arrondi */}
            <div className="flex items-center gap-2 bg-[#0a0a09] px-2.5 py-1.5 rounded border border-[#262624]">
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

      {/* ── Ligne 2 (Conditionnelle) : Panneau Complet d'Édition du Bouton / Lien ── */}
      {showLinkEditor && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#2b2b28] bg-[#141412] p-2.5 rounded-lg animate-in slide-in-from-top-1">
          {isSearchAction && (
            <div className="flex items-center justify-between bg-[#1f1e18] border border-[#524c25] px-2.5 py-1.5 rounded text-xs">
              <span className="flex items-center gap-1.5 text-[#e5d470] font-mono">
                <Zap className="w-3.5 h-3.5" />
                Action native : Ouverture Fenêtre de Recherche
              </span>
              <span className="text-[10px] text-[#aaa] font-mono">Action prioritaire</span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Destination URL active */}
            <div className="flex-1 min-w-[200px] flex items-center gap-1.5 bg-[#0a0a09] border border-[#333] px-2 py-1 rounded">
              <LinkIcon className="w-3.5 h-3.5 text-[#C3F910] shrink-0" />
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
            </div>

            {/* 2. Liste déroulante des pages internes du site */}
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
              className="bg-[#1f1f1d] border border-[#333] rounded px-2 py-1 text-xs text-[#ddd] font-mono focus:border-[#C3F910] cursor-pointer"
              title="Choisir une page interne ou ancre du site"
            >
              <option value="">-- Choisir une page interne --</option>
              {INTERNAL_PAGES.map((p) => (
                <option key={p.url} value={p.url}>
                  {p.label} ({p.url})
                </option>
              ))}
            </select>

            {/* 3. Cible d'ouverture (Même onglet ou nouvel onglet) */}
            <button
              type="button"
              onClick={() => {
                const nextTarget = isBlank ? '_self' : '_blank';
                if (clickableNode) clickableNode.setAttribute('target', nextTarget);
                selected.el.setAttribute('target', nextTarget);
                commit({ target: nextTarget, rel: nextTarget === '_blank' ? 'noopener noreferrer' : '' });
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                isBlank ? 'bg-[#C3F910] text-[#080808] font-bold' : 'bg-[#222] text-[#aaa] hover:text-white'
              }`}
              title={isBlank ? 'S’ouvre dans un nouvel onglet (_blank)' : 'S’ouvre dans le même onglet (_self)'}
            >
              <ExternalLink className="w-3 h-3" />
              <span>{isBlank ? 'NOUVEL ONGLET' : 'MÊME ONGLET'}</span>
            </button>

            {/* 4. Bouton de suppression du lien */}
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
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#2a1111] hover:bg-[#441111] text-[#ff6666] text-xs font-mono transition-colors cursor-pointer"
                title="Supprimer le lien de cet élément"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le lien</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
