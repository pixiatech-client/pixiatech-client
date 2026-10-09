import fs from 'fs';
import path from 'path';
import { DEFAULT_CMS_SETTINGS, type CmsBackendSettings, type CmsDb, type CmsPageData } from './cms-types';

// ─────────────────────────────────────────────────────────────────────────────
// Firestore constants
// ─────────────────────────────────────────────────────────────────────────────

const FIRESTORE_COLLECTION = 'siteWebCms';  // collection dédiée au CMS pages
const FIRESTORE_DB_DOC     = '__db__';      // document « base complète » (settings, etc.)

// ─────────────────────────────────────────────────────────────────────────────
// JSON local (fallback read-only en production, lecture/écriture en dev)
// ─────────────────────────────────────────────────────────────────────────────

const DATA_FILE = path.join(process.cwd(), 'data', 'pixel-tech-web-pages.json');

function readJsonDb(): CmsDb {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CmsDb>;
    if (!parsed || typeof parsed !== 'object') return { pages: {} };
    return {
      pages: parsed.pages && typeof parsed.pages === 'object' ? parsed.pages : {},
      settings: parsed.settings || undefined,
    } as CmsDb;
  } catch {
    return { pages: {} };
  }
}

function writeJsonDb(db: CmsDb): boolean {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('[pages-store] JSON write failed (attendu en production Cloud Run):', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore helpers (async)
// ─────────────────────────────────────────────────────────────────────────────

async function getFirestoreDb() {
  try {
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
    const { adminDb } = getFirebaseAdmin();
    return adminDb;
  } catch (err) {
    console.error('[pages-store] Firestore Admin indisponible:', err);
    return null;
  }
}

/** Lit une page depuis Firestore. Retourne null si absente ou en cas d'erreur. */
async function firestoreGetPage(pageId: string): Promise<CmsPageData | null> {
  try {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await db.collection(FIRESTORE_COLLECTION).doc(pageId).get();
    if (snap.exists) {
      return snap.data() as CmsPageData;
    }
    return null;
  } catch (err) {
    console.error(`[pages-store] Firestore read error (page=${pageId}):`, err);
    return null;
  }
}

/** Lit toutes les pages depuis Firestore (exclut le doc __db__). */
async function firestoreGetAllPages(): Promise<Record<string, CmsPageData>> {
  try {
    const db = await getFirestoreDb();
    if (!db) return {};
    const snap = await db.collection(FIRESTORE_COLLECTION).get();
    const pages: Record<string, CmsPageData> = {};
    snap.docs.forEach((doc) => {
      if (doc.id !== FIRESTORE_DB_DOC) {
        pages[doc.id] = doc.data() as CmsPageData;
      }
    });
    return pages;
  } catch (err) {
    console.error('[pages-store] Firestore getAllPages error:', err);
    return {};
  }
}

/** Écrit une page dans Firestore. */
async function firestoreSetPage(pageId: string, page: CmsPageData): Promise<boolean> {
  try {
    const db = await getFirestoreDb();
    if (!db) return false;
    await db.collection(FIRESTORE_COLLECTION).doc(pageId).set(page);
    return true;
  } catch (err) {
    console.error(`[pages-store] Firestore write error (page=${pageId}):`, err);
    return false;
  }
}

/** Supprime une page dans Firestore. */
async function firestoreDeletePage(pageId: string): Promise<boolean> {
  try {
    const db = await getFirestoreDb();
    if (!db) return false;
    await db.collection(FIRESTORE_COLLECTION).doc(pageId).delete();
    return true;
  } catch (err) {
    console.error(`[pages-store] Firestore delete error (page=${pageId}):`, err);
    return false;
  }
}

/** Lit les settings depuis Firestore. */
async function firestoreGetSettings(): Promise<CmsBackendSettings | null> {
  try {
    const db = await getFirestoreDb();
    if (!db) return null;
    const snap = await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DB_DOC).get();
    if (snap.exists) {
      const data = snap.data() as { settings?: CmsBackendSettings };
      return data.settings || null;
    }
    return null;
  } catch (err) {
    console.error('[pages-store] Firestore getSettings error:', err);
    return null;
  }
}

/** Écrit les settings dans Firestore. */
async function firestoreSetSettings(settings: CmsBackendSettings): Promise<boolean> {
  try {
    const db = await getFirestoreDb();
    if (!db) return false;
    await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DB_DOC).set(
      { settings, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('[pages-store] Firestore setSettings error:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API publique (compatible avec l'existant — seules les fonctions async
// ont leur signature changée en Promise<>)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lit la base complète.
 * Firestore est la source de vérité ; le JSON local est un fallback.
 */
export async function readCmsDbAsync(): Promise<CmsDb> {
  const [firestorePages, firestoreSettings] = await Promise.all([
    firestoreGetAllPages(),
    firestoreGetSettings(),
  ]);

  if (Object.keys(firestorePages).length > 0 || firestoreSettings !== null) {
    return {
      pages: firestorePages,
      settings: firestoreSettings || undefined,
    };
  }

  // Firestore vide → on relit le JSON local (migration initiale)
  return readJsonDb();
}

/**
 * Lecture synchrone (compatibilité back-compat pour le code non-migré).
 * En production Cloud Run, cette fonction lira un JSON vide.
 * Elle ne doit plus être utilisée pour les routes critiques.
 * @deprecated Préférer readCmsDbAsync()
 */
export function readCmsDb(): CmsDb {
  return readJsonDb();
}

export function writeCmsDb(db: CmsDb): boolean {
  return writeJsonDb(db);
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function getCmsPages(): Promise<Record<string, CmsPageData>> {
  const [firestorePages] = await Promise.all([firestoreGetAllPages()]);
  if (Object.keys(firestorePages).length > 0) return firestorePages;
  return readJsonDb().pages || {};
}

export async function getCmsPage(pageId: string): Promise<CmsPageData | null> {
  // Priorité Firestore
  const firestorePage = await firestoreGetPage(pageId);
  if (firestorePage) return firestorePage;

  // Fallback JSON local (migration initiale / dev local sans Firestore)
  const jsonPage = readJsonDb().pages?.[pageId] || null;
  if (jsonPage) {
    // Opportuniste : on migre la page dans Firestore si on en a une localement
    console.log(`[pages-store] Migration JSON→Firestore de la page "${pageId}"`);
    void firestoreSetPage(pageId, jsonPage);
  }
  return jsonPage;
}

/**
 * Sauvegarde une page.
 * Écrit TOUJOURS dans Firestore (persistance garantie).
 * Tente aussi le JSON local en best-effort (utile en dev local).
 */
export async function saveCmsPage(pageId: string, page: CmsPageData): Promise<CmsDb> {
  const existing = await getCmsPage(pageId);
  const rawMerged: CmsPageData = {
    ...(existing || {}),
    ...page,
    id: pageId,
    updatedAt: new Date().toISOString(),
  };
  // Nettoie récursivement toute valeur undefined pour Firestore
  const merged: CmsPageData = JSON.parse(JSON.stringify(rawMerged));

  // Écriture Firestore (source de vérité)
  const ok = await firestoreSetPage(pageId, merged);
  if (!ok) {
    console.error(`[pages-store] ÉCHEC Firestore pour la page "${pageId}"`);
    throw new Error(`Échec de l'écriture Firestore pour la page "${pageId}".`);
  }

  // Écriture JSON local (best-effort, échoue silencieusement en Cloud Run)
  try {
    const jsonDb = readJsonDb();
    const nextDb: CmsDb = {
      ...jsonDb,
      pages: { ...(jsonDb.pages || {}), [pageId]: merged },
      updatedAt: new Date().toISOString(),
    };
    writeJsonDb(nextDb);
  } catch {
    // ignoré en production
  }

  return {
    pages: { [pageId]: merged },
    updatedAt: new Date().toISOString(),
  };
}

/** @deprecated — Utiliser saveCmsPage (async) */
export class CmsWriteConflictError extends Error {
  constructor(pageId: string) {
    super(
      `La page « ${pageId} » a été modifiée pendant l'opération. Aucune modification enregistrée.`
    );
    this.name = 'CmsWriteConflictError';
  }
}

/**
 * Écriture conditionnelle d'une page (protection contre les conflits de traduction).
 * Utilise Firestore comme source de vérité.
 */
export async function saveCmsPageIfUnchanged(
  pageId: string,
  page: CmsPageData,
  expectedUpdatedAt: string
): Promise<CmsDb> {
  const existing = await getCmsPage(pageId);
  if (!existing) throw new CmsWriteConflictError(pageId);
  if (existing.updatedAt !== expectedUpdatedAt) throw new CmsWriteConflictError(pageId);
  return saveCmsPage(pageId, page);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getCmsSettings(): Promise<CmsBackendSettings> {
  const firestoreSettings = await firestoreGetSettings();
  if (firestoreSettings) {
    return { ...DEFAULT_CMS_SETTINGS, ...firestoreSettings };
  }
  // Fallback JSON
  const db = readJsonDb();
  const legacy = db.pages?.contact && (db.pages.contact.sections as Record<string, unknown> | undefined)?.settings as CmsBackendSettings | undefined;
  return { ...DEFAULT_CMS_SETTINGS, ...(db.settings || {}), ...(legacy || {}) };
}

export async function saveCmsSettings(partial: Partial<CmsBackendSettings>): Promise<CmsBackendSettings> {
  const current = await getCmsSettings();
  const merged: CmsBackendSettings = { ...current, ...partial };
  await firestoreSetSettings(merged);
  // Best-effort JSON local
  try {
    const db = readJsonDb();
    writeJsonDb({ ...db, settings: merged, updatedAt: new Date().toISOString() });
  } catch { /* ignoré */ }
  return merged;
}

export async function resetCmsPages(): Promise<CmsDb> {
  // Supprime toutes les pages dans Firestore
  const pages = await firestoreGetAllPages();
  await Promise.all(Object.keys(pages).map((id) => firestoreDeletePage(id)));
  // Efface aussi le JSON local
  writeJsonDb({ pages: {} });
  return { pages: {} };
}

export async function deleteCmsPage(pageId: string): Promise<CmsDb> {
  await firestoreDeletePage(pageId);
  try {
    const db = readJsonDb();
    if (db.pages) {
      const next: CmsDb = {
        ...db,
        pages: Object.fromEntries(Object.entries(db.pages).filter(([id]) => id !== pageId)),
        updatedAt: new Date().toISOString(),
      };
      writeJsonDb(next);
      return next;
    }
  } catch { /* ignoré */ }
  return { pages: {} };
}
