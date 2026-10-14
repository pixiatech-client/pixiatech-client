import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/site-web/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

// Bibliothèque d'images réelle du site (admin uniquement, lecture seule).
//
// Le sélecteur du CMS visuel affichait auparavant une liste codée en dur
// (`STOCK_LIBRARY_IMAGES`) limitée aux images de démonstration. Cette route
// agrège les deux sources réelles utilisées par le projet :
//   1. Les fichiers statiques `public/uploads/**` servis en `/uploads/...`
//      (images de démonstration livrées avec le site + anciens uploads).
//   2. Les fichiers Firebase Storage téléversés depuis l'administration :
//      `site/cms/**` (CMS visuel), `site/hero/**` (sliders), `uploads/**`
//      (produits). Le listing nécessite l'Admin SDK (les règles de sécurité
//      client n'autorisent pas l'énumération).
//
// Aucune donnée n'est modifiée : cette route ne fait que lister. Elle ne
// touche ni aux routes existantes ni aux règles de sécurité Firebase.
export const dynamic = 'force-dynamic';

/** Extensions d'images prises en charge par le sélecteur. */
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp']);

/** Racine des fichiers statiques servis publiquement. */
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/** Préfixes Firebase Storage contenant des images du site. */
const STORAGE_PREFIXES = ['site/cms/', 'site/hero/', 'uploads/'];

interface MediaLibraryItem {
  url: string;
  name: string;
  source: 'static' | 'storage';
}

/** Type du bucket Firebase Storage dérivé de `getStorage()` (évite un import transitoire). */
type StorageBucket = ReturnType<ReturnType<typeof getStorage>['bucket']>;

/** Transforme un nom de fichier en libellé lisible. */
function toLabel(fileName: string): string {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || fileName;
}

/** Parcours récursif d'un dossier de fichiers statiques. */
function walkStaticDir(dir: string, baseDir: string, out: MediaLibraryItem[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkStaticDir(full, baseDir, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    // Chemin relatif avec des séparateurs URL.
    const rel = path.relative(baseDir, full).split(path.sep).join('/');
    out.push({
      url: `/uploads/${rel}`,
      name: toLabel(entry.name),
      source: 'static',
    });
  }
}

/** Liste les fichiers image d'un préfixe Firebase Storage. */
async function listStoragePrefix(
  bucket: StorageBucket,
  prefix: string,
  out: MediaLibraryItem[]
): Promise<void> {
  const [files] = await bucket.getFiles({ prefix });
  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      file.name
    )}?alt=media`;
    out.push({
      url: publicUrl,
      name: toLabel(file.name),
      source: 'storage',
    });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const items: MediaLibraryItem[] = [];

  // 1. Fichiers statiques `public/uploads/**`.
  walkStaticDir(PUBLIC_UPLOADS_DIR, PUBLIC_UPLOADS_DIR, items);

  // 2. Firebase Storage (best-effort : ne doit jamais faire échouer le listing
  //    statique si Admin Storage est indisponible).
  try {
    const { app } = getFirebaseAdmin();
    const bucket = getStorage(app).bucket();
    await Promise.all(STORAGE_PREFIXES.map((prefix) => listStoragePrefix(bucket, prefix, items)));
  } catch (err) {
    console.error('[site-web/media-library] Firebase Storage listing failed:', err);
  }

  // Déduplication par URL (une même image peut être référencée par plusieurs
  // préfixes / chemins normalisés identiques).
  const byUrl = new Map<string, MediaLibraryItem>();
  for (const item of items) {
    if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  }

  // Tri : statiques d'abord, puis par libellé.
  const sorted = Array.from(byUrl.values()).sort((a, b) => {
    if (a.source !== b.source) return a.source === 'static' ? -1 : 1;
    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
  });

  return NextResponse.json(
    { success: true, count: sorted.length, items: sorted },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
