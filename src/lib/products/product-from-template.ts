// ============================================================================
// CONSTRUCTION D'UN PRODUIT : TEMPLATE MAÎTRE + PDF
//
// Chaîne attendue par la mission (POINT 16 → 20) :
//
//   1. on part du TEMPLATE MAÎTRE (structure + valeurs par défaut) ;
//   2. le PDF n'écrase QUE les champs qu'il contient réellement ;
//   3. le produit créé conserve donc la page complète du template.
//
// C'est la correction du défaut historique : la surcouche PDF était appliquée à
// un objet vide, si bien qu'une section absente du PDF disparaissait de la page
// et que le produit pouvait se réduire à son nom.
// ============================================================================

import {
  MASTER_TEMPLATE_SLUG,
  createMasterTemplateSkeleton,
  mergeProductOntoTemplate,
} from './master-template';
import type { Product } from './types';

/**
 * Récupère le produit maître « template-maitre ».
 *
 * `resolveBase` est injecté pour deux raisons : le client Admin charge depuis
 * Firestore via le SDK client, le serveur via l'admin SDK. Aucun des deux n'est
 * requis pour tester la règle de fusion.
 *
 * Si le template maître est introuvable ou illisible, on retourne le squelette
 * STRUCTUREL : la page conserve toutes ses sections, mais elles restent vides.
 * On n'invente jamais une caractéristique technique (POINT 22).
 */
export async function loadMasterTemplate(
  resolveBase: (slug: string) => Promise<Product | null>
): Promise<Product> {
  try {
    const master = await resolveBase(MASTER_TEMPLATE_SLUG);
    if (master) return { ...createMasterTemplateSkeleton(), ...master };
  } catch {
    // Template maître illisible : on continue sur le squelette.
  }
  return createMasterTemplateSkeleton();
}

/**
 * Construit le produit final : base = template maître, surcouche = PDF.
 * La base n'est jamais modifiée.
 */
export async function buildProductFromMasterTemplate(
  overlay: Partial<Product>,
  resolveBase: (slug: string) => Promise<Product | null>
): Promise<Product> {
  const master = await loadMasterTemplate(resolveBase);
  return mergeProductOntoTemplate(master, overlay);
}
