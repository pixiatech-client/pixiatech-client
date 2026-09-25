// ============================================================================
// Service Firestore des produits du site web (Phase A)
// Lecture publique + écriture admin. doc.id = slug.
// Client SDK (firebase/app config partagé src/firebase/config.ts).
// ============================================================================

import { firestore, storage } from '@/firebase/config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import {
  PRODUCTS_COLLECTION,
  MEGA_MENU_SETTING_ID,
  assertValidProductName,
  assertValidProductSlug,
  slugify,
  type MegaMenu,
  type Product,
  type ProductEnvironment,
  type ProductRecord,
  type ProductStatus,
} from './types';

export function nowISO(): string {
  return new Date().toISOString();
}

function toRecord(slug: string, data: Product): ProductRecord {
  return { id: slug, ...data };
}

export function listProducts(options?: {
  includeDeleted?: boolean;
  status?: ProductStatus | ProductStatus[];
}): Promise<ProductRecord[]> {
  return getDocs(collection(firestore, PRODUCTS_COLLECTION)).then((snap) => {
    const statuses = options?.status
      ? Array.isArray(options.status)
        ? options.status
        : [options.status]
      : undefined;
    const records = snap.docs
      .map((d) => toRecord(d.id, d.data() as Product))
      .filter((p) => options?.includeDeleted || p.status !== 'deleted')
      .filter((p) => !statuses || statuses.includes(p.status));
    // Tri en JS (comme l'admin boutique) : aucune demande d'index composite.
    records.sort((a, b) => {
      const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return (a.name || '').localeCompare(b.name || '', 'fr');
    });
    return records;
  });
}

export async function getProductBySlug(slug: string): Promise<ProductRecord | null> {
  const snap = await getDoc(doc(firestore, PRODUCTS_COLLECTION, slug));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Product);
}

export async function getProductById(id: string): Promise<ProductRecord | null> {
  return getProductBySlug(id);
}

/** Vérifie qu'un slug est libre (utile à la création / au renommage). */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await getProductBySlug(slug);
  if (!existing) return false;
  return existing.id !== excludeId;
}

export async function createProduct(
  input: Omit<Product, 'slug' | 'createdAt' | 'updatedAt'> & { slug?: string }
): Promise<ProductRecord> {
  const name = assertValidProductName(input.name ?? '');
  const slug = input.slug ? assertValidProductSlug(input.slug) : slugify(name);
  if (!slug) {
    throw new Error('Impossible de dériver un slug de ce nom.');
  }
  if (await isSlugTaken(slug)) {
    throw new Error(
      `Un produit existe déjà avec l'adresse « /web/product/${slug} ». Choisissez un autre nom.`
    );
  }
  const data: Product = {
    ...input,
    name,
    slug,
    status: input.status ?? 'draft',
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  await setDoc(doc(firestore, PRODUCTS_COLLECTION, slug), data);
  return toRecord(slug, data);
}

export async function updateProduct(
  slug: string,
  patch: Partial<Product>
): Promise<ProductRecord> {
  const existing = await getProductBySlug(slug);
  if (!existing) throw new Error(`Produit introuvable : ${slug}`);
  if (patch.name !== undefined) {
    patch.name = assertValidProductName(patch.name);
  }
  if (patch.slug !== undefined && patch.slug !== slug) {
    const newSlug = assertValidProductSlug(patch.slug);
    if (await isSlugTaken(newSlug, slug)) {
      throw new Error(
        `Un produit existe déjà avec l'adresse « /web/product/${newSlug} ». Choisissez un autre nom.`
      );
    }
    // Renommage : on copie le doc sous le nouveau slug, puis suppression de l'ancien.
    const next: Product = { ...existing, ...patch, slug: newSlug, updatedAt: nowISO() };
    await setDoc(doc(firestore, PRODUCTS_COLLECTION, newSlug), next);
    await deleteDoc(doc(firestore, PRODUCTS_COLLECTION, slug));
    return toRecord(newSlug, next);
  }
  const next: Product = {
    ...existing,
    ...patch,
    slug,
    updatedAt: nowISO(),
  };
  await setDoc(doc(firestore, PRODUCTS_COLLECTION, slug), next, { merge: true });
  return toRecord(slug, next);
}

/** Suppression douce : le produit disparaît du site mais reste en base. */
export async function softDeleteProduct(slug: string): Promise<void> {
  await updateDoc(doc(firestore, PRODUCTS_COLLECTION, slug), {
    status: 'deleted' as ProductStatus,
    updatedAt: nowISO(),
  });
}

export async function restoreProduct(slug: string, status: ProductStatus = 'published'): Promise<void> {
  await updateDoc(doc(firestore, PRODUCTS_COLLECTION, slug), {
    status,
    updatedAt: nowISO(),
  });
}

/** Suppression définitive (purge admin). */
export async function hardDeleteProduct(slug: string): Promise<void> {
  await deleteDoc(doc(firestore, PRODUCTS_COLLECTION, slug));
}

/** Abonnement temps réel (utilisé par products-context). */
export function subscribeProducts(
  onData: (records: ProductRecord[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, PRODUCTS_COLLECTION),
    (snap) => {
      const records = snap.docs
        .map((d) => toRecord(d.id, d.data() as Product))
        .filter((p) => p.status !== 'deleted');
      records.sort((a, b) => {
        const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (oa !== ob) return oa - ob;
        return (a.name || '').localeCompare(b.name || '', 'fr');
      });
      onData(records);
    },
    (error) => onError?.(error)
  );
}

// ---------------------------------------------------------------------------
// Méga-menu (doc "settings/mega_menu" — règles existantes : get public,
// écriture admin)
// ---------------------------------------------------------------------------

export async function getMegaMenu(): Promise<MegaMenu | null> {
  const snap = await getDoc(doc(firestore, 'settings', MEGA_MENU_SETTING_ID));
  if (!snap.exists()) return null;
  return snap.data() as MegaMenu;
}

export async function saveMegaMenu(menu: MegaMenu): Promise<MegaMenu> {
  const next: MegaMenu = { ...menu, updatedAt: nowISO() };
  await setDoc(doc(firestore, 'settings', MEGA_MENU_SETTING_ID), next);
  return next;
}

export function subscribeMegaMenu(
  onData: (menu: MegaMenu | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  return onSnapshot(
    doc(firestore, 'settings', MEGA_MENU_SETTING_ID),
    (snap) => onData(snap.exists() ? (snap.data() as MegaMenu) : null),
    (error) => onError?.(error)
  );
}

// ---------------------------------------------------------------------------
// Photos & vidéos (Storage — jamais extraites du PDF, upload admin)
// ---------------------------------------------------------------------------

const PRODUCT_MEDIA_ROOT = 'site_web_products';

function sanitizeFileName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `${Date.now()}-${base}`;
}

export async function uploadProductPhoto(
  slug: string,
  file: File
): Promise<{ name: string; url: string; path: string; size: number }> {
  const path = `${PRODUCT_MEDIA_ROOT}/${slug}/photos/${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, url, path, size: file.size };
}

export async function uploadProductVideo(
  slug: string,
  file: File
): Promise<{ name: string; url: string; path: string; size: number }> {
  const path = `${PRODUCT_MEDIA_ROOT}/${slug}/videos/${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, url, path, size: file.size };
}

export async function deleteProductMedia(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}

export async function replaceProductEnvironment(slug: string, env: ProductEnvironment): Promise<ProductRecord> {
  return updateProduct(slug, { environment: env });
}
