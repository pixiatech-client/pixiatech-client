import {
  PRODUCT_3D_MODELS,
  type Product3DModelId,
} from './catalog';

/** Identifiant Firestore unique des noms globaux des six modules. */
export const PRODUCT_3D_NAMES_SETTING_ID = 'product_3d_model_names';

export type Product3DModelNames = Readonly<Partial<Record<Product3DModelId, string>>>;
export type EditableProduct3DModelNames = Partial<Record<Product3DModelId, string>>;

/**
 * Ne conserve que les six identifiants techniques connus. Le client et
 * l'endpoint admin appliquent exactement la même normalisation afin qu'un nom
 * saisi dans le CMS puisse être lu partout sans divergence.
 */
export function normalizeProduct3DModelNames(
  raw: unknown
): EditableProduct3DModelNames {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  const next: EditableProduct3DModelNames = {};
  for (const model of PRODUCT_3D_MODELS) {
    const value = source[model.id];
    if (typeof value !== 'string' || !value.trim()) continue;
    next[model.id] = value.trim().slice(0, 80);
  }
  return next;
}
