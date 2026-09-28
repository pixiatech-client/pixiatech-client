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
  type LucideIcon,
} from 'lucide-react';
import {
  getSelectedElement,
  setSelectedElement,
  subscribeSelectedElement,
  type SelectedElement,
} from './section-registry';
import { applyElementStyle, readElementStyle, type ElementStyle } from './useCmsElementStyles';

const NUDGE = 4;
const FONT_STEP = 2;
const SAVE_DEBOUNCE_MS = 600;

const ALIGNS: { value: ElementStyle['textAlign']; icon: LucideIcon; label: string }[] = [
  { value: 'left', icon: AlignLeft, label: 'Gauche' },
  { value: 'center', icon: AlignCenter, label: 'Centre' },
  { value: 'right', icon: AlignRight, label: 'Droite' },
  { value: 'justify', icon: AlignJustify, label: 'Justifié' },
];

export const FloatingElementToolbar: React.FC<{
  onOpenImageModal?: (element: HTMLElement) => void;
}> = ({ onOpenImageModal }) => {
  const { isEditing, isAdmin, currentPageData, updateSectionField, saveCurrentPage } = useCms();

  const [selected, setSelected] = useState<SelectedElement | null>(getSelectedElement());
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showColors, setShowColors] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Si l'élément est complètement hors de la vue
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setCoords(null);
      return;
    }

    const tb = toolbarRef.current;
    const tbWidth = tb ? tb.offsetWidth : 440;
    const tbHeight = tb ? tb.offsetHeight : 44;

    // Déterminer si on place au-dessus ou en-dessous
    // On laisse une marge par rapport au header fixe (environ 80px)
    const spaceAbove = rect.top - 80;
    const placeBelow = spaceAbove < tbHeight + 12;

    let top = placeBelow ? rect.bottom + 10 : rect.top - tbHeight - 10;

    // Clamper verticalement pour ne jamais sortir de l'écran
    top = Math.max(84, Math.min(window.innerHeight - tbHeight - 12, top));

    // Centrage horizontal avec clamp
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

    // Un tick différé pour attendre que les styles de la toolbar soient calculés
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

      const currentSections = (currentPageData?.sections || {}) as Record<string, Record<string, unknown>>;
      const currentSection = currentSections[sectionKey] || {};
      const currentBag = (currentSection._elements as Record<string, ElementStyle>) || {};
      const nextStyle: ElementStyle = { ...currentBag[elementKey], ...patch };
      const nextBag = { ...currentBag, [elementKey]: nextStyle };

      // Rendu immédiat dans le DOM
      applyElementStyle(selected.el, nextStyle);

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
    [selected, currentPageData, updateSectionField, saveCurrentPage]
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

  if (!isEditing || !isAdmin || !selected || !coords) return null;

  const isAnchor = selected.el.tagName === 'A' || Boolean(selected.el.closest('a'));
  const anchorEl = (selected.el.tagName === 'A' ? selected.el : selected.el.closest('a')) as HTMLAnchorElement | null;
  const isButton = selected.el.tagName === 'BUTTON' || Boolean(selected.el.closest('button'));
  const isMedia = selected.kind === 'media' || selected.el.tagName === 'IMG' || selected.el.tagName === 'VIDEO';
  const hasOffset = Boolean(style.offsetX || style.offsetY);

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
        top: coords.top,
        left: coords.left,
        zIndex: 350,
      }}
      className="flex items-center gap-1.5 bg-[#0e0e0d]/98 border border-[#2b2b28] text-[#f5f4f0] p-1.5 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md select-none animate-in fade-in duration-100 max-w-[95vw] overflow-x-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Badge indicateur de type & section */}
      <span
        className="px-2 py-1 rounded-md bg-[#C3F910]/15 border border-[#C3F910]/30 text-[#C3F910] font-mono text-[10px] font-bold tracking-wider uppercase whitespace-nowrap"
        title={`${selected.sectionKey} → ${selected.elementKey}`}
      >
        {isMedia ? 'IMAGE' : isAnchor ? 'LIEN' : isButton ? 'BOUTON' : 'TEXTE'} · {selected.sectionKey}
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

      {/* ── Cas 2 : TEXTE (Aussi pour boutons et liens avec du texte) ── */}
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
              title="Palette de couleurs"
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
                    value={style.backgroundColor || '#111111'}
                    onChange={(e) => commit({ backgroundColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Cas 3 : LIEN OU BOUTON (Édition d'URL) ── */}
      {isAnchor && (
        <div className="flex items-center gap-1.5 px-1 border-l border-[#2b2b28]">
          <LinkIcon className="w-3.5 h-3.5 text-[#C3F910]" />
          <input
            type="text"
            defaultValue={style.href ?? anchorEl?.getAttribute('href') ?? ''}
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (anchorEl) anchorEl.setAttribute('href', url);
              commit({ href: url });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            placeholder="/contact ou https://..."
            className="w-[140px] bg-[#171715] border border-[#2b2b28] rounded-md px-2 py-1 text-[11px] text-white font-mono focus:border-[#C3F910] focus:outline-none"
            title="Modifier l'URL du lien"
          />
          <button
            type="button"
            onClick={() => {
              const currentTarget = anchorEl?.getAttribute('target');
              const nextTarget = currentTarget === '_blank' ? '_self' : '_blank';
              commit({ target: nextTarget, rel: nextTarget === '_blank' ? 'noopener noreferrer' : '' });
            }}
            className={`${iconBtn} ${anchorEl?.getAttribute('target') === '_blank' ? on : off}`}
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-3.5 h-3.5" />
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
          title="Réinitialiser la position"
        >
          <RotateCcw className="w-3.5 h-3.5" />
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
  );
};
