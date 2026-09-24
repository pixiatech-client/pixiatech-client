/**
 * useSectionSpacing — Elementor-style spacing hook
 *
 * Reads paddingTop/Bottom/Left/Right, marginTop/Bottom, minHeight
 * from CMS section data and returns a React.CSSProperties object
 * ready to spread onto a <section> style prop.
 *
 * Usage:
 *   const spacingStyle = useSectionSpacing(cmsData, { padding: 'clamp(90px,12vh,150px) 0' });
 *   <section style={{ background: '...', ...spacingStyle }}>
 */
import type React from 'react';

export function useSectionSpacing(
  cmsData: Record<string, unknown>,
  fallback?: React.CSSProperties
): React.CSSProperties {
  const get = (key: string): number | undefined => {
    const v = cmsData[key];
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  };

  const pTop    = get('paddingTop');
  const pBottom = get('paddingBottom');
  const pLeft   = get('paddingLeft');
  const pRight  = get('paddingRight');
  const mTop    = get('marginTop');
  const mBottom = get('marginBottom');
  const mLeft   = get('marginLeft');
  const mRight  = get('marginRight');
  const minH    = get('minHeight');

  // If no CMS padding set at all, fall back to the provided default
  const hasCustomPadding =
    pTop !== undefined || pBottom !== undefined || pLeft !== undefined || pRight !== undefined;

  const style: React.CSSProperties = {
    ...(fallback || {}),
  };

  if (hasCustomPadding) {
    // Override the fallback padding with per-side values
    style.padding   = undefined;
    if (pTop    !== undefined) style.paddingTop    = pTop;
    if (pBottom !== undefined) style.paddingBottom = pBottom;
    if (pLeft   !== undefined) style.paddingLeft   = pLeft;
    if (pRight  !== undefined) style.paddingRight  = pRight;
  }

  if (mTop    !== undefined) style.marginTop    = mTop;
  if (mBottom !== undefined) style.marginBottom = mBottom;
  if (mLeft   !== undefined) style.marginLeft   = mLeft;
  if (mRight  !== undefined) style.marginRight  = mRight;
  if (minH    !== undefined && minH > 0) style.minHeight = minH;

  return style;
}
