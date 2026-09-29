'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RotateCcw, X } from 'lucide-react';
import { useCms } from '@/lib/site-web/cms-context';

interface SectionStylePanelProps {
  sectionKey: string;
  sectionLabel: string;
  onClose: () => void;
  /**
   * Propriétés de style réellement rendues par la section : le panneau
   * n'expose jamais de champ dont la valeur n'aurait aucun effet visible
   * (propriété orpheline). Défaut : espacement seul (`SPACING_KEYS`),
   * ce qu'`EditableWrapper` applique à toutes les sections.
   */
  capabilities?: readonly StyleKey[];
}

type Status = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const NUMERIC_KEYS = [
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'marginTop',
  'marginBottom',
  'minHeight',
  'titleFontSize',
  'overlayOpacity',
] as const;

const TEXT_KEYS = ['bgColor', 'textColor', 'bgImage', 'overlayColor'] as const;

type NumericKey = (typeof NUMERIC_KEYS)[number];
type TextKey = (typeof TEXT_KEYS)[number];
export type StyleKey = NumericKey | TextKey;

const NUMERIC_META: Record<NumericKey, { label: string; step: number; min: number; max: number; unit: string }> = {
  paddingTop: { label: 'Padding haut', step: 4, min: 0, max: 400, unit: 'px' },
  paddingBottom: { label: 'Padding bas', step: 4, min: 0, max: 400, unit: 'px' },
  paddingLeft: { label: 'Padding gauche', step: 4, min: 0, max: 400, unit: 'px' },
  paddingRight: { label: 'Padding droite', step: 4, min: 0, max: 400, unit: 'px' },
  marginTop: { label: 'Marge haute', step: 4, min: 0, max: 400, unit: 'px' },
  marginBottom: { label: 'Marge basse', step: 4, min: 0, max: 400, unit: 'px' },
  minHeight: { label: 'Hauteur min.', step: 10, min: 0, max: 2000, unit: 'px' },
  titleFontSize: { label: 'Taille du titre', step: 2, min: 8, max: 160, unit: 'px' },
  overlayOpacity: { label: 'Opacité voile', step: 5, min: 0, max: 100, unit: '%' },
};

const TEXT_META: Record<TextKey, { label: string; type: 'color' | 'text' | 'url'; placeholder: string }> = {
  bgColor: { label: 'Couleur de fond', type: 'color', placeholder: '' },
  textColor: { label: 'Couleur du texte', type: 'color', placeholder: '' },
  bgImage: { label: 'Image de fond (URL)', type: 'url', placeholder: 'https://… ou /uploads/…' },
  overlayColor: { label: 'Couleur du voile', type: 'color', placeholder: '#000000' },
};

const ALL_KEYS: readonly StyleKey[] = [...NUMERIC_KEYS, ...TEXT_KEYS];

/**
 * Propriétés orphelines — jeu de propriétés RÉELLEMENT appliqué par section.
 *
 * `EditableWrapper` applique au DOM : padding* + minHeight (toutes sections).
 * Les propriétés suivantes (marges, couleurs, image, voile, taille du titre) ne
 * sont rendues QUE par les sections qui consomment `useSectionStyle`. Une
 * propriété écrite par le panneau mais jamais lue par le renderer de la section
 * est une propriété orpheline : aucun effet visible, pourtant persistée.
 *
 * Chaque page passe donc à `EditableWrapper` (`styleCapabilities`) le jeu exact
 * que le renderer de la section consomme. Les capacités restent déclarées AU
 * POINT D'UTILISATION (où le renderer est instancié), jamais par simple clé :
 * une même clé (`hero`) peut être pleine sur l'accueil et réduite sur les
 * fiches produit.
 */
export const SPACING_KEYS: readonly StyleKey[] = ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'minHeight'];

/** Toutes les clés : sections qui écrivent cms.section complet (via useSectionStyle). */
export const FULL_STYLE_KEYS: readonly StyleKey[] = ALL_KEYS;

/** Styles du fond pleins mais sans voile (Hero, Experience : pas d'overlay rendu). */
export const BGMAP_STYLE_KEYS: readonly StyleKey[] = ALL_KEYS.filter(
  (k) => k !== 'overlayOpacity' && k !== 'overlayColor'
);

/** Fond + voile, sans typo de titre (Markets : pas de cms.title). */
export const BGMAP_TITLELESS_KEYS: readonly StyleKey[] = ALL_KEYS.filter(
  (k) => k !== 'overlayOpacity' && k !== 'overlayColor' && k !== 'titleFontSize'
);

/** Padding + fond + voile, sans marges / typo / couleur texte (Showreel). */
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

function readEffectiveValue(
  sectionData: Record<string, unknown> | undefined,
  key: StyleKey
): string {
  if (!sectionData) return '';
  const layout = sectionData.layout as Record<string, unknown> | undefined;
  const raw = sectionData[key] !== undefined ? sectionData[key] : layout?.[key];
  if (raw === undefined || raw === null || raw === '') return '';
  return String(raw);
}

/**
 * Contrôles de style contextuels de l'élément sélectionné.
 *
 * Ces contrôles ne créent pas un nouveau système : ils écrivent exactement les
 * champs que `useSectionStyle` lit déjà (paddingTop/Bottom/Left/Right,
 * marginTop/Bottom, minHeight, bgColor, textColor, bgImage, overlayColor,
 * overlayOpacity, titleFontSize) via `updateSectionField`, puis persistent
 * réellement via `saveCurrentPage()` — le même enchaînement que
 * `SectionResizeHandle`.
 */
export const SectionStylePanel: React.FC<SectionStylePanelProps> = ({
  sectionKey,
  sectionLabel,
  onClose,
  capabilities = SPACING_KEYS,
}) => {
  const { currentPageData, updateSectionField, saveCurrentPage } = useCms();

  const sectionData = currentPageData?.sections?.[sectionKey] as Record<string, unknown> | undefined;

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const key of capabilities) initial[key] = readEffectiveValue(sectionData, key);
    return initial;
  });

  const [status, setStatus] = useState<Status>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Resynchronise les champs quand la section change (sans écraser une saisie
  // en cours juste après un update local).
  useEffect(() => {
    if (dirtyRef.current) return;
    setValues((prev) => {
      let changed = false;
      const next: Record<string, string> = {};
      for (const key of capabilities) {
        const val = readEffectiveValue(sectionData, key);
        next[key] = val;
        if (prev[key] !== val) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sectionKey, sectionData, capabilities]);

  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (!dirtyRef.current) return;
    setStatus('saving');
    const ok = await saveCurrentPage();
    dirtyRef.current = false;
    setStatus(ok ? 'saved' : 'error');
    if (ok) {
      window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2500);
    }
  }, [saveCurrentPage]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setStatus('dirty');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void flushSave();
    }, 600);
  }, [flushSave]);

  // Une saisie non sauvegardée ne doit jamais être perdue si le panneau se ferme.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (dirtyRef.current) void flushSave();
    },
    [flushSave]
  );

  const apply = useCallback(
    (key: StyleKey, rawValue: string) => {
      setValues((prev) => ({ ...prev, [key]: rawValue }));
      let value: number | string | undefined;
      if (rawValue.trim() === '') {
        value = undefined; // champ vidé = retour au défaut de la section
      } else if ((NUMERIC_KEYS as readonly string[]).includes(key)) {
        const n = Number(rawValue);
        value = Number.isFinite(n) ? n : undefined;
      } else {
        value = rawValue.trim();
      }
      updateSectionField(sectionKey, key, value);
      scheduleSave();
    },
    [sectionKey, updateSectionField, scheduleSave]
  );

  const resetAll = useCallback(() => {
    for (const key of capabilities) {
      if (values[key] !== '') updateSectionField(sectionKey, key, undefined);
    }
    const empty: Record<string, string> = {};
    for (const key of capabilities) empty[key] = '';
    setValues(empty);
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey, updateSectionField, scheduleSave, values, capabilities]);

  const groups = useMemo(
    () => [
      {
        id: 'spacing',
        title: 'ESPACEMENT',
        keys: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom'] as StyleKey[],
      },
      { id: 'size', title: 'TAILLE', keys: ['minHeight', 'titleFontSize'] as StyleKey[] },
      { id: 'colors', title: 'COULEURS', keys: ['bgColor', 'textColor'] as StyleKey[] },
      { id: 'background', title: 'ARRIÈRE-PLAN', keys: ['bgImage', 'overlayOpacity', 'overlayColor'] as StyleKey[] },
    ],
    []
  );

  // Filtre chaque groupe sur le jeu de propriétés réellement rendues.
  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, keys: g.keys.filter((k) => (capabilities as readonly string[]).includes(k)) }))
        .filter((g) => g.keys.length > 0),
    [groups, capabilities]
  );

  const inputCls =
    'w-full bg-[#171715] border border-[#2a2a27] rounded px-2 py-1 text-[11px] text-white font-mono focus:border-[#C3F910] focus:outline-none';

  return (
    <div
      data-cms-ui
        style={{ position: 'absolute', top: 48, left: 16, zIndex: 160, width: 268 }}
      className="bg-[#0e0e0d]/98 backdrop-blur-md border border-[#C3F910] rounded-lg shadow-2xl font-sans select-none"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* En-tête (non scrollable) */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#2a2a27]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#C3F910] font-mono text-[10px] font-bold uppercase truncate">
            {sectionLabel}
          </span>
          <span className="text-[#6b6b64] font-mono text-[9px]">/ style</span>
        </div>
        <div className="flex items-center gap-1">
          {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin text-[#C3F910]" />}
          {status === 'saved' && <span className="text-[#C3F910] font-mono text-[9px]">✓ sauvegardé</span>}
          {status === 'dirty' && <span className="text-[#9A9A94] font-mono text-[9px]">non sauvegardé…</span>}
          {status === 'error' && <span className="text-[#ff6666] font-mono text-[9px]">échec</span>}
          <button
            type="button"
            onClick={resetAll}
            title="Réinitialiser tous les styles de la section"
            className="p-1 text-[#6b6b64] hover:text-[#C3F910] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              void flushSave();
              onClose();
            }}
            title="Fermer et enregistrer"
            className="p-1 text-[#6b6b64] hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Corps scrollable — seule zone scrollable du panneau */}
      <div className="max-h-[min(60vh,460px)] overflow-y-auto p-3 space-y-3">
        {visibleGroups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <div className="text-[#6b6b64] font-mono text-[9px] font-bold tracking-wider">{group.title}</div>
            {group.keys.map((key) => {
              if ((TEXT_KEYS as readonly string[]).includes(key)) {
                const meta = TEXT_META[key as TextKey];
                return (
                  <label key={key} className="block">
                    <span className="block text-[#9A9A94] text-[10px] mb-0.5">{meta.label}</span>
                    <div className="flex items-center gap-1.5">
                      {meta.type === 'color' && (
                        <input
                          type="color"
                          value={values[key] || '#000000'}
                          onChange={(e) => apply(key, e.target.value)}
                          className="w-7 h-6 p-0 rounded border border-[#2a2a27] bg-transparent cursor-pointer"
                        />
                      )}
                      <input
                        type="text"
                        value={values[key] || ''}
                        placeholder={meta.placeholder || 'défaut'}
                        onChange={(e) => apply(key, e.target.value)}
                        className={inputCls}
                      />
                      {values[key] && (
                        <button
                          type="button"
                          onClick={() => apply(key, '')}
                          title="Revenir au défaut"
                          className="text-[#6b6b64] hover:text-[#ff6666] text-[10px] font-mono shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </label>
                );
              }
              const meta = NUMERIC_META[key as NumericKey];
              return (
                <label key={key} className="block">
                  <span className="block text-[#9A9A94] text-[10px] mb-0.5">
                    {meta.label}
                    <span className="text-[#4a4a45] font-mono"> ({meta.unit})</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min={meta.min}
                      max={meta.max}
                      step={meta.step}
                      value={values[key] === '' ? meta.min : Number(values[key]) || meta.min}
                      onChange={(e) => apply(key, e.target.value)}
                      className="flex-1 accent-[#C3F910] h-1"
                    />
                    <input
                      type="number"
                      min={meta.min}
                      max={meta.max}
                      step={meta.step}
                      value={values[key]}
                      placeholder="auto"
                      onChange={(e) => apply(key, e.target.value)}
                      className={`${inputCls} w-16 shrink-0`}
                    />
                  </div>
                </label>
              );
            })}
          </div>
        ))}
        <p className="text-[9px] text-[#4a4a45] font-mono leading-relaxed pt-1">
          champ vide = valeur par défaut de la section
        </p>
      </div>
    </div>
  );
};

export default SectionStylePanel;
