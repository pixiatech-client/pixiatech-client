import fs from 'fs';
import path from 'path';
import { DEFAULT_CMS_SETTINGS, type CmsBackendSettings, type CmsDb, type CmsPageData } from './cms-types';

// ─────────────────────────────────────────────────────────────────────────────
// Firestore constants
// ─────────────────────────────────────────────────────────────────────────────

const FIRESTORE_COLLECTION = 'siteWebCms';  // collection dédiée au CMS pages
// IMPORTANT : Firestore interdit les IDs de documents encadrés par __ (ex: __db__).
// Erreur code 3 (INVALID_ARGUMENT) si le nom commence ET termine par "__".
const FIRESTORE_DB_DOC     = 'cms-db-settings'; // document settings/meta global

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
    console.warn('[pages-store] JSON write failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore helpers (async)
// ─────────────────────────────────────────────────────────────────────────────

let firestoreDisabledInDev = false;

// ─────────────────────────────────────────────────────────────────────────────
// In-memory TTL caches pour lectures instantanées (serveur chaud)
// ─────────────────────────────────────────────────────────────────────────────
let _cmsPagesCache: { data: Record<string, CmsPageData>; timestamp: number } | null = null;
let _cmsSettingsCache: { data: CmsBackendSettings; timestamp: number } | null = null;
const _cmsPageCacheMap = new Map<string, { data: CmsPageData; timestamp: number }>();
const CMS_CACHE_TTL_MS = 60_000; // 60 secondes

export function clearCmsCache(): void {
  _cmsPagesCache = null;
  _cmsSettingsCache = null;
  _cmsPageCacheMap.clear();
}

function handleFirestoreDevError(op: string, err: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    if (!firestoreDisabledInDev) {
      firestoreDisabledInDev = true;
      const anyErr = err as { code?: string | number; message?: string };
      console.warn(
        `[pages-store] Firestore indisponible en environnement local (${anyErr?.code || anyErr?.message || 'code: 3'}), repli automatique et transparent sur data/pixel-tech-web-pages.json.`
      );
    }
  } else {
    console.error(`[pages-store] Firestore ${op} error:`, err);
  }
}

async function getFirestoreDb() {
  if (process.env.NODE_ENV === 'development' && firestoreDisabledInDev) {
    return null;
  }
  try {
    const hasServiceAccount = Boolean(process.env.ADMIN_CLIENT_EMAIL && process.env.ADMIN_PRIVATE_KEY);
    const hasGoogleCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE);
    if (!hasServiceAccount && !hasGoogleCredentials) {
      return null;
    }
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
    const { adminDb } = getFirebaseAdmin();
    return adminDb;
  } catch (err) {
    handleFirestoreDevError('getFirestoreDb', err);
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
    handleFirestoreDevError(`getPage(${pageId})`, err);
    return null;
  }
}

/** Lit toutes les pages depuis Firestore (exclut le doc de settings). */
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
    handleFirestoreDevError('getAllPages', err);
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
    handleFirestoreDevError(`setPage(${pageId})`, err);
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
    handleFirestoreDevError(`deletePage(${pageId})`, err);
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
    handleFirestoreDevError('getSettings', err);
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
    handleFirestoreDevError('setSettings', err);
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
  const jsonDb = readJsonDb();
  const [firestorePages, firestoreSettings] = await Promise.all([
    firestoreGetAllPages(),
    firestoreGetSettings(),
  ]);

  return {
    pages: {
      ...(jsonDb.pages || {}),
      ...firestorePages,
    },
    settings: firestoreSettings || jsonDb.settings || undefined,
  };
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
  if (_cmsPagesCache && Date.now() - _cmsPagesCache.timestamp < CMS_CACHE_TTL_MS) {
    return _cmsPagesCache.data;
  }
  const jsonPages = readJsonDb().pages || {};
  const [firestorePages] = await Promise.all([firestoreGetAllPages()]);
  const result = {
    ...jsonPages,
    ...firestorePages,
  };
  _cmsPagesCache = { data: result, timestamp: Date.now() };
  return result;
}

export async function getCmsPage(pageId: string): Promise<CmsPageData | null> {
  const cached = _cmsPageCacheMap.get(pageId);
  if (cached && Date.now() - cached.timestamp < CMS_CACHE_TTL_MS) {
    return cached.data;
  }
  const jsonPage = readJsonDb().pages?.[pageId] || null;
  const firestorePage = await firestoreGetPage(pageId);
  if (firestorePage) {
    let result: CmsPageData;
    if (jsonPage) {
      result = {
        ...jsonPage,
        ...firestorePage,
        sections: {
          ...((jsonPage.sections as Record<string, unknown> | undefined) || {}),
          ...((firestorePage.sections as Record<string, unknown> | undefined) || {}),
        },
      };
    } else {
      result = firestorePage;
    }
    _cmsPageCacheMap.set(pageId, { data: result, timestamp: Date.now() });
    return result;
  }
  if (jsonPage) {
    _cmsPageCacheMap.set(pageId, { data: jsonPage, timestamp: Date.now() });
  }
  return jsonPage;
}

/**
 * Sauvegarde une page.
 * Écrit dans Firestore ET dans le JSON local pour une persistance résiliente.
 */
export async function saveCmsPage(pageId: string, page: CmsPageData): Promise<CmsDb> {
  const existing = await getCmsPage(pageId);
  const mergedSections = {
    ...((existing?.sections as Record<string, unknown> | undefined) || {}),
    ...((page.sections as Record<string, unknown> | undefined) || {}),
  };
  const rawMerged: CmsPageData = {
    ...(existing || {}),
    ...page,
    id: pageId,
    sections: mergedSections,
    updatedAt: new Date().toISOString(),
  };
  // Nettoie récursivement toute valeur undefined pour Firestore
  const merged: CmsPageData = JSON.parse(JSON.stringify(rawMerged));

  // 1. Écriture Firestore (si dispo)
  let firestoreOk = false;
  try {
    firestoreOk = await firestoreSetPage(pageId, merged);
  } catch (err) {
    console.warn(`[pages-store] Firestore setPage failed for "${pageId}":`, err);
  }

  // 2. Écriture JSON local (persistance locale / fallback / dev)
  let jsonOk = false;
  try {
    const jsonDb = readJsonDb();
    const nextDb: CmsDb = {
      ...jsonDb,
      pages: { ...(jsonDb.pages || {}), [pageId]: merged },
      updatedAt: new Date().toISOString(),
    };
    jsonOk = writeJsonDb(nextDb);
  } catch (err) {
    console.warn(`[pages-store] JSON write failed for "${pageId}":`, err);
  }

  if (!firestoreOk && !jsonOk) {
    console.error(`[pages-store] ÉCHEC Firestore ET JSON pour la page "${pageId}"`);
    throw new Error(`Échec de la sauvegarde pour la page "${pageId}".`);
  }

  // Invalidation immédiate du cache CMS pour servir la nouvelle version
  clearCmsCache();

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
  if (_cmsSettingsCache && Date.now() - _cmsSettingsCache.timestamp < CMS_CACHE_TTL_MS) {
    return _cmsSettingsCache.data;
  }
  const firestoreSettings = await firestoreGetSettings();
  let result: CmsBackendSettings;
  if (firestoreSettings) {
    result = { ...DEFAULT_CMS_SETTINGS, ...firestoreSettings };
  } else {
    // Fallback JSON
    const db = readJsonDb();
    const legacy = db.pages?.contact && (db.pages.contact.sections as Record<string, unknown> | undefined)?.settings as CmsBackendSettings | undefined;
    result = { ...DEFAULT_CMS_SETTINGS, ...(db.settings || {}), ...(legacy || {}) };
  }
  _cmsSettingsCache = { data: result, timestamp: Date.now() };
  return result;
}

export async function saveCmsSettings(partial: Partial<CmsBackendSettings>): Promise<CmsBackendSettings> {
  const current = await getCmsSettings();
  const merged: CmsBackendSettings = { ...current, ...partial };
  await firestoreSetSettings(merged);

  // Synchronisation de l'accentColor dans settings/global pour le RootLayout & cache invalidation
  if (merged.accentColor) {
    try {
      const db = await getFirestoreDb();
      if (db) {
        await db.collection('settings').doc('global').set(
          { accentColor: merged.accentColor },
          { merge: true }
        );
      }
      const { clearThemeCache } = await import('@/app/actions/public-actions');
      await clearThemeCache();
    } catch {
      /* best effort non bloquant */
    }
  }

  // Best-effort JSON local
  try {
    const db = readJsonDb();
    writeJsonDb({ ...db, settings: merged, updatedAt: new Date().toISOString() });
  } catch { /* ignoré */ }
  clearCmsCache();
  return merged;
}

export async function resetCmsPages(): Promise<CmsDb> {
  clearCmsCache();
  // Supprime toutes les pages dans Firestore
  const pages = await firestoreGetAllPages();
  await Promise.all(Object.keys(pages).map((id) => firestoreDeletePage(id)));
  // Efface aussi le JSON local
  writeJsonDb({ pages: {} });
  return { pages: {} };
}

export async function deleteCmsPage(pageId: string): Promise<CmsDb> {
  clearCmsCache();
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
