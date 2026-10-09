import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/**
 * Upload d'image CMS vers Firebase Storage (admin uniquement).
 *
 * Remplace l'ancien mécanisme fs.writeFileSync qui écrivait dans
 * public/uploads/cms/ — une zone éphémère en Cloud Run (App Hosting).
 * Les fichiers écrits sur disque après le build ne sont pas servis.
 *
 * Ce endpoint accepte une data URL base64 et retourne une URL Firebase
 * Storage publique permanente, accessible depuis le navigateur.
 *
 * Contrat API (inchangé) :
 *   POST /api/site-web/upload
 *   Body : { image: string (data URL base64), filename?: string }
 *   Réponse : { success: true, url: string, filename: string, size: number }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: { image?: string; filename?: string };
  try {
    body = (await request.json()) as { image?: string; filename?: string };
  } catch {
    return NextResponse.json({ success: false, message: 'Corps de requête invalide.' }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ success: false, message: 'Image manquante.' }, { status: 400 });
  }

  // Accepte une URL directe (depuis la bibliothèque ou un lien)
  if (!body.image.startsWith('data:')) {
    return NextResponse.json({ success: true, url: body.image, filename: body.filename || 'url' });
  }

  // Parse la data URL base64
  const matches = body.image.match(/^data:([A-Za-z0-9-+/.]+);base64,(.+)$/s);
  if (!matches || matches.length !== 3) {
    return NextResponse.json(
      { success: false, message: 'Format de data URL invalide.' },
      { status: 400 }
    );
  }

  const contentType = matches[1].toLowerCase();
  const ext = ALLOWED_MIME[contentType];
  if (!ext) {
    return NextResponse.json(
      { success: false, message: `Format non pris en charge : ${contentType}` },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.byteLength === 0) {
    return NextResponse.json({ success: false, message: 'Image vide.' }, { status: 400 });
  }
  if (buffer.byteLength > MAX_FILE_BYTES) {
    return NextResponse.json(
      { success: false, message: `Image trop volumineuse (max ${MAX_FILE_BYTES / 1024 / 1024} Mo).` },
      { status: 413 }
    );
  }

  // Construit le nom de fichier dans Firebase Storage
  // Préserve le nom original (sans extension dupliquée) et ajoute un suffixe unique
  const rawName = body.filename
    ? body.filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '') // retire l'extension existante
    : `upload_${Date.now()}`;
  const rand = Math.random().toString(36).slice(2, 7);
  const storagePath = `site/cms/${rawName}_${rand}.${ext}`;

  try {
    const { app } = getFirebaseAdmin();
    const bucket = getStorage(app).bucket();
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: { contentType },
      public: false,
    });

    await file.makePublic();

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: storagePath,
      size: buffer.byteLength,
      contentType,
    });
  } catch (err: unknown) {
    const msg = (err as Error).message || String(err);
    console.error('[site-web/upload] Firebase Storage error:', msg);
    return NextResponse.json(
      { success: false, error: `Échec du téléversement Firebase Storage : ${msg}` },
      { status: 500 }
    );
  }
}
