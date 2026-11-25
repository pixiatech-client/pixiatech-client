import type { Language, Product, ProjectType, WizardPitchOption, WizardSettings } from '../types';
import { t } from '../i18n/translations';

const DEFAULT_DISTANCES = ['0.5-2m', '2-5m', '5-10m', '10-20m', '+20m'];

export function getPitchRangeForDistance(distance: string): { min: number; max: number } {
  switch (distance) {
    case '0.5-2m':
      return { min: 0, max: 2.9 };
    case '2-5m':
      return { min: 2.5, max: 4.8 };
    case '5-10m':
      return { min: 3.9, max: 8 };
    case '10-20m':
      return { min: 8, max: 16 };
    case '+20m':
      return { min: 16, max: 99 };
    default:
      return { min: 0, max: 99 };
  }
}

function parseDistanceSortValue(dist: string): number {
  const match = dist.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 999;
  const val = parseFloat(match[1]);
  return dist.startsWith('+') ? val + 100 : val;
}

export function getAvailableDistances(
  products: Product[],
  projectType: ProjectType | null,
  wizardSettings: WizardSettings
): string[] {
  const fromProducts = Array.from(
    new Set(
      products
        .filter((p) => !p.isHidden)
        .filter((p) => !projectType || p.availableFor.includes(projectType))
        .map((p) => p.distance)
        .filter((d): d is string => Boolean(d && d.trim()))
    )
  ).sort((a, b) => parseDistanceSortValue(a) - parseDistanceSortValue(b));

  if (fromProducts.length > 0) return fromProducts;
  if (wizardSettings.viewingDistances.length > 0) return wizardSettings.viewingDistances;
  return DEFAULT_DISTANCES;
}

export interface PitchChoice {
  value: number;
  label: string;
  isDontKnow?: boolean;
}

export function getAvailablePitches(
  distance: string | null,
  wizardSettings: WizardSettings,
  lang: Language
): PitchChoice[] {
  const range = getPitchRangeForDistance(distance ?? '');
  const allPitches: WizardPitchOption[] = wizardSettings.pixelPitches;
  const filtered = allPitches.filter((p) => p.value >= range.min && p.value <= range.max);
  const source = filtered.length > 0 ? filtered : allPitches;

  const choices: PitchChoice[] = source.map((p) => ({
    value: p.value,
    label: lang === 'fr' ? p.marketingLabelFr : p.marketingLabelEn,
  }));

  choices.push({
    value: 2.5,
    label: t(lang, 'bot.pitchDontKnow'),
    isDontKnow: true,
  });

  return choices;
}

export function matchProducts(products: Product[], requestedPitch: number): {
  matches: Product[];
  isFallbackCatalog: boolean;
} {
  const visible = products.filter((p) => !p.isHidden);
  const filtered = visible
    .filter((p) => {
      const hasPitch = p.pitch !== null && p.pitch !== undefined;
      const hasDistance = Boolean(p.distance);
      if (!hasPitch && !hasDistance) return true;
      if (hasPitch && p.pitch !== null) {
        return Math.abs(p.pitch - requestedPitch) <= 1.5;
      }
      return false;
    })
    .sort((a, b) => {
      const diffA = a.pitch !== null ? Math.abs(a.pitch - requestedPitch) : 99;
      const diffB = b.pitch !== null ? Math.abs(b.pitch - requestedPitch) : 99;
      return diffA - diffB;
    });

  if (filtered.length > 0) {
    return { matches: filtered, isFallbackCatalog: false };
  }

  return { matches: visible, isFallbackCatalog: true };
}
