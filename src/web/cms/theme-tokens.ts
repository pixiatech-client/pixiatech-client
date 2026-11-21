/**
 * Utilitaires et tokens de thème globaux PixiaTech.
 * Isomorphe (exécutable côté serveur et côté client).
 */

export const DEFAULT_ACCENT = '#C3F910';
export const STORAGE_KEY = 'pixiatech_theme_accent';

// Palette de couleurs prédéfinies
export const PRESET_COLORS = [
  { name: 'Vert PIXIA (Défaut)', value: '#C3F910', darkText: true },
  { name: 'Bleu Électrique', value: '#00AAFF', darkText: true },
  { name: 'Cyan Néon', value: '#00E5FF', darkText: true },
  { name: 'Violet Cyber', value: '#A855F7', darkText: false },
  { name: 'Orange Ambre', value: '#FF9900', darkText: true },
  { name: 'Rouge Laser', value: '#FF3344', darkText: false },
  { name: 'Rose Futuriste', value: '#FF2E93', darkText: false },
  { name: 'Jaune Solaire', value: '#FFE600', darkText: true },
  { name: 'Émeraude', value: '#10B981', darkText: true },
  { name: 'Blanc Pur', value: '#F5F4F0', darkText: true },
];

/** Calcule les dérivées de couleur à partir d'un code HEX (#RRGGBB) */
export function deriveThemeTokens(hex: string): Record<string, string> {
  const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
  let r = 195, g = 249, b = 16;
  if (/^#[0-9a-fA-F]{6}$/.test(cleanHex)) {
    r = parseInt(cleanHex.slice(1, 3), 16);
    g = parseInt(cleanHex.slice(3, 5), 16);
    b = parseInt(cleanHex.slice(5, 7), 16);
  }

  const hoverR = Math.max(0, Math.min(255, Math.round(r * 0.9)));
  const hoverG = Math.max(0, Math.min(255, Math.round(g * 0.9)));
  const hoverB = Math.max(0, Math.min(255, Math.round(b * 0.9)));
  const hoverHex = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;

  const activeR = Math.max(0, Math.min(255, Math.round(r * 0.78)));
  const activeG = Math.max(0, Math.min(255, Math.round(g * 0.78)));
  const activeB = Math.max(0, Math.min(255, Math.round(b * 0.78)));
  const activeHex = `#${activeR.toString(16).padStart(2, '0')}${activeG.toString(16).padStart(2, '0')}${activeB.toString(16).padStart(2, '0')}`;

  return {
    '--accent': cleanHex,
    '--accent-rgb': `${r}, ${g}, ${b}`,
    '--accent-hover': hoverHex,
    '--accent-active': activeHex,
    '--accent-muted': `rgba(${r}, ${g}, ${b}, 0.15)`,
    '--accent-border': `rgba(${r}, ${g}, ${b}, 0.4)`,
    '--accent-glow': `rgba(${r}, ${g}, ${b}, 0.35)`,
    // Token de marque partagé avec le thème global du back-office. Les deux
    // systèmes écrivent les mêmes variables : les éléments qui les consomment
    // suivent le thème, quel que soit le réglage utilisé.
    '--ui-accent': cleanHex,
    '--ui-accent-rgb': `${r}, ${g}, ${b}`,
    '--ui-accent-hover': hoverHex,
    '--ui-accent-active': activeHex,
    '--ui-accent-muted': `rgba(${r}, ${g}, ${b}, 0.15)`,
    '--ui-accent-border': `rgba(${r}, ${g}, ${b}, 0.4)`,
    '--ui-accent-glow': `rgba(${r}, ${g}, ${b}, 0.35)`,
  };
}

/** Génère la chaîne CSS complète pour une couleur d'accent donnée */
export function generateThemeCss(hex: string): string {
  const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
  const tokens = deriveThemeTokens(cleanHex);
  const color = tokens['--accent'];

  return `
    :root, html, body, #pixia-web, #admin-top-bar, #cms-section-bar, #floating-element-toolbar, [data-cms-ui], nav, header {
      --accent: ${color} !important;
      --accent-rgb: ${tokens['--accent-rgb']} !important;
      --accent-hover: ${tokens['--accent-hover']} !important;
      --accent-active: ${tokens['--accent-active']} !important;
      --accent-muted: ${tokens['--accent-muted']} !important;
      --accent-border: ${tokens['--accent-border']} !important;
      --accent-glow: ${tokens['--accent-glow']} !important;
      --ui-accent: ${tokens['--ui-accent']} !important;
      --ui-accent-rgb: ${tokens['--ui-accent-rgb']} !important;
      --ui-accent-hover: ${tokens['--ui-accent-hover']} !important;
      --ui-accent-active: ${tokens['--ui-accent-active']} !important;
      --ui-accent-muted: ${tokens['--ui-accent-muted']} !important;
      --ui-accent-border: ${tokens['--ui-accent-border']} !important;
      --ui-accent-glow: ${tokens['--ui-accent-glow']} !important;
      --pxt-nav-hover: ${color} !important;
      --pxt-nav-active: ${color} !important;
    }

    /* ── Barre CMS d'administration ── */
    #admin-top-bar .animate-pulse,
    #admin-top-bar [data-accent-badge] {
      background-color: ${color} !important;
    }
    #admin-top-bar [data-accent-icon] {
      color: ${color} !important;
    }

    /* ── Cartes Marchés (EXPLORER COMMERCE, puces, etc.) ── */
    .mkt-cta-btn,
    .mkt-cta-btn span,
    button[data-text-key*="market_"] {
      color: ${color} !important;
    }

    /* ── Process / Étapes (01, 02, 03 ÉTUDE, ligne de suivi) ── */
    .proc-row span:first-child,
    .proc-row span[style*="font-mono"] {
      color: ${color} !important;
    }

    /* ── Boutons pleins d'accent (Visiter Experience Center, etc.) ── */
    .btn-solid,
    button.btn-solid {
      background: ${color} !important;
      background-color: ${color} !important;
      color: #080808 !important;
    }

    /* ── Liens de navigation & États actifs (ACCUEIL, etc.) ── */
    .pxt-nav-link.active,
    .pxt-nav-link:hover,
    #site-header .pxt-nav-link.active,
    #site-header .pxt-nav-link:hover,
    nav a.active,
    nav a[class*="active"],
    .subnav a:hover,
    .subnav a.active {
      color: ${color} !important;
      border-bottom-color: ${color} !important;
    }
    .mega-card-item:hover .mega-title {
      color: ${color} !important;
    }

    /* ── Boutons Hero & CTA (Estimer mon projet, etc.) ── */
    .hero-cta2,
    .hero-cta2[style],
    [data-slide-field*="secondaryCta"],
    [data-text-key*="secondaryCta"],
    [data-cms-styled-id*="secondaryCta"],
    [data-cms-styled-id*="secondaryCta"][data-cms-styled-id*="secondaryCta"][data-cms-styled-id*="secondaryCta"][data-cms-styled-id*="secondaryCta"] {
      border-color: ${color} !important;
    }

    .hero-cta2:hover:not([data-cms-styled-id]),
    .hero-cta1:hover:not([data-cms-styled-id]),
    .btn-solid:hover:not([data-cms-styled-id]),
    .btn-ink:hover:not([data-cms-styled-id]),
    .btn-outline:hover:not([data-cms-styled-id]),
    .hov-acc-bg:hover:not([data-cms-styled-id]) {
      background: ${color} !important;
      border-color: ${color} !important;
      color: #080808 !important;
    }

    /* ── Sélection & Focus ── */
    ::selection {
      background: ${color} !important;
      color: #000000 !important;
    }
    :focus-visible {
      outline-color: ${color} !important;
    }

    /* ── Liens & Soulignements d'accent ── */
    .link-ul,
    .link-ul:hover,
    .link-acc,
    .hov-acc:hover,
    .hov-border-acc:hover,
    a:not(.btn):not(.no-acc):hover {
      color: ${color} !important;
      border-color: ${color} !important;
    }

    /* ── Tags & Puces ── */
    .tag.on,
    .chip.on {
      border-color: ${color} !important;
      color: ${color} !important;
    }
    .fstage-step.on .fstage-step-line,
    .fstage-step.on:before,
    .fstage-seg.on i {
      background: ${color} !important;
    }
    .tech-panel--active {
      border-color: ${color} !important;
    }
  `;
}

/** Applique les variables CSS sur tous les éléments racine et injecte la feuille de style globale */
export function applyThemeTokens(hex: string): void {
  if (typeof document === 'undefined') return;
  const tokens = deriveThemeTokens(hex);
  const color = tokens['--accent'];

  // Appliquer sur les conteneurs DOM clés
  const targets = [
    document.documentElement,
    document.body,
    document.getElementById('pixia-web'),
    document.getElementById('admin-top-bar'),
    document.getElementById('cms-section-bar'),
    document.getElementById('floating-element-toolbar'),
  ];

  targets.forEach((t) => {
    if (!t) return;
    for (const [key, val] of Object.entries(tokens)) {
      t.style.setProperty(key, val);
    }
    t.style.setProperty('--pxt-nav-hover', color);
    t.style.setProperty('--pxt-nav-active', color);
  });

  // Notifier les composants React à l'écoute (AdminTopBar, Nav, PixiaHeader, Kinetic, etc.)
  try {
    window.dispatchEvent(new CustomEvent('pixiatech-theme-change', { detail: { accent: color, tokens } }));
  } catch {}

  // Injecter ou mettre à jour la balise de style globale
  let dynamicStyleTag = document.getElementById('pixiatech-theme-override-styles') as HTMLStyleElement | null;
  if (!dynamicStyleTag) {
    dynamicStyleTag = document.createElement('style');
    dynamicStyleTag.id = 'pixiatech-theme-override-styles';
    document.head.appendChild(dynamicStyleTag);
  }

  dynamicStyleTag.textContent = generateThemeCss(color);
}

/** Charge et applique le thème depuis le cache local ou le repli serveur */
export function loadSavedTheme(serverFallback?: string): string {
  if (typeof window === 'undefined') return serverFallback || DEFAULT_ACCENT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) {
      applyThemeTokens(saved);
      return saved;
    }
  } catch {}
  const fallback = serverFallback && /^#[0-9a-fA-F]{6}$/.test(serverFallback) ? serverFallback : DEFAULT_ACCENT;
  applyThemeTokens(fallback);
  return fallback;
}
