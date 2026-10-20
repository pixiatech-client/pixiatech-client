'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Eye, EyeOff, Settings, GripVertical, Layers, Sliders } from 'lucide-react';
import { useCms } from '@/lib/site-web/cms-context';
import { getRegisteredSections, subscribeSections, getSectionLabel } from './section-registry';
import { getSectionDragController } from './SectionDragDropManager';
import { stylePanelStore, heroSlideStore, useStoreValue } from './editor-ui-store';
import { computeValidHeroSlides } from '@/web/pixiatech/sections/hero-slides';

/** Libellés pour les blocs qui ne passent pas par `EditableWrapper`. */
const STATIC_LABELS: Record<string, string> = {
  header: 'En-tête',
  footer: 'Pied de page',
};

/**
 * Section actuellement sous la ligne de détection (bas de la barre + 8px).
 *
 * Suivi continu par `IntersectionObserver` : l'observateur utilise une bande
 * de 1px exactement positionnée sur la ligne, donc chaque franchissement de
 * frontière déclenche une mise à jour — sans gestionnaire de défilement
 * permanent. Les rects ne sont lus qu'à ce moment précis.
 */
function useVisibleSection(barRef: React.RefObject<HTMLElement>, enabled: boolean): string | null {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setKey(null);
      return;
    }

    let observer: IntersectionObserver | null = null;
    let raf = 0;

    const lineOf = () => {
      const el = barRef.current;
      const top = el ? el.getBoundingClientRect().bottom : 0;
      return top + 8;
    };

    const pick = () => {
      raf = 0;
      const nodes = getRegisteredSections().filter((n) => {
        // Le chrome fixe (en-tête) chevauche la ligne de détection : il ne doit
        // pas être considéré comme la « section visible » au défilement.
        return getComputedStyle(n.node).position !== 'fixed';
      });
      if (!nodes.length) {
        setKey(null);
        return;
      }
      const line = lineOf();
      let covering: string | null = null;
      let below: string | null = null;
      let belowTop = Infinity;
      for (const { node, sectionKey } of nodes) {
        const rect = node.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) {
          covering = sectionKey;
          break;
        }
        if (rect.top > line && rect.top < belowTop) {
          belowTop = rect.top;
          below = sectionKey;
        }
      }
      setKey(covering ?? below ?? nodes[nodes.length - 1].sectionKey);
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(pick);
    };

    const build = () => {
      if (observer) observer.disconnect();
      const line = lineOf();
      const bottomMargin = Math.min(0, -(window.innerHeight - line - 1));
      observer = new IntersectionObserver(schedule, {
        rootMargin: `-${Math.max(0, line)}px 0px ${bottomMargin}px 0px`,
        threshold: [0, 1],
      });
      for (const { node } of getRegisteredSections()) observer.observe(node);
      schedule();
    };

    const unsubscribe = subscribeSections(build);
    window.addEventListener('resize', build);
    build();

    return () => {
      if (observer) observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener('resize', build);
    };
  }, [enabled, barRef]);

  return key;
}

/**
 * Barre de section unique de l'éditeur, épinglée sous la barre d'administration.
 *
 * Regroupe pour la section active (celle visible au défilement) : le nom, la
 * visibilité, le glisser-déposer et l'accès aux réglages de style — plus le
 * sélecteur de photo du Hero. Remplace l'ancienne barre flottante par section
 * et le panneau « SLIDER ACTIF » qui se superposaient en haut à gauche.
 */
export const CmsSectionBar: React.FC = () => {
  const {
    isEditing,
    currentPageData,
    currentLang,
    selectedBlockId,
    setSelectedBlockId,
    toggleSectionVisibility,
    saveCurrentPage,
  } = useCms();

  const barRef = useRef<HTMLDivElement>(null);
  const visibleKey = useVisibleSection(barRef, isEditing);
  const stylePanelKey = useStoreValue(stylePanelStore);
  const heroSlide = useStoreValue(heroSlideStore);

  // La version du registre force un rendu quand des sections montent/démontent.
  const registryVersion = useSyncExternalStore(
    subscribeSections,
    () => getRegisteredSections().map((s) => s.sectionKey).join('|'),
    () => ''
  );

  // Réserve la hauteur réelle de la barre dans le flux (padding + header).
  useEffect(() => {
    const root = document.getElementById('pixia-web');
    if (!root) return;
    if (!isEditing) {
      root.style.setProperty('--cms-section-bar-h', '0px');
      return;
    }
    const el = barRef.current;
    const apply = () => {
      const h = el ? el.getBoundingClientRect().height : 0;
      root.style.setProperty('--cms-section-bar-h', `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    if (el) ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--cms-section-bar-h', '0px');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, registryVersion]);

  const sections = getRegisteredSections();
  const keys = sections.map((s) => s.sectionKey);
  const activeKey =
    (visibleKey && keys.includes(visibleKey) ? visibleKey : null) ??
    (selectedBlockId && keys.includes(selectedBlockId) ? selectedBlockId : null) ??
    keys[0] ??
    null;

  const activeLabel = activeKey
    ? getSectionLabel(activeKey) || STATIC_LABELS[activeKey] || activeKey
    : '';

  const sectionData = activeKey
    ? (currentPageData?.sections?.[activeKey] as Record<string, unknown> | undefined)
    : undefined;
  const layout = (sectionData?.layout as Record<string, unknown> | undefined) || {};
  const isVisible = sectionData?.visible !== false && layout.visible !== false;

  const dragController = getSectionDragController();

  const heroSlides = useMemo(
    () =>
      computeValidHeroSlides(
        currentPageData?.sections?.hero as Record<string, unknown> | undefined,
        currentLang
      ),
    [currentPageData, currentLang]
  );

  const activeHeroSlide = heroSlides.length ? heroSlide % heroSlides.length : 0;
  const styleOpen = stylePanelKey === activeKey;

  useEffect(() => {
    if (!isVisible && activeKey) {
      stylePanelStore.set(null);
    }
  }, [isVisible, activeKey]);

  if (!isEditing) return null;

  return (
    <div
      id="cms-section-bar"
      ref={barRef}
      data-cms-ui="true"
      aria-label="Barre de section CMS"
      style={{ top: 'var(--admin-bar-h, 0px)' }}
      className="fixed left-0 right-0 z-[279] bg-[#0A0A09]/95 backdrop-blur-md border-b border-[#262624] text-[#F5F4F0] px-3 py-1.5 select-none shadow-lg"
    >
      <div className="mx-auto max-w-[1920px] flex items-center gap-2 flex-wrap font-mono text-[11px]">
        <span className="flex items-center gap-1.5 text-[#C3F910] font-bold tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          SECTION
        </span>

        {activeKey ? (
          <>
            <span className="px-2 py-0.5 rounded bg-[#171715] border border-[#2B2B28] text-white font-semibold uppercase truncate max-w-[40vw]">
              {activeLabel}
            </span>

            <span className="text-[#7A7A76]">|</span>

            <button
              type="button"
              onClick={() => {
                toggleSectionVisibility(activeKey);
                void saveCurrentPage();
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                isVisible
                  ? 'text-[#C3F910] border-[#C3F910]/40 hover:bg-[#C3F910]/15'
                  : 'text-[#ff6666] bg-[#ff4444]/15 border-[#ff4444]/50 hover:bg-[#ff4444]/25'
              }`}
              title={isVisible ? 'Masquer cette section sur le site public' : 'Réafficher cette section'}
            >
              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isVisible ? 'Visible' : 'Masquée'}</span>
            </button>

            {dragController && keys.length > 1 && (
              <button
                type="button"
                onClick={(e) => dragController.startDrag(activeKey, e)}
                className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#2B2B28] text-[#9A9A94] hover:text-[#C3F910] hover:border-[#C3F910]/50 cursor-grab active:cursor-grabbing transition-colors"
                title="Déplacer cette section : maintenez et glissez vers le haut ou le bas de la page"
              >
                <GripVertical className="w-3.5 h-3.5" />
                Déplacer
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedBlockId(activeKey);
                stylePanelStore.set(styleOpen ? null : activeKey);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                styleOpen
                  ? 'text-[#C3F910] border-[#C3F910] bg-[#C3F910]/15'
                  : 'text-[#9A9A94] border-[#2B2B28] hover:text-[#C3F910] hover:border-[#C3F910]/50'
              }`}
              title="Ouvrir les réglages de style et espacement"
            >
              <Settings className="w-3.5 h-3.5" />
              Réglages
            </button>

            {activeKey === 'showreel' && (
              <a
                href="/admin/site-web/showreel"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15 transition-colors cursor-pointer"
                title="Gérer tous les textes du Showreel 3D dans l'administration"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Textes Showreel</span>
              </a>
            )}

            {activeKey === 'hero' && heroSlides.length > 1 && (
              <span className="flex items-center gap-1 ml-1 pl-2 border-l border-[#2B2B28]">
                <span className="text-[#6b6b64]">Photo :</span>
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      heroSlideStore.set(i);
                    }}
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-colors ${
                      i === activeHeroSlide
                        ? 'bg-[#C3F910] text-[#080808] border-[#C3F910]'
                        : 'bg-[#171715] text-[#9A9A94] border-[#2B2B28] hover:text-white'
                    }`}
                    title={`Afficher la photo ${i + 1}`}
                  >
                    0{i + 1}
                  </button>
                ))}
              </span>
            )}
          </>
        ) : (
          <span className="text-[#7A7A76]">
            Aucune section éditable détectée sur cette page.
          </span>
        )}
      </div>
    </div>
  );
};

export default CmsSectionBar;
