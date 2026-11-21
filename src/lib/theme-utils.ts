import { DEFAULT_PALETTES } from '@/lib/color-palettes';

export const THEME_TRANSITION =
  'background-color 400ms ease-out, color 400ms ease-out, border-color 400ms ease-out, box-shadow 400ms ease-out';

export const CSS_VAR_MAP: Record<string, string> = {
  adminBackground: '--admin-bg',
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  cardBorder: '--card-border',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  sidebarBg: '--sidebar-bg',
  sidebarText: '--sidebar-text',
  sidebarBorder: '--sidebar-border',
  sidebarActiveBg: '--sidebar-active-bg',
  sidebarActiveText: '--sidebar-active-text',
  sidebarAccent: '--sidebar-accent',
  navBg: '--nav-bg',
  navText: '--nav-text',
  btnPrimaryBg: '--btn-primary-bg',
  btnPrimaryText: '--btn-primary-text',
  btnPrimaryHover: '--btn-primary-hover',
  btnSecondaryBg: '--btn-secondary-bg',
  btnSecondaryText: '--btn-secondary-text',
  btnSecondaryHover: '--btn-secondary-hover',
  success: '--success',
  warning: '--warning',
  error: '--error',
  info: '--info',
  border: '--border',
  input: '--input',
  ring: '--ring',
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
};

const RESOLVED_THEME_VARS: Record<string, string> = {
  adminBackground: '--theme-page-bg',
  card: '--theme-card-bg',
  cardBorder: '--theme-card-border',
  cardForeground: '--theme-card-text',
  secondary: '--theme-hover-bg',
  foreground: '--theme-text-primary',
  mutedForeground: '--theme-text-secondary',
  sidebarBg: '--theme-sidebar-bg',
  sidebarText: '--theme-sidebar-text',
  sidebarBorder: '--theme-sidebar-border',
  sidebarActiveBg: '--theme-sidebar-active-bg',
  sidebarActiveText: '--theme-sidebar-active-text',
  btnPrimaryBg: '--theme-btn-primary-bg',
  btnPrimaryText: '--theme-btn-primary-text',
  btnPrimaryHover: '--theme-btn-primary-hover',
  btnSecondaryBg: '--theme-btn-secondary-bg',
  btnSecondaryText: '--theme-btn-secondary-text',
  btnSecondaryHover: '--theme-btn-secondary-hover',
  navBg: '--theme-nav-bg',
  navText: '--theme-nav-text',
};

/**
 * Convertit une couleur HSL (`"142 76% 36%"`) en hexadécimal.
 * Les palettes du back-office stockent `--accent` sous forme de triplet HSL
 * (format exigé par les utilitaires shadcn `hsl(var(--accent))`), alors que les
 * composants « marque » (fiche produit, sélecteurs, CMS) attendent une couleur
 * CSS directe. Ce token de marque unique évite les deux formats concurrents.
 */
export function hslToHex(hsl: string): string {
  try {
    const [hStr, sStr, lStr] = hsl.trim().split(/\s+/);
    const h = parseFloat(hStr) / 360;
    const s = parseFloat(sStr.replace('%', '')) / 100;
    const l = parseFloat(lStr.replace('%', '')) / 100;
    if ([h, s, l].some((n) => Number.isNaN(n))) return '#C3F910';
    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return `#${[r, g, b]
      .map((v) => Math.round(v * 255).toString(16).padStart(2, '0'))
      .join('')}`;
  } catch {
    return '#C3F910';
  }
}

/** Dérive les variantes (hover, glow, rgb) d'un token de marque hexadécimal. */
export function deriveUiAccentTokens(hex: string): Record<string, string> {
  const clean = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#C3F910';
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  const scale = (factor: number) =>
    `#${[r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v * factor))).toString(16).padStart(2, '0'))
      .join('')}`;
  return {
    '--ui-accent': clean,
    '--ui-accent-rgb': `${r}, ${g}, ${b}`,
    '--ui-accent-hover': scale(0.9),
    '--ui-accent-active': scale(0.78),
    '--ui-accent-muted': `rgba(${r}, ${g}, ${b}, 0.15)`,
    '--ui-accent-border': `rgba(${r}, ${g}, ${b}, 0.4)`,
    '--ui-accent-glow': `rgba(${r}, ${g}, ${b}, 0.35)`,
  };
}

export function resolveTheme(
  themeId: string | null | undefined,
  palettes: Array<(typeof DEFAULT_PALETTES)[number] & { id?: string }> = DEFAULT_PALETTES,
): (typeof DEFAULT_PALETTES)[number] {
  const found =
    palettes.find((t) => t.name === themeId || (t.id && t.id === themeId)) ||
    palettes.find((p) => p.isDefault) ||
    palettes[0];
  return found;
}

export function computeThemeVars(
  colors: Record<string, string>,
  overrides?: Record<string, string>,
): Record<string, string> {
  const merged = { ...colors, ...overrides };
  const vars: Record<string, string> = {};

  Object.entries(merged).forEach(([key, value]) => {
    const cssVar = CSS_VAR_MAP[key];
    const resolvedVar = RESOLVED_THEME_VARS[key];
    if (cssVar) vars[cssVar] = value;
    if (resolvedVar) vars[resolvedVar] = `hsl(${value})`;
  });

  // Token de marque unique, TOUJOURS une couleur CSS valide (contrairement à
  // `--accent` qui est un triplet HSL pour shadcn). C'est cette variable que
  // consomment désormais les éléments d'accent de la fiche produit et du
  // back-office, afin qu'aucun vert ne reste figé lors d'un changement de
  // palette. La couleur d'accent du CMS (hex, injectée avec !important) prend
  // le dessus sur ces valeurs.
  if (merged.accent) {
    Object.assign(vars, deriveUiAccentTokens(hslToHex(merged.accent)));
  }

  // Déclinaisons partagées : plusieurs variables CSS issues du même jeton
  if (merged.adminBackground) {
    vars['--theme-app-bg'] = `hsl(${merged.adminBackground})`;
  }
  if (merged.mutedForeground) {
    vars['--theme-icon'] = `hsl(${merged.mutedForeground})`;
  }
  if (merged.btnSecondaryHover) {
    vars['--theme-active-bg'] = `hsl(${merged.btnSecondaryHover})`;
  }

  return vars;
}

/**
 * Retourne le CSS à injecter dans le <head> (anti-FOUC).
 * `html:root` bat la règle `:root` de globals.css par spécificité, quel que
 * soit l'ordre d'apparition des feuilles.
 */
export function buildThemeCss(
  theme: (typeof DEFAULT_PALETTES)[number] | null | undefined,
  overrides?: Record<string, string>,
): string {
  if (!theme) return '';
  const vars = computeThemeVars(theme.colors, overrides);
  const declarations = Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ');
  return `html:root {\n  ${declarations}\n}`;
}
