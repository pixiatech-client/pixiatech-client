import {
  getProduct3DDefinition,
  type Product3DModelId,
} from './catalog';

/**
 * Identifiant canonique du module 3D choisi pour un produit.
 *
 * L'historique du projet utilisait `'3dModelId'` dans Firestore. Le champ
 * lisible `model3dId` est désormais la source canonique demandée par le CMS et
 * l'admin, mais les deux clés restent écrites ensemble pour ne casser aucun
 * document existant.
 */
export const PRODUCT_3D_MODEL_FIELD = 'model3dId';
export const LEGACY_PRODUCT_3D_MODEL_FIELD = '3dModelId';

type Product3DModelRecord = {
  model3dId?: string | null;
  '3dModelId'?: string | null;
};

/** Lit le modèle choisi, avec repli sur l'ancien champ puis sur le défaut. */
export function getProduct3DModelId(product?: Product3DModelRecord | null): Product3DModelId {
  const raw = product?.model3dId ?? product?.['3dModelId'];
  return getProduct3DDefinition(raw).id;
}

/** Patch à écrire dans le document produit : clé canonique + compatibilité. */
export function product3DModelPatch(modelId: Product3DModelId | string): {
  model3dId: Product3DModelId;
  '3dModelId': Product3DModelId;
} {
  const id = getProduct3DDefinition(modelId).id;
  return {
    model3dId: id,
    '3dModelId': id,
  };
}
