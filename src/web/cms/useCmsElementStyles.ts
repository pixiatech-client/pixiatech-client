'use client';

import { useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { forEachElementInSection, getRegisteredSections } from './section-registry';

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
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  target?: string;
  rel?: string;
  offsetX?: number;
  offsetY?: number;
};

/** Marque les transform posés par l'éditeur, pour ne toucher qu'aux nôtres. */
const OFFSET_MARK = 'data-cms-el-offset';

export const EMPTY_ELEMENT_STYLE: ElementStyle = {};

export function readElementStyle(
  sectionData: Record<string, unknown> | undefined,
  elementKey: string
): ElementStyle {
  const bag = sectionData?._elements as Record<string, ElementStyle> | undefined;
  return (bag && bag[elementKey]) || EMPTY_ELEMENT_STYLE;
}

/** Applique un style d'élément sur le nœud DOM correspondant. */
export function applyElementStyle(el: HTMLElement, style: ElementStyle): void {
  if (style.text !== undefined && el.textContent !== style.text) {
    el.textContent = style.text;
  }
  if (style.src !== undefined && el.getAttribute('src') !== style.src) {
    el.setAttribute('src', style.src);
  }
  if (style.alt !== undefined) el.setAttribute('alt', style.alt);
  if (style.fontSize !== undefined) el.style.fontSize = style.fontSize;
  if (style.color !== undefined) el.style.color = style.color;
  if (style.fontWeight !== undefined) el.style.fontWeight = style.fontWeight;
  if (style.fontStyle !== undefined) el.style.fontStyle = style.fontStyle;
  if (style.textDecoration !== undefined) el.style.textDecoration = style.textDecoration;
  if (style.textAlign !== undefined) el.style.textAlign = style.textAlign;
  if (style.backgroundColor !== undefined) el.style.backgroundColor = style.backgroundColor;
  if (style.href !== undefined && el.tagName === 'A') el.setAttribute('href', style.href);
  if (style.target !== undefined) el.setAttribute('target', style.target);
  if (style.rel !== undefined) el.setAttribute('rel', style.rel);

  // `target="_blank"` sans `rel` est un risque sécurité (reverse tabnabbing).
  if (el.getAttribute('target') === '_blank' && !el.getAttribute('rel')) {
    el.setAttribute('rel', 'noopener noreferrer');
  }

  const x = style.offsetX ?? 0;
  const y = style.offsetY ?? 0;
  if (x !== 0 || y !== 0) {
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.setAttribute(OFFSET_MARK, '1');
  } else if (el.hasAttribute(OFFSET_MARK)) {
    // Reset : on ne retire que le transform posé par l'éditeur, jamais celui
    // du design d'origine.
    el.style.removeProperty('transform');
    el.removeAttribute(OFFSET_MARK);
  }
}

/**
 * Balaye les sections montées et réapplique les styles d'élément persistés.
 * Exécuté au montage, au changement de page, de langue et de données CMS.
 */
export function useCmsElementStyles(): void {
  const { currentPageId, currentPageData, currentLang } = useCms();

  useEffect(() => {
    // Deux passes : la seconde attend le rendu des sections qui viennent de
    // s'insérer dans le même commit que le changement de langue.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(apply);
    });

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
          if (style) applyElementStyle(el, style);
        });
      }
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [currentPageId, currentPageData, currentLang]);
}
