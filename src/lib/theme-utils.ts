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