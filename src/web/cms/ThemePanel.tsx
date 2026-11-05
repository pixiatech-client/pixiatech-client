'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Check, Palette } from 'lucide-react';

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
  };
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

  // Notifier les composants React à l'écoute (AdminTopBar, Nav, etc.)
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

  dynamicStyleTag.textContent = `
    :root, html, body, #pixia-web, #admin-top-bar, #cms-section-bar, #floating-element-toolbar, [data-cms-ui], nav, header {
      --accent: ${color} !important;
      --accent-rgb: ${tokens['--accent-rgb']} !important;
      --accent-hover: ${tokens['--accent-hover']} !important;
      --accent-active: ${tokens['--accent-active']} !important;
      --accent-muted: ${tokens['--accent-muted']} !important;
      --accent-border: ${tokens['--accent-border']} !important;
      --accent-glow: ${tokens['--accent-glow']} !important;
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

    /* ── Isolation stricte des barres et outils d'édition CMS ── */
    #admin-top-bar,
    #cms-section-bar,
    #floating-element-toolbar,
    [data-cms-ui] {
      /* Les barres d'outils CMS conservent leurs transparences et badges fonctionnels */
    }

    /* ── Cartes Marchés (Image 1 : EXPLORER COMMERCE, puces, etc.) ── */
    .mkt-cta-btn,
    .mkt-cta-btn span,
    button[data-text-key*="market_"] {
      color: ${color} !important;
    }

    /* ── Process / Étapes (Image 2 : 01, 02, 03 ÉTUDE, ligne de suivi) ── */
    .proc-row span:first-child,
    .proc-row span[style*="font-mono"] {
      color: ${color} !important;
    }

    /* ── Boutons pleins d'accent (Image 4 : Visiter Experience Center) ── */
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

    .hero-cta2:hover,
    .hero-cta1:hover,
    .btn-solid:hover,
    .btn-ink:hover,
    .btn-outline:hover,
    .hov-acc-bg:hover {
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

/** Charge et applique le thème depuis le localStorage */
export function loadSavedTheme(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) {
      applyThemeTokens(saved);
      return saved;
    }
  } catch {}
  applyThemeTokens(DEFAULT_ACCENT);
  return DEFAULT_ACCENT;
}

interface ThemePanelProps {
  onClose: () => void;
}

export const ThemePanel: React.FC<ThemePanelProps> = ({ onClose }) => {
  const [persistedColor, setPersistedColor] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_ACCENT;
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_ACCENT;
  });
  const [selectedColor, setSelectedColor] = useState<string>(persistedColor);
  const [hexInput, setHexInput] = useState<string>(persistedColor);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Prévisualisation en temps réel dès le montage et à chaque changement
  useEffect(() => {
    if (/^#[0-9a-fA-F]{6}$/.test(selectedColor)) {
      applyThemeTokens(selectedColor);
    }
  }, [selectedColor]);

  const selectColor = useCallback((color: string) => {
    setSelectedColor(color);
    setHexInput(color);
    applyThemeTokens(color);
  }, []);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    const candidate = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9a-fA-F]{6}$/.test(candidate)) {
      const clean = candidate.toUpperCase();
      selectColor(clean);
    }
  };

  const handleApply = useCallback(() => {
    if (!/^#[0-9a-fA-F]{6}$/.test(selectedColor)) return;
    try {
      localStorage.setItem(STORAGE_KEY, selectedColor);
      applyThemeTokens(selectedColor);
      setPersistedColor(selectedColor);
      setStatusMessage('✓ Thème appliqué et sauvegardé !');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('✕ Erreur lors de la sauvegarde');
    }
  }, [selectedColor]);

  const handleReset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    selectColor(DEFAULT_ACCENT);
    setPersistedColor(DEFAULT_ACCENT);
    setStatusMessage('✓ Réinitialisé au vert PIXIATECH');
    setTimeout(() => setStatusMessage(null), 2500);
  }, [selectColor]);

  const handleCancel = useCallback(() => {
    applyThemeTokens(persistedColor);
    onClose();
  }, [persistedColor, onClose]);

  return (
    <div
      data-cms-ui
      style={{
        position: 'fixed',
        top: 'calc(var(--admin-bar-h, 42px) + 8px)',
        right: 16,
        zIndex: 350,
        width: 310,
      }}
      className="bg-[#0e0e0d]/98 backdrop-blur-md border border-[#262624] text-[#f5f4f0] rounded-xl shadow-2xl font-sans select-none animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#222220]">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-black shadow"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="font-mono text-xs font-bold text-[#F5F4F0] tracking-wider uppercase">
            GESTIONNAIRE DE THÈMES
          </span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-[#777] hover:text-white p-1 rounded transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Sélecteur de couleur personnalisé + champ HEX */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-[#9A9A94] uppercase tracking-wider mb-2">
            Couleur Principale (Accent)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#2b2b28] shrink-0 cursor-pointer">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => selectColor(e.target.value.toUpperCase())}
                className="absolute -inset-2 w-16 h-16 cursor-pointer bg-transparent border-0"
              />
            </div>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#C3F910"
              maxLength={7}
              className="flex-1 bg-[#141412] border border-[#262624] focus:border-[#C3F910] rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Palette de couleurs prédéfinies */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-[#9A9A94] uppercase tracking-wider mb-2">
            Palettes Prédéfinies
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((p) => {
              const isSelected = selectedColor.toLowerCase() === p.value.toLowerCase();
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => selectColor(p.value)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer flex items-center justify-center ${
                    isSelected ? 'border-white shadow-lg scale-105' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: p.value }}
                  title={p.name}
                >
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5"
                      style={{ color: p.darkText ? '#080808' : '#ffffff' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aperçu direct des composants d'accentuation */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-[#9A9A94] uppercase tracking-wider mb-1.5">
            Aperçu des Composants
          </label>
          <div className="bg-[#141412] p-3 rounded-lg border border-[#222220] flex items-center justify-between gap-2">
            {/* Bouton démo */}
            <div
              className="px-2.5 py-1 rounded font-mono text-[10px] font-bold shadow text-black"
              style={{ backgroundColor: selectedColor }}
            >
              BOUTON
            </div>
            {/* Tag / badge démo */}
            <div
              className="px-2 py-0.5 rounded font-mono text-[9px] font-bold border"
              style={{
                borderColor: selectedColor,
                color: selectedColor,
                backgroundColor: `rgba(${deriveThemeTokens(selectedColor)['--accent-rgb']}, 0.12)`,
              }}
            >
              ACTIF
            </div>
            {/* Lien démo */}
            <div
              className="font-mono text-[10px] font-bold underline cursor-pointer"
              style={{ color: selectedColor }}
            >
              LIEN_WEB →
            </div>
          </div>
        </div>

        {/* Message de statut */}
        {statusMessage && (
          <div
            className="text-center font-mono text-[11px] font-bold animate-in fade-in duration-150"
            style={{ color: selectedColor }}
          >
            {statusMessage}
          </div>
        )}

        {/* Barre d'actions : Réinitialiser, Annuler, Appliquer */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#222220]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono text-[#888] hover:text-[#ff4444] hover:bg-[#1f1313] transition-colors cursor-pointer"
            title="Revenir au vert PIXIATECH d'origine"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RÉINIT.</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-3 py-1.5 rounded text-xs font-mono text-[#AAA] hover:text-white bg-[#171715] hover:bg-[#20201D] transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer shadow-md text-black"
            style={{ backgroundColor: selectedColor }}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Appliquer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
