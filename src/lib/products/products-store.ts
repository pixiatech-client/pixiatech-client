import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { MEGA_MENU_SETTING_ID, type MegaMenu, type Product } from './types';

const PRODUCTS_COLLECTION = 'site_web_products';
const SETTINGS_COLLECTION = 'settings';

export async function listProducts(): Promise<Product[]> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(PRODUCTS_COLLECTION).get();
  const products = snap.docs.map((doc) => ({ ...(doc.data() as object) }) as Product);
  return products.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { adminDb } = getFirebaseAdmin();
  const docSnap = await adminDb.collection(PRODUCTS_COLLECTION).doc(slug).get();
  if (!docSnap.exists) return null;
  return docSnap.data() as Product;
}

export async function saveProduct(slug: string, data: Partial<Product>): Promise<Product> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(PRODUCTS_COLLECTION).doc(slug);
  const existingSnap = await ref.get();
  const base = existingSnap.exists ? (existingSnap.data() as object) : {};
  const payload = {
    ...base,
    ...data,
    slug,
    updatedAt: new Date().toISOString(),
  };
  await ref.set(payload);
  return payload as unknown as Product;
}

export async function deleteProduct(slug: string): Promise<boolean> {
  const { adminDb } = getFirebaseAdmin();
  const docRef = adminDb.collection(PRODUCTS_COLLECTION).doc(slug);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return false;
  await docRef.delete();
  return true;
}

// ---------------------------------------------------------------------------
// Méga-menu (admin SDK — utilisé par l'API /api/site-web/mega-menu)
// ---------------------------------------------------------------------------

export async function getStoredMegaMenu(): Promise<MegaMenu | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(SETTINGS_COLLECTION).doc(MEGA_MENU_SETTING_ID).get();
  if (!snap.exists) return null;
  return snap.data() as MegaMenu;
}

export async function saveStoredMegaMenu(menu: MegaMenu): Promise<MegaMenu> {
  const { adminDb } = getFirebaseAdmin();
  const next: MegaMenu = { ...menu, updatedAt: new Date().toISOString() };
  await adminDb.collection(SETTINGS_COLLECTION).doc(MEGA_MENU_SETTING_ID).set(next);
  return next;
}

export async function deleteStoredMegaMenu(): Promise<void> {
  const { adminDb } = getFirebaseAdmin();
  await adminDb.collection(SETTINGS_COLLECTION).doc(MEGA_MENU_SETTING_ID).delete();
}