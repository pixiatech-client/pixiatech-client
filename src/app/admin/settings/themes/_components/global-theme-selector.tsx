'use client';

import { Check, Sparkles, RotateCcw, Paintbrush, Save, Trash2, Plus, X, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_PALETTES } from '@/lib/color-palettes';
import { useTheme } from '@/contexts/ThemeProvider';
import { useAdminT } from '@/hooks/useAdminT';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PaletteColors = (typeof DEFAULT_PALETTES)[number]['colors'];
type Palette = (typeof DEFAULT_PALETTES)[number];

interface CustomTheme extends Omit<Palette, 'isDefault'> {
  id: string;
  isDefault: false;
  isCustom: true;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = { pastel: 'Pastel', audacieux: 'Bold' };
const CATEGORY_STYLES: Record<string, string> = {
  pastel: 'bg-pink-100 text-pink-700 border-pink-200',
  audacieux: 'bg-violet-100 text-violet-700 border-violet-200',
};

const SWATCH_KEYS: Array<{ key: keyof PaletteColors; label: string }> = [
  { key: 'primary', label: 'Primaire' },
  { key: 'accent', label: 'Accent' },
  { key: 'adminBackground', label: 'Fond' },
  { key: 'card', label: 'Carte' },
  { key: 'sidebarBg', label: 'Sidebar' },
];

const OVERRIDES_KEY = 'theme-color-overrides';
const CUSTOM_THEMES_KEY = 'theme-custom-list';

// ─── Color Utilities ─────────────────────────────────────────────────────────

function hslStringToHex(hsl: string): string {
  try {
    const parts = hsl.trim().split(/\s+/);
    if (parts.length < 3) return '#888888';
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace('%', '')) / 100;
    const l = parseFloat(parts[2].replace('%', '')) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch { return '#888888'; }
}

function hexToHslString(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch { return '0 0% 50%'; }
}

// ─── LocalStorage Helpers ────────────────────────────────────────────────────

function loadOverrides(): Record<string, Record<string, string>> {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}'); } catch { return {}; }
}
function saveOverrides(o: Record<string, Record<string, string>>) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
}
function loadCustomThemes(): CustomTheme[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) ?? '[]'); } catch { return []; }
}
function saveCustomThemes(themes: CustomTheme[]) {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}

// ─── SwatchPicker ─────────────────────────────────────────────────────────────

interface SwatchPickerProps {
  colorKey: string;
  label: string;
  currentHsl: string;
  onChange: (key: string, hsl: string) => void;
}

function SwatchPicker({ colorKey, label, currentHsl, onChange }: SwatchPickerProps) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(hslStringToHex(currentHsl));
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setHex(hslStringToHex(currentHsl)); }, [currentHsl]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleHex = (v: string) => {
    setHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(colorKey, hexToHslString(v));
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="group relative w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0 ring-2 ring-transparent hover:ring-black/30 transition-all"
        style={{ background: `hsl(${currentHsl})` }}
        title={`Personnaliser : ${label}`}
      >
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Paintbrush className="w-2.5 h-2.5 text-white drop-shadow" />
        </span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-52"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <div className="w-full h-10 rounded-xl mb-3 border border-slate-100" style={{ background: `hsl(${currentHsl})` }} />
          <div className="flex items-center gap-2 mb-3">
            <input type="color" value={hex} onChange={e => handleHex(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5" />
            <input type="text" value={hex} onChange={e => handleHex(e.target.value)} maxLength={7}
              className="flex-1 text-xs font-mono border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-black/10"
              placeholder="#000000" />
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Teintes rapides</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(DEFAULT_PALETTES.map(p => p.colors[colorKey as keyof PaletteColors] as string))).slice(0, 12).map((hsl, i) => (
              <button key={i} type="button" onClick={() => { onChange(colorKey, hsl); setHex(hslStringToHex(hsl)); }}
                className="w-5 h-5 rounded-full border border-white shadow ring-2 ring-transparent hover:ring-black/30 transition-all"
                style={{ background: `hsl(${hsl})` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Save Modal ───────────────────────────────────────────────────────────────

interface SaveModalProps {
  baseColors: PaletteColors;
  baseMode: 'light' | 'dark';
  onSave: (name: string, description: string, category: string, mode: 'light' | 'dark', colors: PaletteColors) => void;
  onClose: () => void;
}

function SaveModal({ baseColors, baseMode, onSave, onClose }: SaveModalProps) {
  const { t } = useAdminT();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('audacieux');
  const [mode, setMode] = useState<'light' | 'dark'>(baseMode);
  const [colors, setColors] = useState<PaletteColors>(baseColors);

  const handleColorChange = (key: string, hsl: string) => {
    setColors(prev => ({ ...prev, [key]: hsl }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">{t('Save theme')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex gap-1.5 mb-5 p-3 rounded-2xl border border-slate-100 bg-slate-50">
          {SWATCH_KEYS.map(({ key, label }) => (
            <SwatchPicker key={key} colorKey={key} label={label} currentHsl={colors[key] as string}
              onChange={handleColorChange} />
          ))}
          <span className="ml-2 text-[11px] text-slate-400 self-center">{t('Click to edit')}</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Theme name *')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('e.g. My Blue Theme')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              maxLength={40} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Description')}</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('Short description...')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              maxLength={120} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Category')}</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 bg-white">
                <option value="audacieux">{t('Bold')}</option>
                <option value="pastel">Pastel</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Mode')}</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMode('light')}
                  className={cn('flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all',
                    mode === 'light' ? 'bg-black text-white border-black' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                  <Sun className="w-3 h-3" /> {t('Light')}
                </button>
                <button type="button" onClick={() => setMode('dark')}
                  className={cn('flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all',
                    mode === 'dark' ? 'bg-black text-white border-black' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                  <Moon className="w-3 h-3" /> {t('Dark')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            {t('Cancel')}
          </button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim(), description, category, mode, colors); }}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {t('Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  themeName: string;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteConfirm({ themeName, onConfirm, onClose }: DeleteConfirmProps) {
  const { t } = useAdminT();
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">{t('Delete theme "{name}"?').replace('{name}', themeName)}</h3>
        <p className="text-sm text-slate-500 mb-6">{t('This custom theme will be permanently deleted.')}</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            {t('Cancel')}
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
            {t('Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Theme Card ───────────────────────────────────────────────────────────────

interface ThemeCardProps {
  palette: Palette & { isCustom?: boolean; id?: string };
  isActive: boolean;
  isCustomized: boolean;
  getColor: (key: string) => string;
  onSelect: () => void;
  onColorChange: (key: string, hsl: string) => void;
  onReset: (e: React.MouseEvent) => void;
  onSaveAs: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

function ThemeCard({ palette, isActive, isCustomized, getColor, onSelect, onColorChange, onReset, onSaveAs, onDelete }: ThemeCardProps) {
  const { t } = useAdminT();
  const isCustom = (palette as CustomTheme).isCustom === true;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer w-full group',
        'hover:shadow-md hover:border-slate-300',
        isActive ? 'border-black bg-white shadow-md' : 'border-slate-200 bg-white'
      )}
    >
      {/* Active check */}
      {isActive && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-full flex items-center justify-center z-10">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Action buttons row — top right when not active */}
      <div className={cn('absolute top-3 flex items-center gap-1 z-10', isActive ? 'right-11' : 'right-3')}>
        {/* Delete — only custom themes */}
        {isCustom && onDelete && (
          <button type="button" onClick={onDelete}
            className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            title={t('Delete theme')}>
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        {/* Save as new */}
        <button type="button" onClick={onSaveAs}
          className="h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center gap-1 px-2 transition-colors opacity-0 group-hover:opacity-100 text-[10px] font-semibold whitespace-nowrap"
          title={t('Save as new theme')}>
          <Save className="w-2.5 h-2.5" /> {t('Save')}
        </button>
        {/* Reset overrides */}
        {isCustomized && (
          <button type="button" onClick={onReset}
            className="h-6 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 flex items-center justify-center gap-1 px-2 transition-colors text-[10px] font-semibold whitespace-nowrap"
            title={t('Reset')}>
            <RotateCcw className="w-2.5 h-2.5" /> {t('Reset')}
          </button>
        )}
      </div>

      <div className="space-y-3 mt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900">{palette.name}</h3>
          {palette.isDefault && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          {isCustom && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              {t('Custom')}
            </span>
          )}
          {isCustomized && !isCustom && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full">
              {t('Modified')}
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{palette.description || t('Custom theme.')}</p>

        {/* Clickable swatches */}
        <div className="flex gap-1.5 items-center">
          {SWATCH_KEYS.map(({ key, label }) => (
            <SwatchPicker key={key} colorKey={key} label={label} currentHsl={getColor(key)}
              onChange={onColorChange} />
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {palette.category && (
            <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
              CATEGORY_STYLES[palette.category] || 'bg-slate-100 text-slate-600 border-slate-200')}>
              {t(CATEGORY_LABELS[palette.category] || palette.category)}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {palette.mode === 'dark' ? t('Dark') : t('Light')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── CSS Variable Maps (mirrors ThemeProvider) ──────────────────────────────

const CSS_VAR_MAP: Record<string, string> = {
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
};

const THEME_VAR_MAP: Record<string, string | string[]> = {
  adminBackground: ['--theme-page-bg', '--theme-app-bg'],
  card: '--theme-card-bg',
  cardBorder: '--theme-card-border',
  cardForeground: '--theme-card-text',
  secondary: '--theme-hover-bg',
  btnSecondaryHover: ['--theme-active-bg', '--theme-btn-secondary-hover'],
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
  navBg: '--theme-nav-bg',
  navText: '--theme-nav-text',
};

function applyColorToDOM(key: string, hsl: string) {
  const root = document.documentElement;
  const cssVar = CSS_VAR_MAP[key];
  if (cssVar) root.style.setProperty(cssVar, hsl);
  const themeEntry = THEME_VAR_MAP[key];
  if (themeEntry) {
    const vars = Array.isArray(themeEntry) ? themeEntry : [themeEntry];
    vars.forEach(v => root.style.setProperty(v, `hsl(${hsl})`));
  }
}

function applyAllOverridesToDOM(palette: Palette, ov: Record<string, string>) {
  // First restore base palette values
  Object.entries(palette.colors).forEach(([key, value]) => applyColorToDOM(key, value as string));
  // Then apply overrides on top
  Object.entries(ov).forEach(([key, hsl]) => applyColorToDOM(key, hsl));
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function GlobalThemeSelector() {
  const { t } = useAdminT();
  const { activeTheme, setTheme } = useTheme();
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [saveModal, setSaveModal] = useState<{ open: boolean; palette: (Palette & { isCustom?: boolean }) | null }>({ open: false, palette: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  useEffect(() => {
    setOverrides(loadOverrides());
    setCustomThemes(loadCustomThemes());
  }, []);

  const getColor = useCallback((palette: Palette & { id?: string }, key: string) => {
    const paletteKey = (palette as CustomTheme).id ?? palette.name;
    return overrides[paletteKey]?.[key] ?? palette.colors[key as keyof PaletteColors] as string;
  }, [overrides]);

  const getEffectiveColors = useCallback((palette: Palette & { id?: string }): PaletteColors => {
    const paletteKey = (palette as CustomTheme).id ?? palette.name;
    const ov = overrides[paletteKey] ?? {};
    return { ...palette.colors, ...ov };
  }, [overrides]);

  const handleSelect = async (name: string) => setTheme(name);

  const handleColorChange = useCallback((palette: Palette & { id?: string }, key: string, hsl: string) => {
    const paletteKey = (palette as CustomTheme).id ?? palette.name;
    // Apply immediately to DOM if this is the active theme
    if (activeTheme?.name === palette.name) {
      applyColorToDOM(key, hsl);
    }
    setOverrides(prev => {
      const next = { ...prev, [paletteKey]: { ...(prev[paletteKey] ?? {}), [key]: hsl } };
      saveOverrides(next);
      return next;
    });
  }, [activeTheme]);

  // Re-apply overrides whenever active theme changes
  useEffect(() => {
    if (!activeTheme) return;
    const paletteKey = activeTheme.name;
    const activeOverrides = overrides[paletteKey] ?? {};
    if (Object.keys(activeOverrides).length > 0) {
      applyAllOverridesToDOM(activeTheme, activeOverrides);
    }
  }, [activeTheme, overrides]);

  const handleReset = useCallback((palette: Palette & { id?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    const paletteKey = (palette as CustomTheme).id ?? palette.name;
    // Restore base palette colors to DOM if this is the active theme
    if (activeTheme?.name === palette.name) {
      Object.entries(palette.colors).forEach(([key, value]) => applyColorToDOM(key, value as string));
    }
    setOverrides(prev => {
      const next = { ...prev };
      delete next[paletteKey];
      saveOverrides(next);
      return next;
    });
  }, [activeTheme]);

  const handleSaveNew = (name: string, description: string, category: string, mode: 'light' | 'dark', colors: PaletteColors) => {
    const id = `custom-${Date.now()}`;
    const newTheme: CustomTheme = {
      id, name, description,
      category: category as 'audacieux' | 'pastel',
      mode,
      isDefault: false,
      isCustom: true,
      colors,
    };
    const updated = [...customThemes, newTheme];
    setCustomThemes(updated);
    saveCustomThemes(updated);
    setSaveModal({ open: false, palette: null });
  };

  const handleDelete = (id: string) => {
    const updated = customThemes.filter(t => t.id !== id);
    setCustomThemes(updated);
    saveCustomThemes(updated);
    setDeleteConfirm({ open: false, id: '', name: '' });
  };

  const allPalettes: Array<Palette & { isCustom?: boolean; id?: string }> = [
    ...DEFAULT_PALETTES,
    ...customThemes,
  ];

  return (
    <>
      {/* Header with "New theme" button */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          {customThemes.length > 0
            ? `${DEFAULT_PALETTES.length} ${t('themes')} · ${customThemes.length} ${customThemes.length > 1 ? t('custom themes') : t('custom theme')}`
            : `${DEFAULT_PALETTES.length} ${t('themes')} ${t('available')}`}
        </p>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setSaveModal({ open: true, palette: null }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {t('New theme')}
        </button>
      </div>

      {/* Custom themes section header */}
      {customThemes.length > 0 && (
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{t('Default themes')}</p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allPalettes.map((palette) => {
          const paletteKey = (palette as CustomTheme).id ?? palette.name;
          const isActive = activeTheme?.name === palette.name;
          const isCustomized = !!overrides[paletteKey] && Object.keys(overrides[paletteKey]).length > 0;
          const isCustom = (palette as CustomTheme).isCustom === true;

          // Section divider before custom themes
          if (isCustom && allPalettes.indexOf(palette) === DEFAULT_PALETTES.length) {
            return (
              <div key="__divider__" className="col-span-full">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2 mb-3">{t('My themes')}</p>
                <ThemeCard
                  palette={palette}
                  isActive={isActive}
                  isCustomized={isCustomized}
                  getColor={key => getColor(palette, key)}
                  onSelect={() => handleSelect(palette.name)}
                  onColorChange={(k, hsl) => handleColorChange(palette, k, hsl)}
                  onReset={e => handleReset(palette, e)}
                  onSaveAs={e => { e.stopPropagation(); setSaveModal({ open: true, palette: { ...palette, colors: getEffectiveColors(palette) } }); }}
                  onDelete={e => { e.stopPropagation(); setDeleteConfirm({ open: true, id: (palette as CustomTheme).id!, name: palette.name }); }}
                />
              </div>
            );
          }

          return (
            <ThemeCard
              key={paletteKey}
              palette={palette}
              isActive={isActive}
              isCustomized={isCustomized}
              getColor={key => getColor(palette, key)}
              onSelect={() => handleSelect(palette.name)}
              onColorChange={(k, hsl) => handleColorChange(palette, k, hsl)}
              onReset={e => handleReset(palette, e)}
              onSaveAs={e => { e.stopPropagation(); setSaveModal({ open: true, palette: { ...palette, colors: getEffectiveColors(palette) } }); }}
              onDelete={isCustom ? e => { e.stopPropagation(); setDeleteConfirm({ open: true, id: (palette as CustomTheme).id!, name: palette.name }); } : undefined}
            />
          );
        })}
      </div>

      {/* Save Modal */}
      {saveModal.open && (
        <SaveModal
          baseColors={saveModal.palette?.colors ?? DEFAULT_PALETTES[0].colors}
          baseMode={saveModal.palette?.mode ?? 'light'}
          onSave={handleSaveNew}
          onClose={() => setSaveModal({ open: false, palette: null })}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm.open && (
        <DeleteConfirm
          themeName={deleteConfirm.name}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          onClose={() => setDeleteConfirm({ open: false, id: '', name: '' })}
        />
      )}
    </>
  );
}
