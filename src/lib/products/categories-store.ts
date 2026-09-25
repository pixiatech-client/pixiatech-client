// ============================================================================
// Store admin SDK des catégories produits (CMS)
// Utilisé par l'API /api/site-web/categories — jamais directement depuis le
// client navigateur (règles Firestore : write = admin via requireAdmin).
// ============================================================================

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import {
  PRODUCT_CATEGORIES_COLLECTION,
  PRODUCT_CATEGORY_GROUPS_COLLECTION,
  PRODUCTS_COLLECTION,
  type Product,
  type ProductCategory,
  type ProductCategoryGroup,
  productCategoryIds,
} from './types';

function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function orderOf(o: number | undefined): number {
  return typeof o === 'number' && Number.isFinite(o) ? o : 9999;
}

// ---------------------------------------------------------------------------
// Groupes de filtres
// ---------------------------------------------------------------------------

export async function listGroupsAdmin(): Promise<ProductCategoryGroup[]> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCT_CATEGORY_GROUPS_COLLECTION).get();
  const list = snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as object) }) as ProductCategoryGroup
  );
  return list.sort((a, b) => {
    const d = orderOf(a.order) - orderOf(b.order);
    return d !== 0 ? d : (a.label || '').localeCompare(b.label || '', 'fr');
  });
}

export async function getGroupById(id: string): Promise<ProductCategoryGroup | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCT_CATEGORY_GROUPS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id, ...(snap.data() as object) } as ProductCategoryGroup;
}

export interface GroupInput {
  key: string;
  label: string;
  active?: boolean;
  order?: number;
  labelFr?: string | null;
  labelEn?: string | null;
}

function localizedGroup(
  input: GroupInput
): Partial<Pick<ProductCategoryGroup, 'labelFr' | 'labelEn'>> {
  const out: Partial<Pick<ProductCategoryGroup, 'labelFr' | 'labelEn'>> = {};
  if (typeof input.labelFr === 'string' && input.labelFr.trim()) out.labelFr = input.labelFr.trim();
  if (typeof input.labelEn === 'string' && input.labelEn.trim()) out.labelEn = input.labelEn.trim();
  return out;
}

export async function createGroup(input: GroupInput): Promise<ProductCategoryGroup> {
  const { adminDb } = getFirebaseAdmin();
  const id = newId('grp_');
  const now = new Date().toISOString();
  const record: ProductCategoryGroup = {
    id,
    key: input.key,
    label: input.label,
    active: input.active ?? true,
    order: orderOf(input.order),
    createdAt: now,
    updatedAt: now,
    ...localizedGroup(input),
  };
  await adminDb.collection(PRODUCT_CATEGORY_GROUPS_COLLECTION).doc(id).set(record);
  return record;
}

export async function updateGroup(
  id: string,
  input: Partial<Omit<GroupInput, 'key'>>
): Promise<ProductCategoryGroup | null> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(PRODUCT_CATEGORY_GROUPS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const base = snap.data() as ProductCategoryGroup;
  const patch: Record<string, unknown> = { ...input };
  if (patch.labelFr == null || patch.labelFr === '') delete patch.labelFr;
  if (patch.labelEn == null || patch.labelEn === '') delete patch.labelEn;
  const next: ProductCategoryGroup = {
    ...base,
    ...(patch as Partial<ProductCategoryGroup>),
    id,
    active: typeof input.active === 'boolean' ? input.active : base.active ?? true,
    order: input.order !== undefined ? orderOf(input.order) : orderOf(base.order),
    updatedAt: new Date().toISOString(),
  };
  await ref.set(next);
  return next;
}

/** Nombre de catégories rattachées à un groupe (toutes, actives ou non). */
export async function countCategoriesInGroup(key: string): Promise<number> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).get();
  return snap.docs.reduce(
    (n, d) => n + ((d.data() as ProductCategory).type === key ? 1 : 0),
    0
  );
}

/**
 * Nombre de produits référençant AU MOINS une catégorie du groupe `key`.
 * Utilisé pour protéger la suppression d'un groupe.
 */
export async function countProductsUsingGroup(key: string): Promise<number> {
  const { adminDb } = getFirebaseAdmin();
  const [cats, products] = await Promise.all([
    adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).get(),
    adminDb.collection(PRODUCTS_COLLECTION).get(),
  ]);
  const ids = new Set(
    cats.docs.filter((d) => (d.data() as ProductCategory).type === key).map((d) => d.id)
  );
  if (ids.size === 0) return 0;
  let count = 0;
  for (const d of products.docs) {
    const p = d.data() as Product;
    if (productCategoryIds(p).some((id) => ids.has(id))) count++;
  }
  return count;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(PRODUCT_CATEGORY_GROUPS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function listGroupKeys(): Promise<string[]> {
  const groups = await listGroupsAdmin();
  return groups.map((g) => g.key);
}

/**
 * Valide qu'une clé de groupe existe. Les clés seedées "environment" et
 * "application" sont conservées pour rétrocompatibilité — un groupe ne peut
 * jamais être supprimé tant que des catégories le référencent.
 */
export async function assertValidGroupKey(key: unknown): Promise<string> {
  if (typeof key !== 'string' || !key.trim()) {
    throw new Error('La clé de groupe est requise.');
  }
  const clean = key.trim();
  const keys = await listGroupKeys();
  if (!keys.includes(clean)) {
    throw new Error(`Groupe de filtres inconnu (« ${clean} »). Créez d'abord le groupe.`);
  }
  return clean;
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

export async function listCategoriesAdmin(): Promise<ProductCategory[]> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).get();
  const list = snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as object) }) as ProductCategory
  );
  return list.sort((a, b) => {
    const d = orderOf(a.order) - orderOf(b.order);
    return d !== 0 ? d : (a.name || '').localeCompare(b.name || '', 'fr');
  });
}

export async function getCategoryById(id: string): Promise<ProductCategory | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id, ...(snap.data() as object) } as ProductCategory;
}

export interface CategoryInput {
  name: string;
  slug: string;
  type: string;
  active?: boolean;
  order?: number;
  nameFr?: string | null;
  nameEn?: string | null;
}

/** Ne conserve que les libellés localisés réellement renseignés. */
function localized(input: CategoryInput): Partial<Pick<ProductCategory, 'nameFr' | 'nameEn'>> {
  const out: Partial<Pick<ProductCategory, 'nameFr' | 'nameEn'>> = {};
  if (typeof input.nameFr === 'string' && input.nameFr.trim()) out.nameFr = input.nameFr.trim();
  if (typeof input.nameEn === 'string' && input.nameEn.trim()) out.nameEn = input.nameEn.trim();
  return out;
}

export async function createCategory(input: CategoryInput): Promise<ProductCategory> {
  const { adminDb } = getFirebaseAdmin();
  const type = await assertValidGroupKey(input.type);
  const id = newId('cat_');
  const now = new Date().toISOString();
  const record: ProductCategory = {
    id,
    name: input.name,
    slug: input.slug,
    type,
    active: input.active ?? true,
    order: orderOf(input.order),
    createdAt: now,
    updatedAt: now,
    ...localized(input),
  };
  await adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).doc(id).set(record);
  return record;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<ProductCategory | null> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const base = snap.data() as ProductCategory;
  const patch: Record<string, unknown> = { ...input };
  if (patch.nameFr == null || patch.nameFr === '') delete patch.nameFr;
  if (patch.nameEn == null || patch.nameEn === '') delete patch.nameEn;
  // Déplacer une catégorie vers un autre groupe = changer sa clé de groupe.
  if (patch.type != null) patch.type = await assertValidGroupKey(patch.type);
  const next: ProductCategory = {
    ...base,
    ...(patch as Partial<ProductCategory>),
    id,
    active: typeof input.active === 'boolean' ? input.active : base.active ?? true,
    order: input.order !== undefined ? orderOf(input.order) : orderOf(base.order),
    updatedAt: new Date().toISOString(),
  };
  await ref.set(next);
  return next;
}

/**
 * Nombre de produits référençant cette catégorie (tous groupes confondus).
 * Utilisé pour protéger la suppression et afficher le risque dans l'admin.
 */
export async function countProductsUsingCategory(catId: string): Promise<number> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCTS_COLLECTION).get();
  let count = 0;
  for (const d of snap.docs) {
    const p = d.data() as Product;
    if (productCategoryIds(p).includes(catId)) count++;
  }
  return count;
}

/**
 * Retire une catégorie de tous les produits qui la référencent.
 * Réécrit aussi bien le champ unifié `categoryIds` que les tableaux hérités.
 * Retourne le nombre de produits modifiés (non-destructif pour les produits).
 */
export async function removeCategoryFromProducts(catId: string): Promise<number> {
  const { adminDb } = getFirebaseAdmin();
  const [cats, products] = await Promise.all([
    adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).get(),
    adminDb.collection(PRODUCTS_COLLECTION).get(),
  ]);
  const typeById = new Map<string, string>();
  for (const d of cats.docs) typeById.set(d.id, (d.data() as ProductCategory).type);

  const batch = adminDb.batch();
  let removed = 0;
  for (const d of products.docs) {
    const p = d.data() as Product;
    const merged = productCategoryIds(p);
    if (!merged.includes(catId)) continue;
    const next = merged.filter((id) => id !== catId);
    const env = next.filter((id) => typeById.get(id) === 'environment');
    const app = next.filter((id) => typeById.get(id) !== 'environment');
    const patch: Record<string, unknown> = {
      categoryIds: next,
      environmentCategoryIds: env,
      applicationCategoryIds: app,
      updatedAt: new Date().toISOString(),
    };
    if (next.length === 0 && !p.categoryIds?.length) {
      // produit ne référençait que des catégories héritées → on garde des
      // tableaux vides explicites pour rester rétrocompatible
      patch.categoryIds = [];
    }
    batch.update(d.ref, patch);
    removed++;
  }
  if (removed > 0) await batch.commit();
  return removed;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(PRODUCT_CATEGORIES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}