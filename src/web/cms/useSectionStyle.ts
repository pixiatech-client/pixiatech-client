import type React from 'react';

/**
 * useSectionStyle
 * ──────────────
 * Reads style/layout overrides from CMS section data and returns
 * CSS-ready values.  Undefined = no override (section keeps its own default).
 */

export interface SectionStyleResult {
  section: React.CSSProperties;
  title:   React.CSSProperties;
  hasOverlay: boolean;
  overlayColor: string;
  bgImage: string | undefined;
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
    ...(bgColor       !== undefined && { backgroundColor: bgColor }),
    ...(textColor     !== undefined && { color: textColor }),
    ...(bgImage ? {
      backgroundImage:    `url(${bgImage})`,
      backgroundSize:     'cover',
      backgroundPosition: 'center',
      backgroundRepeat:   'no-repeat',
    } : {}),
  };

  const titleStyle: React.CSSProperties = {
    ...(titleFontSize !== undefined && { fontSize: titleFontSize }),
    ...(textColor     !== undefined && { color: textColor }),
  };

  return { section: sectionStyle, title: titleStyle, hasOverlay, overlayColor, bgImage };
}
