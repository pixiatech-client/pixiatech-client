// ============================================================================
// Service Firestore des catégories produits (site web)
// Lectura publique (règles : read/list = true, write = admin).
// Utilisé côté public (abonnement temps réel) — l'admin passe par l'API REST.
// ============================================================================

import { firestore } from '@/firebase/config';
import { collection, getDocs, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import {
  PRODUCT_CATEGORIES_COLLECTION,
  PRODUCT_CATEGORY_GROUPS_COLLECTION,
  type ProductCategory,
  type ProductCategoryGroup,
} from './types';

function toCategory(id: string, data: ProductCategory): ProductCategory {
  return { id, ...data };
}

function toGroup(id: string, data: ProductCategoryGroup): ProductCategoryGroup {
  return { id, ...data };
}

/** Tri stable : `order` puis nom (les sections de filtres sont pilotées par
 *  les groupes, pas par un type codé en dur). */
export function sortCategories(list: ProductCategory[]): ProductCategory[] {
  return [...list].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return (a.name || '').localeCompare(b.name || '', 'fr');
  });
}

/** Tri stable : `order` puis label. */
export function sortGroups(list: ProductCategoryGroup[]): ProductCategoryGroup[] {
  return [...list].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return (a.label || '').localeCompare(b.label || '', 'fr');
  });
}

export async function listCategories(): Promise<ProductCategory[]> {
  const snap = await getDocs(collection(firestore, PRODUCT_CATEGORIES_COLLECTION));
  return sortCategories(snap.docs.map((d) => toCategory(d.id, d.data() as ProductCategory)));
}

/** Abonnement temps réel (page Products — filtres dynamiques). */
export function subscribeCategories(
  onData: (categories: ProductCategory[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, PRODUCT_CATEGORIES_COLLECTION),
    (snap) => {
      onData(sortCategories(snap.docs.map((d) => toCategory(d.id, d.data() as ProductCategory))));
    },
    (error) => onError?.(error)
  );
}

export async function listGroups(): Promise<ProductCategoryGroup[]> {
  const snap = await getDocs(collection(firestore, PRODUCT_CATEGORY_GROUPS_COLLECTION));
  return sortGroups(snap.docs.map((d) => toGroup(d.id, d.data() as ProductCategoryGroup)));
}

/** Abonnement temps réel (groupes de filtres — sections de la page Produits). */
export function subscribeGroups(
  onData: (groups: ProductCategoryGroup[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, PRODUCT_CATEGORY_GROUPS_COLLECTION),
    (snap) => {
      onData(sortGroups(snap.docs.map((d) => toGroup(d.id, d.data() as ProductCategoryGroup))));
    },
    (error) => onError?.(error)
  );
}