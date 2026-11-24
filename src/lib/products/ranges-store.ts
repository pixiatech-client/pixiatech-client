// ============================================================================
// Store admin SDK des gammes produits (CMS)
// Utilisé par l'API /api/site-web/ranges — persistance Firestore dans 'product_ranges'.
// ============================================================================

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import {
  PRODUCT_RANGES_COLLECTION,
  type ProductRange,
  slugify,
} from './types';

function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function orderOf(o: number | undefined): number {
  return typeof o === 'number' && Number.isFinite(o) ? o : 9999;
}

/** Gammes de base PixiaTech seedées automatiquement si la collection est vide */
export const DEFAULT_PIXIATECH_RANGES: Array<{ name: string; slug: string; order: number }> = [
  { name: 'PXT FLEX', slug: 'pxt-flex', order: 10 },
  { name: 'PXT ÉCLAIR', slug: 'pxt-eclair', order: 20 },
  { name: 'PXT WAVE', slug: 'pxt-wave', order: 30 },
  { name: 'PXT AIR', slug: 'pxt-air', order: 40 },
  { name: 'PXT FOLD', slug: 'pxt-fold', order: 50 },
  { name: 'PXT RENTAL', slug: 'pxt-rental', order: 60 },
  { name: 'PXT MICRO', slug: 'pxt-micro', order: 70 },
  { name: 'PXT GLASS', slug: 'pxt-glass', order: 80 },
  { name: 'PXT BEND', slug: 'pxt-bend', order: 90 },
  { name: 'PXT DUO', slug: 'pxt-duo', order: 100 },
  { name: 'PXT SHOW', slug: 'pxt-show', order: 110 },
  { name: 'PXT HOST', slug: 'pxt-host', order: 120 },
  { name: 'PXT SEG', slug: 'pxt-seg', order: 130 },
  { name: 'PXT GLOW', slug: 'pxt-glow', order: 140 },
  { name: 'PXT HOLO', slug: 'pxt-holo', order: 150 },
];

export async function listRangesAdmin(): Promise<ProductRange[]> {
  const { adminDb } = getFirebaseAdmin();
  const colRef = adminDb.collection(PRODUCT_RANGES_COLLECTION);
  const snap = await colRef.get();

  if (snap.empty) {
    // Auto-seed des gammes par défaut
    const now = new Date().toISOString();
    const batch = adminDb.batch();
    const seeded: ProductRange[] = [];
    for (const item of DEFAULT_PIXIATECH_RANGES) {
      const id = newId('rng_');
      const record: ProductRange = {
        id,
        name: item.name,
        nameFr: item.name,
        nameEn: item.name,
        slug: item.slug,
        active: true,
        order: item.order,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(colRef.doc(id), record);
      seeded.push(record);
    }
    await batch.commit().catch((err) => {
      console.warn('[ranges-store] Échec auto-seed gammes:', err);
    });
    return seeded.sort((a, b) => orderOf(a.order) - orderOf(b.order));
  }

  const list = snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as object) }) as ProductRange
  );

  return list.sort((a, b) => {
    const d = orderOf(a.order) - orderOf(b.order);
    return d !== 0 ? d : (a.name || '').localeCompare(b.name || '', 'fr');
  });
}

export async function getRangeById(id: string): Promise<ProductRange | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCT_RANGES_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id, ...(snap.data() as object) } as ProductRange;
}

export interface RangeInput {
  name: string;
  slug?: string;
  nameFr?: string | null;
  nameEn?: string | null;
  active?: boolean;
  order?: number;
}

export async function createRange(input: RangeInput): Promise<ProductRange> {
  const { adminDb } = getFirebaseAdmin();
  const id = newId('rng_');
  const now = new Date().toISOString();
  const rawSlug = input.slug?.trim() || slugify(input.name);
  const slug = slugify(rawSlug);

  const record: ProductRange = {
    id,
    name: input.name.trim(),
    nameFr: input.nameFr?.trim() || input.name.trim(),
    nameEn: input.nameEn?.trim() || input.name.trim(),
    slug,
    active: input.active ?? true,
    order: orderOf(input.order),
    createdAt: now,
    updatedAt: now,
  };

  await adminDb.collection(PRODUCT_RANGES_COLLECTION).doc(id).set(record);
  return record;
}

export async function updateRange(
  id: string,
  input: Partial<RangeInput>
): Promise<ProductRange | null> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(PRODUCT_RANGES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const current = snap.data() as ProductRange;
  const now = new Date().toISOString();
  const patch: Partial<ProductRange> = {
    updatedAt: now,
  };

  if (typeof input.name === 'string' && input.name.trim()) {
    patch.name = input.name.trim();
  }
  if (typeof input.slug === 'string' && input.slug.trim()) {
    patch.slug = slugify(input.slug.trim());
  }
  if (input.nameFr !== undefined) patch.nameFr = input.nameFr?.trim() || patch.name || current.name;
  if (input.nameEn !== undefined) patch.nameEn = input.nameEn?.trim() || patch.name || current.name;
  if (input.active !== undefined) patch.active = input.active;
  if (input.order !== undefined) patch.order = orderOf(input.order);

  await ref.update(patch);
  return { ...current, ...patch, id };
}

export async function deleteRange(id: string): Promise<boolean> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(PRODUCT_RANGES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
