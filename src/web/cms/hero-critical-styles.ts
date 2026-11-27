import type { CSSProperties } from 'react';
import { fluidFontSize } from './fluid-font-size';
import {
  computeOverlayBackground,
  highSpecSelector,
  makeElementStyledId,
  resolveThemeColor,
  type ImageOverlayConfig,
} from './cms-style-utils';

/**
 * Styles critiques du Hero, calculés côté serveur avec les mêmes données CMS
 * que le rendu public.
 *
 * Le moteur CMS historique (`useCmsElementStyles`) applique ces styles après
 * hydratation (deux `requestAnimationFrame`). Le premier HTML avait donc un
 * titre sans taille CMS, des CTA aux couleurs par défaut et aucune ombre
 * portée sur la photo. Ce module sérialise uniquement l'état NORMAL final
 * dans le premier rendu. Les états hover/active et les effets interactifs
 * restent gérés par le moteur CMS une fois le JS chargé : aucune règle
 * fonctionnelle n'est déplacée ni désactivée.
 */

const CRITICAL_KEYS = ['badge', 'title', 'tagline', 'description', 'primaryCta', 'secondaryCta'] as const;

type StyleBag = Record<string, Record<string, unknown>>;

function readStyleBag(heroSection: unknown): StyleBag {
  if (!heroSection || typeof heroSection !== 'object') return {};
  const bag = (heroSection as Record<string, unknown>)._elements;
  return bag && typeof bag === 'object' ? (bag as StyleBag) : {};
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function color(value: unknown): string | undefined {
  return resolveThemeColor(str(value));
}

function number(value: unknown): number | undefined {
  const n = Number(value);
  return value !== undefined && value !== null && value !== '' && Number.isFinite(n) ? n : undefined;
}

export function buildHeroCriticalCss(heroSection: unknown): string {
  const bag = readStyleBag(heroSection);
  const rules: string[] = [];

  for (const key of CRITICAL_KEYS) {
    const style = bag[key];
    if (!style) continue;

    const declarations: string[] = [];

    const fontSize = str(style.fontSize);
    if (fontSize) declarations.push(`font-size:${fluidFontSize(fontSize)}!important;`);

    const fontWeight = str(style.fontWeight);
    if (fontWeight) declarations.push(`font-weight:${fontWeight}!important;`);

    const fontStyle = str(style.fontStyle);
    if (fontStyle) declarations.push(`font-style:${fontStyle}!important;`);

    const textDecoration = str(style.textDecoration);
    if (textDecoration) declarations.push(`text-decoration:${textDecoration}!important;`);

    const textTransform = str(style.textTransform);
    if (textTransform) declarations.push(`text-transform:${textTransform}!important;`);

    const textAlign = str(style.textAlign);
    if (textAlign) declarations.push(`text-align:${textAlign}!important;`);

    const width = str(style.width);
    if (width) {
      declarations.push(`width:${width}!important;`);
      declarations.push(`max-width:${width}!important;`);
      declarations.push('box-sizing:border-box!important;');
    }

    const height = str(style.height);
    if (height && height !== 'auto') {
      declarations.push(`height:${height}!important;`);
      declarations.push(`min-height:${height}!important;`);
      declarations.push('box-sizing:border-box!important;');
    }

    const fg = color(style.color);
    if (fg) declarations.push(`color:${fg}!important;`);

    const bg = color(style.backgroundColor);
    if (bg) declarations.push(`background-color:${bg}!important;`);

    const borderColor = color(style.borderColor);
    if (borderColor) declarations.push(`border-color:${borderColor}!important;`);

    const borderWidth = str(style.borderWidth);
    if (borderWidth) {
      declarations.push(`border-width:${borderWidth}!important;`);
      declarations.push(`border-style:${str(style.borderStyle) || 'solid'}!important;`);
    }

    const borderRadius = str(style.borderRadius);
    if (borderRadius) declarations.push(`border-radius:${borderRadius}!important;`);

    const offsetX = number(style.offsetX) ?? 0;
    const offsetY = number(style.offsetY) ?? 0;
    if (offsetX !== 0 || offsetY !== 0) {
      declarations.push(`transform:translate(${offsetX}px, ${offsetY}px)!important;`);
    }

    const effect = style.buttonEffect;
    if (effect && typeof effect === 'object') {
      const type = str((effect as Record<string, unknown>).type);
      // Seul l'état normal de l'effet signature est nécessaire à la première
      // peinture. Le hover/active reste injecté par le moteur CMS habituel.
      if (type === 'signature') {
        const amplitude = number((effect as Record<string, unknown>).amplitude) ?? 4;
        const duration = number((effect as Record<string, unknown>).duration) ?? 300;
        declarations.push('position:relative!important;');
        declarations.push('isolation:isolate!important;');
        declarations.push('overflow:hidden!important;');
        declarations.push(`transition-duration:${duration}ms!important;`);
        declarations.push('display:inline-flex!important;');
        declarations.push('align-items:center!important;');
        declarations.push(`gap:${12 + amplitude}px!important;`);
      }
    }

    if (declarations.length === 0) continue;
    rules.push(`${highSpecSelector(makeElementStyledId('hero', key))}{${declarations.join('')}}`);
  }

  return rules.join('\n');
}

export function readHeroOverlayConfig(heroSection: unknown, imageKey: string): ImageOverlayConfig | undefined {
  const style = readStyleBag(heroSection)[imageKey];
  const overlay = style?.overlay;
  return overlay && typeof overlay === 'object' ? (overlay as ImageOverlayConfig) : undefined;
}

/** Style de la couche sombre SSR, identique à celui créé par `applyImageOverlay()`. */
export function heroOverlayStyle(overlay: ImageOverlayConfig | undefined): CSSProperties | undefined {
  if (!overlay || !overlay.enabled) return undefined;
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 2,
    background: computeOverlayBackground(overlay),
    transition: 'background 0.2s ease-in-out',
  };
}
