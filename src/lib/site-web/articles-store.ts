import fs from 'fs';
import path from 'path';
import type { InsightArticle } from '@/web/data/insights-articles-content';
import { INSIGHTS_ARTICLES } from '@/web/data/insights-articles-content';
import { INSIGHTS_ARTICLES_FR } from '@/web/data/insights-articles-content-fr';

const FIRESTORE_ARTICLES_COLLECTION = 'siteWebArticles';
const LOCAL_ARTICLES_FILE = path.join(process.cwd(), 'data', 'pixel-tech-web-articles.json');

// Mémoire cache pour SSR rapide
let inMemoryArticlesCache: Record<string, InsightArticle> | null = null;

function getSeedArticles(): Record<string, InsightArticle> {
  const map: Record<string, InsightArticle> = {};
  for (const a of INSIGHTS_ARTICLES) {
    const fr = INSIGHTS_ARTICLES_FR[a.slug];
    map[a.slug] = {
      ...a,
      titleFr: a.titleFr ?? a.title,
      descFr: a.descFr ?? a.desc,
      contentFr: a.contentFr ?? fr?.contentFr ?? a.content,
      faqsFr: a.faqsFr ?? fr?.faqsFr ?? a.faqs,
      dateFr: a.dateFr ?? a.date,
    };
  }
  return map;
}

function readJsonArticles(): Record<string, InsightArticle> {
  try {
    if (!fs.existsSync(LOCAL_ARTICLES_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(LOCAL_ARTICLES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeJsonArticles(articles: Record<string, InsightArticle>): boolean {
  try {
    fs.mkdirSync(path.dirname(LOCAL_ARTICLES_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('[articles-store] JSON write failed:', err);
    return false;
  }
}

async function getFirestoreDb() {
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
    console.error('[articles-store] Firestore Admin unavailable:', err);
    return null;
  }
}

/**
 * Lit tous les articles (seed initial + surcharges Firestore / JSON local).
 */
export async function getArticles(): Promise<InsightArticle[]> {
  const seed = getSeedArticles();
  const jsonLocal = readJsonArticles();

  let firestoreArticles: Record<string, InsightArticle> = {};
  const db = await getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection(FIRESTORE_ARTICLES_COLLECTION).get();
      snap.docs.forEach((doc) => {
        firestoreArticles[doc.id] = doc.data() as InsightArticle;
      });
    } catch (err) {
      console.warn('[articles-store] Firestore getArticles error:', err);
    }
  }

  // Fusion : seed < jsonLocal < firestore
  const merged: Record<string, InsightArticle> = {
    ...seed,
    ...jsonLocal,
    ...firestoreArticles,
  };

  inMemoryArticlesCache = merged;
  return Object.values(merged);
}

/**
 * Récupère un article spécifique par son slug.
 */
export async function getArticle(slug: string): Promise<InsightArticle | null> {
  // Vérification rapide dans le cache ou Firestore
  const db = await getFirestoreDb();
  if (db) {
    try {
      const doc = await db.collection(FIRESTORE_ARTICLES_COLLECTION).doc(slug).get();
      if (doc.exists) {
        return doc.data() as InsightArticle;
      }
    } catch (err) {
      console.warn(`[articles-store] Firestore getArticle error (${slug}):`, err);
    }
  }

  // Fallback JSON local
  const jsonLocal = readJsonArticles();
  if (jsonLocal[slug]) {
    return jsonLocal[slug];
  }

  // Fallback Seed
  const seed = getSeedArticles();
  return seed[slug] || null;
}

/**
 * Sauvegarde ou met à jour un article (dans Firestore et en local).
 */
export async function saveArticle(
  slug: string,
  articleData: Partial<InsightArticle>
): Promise<InsightArticle> {
  const existing = (await getArticle(slug)) || getSeedArticles()[slug] || {
    slug,
    title: 'Nouvel article',
    img: '/uploads/site/hero-1.jpg',
    category: 'GUIDE',
    chip: 'Guides',
    read: '5 MIN READ',
    date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
    content: '## Introduction\n\nContenu de l\'article...',
    faqs: [],
    toc: [],
  };

  const updated: InsightArticle = {
    ...existing,
    ...articleData,
    slug, // slug canonique
  };

  // Écriture Firestore (source de vérité)
  const db = await getFirestoreDb();
  if (db) {
    try {
      await db.collection(FIRESTORE_ARTICLES_COLLECTION).doc(slug).set(updated);
    } catch (err) {
      console.error(`[articles-store] Firestore saveArticle error (${slug}):`, err);
    }
  }

  // Écriture JSON local (best-effort en dev)
  try {
    const jsonLocal = readJsonArticles();
    jsonLocal[slug] = updated;
    writeJsonArticles(jsonLocal);
  } catch {
    // ignoré en prod Cloud Run
  }

  // Invalidation cache mémoire
  if (inMemoryArticlesCache) {
    inMemoryArticlesCache[slug] = updated;
  }

  return updated;
}

/**
 * Supprime un article personnalisé.
 */
export async function deleteArticle(slug: string): Promise<boolean> {
  const db = await getFirestoreDb();
  if (db) {
    try {
      await db.collection(FIRESTORE_ARTICLES_COLLECTION).doc(slug).delete();
    } catch (err) {
      console.error(`[articles-store] Firestore deleteArticle error (${slug}):`, err);
    }
  }

  try {
    const jsonLocal = readJsonArticles();
    delete jsonLocal[slug];
    writeJsonArticles(jsonLocal);
  } catch {
    // ignoré
  }

  if (inMemoryArticlesCache) {
    delete inMemoryArticlesCache[slug];
  }

  return true;
}

/**
 * Accès synchrone pour SSR / fallback immédiat (utilise le cache mémoire ou les seed data).
 */
export function getCachedArticleSync(slug: string): InsightArticle | null {
  if (inMemoryArticlesCache && inMemoryArticlesCache[slug]) {
    return inMemoryArticlesCache[slug];
  }
  const jsonLocal = readJsonArticles();
  if (jsonLocal[slug]) return jsonLocal[slug];
  const seed = getSeedArticles();
  return seed[slug] || null;
}
