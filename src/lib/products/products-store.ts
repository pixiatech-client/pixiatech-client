import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { MEGA_MENU_SETTING_ID, type MegaMenu, type Product } from './types';
import { assertDeletableProduct } from './system-template';

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

export async function saveProduct(slug: string, data: Partial<Product>, newSlug?: string): Promise<Product> {
  const { adminDb } = getFirebaseAdmin();
  const targetSlug = newSlug && newSlug !== slug ? newSlug : (data.slug && data.slug !== slug ? data.slug : slug);

  if (targetSlug !== slug) {
    assertDeletableProduct(slug); // Le template maître ne peut pas être renommé
    const oldRef = adminDb.collection(PRODUCTS_COLLECTION).doc(slug);
    const existingSnap = await oldRef.get();
    const base = existingSnap.exists ? (existingSnap.data() as object) : {};
    const payload = {
      ...base,
      ...data,
      slug: targetSlug,
      updatedAt: new Date().toISOString(),
    };
    const newRef = adminDb.collection(PRODUCTS_COLLECTION).doc(targetSlug);
    await newRef.set(payload);
    await oldRef.delete();

    // Migrer la page CMS associée si elle existe
    try {
      const { getCmsPage, saveCmsPage, deleteCmsPage } = await import('@/lib/site-web/pages-store');
      const oldPageId = `product__${slug}`;
      const newPageId = `product__${targetSlug}`;
      const pageData = await getCmsPage(oldPageId);
      if (pageData) {
        await saveCmsPage(newPageId, { ...pageData, id: newPageId, slug: `/web/product/${targetSlug}` });
        await deleteCmsPage(oldPageId);
      }
    } catch (pageErr) {
      console.warn('[saveProduct] Échec de migration de la page CMS:', pageErr);
    }

    return payload as unknown as Product;
  }

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
  // Dernière barrière, côté données : elle tient même si l'API est contournée,
  // et elle est placée AVANT l'ouverture du Firestore pour que le document ne
  // soit jamais lu ni touché. Une garde dans le seul handler DELETE protégerait
  // l'écran, pas la donnée.
  assertDeletableProduct(slug);
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