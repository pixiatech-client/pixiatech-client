'use client';

import { useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { CMS_SOURCE_LANG, normalizeLang } from '@/lib/site-web/cms-i18n';
import { forEachElementInSection, getRegisteredSections, subscribeSections } from './section-registry';

/**
 * Styles d'élément persistés par la barre contextuelle.
 *
 * Stockage : `pages[pageId].sections[sectionKey]._elements[elementKey]`
 *   {
 *     fontSize, color, fontWeight, fontStyle, textDecoration, textAlign,
 *     backgroundColor, href,
 *     offsetX, offsetY
 *   }
 *
 * `offsetX` / `offsetY` sont appliqués en `transform: translate(...)` :
 * le flux responsive de la page n'est pas touché, rien ne devient absolu.
 *
 * Cet effet est monté dans `WebCmsBridge`, donc actif en édition ET en mode
 * public : sans cela, un style validé disparaîtrait pour les visiteurs et au
 * refresh. C'est le pendant DOM du travail de `updateSectionField`.
 */

export type ElementStyle = {
  fontSize?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  backgroundColor?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  padding?: string;
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  target?: string;
  rel?: string;
  actionType?: string;
  offsetX?: number;
  offsetY?: number;
};

/** Marque les transform posés par l'éditeur, pour ne toucher qu'aux nôtres. */
const OFFSET_MARK = 'data-cms-el-offset';

export const EMPTY_ELEMENT_STYLE: ElementStyle = {};

/**
 * Clé de texte par langue dans le sac `_elements`.
 */
export function elementTextKey(lang: string): string {
  return `text_${normalizeLang(lang)}`;
}

/** Résout le texte applicable pour une langue (langue active → legacy, jamais croisée). */
export function resolveElementText(style: ElementStyle | undefined, lang: string): string | undefined {
  if (!style) return undefined;
  const bag = style as Record<string, unknown>;
  const direct = bag[elementTextKey(lang)];
  if (typeof direct === 'string') return direct;
  return typeof bag.text === 'string' ? (bag.text as string) : undefined;
}

export function readElementStyle(
  sectionData: Record<string, unknown> | undefined,
  elementKey: string
): ElementStyle {
  const bag = sectionData?._elements as Record<string, ElementStyle> | undefined;
  return (bag && bag[elementKey]) || EMPTY_ELEMENT_STYLE;
}

/** Applique un style d'élément sur le nœud DOM correspondant. */
export function applyElementStyle(el: HTMLElement, style: ElementStyle, lang?: string): void {
  const resolvedText = resolveElementText(style, lang || CMS_SOURCE_LANG);
  if (resolvedText !== undefined && el.textContent !== resolvedText) {
    el.textContent = resolvedText;
  }
  if (style.src !== undefined && el.getAttribute('src') !== style.src) {
    el.setAttribute('src', style.src);
    if (el.tagName === 'IMG') {
      (el as HTMLImageElement).src = style.src;
    }
  }
  if (style.alt !== undefined) el.setAttribute('alt', style.alt);
  if (style.fontSize !== undefined) el.style.fontSize = style.fontSize;
  if (style.color !== undefined) el.style.color = style.color;
  if (style.fontWeight !== undefined) el.style.fontWeight = style.fontWeight;
  if (style.fontStyle !== undefined) el.style.fontStyle = style.fontStyle;
  if (style.textDecoration !== undefined) el.style.textDecoration = style.textDecoration;
  if (style.textAlign !== undefined) el.style.textAlign = style.textAlign;
  if (style.backgroundColor !== undefined) el.style.backgroundColor = style.backgroundColor;
  if (style.borderRadius !== undefined) el.style.borderRadius = style.borderRadius;
  if (style.borderColor !== undefined) el.style.borderColor = style.borderColor;
  if (style.borderWidth !== undefined) {
    el.style.borderWidth = style.borderWidth;
    el.style.borderStyle = style.borderStyle || 'solid';
  }
  if (style.padding !== undefined) el.style.padding = style.padding;

  // Gestion universelle des liens & boutons
  const anchor = el.tagName === 'A' ? (el as HTMLAnchorElement) : (el.closest('a') as HTMLAnchorElement | null);
  if (style.href !== undefined) {
    if (anchor) {
      anchor.setAttribute('href', style.href);
      if (style.target !== undefined) anchor.setAttribute('target', style.target);
      if (style.rel !== undefined) anchor.setAttribute('rel', style.rel);
      if (anchor.getAttribute('target') === '_blank' && !anchor.getAttribute('rel')) {
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    } else {
      // Pour les éléments boutons ou conteneurs cliquables sans balise <a>
      el.setAttribute('data-href', style.href);
      if (style.target) el.setAttribute('data-target', style.target);
      const btnObj = el as unknown as Record<string, unknown>;
      btnObj.__cmsHref = style.href;
      btnObj.__cmsTarget = style.target || '_self';

      if (!btnObj.__cmsNavAttached && !style.href.startsWith('action:')) {
        btnObj.__cmsNavAttached = true;
        el.addEventListener('click', (e) => {
          // Si on est en mode édition CMS, on n'exécute pas la navigation au clic
          if (document.body.classList.contains('cms-editing') || (window as unknown as Record<string, unknown>).__CMS_IS_EDITING__) {
            return;
          }
          const destination = btnObj.__cmsHref as string;
          if (destination && !destination.startsWith('action:')) {
            e.preventDefault();
            e.stopPropagation();
            const targetAttr = (btnObj.__cmsTarget as string) || '_self';
            if (targetAttr === '_blank') {
              window.open(destination, '_blank', 'noopener,noreferrer');
            } else if (destination.startsWith('#')) {
              const targetNode = document.querySelector(destination);
              if (targetNode) targetNode.scrollIntoView({ behavior: 'smooth' });
              else window.location.hash = destination;
            } else {
              window.location.href = destination;
            }
          }
        });
      }
    }
  }

  const x = style.offsetX ?? 0;
  const y = style.offsetY ?? 0;
  if (x !== 0 || y !== 0) {
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.setAttribute(OFFSET_MARK, '1');
  } else if (el.hasAttribute(OFFSET_MARK)) {
    el.style.removeProperty('transform');
    el.removeAttribute(OFFSET_MARK);
  }
}

/**
 * Balaye les sections montées et réapplique les styles d'élément persistés.
 * Exécuté au montage, au changement de page, de langue, de données CMS, de mode
 * édition (public ↔ édition) et à chaque (re)montage de section.
 */
export function useCmsElementStyles(): void {
  const { isEditing, currentPageId, currentPageData, currentLang } = useCms();

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    let raf3 = 0;

    function apply() {
      const sections = currentPageData?.sections as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!sections) return;

      for (const { node, sectionKey } of getRegisteredSections()) {
        const sectionData = sections[sectionKey];
        const bag = sectionData?._elements as Record<string, ElementStyle> | undefined;
        if (!bag || Object.keys(bag).length === 0) continue;

        forEachElementInSection(node, (el, key) => {
          const style = bag[key];
          if (style) applyElementStyle(el, style, currentLang);
        });
      }
    }

    // Deux passes : la seconde attend le rendu des sections qui viennent de
    // s'insérer dans le même commit que le changement de langue.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(apply);
    });

    // Le basculement public/édition fait remonter le sous-arbre de chaque
    // section (`EditableWrapper` rend une arborescence différente — div
    // d'enrobage + poignées), ce qui détruit les styles inline posés une seule
    // fois. Sans resynchronisation, un titre Hero reprend alors la taille du CSS
    // `.hero-h1` au lieu de sa taille CMS. On resynchronise donc dès qu'une
    // section se (re)monte ou que le mode édition change. `apply()` ne lit et
    // n'écrit que le DOM : il ne déclenche aucun `setState`, donc aucune boucle.
    const unsubscribe = subscribeSections(() => {
      cancelAnimationFrame(raf3);
      raf3 = requestAnimationFrame(apply);
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf3);
      unsubscribe();
    };
  }, [isEditing, currentPageId, currentPageData, currentLang]);
}
