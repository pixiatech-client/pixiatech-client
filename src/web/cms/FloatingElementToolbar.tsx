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
import { applyElementStyle, readElementStyle, type ElementStyle } from './useCmsElementStyles';
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
  const [showColors, setShowColors] = useState(false);
  const [showBoxStyles, setShowBoxStyles] = useState(false);
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

      // Rendu immédiat dans le DOM
      applyElementStyle(selected.el, nextStyle, normalizeLang(currentLang));
      if (selected.clickableEl) {
        applyElementStyle(selected.clickableEl, nextStyle, normalizeLang(currentLang));
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

  if (!isEditing || !isAdmin || !selected || !coords) return null;

  // Détection exhaustive des liens et boutons
  const clickableNode =
    selected.clickableEl ||
    (selected.el.closest('a, button, [role="button"]') as HTMLElement | null) ||
    (selected.el.tagName === 'A' || selected.el.tagName === 'BUTTON' ? selected.el : null);

  const isAnchor = clickableNode?.tagName === 'A';
  const isButton = clickableNode?.tagName === 'BUTTON';
  const isClickable = Boolean(clickableNode);
  const isMedia = selected.kind === 'media' || selected.el.tagName === 'IMG' || selected.el.tagName === 'VIDEO';
  const hasOffset = Boolean(style.offsetX || style.offsetY);

  // Détection de l'action existante (ex: ouverture modal consultation, recherche, etc.)
  const actionAttr = clickableNode?.getAttribute('data-action');
  const isConsultationAction =
    actionAttr === 'consultation' ||
    clickableNode?.classList.contains('hero-cta2') ||
    clickableNode?.getAttribute('data-text-key') === 'secondaryCta' ||
    clickableNode?.innerText.toLowerCase().includes('projet') ||
    clickableNode?.innerText.toLowerCase().includes('consultation');

  const isSearchAction = actionAttr === 'search' || clickableNode?.classList.contains('search-trigger');

  // URL réelle configurée actuellement
  const realCurrentUrl =
    style.href ??
    clickableNode?.getAttribute('href') ??
    clickableNode?.getAttribute('data-href') ??
    '';

  const isBlank =
    (style.target ?? clickableNode?.getAttribute('target') ?? clickableNode?.getAttribute('data-target')) ===
    '_blank';

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

            {/* Couleurs texte et fond */}
            <div className="flex items-center gap-1 px-1 border-l border-[#2b2b28]">
              <button
                type="button"
                onClick={() => setShowColors((v) => !v)}
                className={`${iconBtn} ${showColors ? on : off}`}
                title="Palette de couleurs (texte & fond)"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
              {showColors && (
                <div className="flex items-center gap-1.5 bg-[#181816] p-1 rounded-lg border border-[#333]">
                  <label
                    className="relative w-5 h-5 rounded overflow-hidden border border-[#444] cursor-pointer flex items-center justify-center"
                    title="Couleur du texte"
                    style={{ background: style.color || '#ffffff' }}
                  >
                    <Type className="w-3 h-3 text-black mix-blend-difference" />
                    <input
                      type="color"
                      value={style.color || '#ffffff'}
                      onChange={(e) => commit({ color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <label
                    className="relative w-5 h-5 rounded overflow-hidden border border-[#444] cursor-pointer flex items-center justify-center"
                    title="Couleur de fond"
                    style={{ background: style.backgroundColor || 'transparent' }}
                  >
                    <span className="w-3 h-2 rounded-[1px] border border-white/80" />
                    <input
                      type="color"
                      value={
                        style.backgroundColor && style.backgroundColor.startsWith('#')
                          ? style.backgroundColor
                          : '#111111'
                      }
                      onChange={(e) => commit({ backgroundColor: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>

                  {/* Bouton pour revenir directement au fond transparent */}
                  <button
                    type="button"
                    onClick={() => commit({ backgroundColor: 'transparent' })}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#242422] hover:bg-[#333330] text-[#E0DFDA] hover:text-[#C3F910] border border-[#3A3A36] transition-colors cursor-pointer"
                    title="Rétablir un fond transparent"
                  >
                    <Ban className="w-3 h-3 text-[#ff5555]" />
                    <span>Fond transparent</span>
                  </button>
                </div>
              )}
            </div>

            {/* Style Boîte (Arrondis, Bordures, Padding) */}
            <div className="flex items-center gap-1 px-1 border-l border-[#2b2b28]">
              <button
                type="button"
                onClick={() => setShowBoxStyles((v) => !v)}
                className={`${iconBtn} ${showBoxStyles ? on : off}`}
                title="Bordures, Coins arrondis & Espacements"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              {showBoxStyles && (
                <div className="flex items-center gap-1.5 bg-[#181816] p-1 rounded-lg border border-[#333] text-[11px] font-mono">
                  {/* Arrondi */}
                  <select
                    value={style.borderRadius || '0px'}
                    onChange={(e) => commit({ borderRadius: e.target.value })}
                    className="bg-[#111] border border-[#444] rounded px-1.5 py-0.5 text-white"
                    title="Rayon des coins"
                  >
                    <option value="0px">Coins droits</option>
                    <option value="4px">Arrondi 4px</option>
                    <option value="8px">Arrondi 8px</option>
                    <option value="12px">Arrondi 12px</option>
                    <option value="9999px">Pilule (Rond)</option>
                  </select>
                  {/* Bordure */}
                  <select
                    value={style.borderWidth || '0px'}
                    onChange={(e) => commit({ borderWidth: e.target.value, borderStyle: 'solid' })}
                    className="bg-[#111] border border-[#444] rounded px-1.5 py-0.5 text-white"
                    title="Bordure"
                  >
                    <option value="0px">Sans bordure</option>
                    <option value="1px">Bordure 1px</option>
                    <option value="2px">Bordure 2px</option>
                  </select>
                  {style.borderWidth && style.borderWidth !== '0px' && (
                    <label
                      className="relative w-5 h-5 rounded overflow-hidden border border-[#444] cursor-pointer"
                      title="Couleur de bordure"
                      style={{ background: style.borderColor || '#C3F910' }}
                    >
                      <input
                        type="color"
                        value={style.borderColor || '#C3F910'}
                        onChange={(e) => commit({ borderColor: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Cas 3 : BOUTON / LIEN (Point 2 : Gestion uniforme des boutons et liens) ── */}
        {(isClickable || isAnchor || isButton) && (
          <div className="flex items-center gap-1.5 px-1 border-l border-[#2b2b28]">
            <button
              type="button"
              onClick={() => setShowLinkEditor((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                showLinkEditor || realCurrentUrl ? 'bg-[#C3F910]/20 text-[#C3F910] border border-[#C3F910]/40' : off
              }`}
              title="Configurer la destination ou l'action de ce bouton/lien"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>LIEN / ACTION</span>
            </button>
          </div>
        )}

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

      {/* ── Ligne 2 (Conditionnelle) : Panneau Complet d'Édition du Bouton / Lien ── */}
      {showLinkEditor && (isClickable || isAnchor || isButton) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#2b2b28] bg-[#141412] p-2.5 rounded-lg animate-in slide-in-from-top-1">
          {/* Action Détectée */}
          {isConsultationAction && (
            <div className="flex items-center justify-between bg-[#1f1e18] border border-[#524c25] px-2.5 py-1.5 rounded text-xs">
              <span className="flex items-center gap-1.5 text-[#e5d470] font-mono">
                <Zap className="w-3.5 h-3.5" />
                Action native : Ouverture Demande de Devis / Consultation
              </span>
              <span className="text-[10px] text-[#aaa] font-mono">Action prioritaire</span>
            </div>
          )}

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
                  commit({ href: url });
                }}
                placeholder="Destination : /contact, #markets, https://..."
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
                commit({ target: nextTarget, rel: nextTarget === '_blank' ? 'noopener noreferrer' : '' });
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all ${
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
                  commit({ href: '', target: '_self' });
                }}
                className="p-1 rounded bg-[#2a1111] hover:bg-[#441111] text-[#ff6666] transition-colors"
                title="Supprimer le lien de ce bouton"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
