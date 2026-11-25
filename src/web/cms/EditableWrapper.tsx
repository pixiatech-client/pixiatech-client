'use client';

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { Eye, EyeOff } from 'lucide-react';
import { SectionResizeHandle } from './SectionResizeHandle';
import { SectionBackgroundControl } from './SectionBackgroundControl';
import type { StyleKey } from './useSectionStyle';
import { useSectionDragDrop } from './SectionDragDropManager';
import { registerSection } from './section-registry';

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

  const isDeleted = sectionData?.deleted === true;
  const isVisible =
    !isDeleted &&
    sectionData?.visible !== false &&
    layout.visible !== false;

  const isSelected = selectedBlockId === sectionKey;

  const savedHeight =
    sectionData?.height !== undefined && Number(sectionData.height) > 0
      ? Number(sectionData.height)
      : layout.height !== undefined && Number(layout.height) > 0
      ? Number(layout.height)
      : undefined;

  const bgColor = (sectionData?.bgColor as string | undefined) || (layout?.bgColor as string | undefined) || '';
  const bgImage = (sectionData?.bgImage as string | undefined) || (layout?.bgImage as string | undefined) || '';
  const bgParallax = Boolean(sectionData?.bgParallax ?? layout?.bgParallax ?? false);

  // Dynamically apply CMS spacing, height and background overrides directly to the inner <section> element
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
    // Hauteur explicite issue de la poignée : contrairement à min-height, elle
    // permet aussi de réduire une section dont le contenu est plus haut.
    const effHeight = liveMinHeight !== null ? liveMinHeight : savedHeight;
    if (effHeight !== undefined && effHeight > 0) {
      sec.style.height = `${effHeight}px`;
      sec.style.overflow = 'hidden';
      sec.dataset.cmsHeightApplied = 'true';
    } else if (sec.dataset.cmsHeightApplied === 'true') {
      sec.style.removeProperty('height');
      sec.style.removeProperty('overflow');
      delete sec.dataset.cmsHeightApplied;
    }

    if (bgColor) {
      sec.style.backgroundColor = bgColor;
    } else {
      sec.style.removeProperty('background-color');
    }
    if (bgImage) {
      sec.style.backgroundImage = `url(${bgImage})`;
      sec.style.backgroundSize = 'cover';
      sec.style.backgroundPosition = 'center';
      sec.style.backgroundRepeat = 'no-repeat';
      sec.style.backgroundAttachment = bgParallax ? 'fixed' : 'scroll';
    } else {
      sec.style.removeProperty('background-image');
      sec.style.removeProperty('background-attachment');
    }
  }, [pTop, pBottom, pLeft, pRight, savedMinHeight, savedHeight, livePaddingBottom, liveMinHeight, bgColor, bgImage, bgParallax]);

  // Effet parallaxe universel pour toute section ayant un média d'arrière-plan
  // plein cadre (<img> ou <video>), sans jamais modifier la hiérarchie DOM.
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const sec = ((root.querySelector(':scope > section') || root.querySelector('section')) as HTMLElement | null) || root;
    if (!sec) return;

    const trackedFixed = new Map<HTMLElement, Record<string, string>>();
    const trackedTransform = new Set<HTMLElement>();

    const restoreElement = (el: HTMLElement, prev: Record<string, string>) => {
      for (const [prop, val] of Object.entries(prev)) {
        if (val) {
          el.style.setProperty(prop, val);
        } else {
          el.style.removeProperty(prop);
        }
      }
    };

    const cleanup = () => {
      trackedFixed.forEach((prev, el) => restoreElement(el, prev));
      trackedFixed.clear();
      trackedTransform.forEach((el) => {
        el.style.removeProperty('translate');
        el.style.removeProperty('scale');
        el.style.removeProperty('will-change');
      });
      trackedTransform.clear();
      if (sec.dataset.cmsParallaxClip === 'true') {
        sec.style.removeProperty('clip-path');
        sec.style.removeProperty('isolation');
        delete sec.dataset.cmsParallaxClip;
      }
    };

    if (!bgParallax) {
      cleanup();
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      cleanup();
      return;
    }

    if (!sec.style.clipPath) {
      sec.style.clipPath = 'inset(0)';
      sec.style.isolation = 'isolate';
      sec.dataset.cmsParallaxClip = 'true';
    }

    const hasTransformedAncestor = (el: HTMLElement): boolean => {
      let cur = el.parentElement;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        if (cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none') {
          return true;
        }
        cur = cur.parentElement;
      }
      return false;
    };

    const findBgMedia = (): HTMLElement[] => {
      const secW = sec.clientWidth;
      const secH = sec.clientHeight;
      if (secW === 0 || secH === 0) return [];
      const candidates = Array.from(sec.querySelectorAll<HTMLElement>('img, video'));
      return candidates.filter((el) => {
        if (el.closest('[data-cms-ui]')) return false;
        if (trackedFixed.has(el)) return true;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w >= secW * 0.75 && h >= secH * 0.75) return true;
        const parent = el.parentElement;
        if (parent && getComputedStyle(parent).position === 'absolute') {
          return parent.offsetWidth >= secW * 0.85 && parent.offsetHeight >= secH * 0.85;
        }
        return false;
      });
    };

    const applyParallaxModes = () => {
      const targets = findBgMedia();
      targets.forEach((el) => {
        if (trackedFixed.has(el) || trackedTransform.has(el)) return;
        if (!hasTransformedAncestor(el)) {
          trackedFixed.set(el, {
            position: el.style.position,
            top: el.style.top,
            left: el.style.left,
            width: el.style.width,
            height: el.style.height,
            'max-width': el.style.maxWidth,
            'z-index': el.style.zIndex,
            'pointer-events': el.style.pointerEvents,
          });
          el.style.position = 'fixed';
          el.style.top = '0';
          el.style.left = '0';
          el.style.width = '100vw';
          el.style.height = '100vh';
          el.style.maxWidth = 'none';
          el.style.zIndex = '-1';
          el.style.pointerEvents = 'none';
        } else {
          trackedTransform.add(el);
        }
      });
    };

    let rafId = 0;

    const updateTransformParallax = () => {
      rafId = 0;
      applyParallaxModes();
      if (trackedTransform.size === 0) return;

      const rect = sec.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (rect.bottom < -vh || rect.top > vh * 2) return;

      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      const maxTravel = (vh + rect.height) / 2 || 1;
      const progress = Math.max(-1, Math.min(1, centerOffset / maxTravel));
      const amplitude = Math.min(Math.max(rect.height * 0.22, 64), 180);
      const y = -progress * amplitude;

      trackedTransform.forEach((el) => {
        el.style.scale = '1.3';
        el.style.translate = `0px ${y.toFixed(1)}px`;
        el.style.willChange = 'translate, scale';
      });
    };

    const scheduleUpdate = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateTransformParallax);
      }
    };

    updateTransformParallax();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      cleanup();
    };
  }, [bgParallax, bgImage]);

  // Dès lors que la section sert à quelque chose, le niveau structurel doit être
  // IDENTIQUE en public et en édition : le contenu est rendu directement comme
  // enfant de `wrapperRef` dans les deux modes. C'est indispensable car
  // `resolveElementKey` (section-registry) calcule les clés `_elements` à partir
  // du chemin DOM réel : un `<div>` d'enveloppe supplémentaire uniquement en
  // édition décalait le chemin (`div:1/section:1/...` vs `section:1/...`) et
  // provoquait la perte des modifications après actualisation. Rendre le même
  // arbre supprime aussi le remontage complet des sections au basculement en
  // édition (qui faisait sauter la page vers le footer).
  if (isDeleted) return null;
  if (!isVisible && !isEditing) return null;

  // `liveMinHeight` n'est alimenté que pendant l'édition (poignée de
  // redimensionnement). En public, on garde strictement la valeur persistée.
  const effectiveMinHeight = isEditing ? liveMinHeight ?? savedMinHeight : savedMinHeight;
  const hasMinHeight = effectiveMinHeight !== undefined && effectiveMinHeight > 0;

  // Chrome d'édition (panneau de style, masque, poignée de redimensionnement)
  // rendu APRÈS le contenu. Tous ces éléments sont en position absolue/fixe :
  // leur ordre DOM n'affecte pas le rendu visuel.
  return (
    <div
      ref={wrapperRef}
      data-cms-section={sectionKey}
      onMouseEnter={isEditing ? () => setIsHovered(true) : undefined}
      onMouseLeave={isEditing ? () => setIsHovered(false) : undefined}
      onClick={
        isEditing
          ? () => {
              setSelectedBlockId(sectionKey);
            }
          : undefined
      }
      className={`${
        isEditing ? 'relative transition-[outline,opacity] duration-150 ' : ''
      }${
        hasMinHeight ? '[&>section]:min-h-[inherit] [&>section]:flex-1 [&>section]:w-full ' : ''
      }${className}`}
      style={{
        ...style,
        minHeight: hasMinHeight ? `${effectiveMinHeight}px` : undefined,
        display: hasMinHeight ? 'flex' : undefined,
        flexDirection: hasMinHeight ? 'column' : undefined,
        zIndex: isEditing
          ? isSelected
            ? 40
            : isHovered || liveMinHeight !== null
            ? 35
            : 1
          : undefined,
        outline: isEditing
          ? isSelected
            ? '2px solid var(--accent, var(--ui-accent))'
            : isHovered
            ? '2px dashed var(--accent-border, rgba(var(--ui-accent-rgb), 0.7))'
            : !isVisible
            ? '2px dashed rgba(255, 68, 68, 0.5)'
            : 'none'
          : undefined,
        outlineOffset: isEditing ? '-2px' : undefined,
        boxSizing: 'border-box',
        isolation: isEditing ? 'isolate' : undefined,
      }}
    >
      {/* Contenu de la section — premier enfant direct, identique en public et
          en édition pour garder les clés DOM stables. */}
      {children}

      {/* La barre d'actions de section (nom, visibilité, glisser-déposer,
          réglages) est désormais centralisée dans la barre fixe unique
          `CmsSectionBar`, sous la barre d'administration. */}

      {/* Bouton carré discret sur le bord droit (sort de droite vers la gauche) : arrière-plan & parallaxe */}
      {isEditing && isVisible && (
        <SectionBackgroundControl
          sectionKey={sectionKey}
          sectionLabel={sectionLabel}
          visible={isHovered || isSelected}
        />
      )}

      {/* Ghost Mask Overlay if Section is Hidden */}
      {isEditing && !isVisible && (
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
            className="flex items-center gap-1.5 bg-[color:var(--ui-accent)] text-black px-4 py-2 rounded-md font-mono text-xs font-bold hover:bg-white transition-colors cursor-pointer shadow-xl"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>RÉAFFICHER LA SECTION</span>
          </button>
        </div>
      )}

      {/* Bottom Drag-to-Resize Handle ↕ */}
      {isEditing && isVisible && (
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
