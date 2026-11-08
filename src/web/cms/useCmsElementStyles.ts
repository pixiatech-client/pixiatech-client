'use client';

import { useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { CMS_SOURCE_LANG, normalizeLang } from '@/lib/site-web/cms-i18n';
import { forEachElementInSection, getRegisteredSections, subscribeSections } from './section-registry';
import { fluidFontSize } from './fluid-font-size';
import { isMediaVideo } from './media-utils';

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

/**
 * Configuration de l'overlay d'image personnalisable (Fonctionnalité 1)
 */
export type ImageOverlayConfig = {
  enabled: boolean;
  color?: string; // Hex, ex: #000000
  opacity?: number; // 0 à 100, ex: 45
  gradientEnabled?: boolean;
  gradientStartColor?: string; // Hex
  gradientStartOpacity?: number; // 0 à 100
  gradientEndColor?: string; // Hex
  gradientEndOpacity?: number; // 0 à 100
  gradientDirection?: 'to bottom' | 'to top' | 'to right' | 'to left' | 'to bottom right';
};

/**
 * Configuration de la bibliothèque d'effets et d'animations des boutons (Fonctionnalité 2)
 */
export type ButtonEffectType =
  | 'none'
  | 'signature'
  | 'lift'
  | 'glow'
  | 'shine'
  | 'fill'
  | 'scale'
  | 'border-glow'
  | 'slide'
  | 'pulse'
  | 'magnetic'
  | 'underline';

export type ButtonEffectConfig = {
  type: ButtonEffectType;
  intensity?: number; // 0 à 100, défaut: 60
  duration?: number; // ms, ex: 300
  color?: string; // Hex, ex: #C3F910
  amplitude?: number; // px, ex: 4
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
  mediaType?: 'image' | 'video';
  alt?: string;
  href?: string;
  target?: string;
  rel?: string;
  actionType?: string;
  width?: string;
  offsetX?: number;
  offsetY?: number;
  hover?: ElementVisualState;
  active?: ElementVisualState;
  overlay?: ImageOverlayConfig;
  buttonEffect?: ButtonEffectConfig;
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

/**
 * Convertit une couleur Hex et une opacité (0-100) en chaîne rgba(...)
 */
export function hexToRgba(hex: string, opacityPercent: number): string {
  let clean = (hex || '#000000').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const a = Math.max(0, Math.min(100, opacityPercent ?? 45)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Calcule l'arrière-plan CSS de l'overlay (couleur unie ou dégradé linéaire)
 */
export function computeOverlayBackground(overlay: ImageOverlayConfig | undefined): string {
  if (!overlay || !overlay.enabled) return 'none';
  if (overlay.gradientEnabled) {
    const dir = overlay.gradientDirection || 'to bottom';
    const start = hexToRgba(overlay.gradientStartColor || '#000000', overlay.gradientStartOpacity ?? 45);
    const end = hexToRgba(overlay.gradientEndColor || '#000000', overlay.gradientEndOpacity ?? 85);
    return `linear-gradient(${dir}, ${start}, ${end})`;
  }
  return hexToRgba(overlay.color || '#000000', overlay.opacity ?? 45);
}

/**
 * Gère l'application de la couche visuelle d'overlay par-dessus un média
 */
function applyImageOverlay(el: HTMLElement, overlay: ImageOverlayConfig | undefined, styledId: string): void {
  if (typeof document === 'undefined') return;
  const overlayAttr = `[data-cms-overlay-for="${styledId}"]`;
  const isDirectMedia = el.tagName === 'IMG' || el.tagName === 'VIDEO';

  // Recherche d'un élément d'overlay existant
  let overlayEl: HTMLElement | null = isDirectMedia && el.parentElement
    ? (el.parentElement.querySelector(overlayAttr) as HTMLElement | null)
    : (el.querySelector(overlayAttr) as HTMLElement | null);

  if (overlay && overlay.enabled) {
    const bg = computeOverlayBackground(overlay);
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.setAttribute('data-cms-overlay-for', styledId);
      overlayEl.setAttribute('data-cms-ignore', 'true');
      overlayEl.setAttribute('data-cms-ui', 'true');

      if (isDirectMedia && el.parentElement) {
        if (el.nextSibling) {
          el.parentElement.insertBefore(overlayEl, el.nextSibling);
        } else {
          el.parentElement.appendChild(overlayEl);
        }
      } else {
        el.appendChild(overlayEl);
      }
    }

    if (overlayEl) {
      overlayEl.style.position = 'absolute';
      overlayEl.style.inset = '0';
      overlayEl.style.pointerEvents = 'none';
      overlayEl.style.zIndex = '2';
      overlayEl.style.background = bg;
      overlayEl.style.transition = 'background 0.2s ease-in-out';

      // S'assurer que le conteneur englobant a un positionnement relatif pour caler l'overlay
      const hostEl = isDirectMedia ? el.parentElement : el;
      if (hostEl) {
        const computedPos = window.getComputedStyle(hostEl).position;
        if (computedPos === 'static') {
          hostEl.style.position = 'relative';
        }
      }
    }
  } else {
    // Désactivé : supprimer immédiatement la couche
    if (overlayEl) {
      overlayEl.remove();
    }
  }
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
  const hasButtonEffect = Boolean(style.buttonEffect && style.buttonEffect.type && style.buttonEffect.type !== 'none');

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

  if (!hasHover && !hasActive && !hasNormalOverridable && !hasButtonEffect) {
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
  if (hasNormalOverridable || hasHover || hasActive || hasButtonEffect) {
    rules += `${base} {\n`;
    if (hasNormalColor) {
      const c = (style.color?.toUpperCase() === '#C3F910') ? 'var(--accent, #C3F910)' : style.color;
      rules += `  color: ${c} !important;\n`;
    }
    if (hasNormalBg) {
      const bg = (style.backgroundColor?.toUpperCase() === '#C3F910') ? 'var(--accent, #C3F910)' : style.backgroundColor;
      rules += `  background-color: ${bg} !important;\n`;
    }
    if (hasNormalBorderColor) {
      const bc = (style.borderColor?.toUpperCase() === '#C3F910') ? 'var(--accent, #C3F910)' : style.borderColor;
      rules += `  border-color: ${bc} !important;\n`;
    }
    if (hasNormalBorderWidth) {
      rules += `  border-width: ${style.borderWidth} !important;\n`;
      rules += `  border-style: ${style.borderStyle || 'solid'} !important;\n`;
    }
    if (hasNormalBorderRadius) rules += `  border-radius: ${style.borderRadius} !important;\n`;
    if (hasHover || hasActive || hasButtonEffect) {
      rules += `  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, border-radius 0.2s ease-in-out, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease-in-out, gap 0.2s ease-in-out !important;\n`;
    }
    rules += `}\n`;
  }

  // ── Bibliothèque d'effets de boutons (Fonctionnalité 2) ──
  if (hasButtonEffect && style.buttonEffect) {
    const eff = style.buttonEffect;
    const intensity = eff.intensity ?? 60; // 0 à 100
    const duration = eff.duration ?? 300; // ms
    const effectColor = (eff.color?.toUpperCase() === '#C3F910' ? 'var(--accent, #C3F910)' : eff.color) || 'var(--accent, #C3F910)';
    const amp = eff.amplitude ?? 4; // px

    rules += `${base} {\n`;
    rules += `  position: relative !important;\n`;
    rules += `  isolation: isolate !important;\n`;
    rules += `  overflow: hidden !important;\n`;
    rules += `  transition-duration: ${duration}ms !important;\n`;
    rules += `}\n`;
    rules += `${base} > * {\n`;
    rules += `  position: relative !important;\n`;
    rules += `  z-index: 2 !important;\n`;
    rules += `}\n`;

    // Priorité à la couleur de texte personnalisée de l'utilisateur en mode hover
    const userHoverColor = style.hover?.color;

    switch (eff.type) {
      case 'signature': {
        // PIXIATECH Experience — Signature Effect (Section 10)
        // Expansion du gap / poussée de la flèche, halo lime, élévation subtile et retour élastique
        rules += `${base} {\n`;
        rules += `  display: inline-flex !important;\n`;
        rules += `  align-items: center !important;\n`;
        rules += `  gap: 12px !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  gap: ${12 + amp}px !important;\n`;
        rules += `  transform: translateY(-2px) !important;\n`;
        rules += `  box-shadow: 0 0 ${Math.round(intensity * 0.3 + 8)}px ${hexToRgba(eff.color || '#C3F910', Math.min(100, intensity * 0.8 + 20))} !important;\n`;
        if (userHoverColor) rules += `  color: ${userHoverColor} !important;\n`;
        rules += `}\n`;
        if (userHoverColor) {
          rules += `${baseHoverStar}, ${previewHoverStar} { color: ${userHoverColor} !important; }\n`;
        }
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: translateY(0) scale(0.97) !important;\n`;
        rules += `  box-shadow: 0 0 6px ${hexToRgba(eff.color || '#C3F910', 40)} !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'lift': {
        // Soulèvement au survol avec ombre portée
        const shadowY = Math.round(amp * 1.5 + 3);
        const shadowBlur = Math.round(amp * 2.5 + 8);
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  transform: translateY(-${amp}px) !important;\n`;
        rules += `  box-shadow: 0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${(intensity * 0.005 + 0.2).toFixed(2)}) !important;\n`;
        if (userHoverColor) rules += `  color: ${userHoverColor} !important;\n`;
        rules += `}\n`;
        if (userHoverColor) {
          rules += `${baseHoverStar}, ${previewHoverStar} { color: ${userHoverColor} !important; }\n`;
        }
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: translateY(-1px) scale(0.98) !important;\n`;
        rules += `  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'glow': {
        // Halo lumineux
        const blur = Math.round((intensity / 100) * 26 + 8);
        const spread = Math.round((intensity / 100) * 4 + 1);
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  box-shadow: 0 0 ${blur}px ${spread}px ${hexToRgba(eff.color || '#C3F910', Math.min(100, intensity * 0.8 + 25))} !important;\n`;
        if (userHoverColor) rules += `  color: ${userHoverColor} !important;\n`;
        rules += `}\n`;
        if (userHoverColor) {
          rules += `${baseHoverStar}, ${previewHoverStar} { color: ${userHoverColor} !important; }\n`;
        }
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  box-shadow: 0 0 ${Math.round(blur * 0.5)}px ${hexToRgba(eff.color || '#C3F910', 50)} !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'shine': {
        // Effet "Curtain closing" (dev.to / shubhamtiwari909) :
        // Deux demi-rideaux se referment derrière le texte depuis la gauche et la droite
        rules += `${base}::before {\n`;
        rules += `  content: '' !important;\n`;
        rules += `  position: absolute !important;\n`;
        rules += `  top: 0 !important;\n`;
        rules += `  bottom: 0 !important;\n`;
        rules += `  left: 0 !important;\n`;
        rules += `  width: 0 !important;\n`;
        rules += `  background-color: ${effectColor} !important;\n`;
        rules += `  transition: width ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) !important;\n`;
        rules += `  z-index: -1 !important;\n`;
        rules += `  pointer-events: none !important;\n`;
        rules += `}\n`;
        rules += `${base}::after {\n`;
        rules += `  content: '' !important;\n`;
        rules += `  position: absolute !important;\n`;
        rules += `  top: 0 !important;\n`;
        rules += `  bottom: 0 !important;\n`;
        rules += `  right: 0 !important;\n`;
        rules += `  width: 0 !important;\n`;
        rules += `  background-color: ${effectColor} !important;\n`;
        rules += `  transition: width ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) !important;\n`;
        rules += `  z-index: -1 !important;\n`;
        rules += `  pointer-events: none !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}::before, ${previewHover}::before {\n`;
        rules += `  width: 51% !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}::after, ${previewHover}::after {\n`;
        rules += `  width: 51% !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  color: ${userHoverColor || '#080808'} !important;\n`;
        rules += `  box-shadow: 0 0 ${Math.round(intensity * 0.2 + 8)}px ${hexToRgba(eff.color || '#C3F910', 45)} !important;\n`;
        rules += `}\n`;
        rules += `${baseHoverStar}, ${previewHoverStar} {\n`;
        rules += `  color: ${userHoverColor || '#080808'} !important;\n`;
        rules += `}\n`;
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: scale(0.97) !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'fill': {
        // Effet "Slide transition" montant (dev.to / shubhamtiwari909) :
        // Le fond monte du bas vers le haut derrière le texte
        rules += `${base}::before {\n`;
        rules += `  content: '' !important;\n`;
        rules += `  position: absolute !important;\n`;
        rules += `  left: 0 !important;\n`;
        rules += `  right: 0 !important;\n`;
        rules += `  bottom: 0 !important;\n`;
        rules += `  height: 0 !important;\n`;
        rules += `  background-color: ${effectColor} !important;\n`;
        rules += `  transition: height ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) !important;\n`;
        rules += `  z-index: -1 !important;\n`;
        rules += `  pointer-events: none !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}::before, ${previewHover}::before {\n`;
        rules += `  height: 100% !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  color: ${userHoverColor || '#080808'} !important;\n`;
        rules += `  border-color: ${effectColor} !important;\n`;
        rules += `  box-shadow: 0 0 ${Math.round(intensity * 0.25 + 6)}px ${hexToRgba(eff.color || '#C3F910', 40)} !important;\n`;
        rules += `}\n`;
        rules += `${baseHoverStar}, ${previewHoverStar} {\n`;
        rules += `  color: ${userHoverColor || '#080808'} !important;\n`;
        rules += `}\n`;
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: scale(0.97) !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'scale': {
        // Effet "Multicolor transition" (dev.to / shubhamtiwari909) :
        // Dégradé arc-en-ciel vibrant + agrandissement dynamique
        const sc = (1 + (amp / 100) * (intensity / 50)).toFixed(3);
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  background: linear-gradient(90deg, ${effectColor}, #00e5ff, #ff6ec7) !important;\n`;
        rules += `  color: ${userHoverColor || '#080808'} !important;\n`;
        rules += `  border-color: transparent !important;\n`;
        rules += `  transform: scale(${sc}) !important;\n`;
        rules += `  box-shadow: 0 0 ${Math.round(intensity * 0.3 + 10)}px rgba(195, 249, 16, 0.5) !important;\n`;
        rules += `}\n`;
        rules += `${baseHoverStar}, ${previewHoverStar} {\n`;
        rules += `  color: ${userHoverColor || '#080808'} !important;\n`;
        rules += `}\n`;
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: scale(0.98) !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'border-glow': {
        // Effet "Multi-color border hover" (dev.to / shubhamtiwari909) :
        // Bordure multicolore vibrante tournante avec halo néon
        const glowB = Math.round((intensity / 100) * 16 + 6);
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  border: 2px solid transparent !important;\n`;
        rules += `  background: linear-gradient(#0e0e0d, #0e0e0d) padding-box, linear-gradient(90deg, ${effectColor}, #00e5ff, #ff6ec7, ${effectColor}) border-box !important;\n`;
        rules += `  box-shadow: 0 0 ${glowB}px ${hexToRgba(eff.color || '#C3F910', 60)}, inset 0 0 8px ${hexToRgba(eff.color || '#C3F910', 25)} !important;\n`;
        if (userHoverColor) rules += `  color: ${userHoverColor} !important;\n`;
        rules += `}\n`;
        if (userHoverColor) {
          rules += `${baseHoverStar}, ${previewHoverStar} { color: ${userHoverColor} !important; }\n`;
        }
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: scale(0.98) !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'slide': {
        // Effet "Slide transition & Star accent" (dev.to / shubhamtiwari909) :
        // Déplacement latéral fluide avec sur-accentuation du tracking
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  transform: translateX(${amp * 1.5}px) !important;\n`;
        rules += `  letter-spacing: 0.12em !important;\n`;
        rules += `  box-shadow: -4px 0 12px ${hexToRgba(eff.color || '#C3F910', 35)} !important;\n`;
        if (userHoverColor) rules += `  color: ${userHoverColor} !important;\n`;
        rules += `}\n`;
        if (userHoverColor) {
          rules += `${baseHoverStar}, ${previewHoverStar} { color: ${userHoverColor} !important; }\n`;
        }
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: translateX(${Math.max(1, Math.round(amp / 2))}px) scale(0.98) !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'pulse': {
        // Effet "Pulse Ring" :
        // Pulsation continue avec double ring lumineux expansif
        const pulseSc = (1 + (amp / 100) * (intensity / 100)).toFixed(3);
        const animName = `pxt_pulse_${styledId}`;
        rules += `@keyframes ${animName} {\n`;
        rules += `  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0px ${hexToRgba(eff.color || '#C3F910', 50)}; }\n`;
        rules += `  50% { transform: scale(${pulseSc}); box-shadow: 0 0 0 6px ${hexToRgba(eff.color || '#C3F910', 30)}, 0 0 0 12px ${hexToRgba(eff.color || '#C3F910', 10)}; }\n`;
        rules += `}\n`;
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  animation: ${animName} ${Math.max(500, duration * 3)}ms ease-in-out infinite !important;\n`;
        if (userHoverColor) rules += `  color: ${userHoverColor} !important;\n`;
        rules += `}\n`;
        if (userHoverColor) {
          rules += `${baseHoverStar}, ${previewHoverStar} { color: ${userHoverColor} !important; }\n`;
        }
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: scale(0.97) !important;\n`;
        rules += `  animation: none !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'magnetic': {
        // Déplacement subtil vers le curseur et shimmer latéral
        rules += `${base}::after {\n`;
        rules += `  content: '' !important;\n`;
        rules += `  position: absolute !important;\n`;
        rules += `  top: 0 !important;\n`;
        rules += `  left: -100% !important;\n`;
        rules += `  width: 50% !important;\n`;
        rules += `  height: 100% !important;\n`;
        rules += `  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent) !important;\n`;
        rules += `  transform: skewX(-20deg) !important;\n`;
        rules += `  transition: left ${Math.round(duration * 1.5)}ms ease !important;\n`;
        rules += `  pointer-events: none !important;\n`;
        rules += `  z-index: 1 !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}::after, ${previewHover}::after {\n`;
        rules += `  left: 150% !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  transform: translateY(-${amp}px) scale(1.02) !important;\n`;
        rules += `  box-shadow: 2px -2px 14px ${hexToRgba(eff.color || '#C3F910', 40)} !important;\n`;
        if (userHoverColor) rules += `  color: ${userHoverColor} !important;\n`;
        rules += `}\n`;
        if (userHoverColor) {
          rules += `${baseHoverStar}, ${previewHoverStar} { color: ${userHoverColor} !important; }\n`;
        }
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: scale(0.98) !important;\n`;
        rules += `}\n`;
        break;
      }

      case 'underline': {
        // Double soulignement animé (première barre franche + seconde barre fine décalée)
        const lineH = Math.max(2, Math.round(amp / 2));
        rules += `${base}::after {\n`;
        rules += `  content: '' !important;\n`;
        rules += `  position: absolute !important;\n`;
        rules += `  bottom: 3px !important;\n`;
        rules += `  left: 0 !important;\n`;
        rules += `  width: 0 !important;\n`;
        rules += `  height: ${lineH}px !important;\n`;
        rules += `  background-color: ${effectColor} !important;\n`;
        rules += `  transition: width ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) !important;\n`;
        rules += `  pointer-events: none !important;\n`;
        rules += `  z-index: 2 !important;\n`;
        rules += `}\n`;
        rules += `${base}::before {\n`;
        rules += `  content: '' !important;\n`;
        rules += `  position: absolute !important;\n`;
        rules += `  bottom: 0px !important;\n`;
        rules += `  right: 0 !important;\n`;
        rules += `  width: 0 !important;\n`;
        rules += `  height: 1px !important;\n`;
        rules += `  background-color: ${hexToRgba(eff.color || '#C3F910', 55)} !important;\n`;
        rules += `  transition: width ${Math.round(duration * 1.3)}ms cubic-bezier(0.16, 1, 0.3, 1) !important;\n`;
        rules += `  pointer-events: none !important;\n`;
        rules += `  z-index: 2 !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}::after, ${previewHover}::after {\n`;
        rules += `  width: 100% !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}::before, ${previewHover}::before {\n`;
        rules += `  width: 75% !important;\n`;
        rules += `}\n`;
        rules += `${baseHover}, ${previewHover} {\n`;
        rules += `  color: ${userHoverColor || effectColor} !important;\n`;
        rules += `}\n`;
        rules += `${baseHoverStar}, ${previewHoverStar} {\n`;
        rules += `  color: ${userHoverColor || effectColor} !important;\n`;
        rules += `}\n`;
        rules += `${baseActive}, ${previewActive} {\n`;
        rules += `  transform: scale(0.98) !important;\n`;
        rules += `}\n`;
        break;
      }
    }

    // Préférence système de réduction de mouvement
    rules += `@media (prefers-reduced-motion: reduce) {\n`;
    rules += `  ${base}, ${base}::after, ${base}::before, ${baseHover}, ${previewHover} {\n`;
    rules += `    transition: none !important;\n`;
    rules += `    animation: none !important;\n`;
    rules += `    transform: none !important;\n`;
    rules += `  }\n`;
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
    } else if (el.tagName === 'VIDEO') {
      (el as HTMLVideoElement).src = style.src;
      try {
        (el as HTMLVideoElement).play().catch(() => {});
      } catch {}
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
  if (style.width !== undefined) {
    const w = style.width.trim();
    el.style.width = style.width;
    // Mobile-safe : la valeur enregistrée reste la référence desktop, mais la
    // largeur ne peut jamais dépasser le conteneur (better-layout #10 :
    // « no fixed widths on text containers »). Sur desktop le conteneur est
    // plus large que la valeur → `min(valeur, 100%)` = valeur, rendu identique.
    // Sur mobile, le texte wrapp dans la largeur disponible au lieu d'être coupé.
    el.style.maxWidth = /^(?:\d+(?:\.\d+)?)(?:px|%)$/.test(w) ? `min(${w}, 100%)` : style.width;
    el.style.boxSizing = 'border-box';
  }

  // Propriétés qui peuvent être surchargées par hover/active :
  // on les applique en inline SEULEMENT s'il n'y a pas de hover ni de active
  // (pas de conflit de spécificité). Sinon, elles passent dans le stylesheet
  // via registerElementDynamicStyles() plus bas dans cette fonction.
  const hasStateOverrides = Boolean(style.hover || style.active);
  const resolvedStyledId = elementStyledId || el.getAttribute('data-cms-styled-id') || '';
  const useStylesheet = hasStateOverrides || Boolean(resolvedStyledId);

  if (!useStylesheet) {
    // Pas de hover/active → inline direct (comportement historique préservé)
    if (style.color !== undefined) {
      el.style.color = (style.color?.toUpperCase() === '#C3F910') ? 'var(--accent, #C3F910)' : style.color;
    }
    if (style.backgroundColor !== undefined) {
      el.style.backgroundColor = (style.backgroundColor?.toUpperCase() === '#C3F910') ? 'var(--accent, #C3F910)' : style.backgroundColor;
    }
    if (style.borderRadius !== undefined) el.style.borderRadius = style.borderRadius;
    if (style.borderColor !== undefined) {
      el.style.borderColor = (style.borderColor?.toUpperCase() === '#C3F910') ? 'var(--accent, #C3F910)' : style.borderColor;
    }
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
  const hasButtonEffect = Boolean(style.buttonEffect && style.buttonEffect.type && style.buttonEffect.type !== 'none');
  const shouldRegister = Boolean(style.hover || style.active) || hasOverridableNormal || hasButtonEffect;

  const effectiveStyledId = styledId || `cms_el_${Math.random().toString(36).slice(2, 9)}`;

  // Application de l'overlay personnalisé pour les images et médias (Fonctionnalité 1)
  applyImageOverlay(el, style.overlay, effectiveStyledId);

  // Gestion de l'effet magnétique interactif (Fonctionnalité 2)
  if (style.buttonEffect?.type === 'magnetic') {
    if (!el.hasAttribute('data-cms-magnetic-attached')) {
      el.setAttribute('data-cms-magnetic-attached', 'true');
      const maxDist = style.buttonEffect.amplitude ?? 6;
      const onMove = (e: MouseEvent) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.22;
        const deltaY = (e.clientY - centerY) * 0.22;
        const clampedX = Math.max(-maxDist, Math.min(maxDist, deltaX));
        const clampedY = Math.max(-maxDist, Math.min(maxDist, deltaY));
        el.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
      };
      const onLeave = () => {
        el.style.transform = '';
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    }
  } else if (el.hasAttribute('data-cms-magnetic-attached')) {
    el.removeAttribute('data-cms-magnetic-attached');
  }

  // Ne pas appeler registerElementDynamicStyles quand le style passé ne contient
  // aucune propriété à enregistrer (pas de hover/active, pas de propriété
  // overridable). Cela éviterait d'effacer par erreur des règles hover/active
  // déjà présentes.
  if (styledId && shouldRegister) {
    el.setAttribute('data-cms-styled-id', styledId);
    registerElementDynamicStyles(styledId, style);
  } else if (shouldRegister && !styledId) {
    el.setAttribute('data-cms-styled-id', effectiveStyledId);
    registerElementDynamicStyles(effectiveStyledId, style);
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
