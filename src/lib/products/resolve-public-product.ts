// ============================================================================
// Résolution d'un produit public — partagée par les routes serveur /web.
//
// Précedence unique pour TOUTES les pages produit :
//   1. Firestore, uniquement si le produit est « published » (un brouillon
//      n'est jamais public) ;
//   2. sinon le seed de référence du même slug ;
//   3. sinon null → l'appelant décide (notFound ou coquille vide).
//
// Pourquoi un module partagé : `/web/product/[slug]` et la page CMS
// `/web/pxt-fine` doivent voir exactement le même produit. Si une page
// résolvait autrement, l'une pourrait afficher le seed et l'autre rien —
// c'est-à-dire afficher une fiche sans donnée plutôt qu'une page honnête.
// ============================================================================

import { getProductBySlug } from './products-store';
import { getSeedProductBySlug } from './seed';
import type { Product } from './types';

/** Un produit Firestore n'est public que s'il est « published ». */
export function isPubliclyVisible(product: Product | null): product is Product {
  return !!product && product.status === 'published';
}

/**
 * Normalise les Timestamps Firestore (firestore-admin) en chaînes ISO pour
 * une sérialisation RSC sans erreur. Les `undefined` sont supprimés.
 */
export function toSerializableProduct(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(toSerializableProduct).filter((v) => v !== undefined);
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const cleaned = toSerializableProduct(val);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return out;
}

/** Firestore publié → seed du même slug → null. */
export async function resolvePublicProduct(slug: string): Promise<Product | null> {
  // Firestore est une dépendance optionnelle, pas une condition d'affichage.
  // Si l'admin SDK est mal configuré ou le réseau indisponible, on ne doit pas
  // sortir une 500 : le seed du même slug est une réponse/publication valable.
  // Une panne de Firestore ne doit donc jamais rendre le site public illisible.
  let firestoreProduct: Product | null = null;
  try {
    firestoreProduct = await getProductBySlug(slug);
  } catch (error) {
    console.error(
      `[products] Lecture Firestore impossible pour « ${slug} », repli sur le seed.`,
      error
    );
  }
  if (isPubliclyVisible(firestoreProduct)) {
    return toSerializableProduct(firestoreProduct) as Product;
  }
  return getSeedProductBySlug(slug);
}

/**
 * Résolution pour la prévisualisation administrateur.
 *
 * Identique à `resolvePublicProduct` MAIS sans le filtre « published » : un
 * brouillon est renvoyé tel quel. Cette fonction NE DOIT être appelée qu'après
 * avoir vérifié une vraie session administrateur — c'est le seul endroit où la
 * porte peut être contrôlée, une page étant décidée côté serveur.
 *
 * Elle ne modifie jamais le produit : le statut reste `draft`, la prévisualisation
 * est strictement une lecture.
 */
export async function resolveProductForPreview(slug: string): Promise<Product | null> {
  try {
    const firestoreProduct = await getProductBySlug(slug);
    if (firestoreProduct) {
      return toSerializableProduct(firestoreProduct) as Product;
    }
  } catch (error) {
    console.error(
      `[products] Lecture Firestore impossible pour « ${slug} » (prévisualisation), repli sur le seed.`,
      error
    );
  }
  return getSeedProductBySlug(slug);
}
