/**
 * Utilitaires purs (isomorphes) partagés entre l'éditeur CMS, le rendu public
 * et le SSR critique. Aucune API DOM ici : ce fichier peut être importé depuis
 * un composant serveur comme depuis un composant client.
 */

export type ImageOverlayConfig = {
  enabled: boolean;
  color?: string;
  opacity?: number;
  gradientEnabled?: boolean;
  gradientStartColor?: string;
  gradientStartOpacity?: number;
  gradientEndColor?: string;
  gradientEndOpacity?: number;
  gradientDirection?: 'to bottom' | 'to top' | 'to right' | 'to left' | 'to bottom right';
};

export function makeElementStyledId(sectionKey: string, elementKey: string): string {
  return `cms_${sectionKey}_${elementKey}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

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

const THEME_ACCENT_ALIAS_REGEX = /^#(?:C3F910|F46201|CF5A1C|FF9900|E60505)$/i;

export function resolveThemeColor(val: string | undefined): string | undefined {
  if (!val) return val;
  if (THEME_ACCENT_ALIAS_REGEX.test(val.trim())) {
    return 'var(--accent, var(--ui-accent))';
  }
  return val;
}

/**
 * Sélecteur à haute spécificité, identique à celui généré côté client par
 * `registerElementDynamicStyles()`. Les règles SSR et post-hydratation doivent
 * porter exactement le même sélecteur, sinon le rendu final change.
 */
export function highSpecSelector(styledId: string, pseudo?: string): string {
  const attr = `[data-cms-styled-id="${styledId}"]`;
  return `${attr}${attr}${attr}${attr}${pseudo ?? ''}`;
}
