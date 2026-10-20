'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Film,
  Globe,
  Save,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  Type,
  Maximize2,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import type { CmsSectionShowreel } from '@/lib/site-web/cms-types';

type ShowreelTab = 'intro' | 'step01' | 'hud' | 'steps_next' | 'timeline' | 'billboard';

interface FieldConfig {
  key: string;
  label: string;
  description: string;
  defaultFr: string;
  defaultEn: string;
  multiline?: boolean;
}

const TABS: { id: ShowreelTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
  { id: 'intro', label: '1. Introduction & En-tête', icon: Type },
  { id: 'step01', label: '2. Étape 01 — Le Module', icon: Layers, badge: '01' },
  { id: 'hud', label: '3. SMD Pixel & Télémétrie HUD', icon: Sliders },
  { id: 'steps_next', label: '4. Étapes 02, 03 & 04 (Mur, Façade, Ville)', icon: Maximize2, badge: '02-04' },
  { id: 'timeline', label: '5. Timeline & Échelle visuelle', icon: Sparkles },
  { id: 'billboard', label: '6. Écran LED 3D (Billboard)', icon: Monitor },
];

const FIELDS_BY_TAB: Record<ShowreelTab, FieldConfig[]> = {
  intro: [
    {
      key: 'label',
      label: 'Libellé de la section (Haut gauche)',
      description: 'Affiché en haut à gauche de la scène figée pendant le défilement.',
      defaultFr: 'PIXIATECH / SHOWREEL',
      defaultEn: 'PIXIATECH / SHOWREEL',
    },
    {
      key: 'scrollHint',
      label: 'Indicateur de défilement (Haut droite)',
      description: 'Texte d’incitation affiché à côté de la pastille verte animée.',
      defaultFr: 'FAITES DÉFILER — DU PIXEL À LA VILLE',
      defaultEn: 'SCROLL TO PULL BACK — ONE PIXEL TO THE CITY',
    },
    {
      key: 'eyebrow',
      label: 'Surtitre d’introduction (Bas gauche)',
      description: 'Petit libellé technique au-dessus du grand titre H1.',
      defaultFr: '02 / SHOWREEL — DU PIXEL À LA VILLE',
      defaultEn: '02 / SHOWREEL — ONE PIXEL TO THE CITY',
    },
    {
      key: 'head1',
      label: 'Titre H1 — Ligne 1 (Contour blanc)',
      description: 'Première ligne du grand titre typographique au zoom initial.',
      defaultFr: 'AFFICHEZ',
      defaultEn: 'SCREEN THE',
    },
    {
      key: 'head2',
      label: 'Titre H1 — Ligne 2 (Plein blanc)',
      description: 'Seconde ligne du grand titre typographique.',
      defaultFr: "L'IMPOSSIBLE.",
      defaultEn: 'IMPOSSIBLE.',
    },
    {
      key: 'lede',
      label: 'Texte descriptif d’introduction',
      description: 'Paragraphe de présentation avant le recul de la caméra.',
      defaultFr: "Faites défiler — la caméra recule d'un seul pixel LED jusqu'à l'horizon de la métropole.",
      defaultEn: 'Keep scrolling — the camera pulls back from a single LED to the whole city.',
      multiline: true,
    },
  ],
  step01: [
    {
      key: 'ch1Eyebrow',
      label: 'Étape 01 — Numéro et intitulé',
      description: 'Surtitre qui apparaît lors du premier palier de recul caméra.',
      defaultFr: '01 / LE MODULE',
      defaultEn: '01 / THE MODULE',
    },
    {
      key: 'ch1TitleLine1',
      label: 'Étape 01 — Titre (Ligne 1)',
      description: 'Accroche principale de l’étape du module.',
      defaultFr: 'Des milliers de pixels.',
      defaultEn: 'Thousands of pixels.',
    },
    {
      key: 'ch1TitleLine2',
      label: 'Étape 01 — Titre (Ligne 2)',
      description: 'Deuxième ligne du titre de l’étape.',
      defaultFr: 'Un module calibré.',
      defaultEn: 'One calibrated module.',
    },
    {
      key: 'ch1Desc',
      label: 'Étape 01 — Description technique des LED',
      description: 'Texte explicatif sur la calibration et la mesure en laboratoire.',
      defaultFr: "Chaque LED est mesurée et appairée en laboratoire afin d'assurer une chromaticité et une luminance parfaites d'un bord à l'autre.",
      defaultEn: 'Every LED measured and matched, so no module is brighter than its neighbour.',
      multiline: true,
    },
  ],
  hud: [
    {
      key: 'smdPixelLabel',
      label: 'Libellé initial « SMD PIXEL » (HUD vert)',
      description: 'Texte d’échelle initiale affiché en vert dans le HUD de droite lors du gros plan.',
      defaultFr: 'SMD PIXEL',
      defaultEn: 'SMD PIXEL',
    },
    {
      key: 'hudScaleLabel',
      label: 'Intitulé de l’indicateur d’échelle (HUD 3)',
      description: 'Sous-titre sous la valeur verte (par ex. ÉCHELLE VISUELLE).',
      defaultFr: 'ÉCHELLE VISUELLE',
      defaultEn: 'WHAT YOU SEE',
    },
    {
      key: 'hudDistanceLabel',
      label: 'Intitulé de la distance caméra (HUD 1)',
      description: 'Sous-titre de la valeur métrique (mm / m / km).',
      defaultFr: 'DISTANCE CAMÉRA',
      defaultEn: 'CAMERA DISTANCE',
    },
    {
      key: 'hudPixelsLabel',
      label: 'Intitulé des pixels visibles (HUD 2)',
      description: 'Sous-titre du compteur dynamique de diodes à l’écran.',
      defaultFr: 'PIXELS VISIBLES',
      defaultEn: 'PIXELS IN VIEW',
    },
  ],
  steps_next: [
    {
      key: 'ch2Eyebrow',
      label: 'Étape 02 — Numéro et intitulé',
      description: 'Affiché lors du passage à l’échelle du mur LED.',
      defaultFr: '02 / LE MUR',
      defaultEn: '02 / THE WALL',
    },
    {
      key: 'ch2TitleLine1',
      label: 'Étape 02 — Titre (Ligne 1)',
      description: 'Première ligne du titre du mur.',
      defaultFr: "Les cabinets s'assemblent en",
      defaultEn: 'Cabinets lock into',
    },
    {
      key: 'ch2TitleLine2',
      label: 'Étape 02 — Titre (Ligne 2)',
      description: 'Seconde ligne du titre du mur.',
      defaultFr: 'une surface continue.',
      defaultEn: 'one seamless surface.',
    },
    {
      key: 'ch2Desc',
      label: 'Étape 02 — Description technique (Châssis 500 × 500 mm...)',
      description: 'Détails sur la profondeur et la modularité des châssis.',
      defaultFr: 'Châssis 500 × 500 mm, profondeur 29.5 mm. Aucune limite de largeur ou de hauteur.',
      defaultEn: '500 × 500 mm cabinets, 29.5 mm deep. Any width. Any height.',
      multiline: true,
    },
    {
      key: 'ch3Eyebrow',
      label: 'Étape 03 — Numéro et intitulé',
      description: 'Affiché lors du passage à l’intégration architecturale.',
      defaultFr: "03 / L'ARCHITECTURE",
      defaultEn: '03 / THE ARCHITECTURE',
    },
    {
      key: 'ch3TitleLine1',
      label: 'Étape 03 — Titre (Ligne 1)',
      description: 'Première ligne du titre d’architecture.',
      defaultFr: "L'écran devient",
      defaultEn: 'The screen becomes',
    },
    {
      key: 'ch3TitleLine2',
      label: 'Étape 03 — Titre (Ligne 2)',
      description: 'Seconde ligne du titre d’architecture.',
      defaultFr: 'la façade.',
      defaultEn: 'the façade.',
    },
    {
      key: 'ch3Desc',
      label: 'Étape 03 — Description (Vision architecturale)',
      description: 'Vision sur l’intégration des écrans dans l’espace.',
      defaultFr: "Nous n'intégrons pas simplement des écrans dans l'espace : nous faisons des écrans une partie intégrante de l'architecture.",
      defaultEn: "We don't place screens into spaces. We make screens part of the space.",
      multiline: true,
    },
    {
      key: 'ch4Eyebrow',
      label: 'Étape 04 — Numéro et intitulé',
      description: 'Affiché lors de la vue aérienne sur la ville.',
      defaultFr: '04 / LA VILLE',
      defaultEn: '04 / THE CITY',
    },
    {
      key: 'ch4TitleLine1',
      label: 'Étape 04 — Titre (Ligne 1)',
      description: 'Première ligne du titre de la ville.',
      defaultFr: 'De la technologie',
      defaultEn: 'From engineering',
    },
    {
      key: 'ch4TitleLine2',
      label: 'Étape 04 — Titre (Ligne 2)',
      description: 'Seconde ligne du titre de la ville.',
      defaultFr: 'à la skyline métropolitaine.',
      defaultEn: 'to every surface.',
    },
    {
      key: 'cta',
      label: 'Bouton d’action (CTA de fin d’animation)',
      description: 'Bouton redirigeant vers le formulaire de contact / réalisations.',
      defaultFr: 'Découvrir les réalisations →',
      defaultEn: 'See the projects →',
    },
  ],
  timeline: [
    {
      key: 'step1',
      label: 'Jalon 1 de la timeline',
      description: 'Première graduation dans la barre inférieure de progression.',
      defaultFr: 'PIXEL',
      defaultEn: 'PIXEL',
    },
    {
      key: 'step2',
      label: 'Jalon 2 de la timeline',
      description: 'Deuxième graduation de progression (Module).',
      defaultFr: 'MODULE',
      defaultEn: 'MODULE',
    },
    {
      key: 'step3',
      label: 'Jalon 3 de la timeline',
      description: 'Troisième graduation de progression (Mur).',
      defaultFr: 'MUR',
      defaultEn: 'WALL',
    },
    {
      key: 'step4',
      label: 'Jalon 4 de la timeline',
      description: 'Quatrième graduation de progression (Façade).',
      defaultFr: 'FAÇADE',
      defaultEn: 'FAÇADE',
    },
    {
      key: 'step5',
      label: 'Jalon 5 de la timeline',
      description: 'Cinquième graduation de progression (Ville).',
      defaultFr: 'VILLE',
      defaultEn: 'CITY',
    },
  ],
  billboard: [
    {
      key: 'tagline',
      label: 'Accroche sur l’écran LED 3D (Billboard Canvas)',
      description: 'Texte typographique dessiné au cœur de l’animation 3D sur le gratte-ciel.',
      defaultFr: 'La science derrière la LED',
      defaultEn: 'Science Behind The LED',
    },
  ],
};

export default function ShowreelAdminModule() {
  const {
    pages,
    updateSectionFieldLocalized,
    saveCurrentPage,
    saveStatus,
    restorePageFromServer,
    isAdmin,
    adminChecked,
  } = useCms();

  const [activeTab, setActiveTab] = useState<ShowreelTab>('intro');
  const [selectedLang, setSelectedLang] = useState<'fr' | 'en'>('fr');
  const [saving, setSaving] = useState(false);

  const showreelSection = useMemo<Record<string, unknown>>(() => {
    return (pages['home']?.sections?.showreel as Record<string, unknown>) || {};
  }, [pages]);

  const handleFieldChange = useCallback(
    (fieldKey: string, value: string) => {
      updateSectionFieldLocalized('showreel', fieldKey, value, selectedLang, true);
    },
    [updateSectionFieldLocalized, selectedLang]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await saveCurrentPage();
      if (ok) {
        toast.success('Textes du Showreel enregistrés avec succès.');
      } else {
        toast.error('Échec de l’enregistrement sur le serveur.');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const currentFields = useMemo(() => FIELDS_BY_TAB[activeTab], [activeTab]);

  if (adminChecked && !isAdmin) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl p-8 text-center text-sm font-semibold text-neutral-500">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Bandeau d’en-tête du module Showreel */}
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
              <Film className="w-6 h-6 text-[#38E044]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                  BACKOFFICE
                </span>
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest">
                  Page d’Accueil · Showreel 3D
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Textes de la section Showreel
              </h1>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                Modifiez individuellement tous les textes visibles, les annotations d’étapes, la télémétrie HUD et l’animation du Showreel sans toucher au code ni altérer le rendu 3D.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Sélecteur de langue */}
            <div className="flex items-center bg-[#171715] border border-neutral-700 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setSelectedLang('fr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLang === 'fr'
                    ? 'bg-[#38E044] text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>🇫🇷</span>
                <span>Français</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang('en')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLang === 'en'
                    ? 'bg-[#38E044] text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>

            <Link
              href="/web#showreel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Visualiser la section Showreel sur le site public"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#38E044]" />
              <span>Voir le Showreel</span>
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-50"
            >
              {saving || saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation par onglets thématiques */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Formulaire des champs de l'onglet actif */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{TABS.find((t) => t.id === activeTab)?.label}</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                Langue : {selectedLang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Chaque champ est automatiquement relié au texte correspondant sur le site public. Les modifications sont enregistrées dans la langue sélectionnée.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {currentFields.map((field) => {
            const rawVal = getCmsText(showreelSection, field.key, selectedLang);
            const defaultVal = selectedLang === 'fr' ? field.defaultFr : field.defaultEn;
            const displayVal = rawVal !== undefined && rawVal !== null ? rawVal : '';

            return (
              <div
                key={field.key}
                className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-700/60 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor={`field-${field.key}`}
                    className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5"
                  >
                    <span>{field.label}</span>
                    <span className="font-mono text-[10px] text-neutral-400 font-normal">
                      ({field.key})
                    </span>
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Valeur initiale : <code className="bg-neutral-200/60 dark:bg-neutral-700 px-1 py-0.5 rounded">{defaultVal}</code>
                  </span>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {field.description}
                </p>

                {field.multiline ? (
                  <textarea
                    id={`field-${field.key}`}
                    rows={3}
                    value={displayVal}
                    placeholder={defaultVal}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full text-xs font-sans rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-700 px-3.5 py-2.5 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#38E044]"
                  />
                ) : (
                  <input
                    id={`field-${field.key}`}
                    type="text"
                    value={displayVal}
                    placeholder={defaultVal}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full text-xs font-sans rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-700 px-3.5 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#38E044]"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Pied de formulaire avec bouton d'enregistrement persistant */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[#38E044] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré ✓
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enregistrement en cours…
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saveStatus === 'saving'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-50"
            >
              {saving || saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les textes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
