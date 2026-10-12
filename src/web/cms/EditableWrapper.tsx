'use client';

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { Eye, EyeOff } from 'lucide-react';
import { SectionResizeHandle } from './SectionResizeHandle';
import { SectionStylePanel } from './SectionStylePanel';
import type { StyleKey } from './SectionStylePanel';
import { useSectionDragDrop } from './SectionDragDropManager';
import { registerSection } from './section-registry';
import { stylePanelStore, useStoreValue } from './editor-ui-store';

interface EditableWrapperProps {
  sectionKey: string;
  sectionLabel: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Propriétés de style réellement rendues par la section (voir
   * `SectionStylePanel.capabilities`). Défaut : espacement seul, appliqué par
   * ce wrapper (`SPACING_KEYS`). À passer quand la section consomme en plus
   * `useSectionStyle` (fond, voile, typo, marges…).
   */
  styleCapabilities?: readonly StyleKey[];
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  sectionKey,
  sectionLabel,
  children,
  className = '',
  style,
  styleCapabilities,
}) => {
  const {
    isEditing,
    selectedBlockId,
    setSelectedBlockId,
    currentPageData,
    toggleSectionVisibility,
    saveCurrentPage,
  } = useCms();

  // La visibilité est une donnée persistée : on sauvegarde réellement au lieu de
  // ne modifier que l'état local.
  const toggleVisibility = React.useCallback(() => {
    toggleSectionVisibility(sectionKey);
    void saveCurrentPage();
  }, [sectionKey, toggleSectionVisibility, saveCurrentPage]);

  const [isHovered, setIsHovered] = useState(false);
  const openStylePanel = useStoreValue(stylePanelStore);
  const [liveMinHeight, setLiveMinHeight] = useState<number | null>(null);
  const [livePaddingBottom, setLivePaddingBottom] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Réactivation du système de réordonnancement déjà présent dans le projet :
  // `SectionDragDropProvider` était monté mais personne n'enregistrait son
  // nœud de section ni ne consommait `useSectionDragDrop`, donc le
  // glisser-déposer ne pouvait pas fonctionner.
  const dragDrop = useSectionDragDrop();

  // La clé sémantique réelle de la section est transmise explicitement au
  // registre consommé par VisualInPlaceEditor. Aucune inférence DOM.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    return registerSection(node, sectionKey, sectionLabel);
  }, [sectionKey, sectionLabel]);

  // Enregistrement du nœud pour le calcul de la destination de dépôt.
  useEffect(() => {
    if (!dragDrop) return;
    dragDrop.registerSectionRef(sectionKey, wrapperRef.current);
    return () => dragDrop.registerSectionRef(sectionKey, null);
  }, [dragDrop, sectionKey]);

  const sectionData = currentPageData?.sections?.[sectionKey] as Record<string, unknown> | undefined;
  const layout = (sectionData?.layout as Record<string, unknown> | undefined) || {};

  const pTop =
    sectionData?.paddingTop !== undefined
      ? Number(sectionData.paddingTop)
      : layout.paddingTop !== undefined
      ? Number(layout.paddingTop)
      : undefined;

  const pBottom =
    sectionData?.paddingBottom !== undefined
      ? Number(sectionData.paddingBottom)
      : layout.paddingBottom !== undefined
      ? Number(layout.paddingBottom)
      : undefined;

  const pLeft =
    sectionData?.paddingLeft !== undefined
      ? Number(sectionData.paddingLeft)
      : layout.paddingLeft !== undefined
      ? Number(layout.paddingLeft)
      : undefined;

  const pRight =
    sectionData?.paddingRight !== undefined
      ? Number(sectionData.paddingRight)
      : layout.paddingRight !== undefined
      ? Number(layout.paddingRight)
      : undefined;

  const savedMinHeight =
    sectionData?.minHeight !== undefined && Number(sectionData.minHeight) > 0
      ? Number(sectionData.minHeight)
      : layout.minHeight !== undefined && Number(layout.minHeight) > 0
      ? Number(layout.minHeight)
      : undefined;

  const isVisible =
    sectionData?.visible !== false &&
    layout.visible !== false;

  const isSelected = selectedBlockId === sectionKey;

  // Dynamically apply CMS spacing and height directly to the inner <section> element
  useLayoutEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const sec = ((root.querySelector(':scope > section') || root.querySelector('section')) as HTMLElement | null) || root;
    if (!sec) return;

    if (pTop !== undefined) {
      sec.style.paddingTop = `${pTop}px`;
    }
    const effPb = livePaddingBottom !== null ? livePaddingBottom : pBottom;
    if (effPb !== undefined) {
      sec.style.paddingBottom = `${effPb}px`;
    }
    if (pLeft !== undefined) {
      sec.style.paddingLeft = `${pLeft}px`;
    }
    if (pRight !== undefined) {
      sec.style.paddingRight = `${pRight}px`;
    }
    const effMinH = liveMinHeight !== null ? liveMinHeight : savedMinHeight;
    if (effMinH !== undefined && effMinH > 0) {
      sec.style.minHeight = `${effMinH}px`;
    } else if (effMinH === 0) {
      sec.style.minHeight = '';
    }
  }, [pTop, pBottom, pLeft, pRight, savedMinHeight, livePaddingBottom, liveMinHeight]);

  // ── Mode public (visiteurs) ──
  if (!isEditing) {
    if (!isVisible) return null;

    const hasMinHeight = savedMinHeight !== undefined && savedMinHeight > 0;
    return (
      <div
        ref={wrapperRef}
        data-cms-section={sectionKey}
        className={`${hasMinHeight ? '[&>section]:min-h-[inherit] [&>section]:flex-1 [&>section]:w-full ' : ''}${className}`}
        style={{
          ...style,
          minHeight: hasMinHeight ? `${savedMinHeight}px` : undefined,
          display: hasMinHeight ? 'flex' : undefined,
          flexDirection: hasMinHeight ? 'column' : undefined,
        }}
      >
        {children}
      </div>
    );
  }

  // ── Mode édition (administrateurs) ──
  const effectiveMinHeight = liveMinHeight ?? savedMinHeight;
  const hasMinHeight = effectiveMinHeight !== undefined && effectiveMinHeight > 0;

  return (
    <div
      ref={wrapperRef}
      data-cms-section={sectionKey}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setSelectedBlockId(sectionKey);
      }}
      className={`relative transition-[outline,opacity] duration-150 ${
        hasMinHeight ? '[&>section]:min-h-[inherit] [&>section]:flex-1 [&>section]:w-full ' : ''
      }${className}`}
      style={{
        ...style,
        minHeight: hasMinHeight ? `${effectiveMinHeight}px` : undefined,
        display: hasMinHeight ? 'flex' : undefined,
        flexDirection: hasMinHeight ? 'column' : undefined,
        zIndex: isSelected ? 40 : isHovered || liveMinHeight !== null ? 35 : 1,
        outline: isSelected
          ? '2px solid #C3F910'
          : isHovered
          ? '2px dashed rgba(195, 249, 16, 0.7)'
          : !isVisible
          ? '2px dashed rgba(255, 68, 68, 0.5)'
          : 'none',
        outlineOffset: '-2px',
      }}
    >
      {/* La barre d'actions de section (nom, visibilité, glisser-déposer,
          réglages) est désormais centralisée dans la barre fixe unique
          `CmsSectionBar`, sous la barre d'administration. */}

      {/* Panneau de style contextuel — reprend les contrôles de l'ancien drawer
          dans l'éditeur direct, sur le même système (useSectionStyle +
          updateSectionField + saveCurrentPage). */}
      {isVisible && openStylePanel === sectionKey && (
        <SectionStylePanel
          sectionKey={sectionKey}
          sectionLabel={sectionLabel}
          onClose={() => stylePanelStore.set(null)}
          capabilities={styleCapabilities}
        />
      )}

      {/* Ghost Mask Overlay if Section is Hidden */}
      {!isVisible && (
        <div data-cms-ui className="absolute inset-0 bg-[#080808]/75 backdrop-blur-[3px] border-2 border-dashed border-[#ff4444]/60 z-[130] flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
          <div className="flex items-center gap-2 bg-[#171715] border border-[#ff4444] text-[#ff6666] px-4 py-2 rounded-lg font-mono text-xs font-bold shadow-2xl mb-3">
            <EyeOff className="w-4 h-4" />
            <span>SECTION MASQUÉE SUR LE SITE PUBLIC ({sectionLabel.toUpperCase()})</span>
          </div>
          <p className="text-[11px] text-[#9A9A94] max-w-md mb-3 font-sans">
            Cette section n&apos;est pas visible pour les visiteurs. Elle reste éditable et déplaçable dans l&apos;éditeur.
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleVisibility();
            }}
            className="flex items-center gap-1.5 bg-[#C3F910] text-black px-4 py-2 rounded-md font-mono text-xs font-bold hover:bg-white transition-colors cursor-pointer shadow-xl"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>RÉAFFICHER LA SECTION</span>
          </button>
        </div>
      )}

      {/* Children Section */}
      <div className={!isVisible ? 'opacity-35 pointer-events-none' : undefined}>
        {children}
      </div>

      {/* Bottom Drag-to-Resize Handle ↕ */}
      {isVisible && (
        <SectionResizeHandle
          sectionKey={sectionKey}
          sectionLabel={sectionLabel}
          targetRef={wrapperRef}
          currentMinHeight={effectiveMinHeight}
          onLiveResize={(h, pb) => {
            setLiveMinHeight(h);
            setLivePaddingBottom(pb);
          }}
          onResizeEnd={(finalH, finalPb) => {
            setLiveMinHeight(finalH);
            setLivePaddingBottom(finalPb);
          }}
        />
      )}
    </div>
  );
};
