import type { Product } from '@/lib/types';
import type { ConfigState } from '@/lib/configurator-wizard-types';

export type ScreenType = 'flat' | 'curved' | '360';

/**
 * Logique de compatibilité partagée de la Configuration guidée.
 *
 * Tous les filtres sont calculés à partir des produits réellement compatibles
 * avec l'ensemble des critères déjà sélectionnés (mode, environnement, distance
 * de visionnage, pixel pitch). La disponibilité d'un type d'écran
 * (PLAT / INCURVÉ / 360°) n'est JAMAIS codée en dur.
 */

/** Normalize distance string for resilient comparison (handles dashes, commas, spaces, units). */
export function normalizeDistance(val?: string | null): string {
  if (!val) return '';
  return val
    .toLowerCase()
    .replace(/m[eèé]tres?/g, 'm')
    .replace(/\b[àa]\b/g, '-')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/(\d+),(\d+)/g, '$1.$2')
    .replace(/\s+/g, '')
    .replace(/m(?=-|$)/g, '')
    .replace(/m/g, '');
}

/** Normalize pixel pitch string for strict comparison (e.g. 'P2.5', 'p 2.5' -> 'P2.5'). */
export function normalizePitch(val?: string | null): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, '').toUpperCase();
}

/** Retrieve only the pitches associated with a specific viewing distance for a product. */
export function getProductPitchesForDistance(p: Product, targetDistance: string): string[] {
  if (!targetDistance || !targetDistance.trim()) return [];
  const normalizedTarget = normalizeDistance(targetDistance);
  const result = new Set<string>();

  // 1. Structured distancePitches (primary source of truth)
  if (p.distancePitches && typeof p.distancePitches === 'object') {
    for (const [distKey, pitches] of Object.entries(p.distancePitches)) {
      if (!Array.isArray(pitches) || pitches.length === 0) continue;
      if (distKey.trim() === targetDistance.trim() || normalizeDistance(distKey) === normalizedTarget) {
        pitches.forEach(pitch => {
          if (pitch && pitch.trim()) result.add(pitch.trim());
        });
      }
    }
    if (Object.keys(p.distancePitches).length > 0) {
      return Array.from(result);
    }
  }

  // 2. Legacy fallback: requires both non-empty distance AND non-empty pitch
  if (p.distance && p.pitch) {
    const distances = p.distance.split(',').map(s => s.trim()).filter(Boolean);
    const matchesDistance = distances.some(d => d === targetDistance.trim() || normalizeDistance(d) === normalizedTarget);
    if (matchesDistance) {
      const pitches = p.pitch.split(',').map(s => s.trim()).filter(Boolean);
      pitches.forEach(pitch => result.add(pitch));
    }
  }

  return Array.from(result);
}

/** Check if product's screenType matches the client's screen selection ('flat' | 'curved' | '360'). */
export function matchProductScreenType(productScreenType?: string | string[] | null, selectedScreenType?: ScreenType): boolean {
  const target = selectedScreenType || 'flat';
  if (Array.isArray(productScreenType)) {
    return productScreenType.map(s => String(s).toLowerCase().trim()).includes(target);
  }
  const rawType = String(productScreenType || 'flat').toLowerCase().trim();
  if (rawType.includes(',')) {
    return rawType.split(',').map(s => s.trim()).includes(target);
  }
  return rawType === target;
}

export type ScreenCriteria = Pick<ConfigState, 'projectType' | 'environment' | 'viewingDistance' | 'pixelPitch'>;

/** Map the wizard project type to the product `availableFor` value. */
export function resolveTargetMode(state: Pick<ConfigState, 'projectType'>): 'sale' | 'rental' {
  return state.projectType === 'location' ? 'rental' : 'sale';
}

/** Map the wizard environment to the product `type` value. */
export function resolveTargetEnvironment(state: Pick<ConfigState, 'environment'>): 'indoor' | 'outdoor' | 'showcase' {
  return state.environment === 'interieur' ? 'indoor'
    : state.environment === 'semi-exterieur' ? 'showcase'
      : 'outdoor';
}

/**
 * Strict compatibility test (AND logic) against ALL criteria already selected,
 * WITHOUT the screen type filter: hidden, mode, environment, distance + pitch.
 */
export function isProductCompatibleWithCriteria(state: ScreenCriteria, p: Product): boolean {
  if (p.isHidden) return false;

  // Mode check (sale / rental)
  if (!p.availableFor?.includes(resolveTargetMode(state))) return false;

  // Environnement (Intérieur -> indoor, Semi-intérieur -> showcase, Extérieur -> outdoor)
  if (!Array.isArray(p.type) || !p.type.includes(resolveTargetEnvironment(state))) return false;

  // Distance & Pixel pitch must be selected and explicitly matched in product data
  if (!state.viewingDistance || !state.pixelPitch) return false;

  const pitchesForSelectedDistance = getProductPitchesForDistance(p, state.viewingDistance);
  if (pitchesForSelectedDistance.length === 0) return false;

  const targetPitchNorm = normalizePitch(state.pixelPitch);
  const hasMatchingPitch = pitchesForSelectedDistance.some(
    pitch => normalizePitch(pitch) === targetPitchNorm
  );
  if (!hasMatchingPitch) return false;

  return true;
}

/** Strict compatibility test with ALL criteria AND the screen type filter. */
export function isProductCompatible(state: ScreenCriteria, p: Product, screenType: ScreenType): boolean {
  if (!isProductCompatibleWithCriteria(state, p)) return false;
  return matchProductScreenType(p.screenType, screenType);
}

export interface ScreenTypeAvailability {
  flat: boolean;
  curved: boolean;
  is360: boolean;
}

/**
 * Availability of each screen type for the currently selected criteria.
 * A type is available only if AT LEAST ONE product is compatible with the
 * whole set of criteria already selected (mode, environment, distance, pitch)
 * AND with that screen type.
 */
export function getScreenTypeAvailability(state: ScreenCriteria, products: Product[]): ScreenTypeAvailability {
  return {
    flat: products.some(p => isProductCompatible(state, p, 'flat')),
    curved: products.some(p => isProductCompatible(state, p, 'curved')),
    is360: products.some(p => isProductCompatible(state, p, '360')),
  };
}
