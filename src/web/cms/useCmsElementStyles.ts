'use client';

import { useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { CMS_SOURCE_LANG, normalizeLang } from '@/lib/site-web/cms-i18n';
import { forEachElementInSection, getRegisteredSections, subscribeSections } from './section-registry';
import { fluidFontSize } from './fluid-font-size';

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

export type ElementVisualState = {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderRadius?: string;
};

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
  hover?: ElementVisualState;
  active?: ElementVisualState;
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


export function makeElementStyledId(sectionKey: string, elementKey: string): string {
  return `cms_${sectionKey}_${elementKey}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

const dynamicRulesMap = new Map<string, string>();

/**
 * Génère un sélecteur CSS à très haute spécificité en répétant l'attribut
 * `data-cms-styled-id`. Ceci permet aux règles dynamiques du CMS (normal /
 * hover / active, toutes en `!important`) de l'emporter sur les règles
 * `!important` globales du site public, par exemple :
 *   `a:not(.btn):not(.no-acc):hover { color: var(--accent) !important; }`
 * qui a une spécificité (0,3,1) et surclasserait un simple
 * `[data-cms-styled-id="x"]:hover` (0,2,0).
 *
 * Avec 4 répétitions de l'attribut + pseudo-classe : spécificité (0,5,1),
 * qui surclasse toute règle globale raisonnable.
 */
function highSpecSelector(styledId: string, pseudo?: string): string {
  const attr = `[data-cms-styled-id="${styledId}"]`;
  return `${attr}${attr}${attr}${attr}${pseudo ?? ''}`;
}

function updateDynamicStylesheet(): void {
  if (typeof document === 'undefined') return;
  let styleTag = document.getElementById('cms-element-dynamic-styles') as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'cms-element-dynamic-styles';
    document.head.appendChild(styleTag);
  }
  let css = '';
  dynamicRulesMap.forEach((rule) => {
    css += rule + '\n';
  });
  styleTag.textContent = css;
}

export function registerElementDynamicStyles(styledId: string, style: ElementStyle): void {
  if (typeof document === 'undefined') return;

  const hasHover = Boolean(style.hover && Object.keys(style.hover).length > 0);
  const hasActive = Boolean(style.active && Object.keys(style.active).length > 0);

  // Propriétés de l'état Normal qui doivent passer par le stylesheet (pas inline)
  // afin que hover/active puissent les écraser via CSS.
  // RÈGLE CRITIQUE : les styles inline ont une spécificité supérieure à toute
  // règle stylesheet même avec !important, donc on déplace ces 4 propriétés
  // dans le stylesheet dès qu'un styledId existe.
  const hasNormalColor = Boolean(style.color);
  const hasNormalBg = Boolean(style.backgroundColor);
  const hasNormalBorderColor = Boolean(style.borderColor);
  const hasNormalBorderRadius = Boolean(style.borderRadius);
  const hasNormalBorderWidth = Boolean(style.borderWidth);

  const hasNormalOverridable = hasNormalColor || hasNormalBg || hasNormalBorderColor || hasNormalBorderRadius || hasNormalBorderWidth;

  if (!hasHover && !hasActive && !hasNormalOverridable) {
    if (dynamicRulesMap.has(styledId)) {
      dynamicRulesMap.delete(styledId);
      updateDynamicStylesheet();
    }
    return;
  }

  let rules = '';

  // Sélecteurs à haute spécificité pour surclasser les règles !important
  // globales du site public (ex: a:hover !important).
  const base = highSpecSelector(styledId);
  const baseHover = highSpecSelector(styledId, ':hover');
  const baseActive = highSpecSelector(styledId, ':active');
  const baseHoverStar = highSpecSelector(styledId, ':hover *');
  const baseActiveStar = highSpecSelector(styledId, ':active *');
  const previewHover = highSpecSelector(styledId, '[data-cms-preview-state="hover"]');
  const previewActive = highSpecSelector(styledId, '[data-cms-preview-state="active"]');
  const previewHoverStar = highSpecSelector(styledId, '[data-cms-preview-state="hover"] *');
  const previewActiveStar = highSpecSelector(styledId, '[data-cms-preview-state="active"] *');

  // ── État Normal : injecté dans le stylesheet pour permettre l'override hover/active ──
  if (hasNormalOverridable || hasHover || hasActive) {
    rules += `${base} {\n`;
    if (hasNormalColor) rules += `  color: ${style.color} !important;\n`;
    if (hasNormalBg) rules += `  background-color: ${style.backgroundColor} !important;\n`;
    if (hasNormalBorderColor) rules += `  border-color: ${style.borderColor} !important;\n`;
    if (hasNormalBorderWidth) {
      rules += `  border-width: ${style.borderWidth} !important;\n`;
      rules += `  border-style: ${style.borderStyle || 'solid'} !important;\n`;
    }
    if (hasNormalBorderRadius) rules += `  border-radius: ${style.borderRadius} !important;\n`;
    if (hasHover || hasActive) rules += `  transition: color 0.18s ease-in-out, background-color 0.18s ease-in-out, border-color 0.18s ease-in-out, border-radius 0.18s ease-in-out !important;\n`;
    rules += `}\n`;
  }

  // ── État Hover ──
  if (hasHover && style.hover) {
    const h = style.hover;
    rules += `${baseHover}, ${previewHover} {\n`;
    if (h.color) rules += `  color: ${h.color} !important;\n`;
    if (h.backgroundColor) rules += `  background-color: ${h.backgroundColor} !important;\n`;
    if (h.borderColor) rules += `  border-color: ${h.borderColor} !important;\n`;
    if (h.borderWidth) {
      rules += `  border-width: ${h.borderWidth} !important;\n`;
      rules += `  border-style: ${h.borderStyle || 'solid'} !important;\n`;
    }
    if (h.borderRadius) rules += `  border-radius: ${h.borderRadius} !important;\n`;
    rules += `}\n`;
    // Propagation aux enfants textuels (span, strong, em, a, p, etc.)
    if (h.color) {
      rules += `${baseHoverStar}, ${previewHoverStar} { color: inherit !important; }\n`;
    }
  }

  // ── État Active (Clic) ──
  if (hasActive && style.active) {
    const a = style.active;
    rules += `${baseActive}, ${previewActive} {\n`;
    if (a.color) rules += `  color: ${a.color} !important;\n`;
    if (a.backgroundColor) rules += `  background-color: ${a.backgroundColor} !important;\n`;
    if (a.borderColor) rules += `  border-color: ${a.borderColor} !important;\n`;
    if (a.borderWidth) {
      rules += `  border-width: ${a.borderWidth} !important;\n`;
      rules += `  border-style: ${a.borderStyle || 'solid'} !important;\n`;
    }
    if (a.borderRadius) rules += `  border-radius: ${a.borderRadius} !important;\n`;
    rules += `}\n`;
    // Propagation aux enfants textuels
    if (a.color) {
      rules += `${baseActiveStar}, ${previewActiveStar} { color: inherit !important; }\n`;
    }
  }

  dynamicRulesMap.set(styledId, rules);
  updateDynamicStylesheet();
}

export function removeElementDynamicStyles(styledId: string): void {
  if (dynamicRulesMap.has(styledId)) {
    dynamicRulesMap.delete(styledId);
    updateDynamicStylesheet();
  }
}

/** Applique un style d'élément sur le nœud DOM correspondant. */
export function applyElementStyle(el: HTMLElement, style: ElementStyle, lang?: string, elementStyledId?: string): void {
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
  // La donnée enregistrée (px) reste la référence desktop ; on la rend fluide
  // à l'affichage via `--cms-text-scale` (1 en desktop, réduite en mobile).
  if (style.fontSize !== undefined) el.style.fontSize = fluidFontSize(style.fontSize);
  if (style.fontWeight !== undefined) el.style.fontWeight = style.fontWeight;
  if (style.fontStyle !== undefined) el.style.fontStyle = style.fontStyle;
  if (style.textDecoration !== undefined) el.style.textDecoration = style.textDecoration;
  if (style.textAlign !== undefined) el.style.textAlign = style.textAlign;
  if (style.padding !== undefined) el.style.padding = style.padding;

  // Propriétés qui peuvent être surchargées par hover/active :
  // on les applique en inline SEULEMENT s'il n'y a pas de hover ni de active
  // (pas de conflit de spécificité). Sinon, elles passent dans le stylesheet
  // via registerElementDynamicStyles() plus bas dans cette fonction.
  const hasStateOverrides = Boolean(style.hover || style.active);
  const resolvedStyledId = elementStyledId || el.getAttribute('data-cms-styled-id') || '';
  const useStylesheet = hasStateOverrides || Boolean(resolvedStyledId);

  if (!useStylesheet) {
    // Pas de hover/active → inline direct (comportement historique préservé)
    if (style.color !== undefined) el.style.color = style.color;
    if (style.backgroundColor !== undefined) el.style.backgroundColor = style.backgroundColor;
    if (style.borderRadius !== undefined) el.style.borderRadius = style.borderRadius;
    if (style.borderColor !== undefined) el.style.borderColor = style.borderColor;
    if (style.borderWidth !== undefined) {
      el.style.borderWidth = style.borderWidth;
      el.style.borderStyle = style.borderStyle || 'solid';
    }
  } else {
    // Hover/active présents → on RETIRE les styles inline conflictuels
    // (ils seront portés par le stylesheet, voir registerElementDynamicStyles)
    el.style.removeProperty('color');
    el.style.removeProperty('background-color');
    el.style.removeProperty('border-color');
    el.style.removeProperty('border-radius');
    // NB: borderWidth/borderStyle ne sont pas override-ables par pseudo-class
    // dans le même sélecteur, donc on les laisse inline si aucun hover override.
    const hoverHasBorder = Boolean(style.hover?.borderWidth);
    const activeHasBorder = Boolean(style.active?.borderWidth);
    if (!hoverHasBorder && !activeHasBorder) {
      if (style.borderWidth !== undefined) {
        el.style.borderWidth = style.borderWidth;
        el.style.borderStyle = style.borderStyle || 'solid';
      }
    } else {
      el.style.removeProperty('border-width');
      el.style.removeProperty('border-style');
    }
  }

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

  // Gestion des styles dynamiques (états Normal/Hover/Active dans le stylesheet)
  const styledId = elementStyledId || el.getAttribute('data-cms-styled-id');
  const hasOverridableNormal = Boolean(style.color || style.backgroundColor || style.borderColor || style.borderRadius || style.borderWidth);
  const shouldRegister = Boolean(style.hover || style.active) || hasOverridableNormal;

  // Ne pas appeler registerElementDynamicStyles quand le style passé ne contient
  // aucune propriété à enregistrer (pas de hover/active, pas de propriété
  // overridable). Cela éviterait d'effacer par erreur des règles hover/active
  // déjà présentes (cas de VisualInPlaceEditor qui appelle applyElementStyle
  // avec un style partiel contenant uniquement du texte ou un src d'image).
  if (styledId && shouldRegister) {
    el.setAttribute('data-cms-styled-id', styledId);
    registerElementDynamicStyles(styledId, style);
  } else if (shouldRegister && !styledId) {
    const autoId = `cms_el_${Math.random().toString(36).slice(2, 9)}`;
    el.setAttribute('data-cms-styled-id', autoId);
    registerElementDynamicStyles(autoId, style);
  }
}

/**
 * Balaye les sections montées et réapplique les styles d'élément persistés.
 * Exécuté au montage, au changement de page, de langue, de données CMS, de mode
 * édition (public ↔ édition) et à chaque (re)montage de section.
 */
export function useCmsElementStyles(): void {
  const { isEditing, currentPageId, currentPageData, currentLang, pages } = useCms();

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    let raf3 = 0;

    function apply() {
      const sections = (currentPageData?.sections || {}) as
        | Record<string, Record<string, unknown>>;
      const homeSections = (pages?.['home']?.sections || {}) as
        | Record<string, Record<string, unknown>>;

      for (const { node, sectionKey } of getRegisteredSections()) {
        const isGlobal = sectionKey === 'footer' || sectionKey === 'header';
        const sectionData = sections[sectionKey] || (isGlobal ? homeSections[sectionKey] : undefined);
        const bag = sectionData?._elements as Record<string, ElementStyle> | undefined;
        if (!bag || Object.keys(bag).length === 0) continue;

        forEachElementInSection(node, (el, key) => {
          const style = bag[key];
          if (style) {
            const styledId = makeElementStyledId(sectionKey, key);
            applyElementStyle(el, style, currentLang, styledId);
          }
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
  }, [isEditing, currentPageId, currentPageData, currentLang, pages]);
}
