import type React from 'react';
import { fluidFontSizePx } from './fluid-font-size';

export type StyleKey =
  | 'paddingTop'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingRight'
  | 'marginTop'
  | 'marginBottom'
  | 'minHeight'
  | 'titleFontSize'
  | 'overlayOpacity'
  | 'bgColor'
  | 'textColor'
  | 'bgImage'
  | 'overlayColor';

const ALL_KEYS: readonly StyleKey[] = [
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'marginTop',
  'marginBottom',
  'minHeight',
  'titleFontSize',
  'overlayOpacity',
  'bgColor',
  'textColor',
  'bgImage',
  'overlayColor',
];

export const SPACING_KEYS: readonly StyleKey[] = ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'minHeight'];
export const FULL_STYLE_KEYS: readonly StyleKey[] = ALL_KEYS;
export const BGMAP_STYLE_KEYS: readonly StyleKey[] = ALL_KEYS.filter(
  (k) => k !== 'overlayOpacity' && k !== 'overlayColor'
);
export const BGMAP_TITLELESS_KEYS: readonly StyleKey[] = ALL_KEYS.filter(
  (k) => k !== 'overlayOpacity' && k !== 'overlayColor' && k !== 'titleFontSize'
);
export const SHOWREEL_STYLE_KEYS: readonly StyleKey[] = [
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'minHeight',
  'bgColor',
  'bgImage',
  'overlayOpacity',
  'overlayColor',
];

/**
 * useSectionStyle
 * --------------
 * Reads style/layout overrides from CMS section data and returns
 * CSS-ready values.  Undefined = no override (section keeps its own default).
 */

export interface SectionStyleResult {
  section: React.CSSProperties;
  title:   React.CSSProperties;
  hasOverlay: boolean;
  overlayColor: string;
}

function px(val: unknown): string | undefined {
  const n = Number(val);
  if (val === undefined || val === null || val === '' || isNaN(n)) return undefined;
  return `${n}px`;
}
function numOrUndef(val: unknown): number | undefined {
  const n = Number(val);
  if (val === undefined || val === null || val === '' || isNaN(n)) return undefined;
  return n;
}

export function useSectionStyle(cmsData: Record<string, unknown>): SectionStyleResult {
  const paddingTop    = px(cmsData.paddingTop);
  const paddingBottom = px(cmsData.paddingBottom);
  const paddingLeft   = px(cmsData.paddingLeft);
  const paddingRight  = px(cmsData.paddingRight);
  const marginTop     = numOrUndef(cmsData.marginTop);
  const marginBottom  = numOrUndef(cmsData.marginBottom);
  const minHeightVal  = numOrUndef(cmsData.minHeight);
  const minHeight     = minHeightVal && minHeightVal > 0 ? minHeightVal : undefined;

  const bgColor = (cmsData.bgColor as string | undefined) || undefined;
  const bgImage = (cmsData.bgImage as string | undefined) || undefined;
  const bgParallax = Boolean(cmsData.bgParallax);

  const heightVal  = numOrUndef(cmsData.height);
  const height     = heightVal && heightVal > 0 ? heightVal : undefined;

  const overlayOpacity = numOrUndef(cmsData.overlayOpacity);
  const hasOverlay     = !!bgImage && !!overlayOpacity && overlayOpacity > 0;
  const overlayHex     = hasOverlay
    ? Math.round((overlayOpacity! / 100) * 255).toString(16).padStart(2, '0')
    : '00';
  const overlayBase    = (cmsData.overlayColor as string | undefined) ?? '#000000';
  const overlayColor   = `${overlayBase}${overlayHex}`;

  const titleFontSize = numOrUndef(cmsData.titleFontSize);
  const textColor     = (cmsData.textColor as string | undefined) || undefined;

  const sectionStyle: React.CSSProperties = {
    ...(paddingTop    !== undefined && { paddingTop }),
    ...(paddingBottom !== undefined && { paddingBottom }),
    ...(paddingLeft   !== undefined && { paddingLeft }),
    ...(paddingRight  !== undefined && { paddingRight }),
    ...(marginTop     !== undefined && { marginTop }),
    ...(marginBottom  !== undefined && { marginBottom }),
    ...(minHeight     !== undefined && { minHeight }),
    ...(height        !== undefined && { height, overflow: 'hidden' as const }),
    ...(bgColor       !== undefined && { backgroundColor: bgColor }),
    ...(textColor     !== undefined && { color: textColor }),
    ...(bgImage ? {
      backgroundImage:    `url(${bgImage})`,
      backgroundSize:     'cover',
      backgroundPosition: 'center',
      backgroundRepeat:   'no-repeat',
      ...(bgParallax ? { backgroundAttachment: 'fixed' } : {}),
    } : {}),
  };

  const titleStyle: React.CSSProperties = {
    // `titleFontSize` (px) = référence desktop ; rendue fluide à l'affichage.
    ...(titleFontSize !== undefined && { fontSize: fluidFontSizePx(titleFontSize) }),
    ...(textColor     !== undefined && { color: textColor }),
  };

  return { section: sectionStyle, title: titleStyle, hasOverlay, overlayColor };
}
