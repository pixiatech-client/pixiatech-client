import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

export const dynamic = 'force-dynamic';

// 512 Mo maximum — vidéos de showreel peuvent être volumineuses
const MAX_FILE_BYTES = 512 * 1024 * 1024;

const ALLOWED_VIDEO_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
};

/**
 * Upload de vidéo Showreel vers Firebase Storage (admin uniquement).
 *
 * Accepte un multipart/form-data avec le champ `file` (vidéo MP4 ou WebM).
 * Stocke le fichier dans `site/showreel/videos/<slug>_<rand>.<ext>` et
 * retourne une URL publique Firebase Storage permanente.
 *
 * Contrat API :
 *   POST /api/site-web/upload-video
 *   Content-Type: multipart/form-data
 *   Body field: file (File object — video/mp4 ou video/webm)
 *   Réponse : { success: true, url: string, filename: string, size: number, contentType: string }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Impossible de lire le formulaire multipart.' },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { success: false, message: 'Champ "file" manquant dans le formulaire.' },
      { status: 400 }
    );
  }

  const contentType = (file.type || 'video/mp4').toLowerCase();
  const ext = ALLOWED_VIDEO_MIME[contentType];
  if (!ext) {
    return NextResponse.json(
      {
        success: false,
        message: `Format vidéo non pris en charge : "${contentType}". Formats acceptés : MP4, WebM.`,
      },
      { status: 415 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        message: `Vidéo trop volumineuse (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : ${MAX_FILE_BYTES / 1024 / 1024} Mo.`,
      },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Nom sécurisé + suffixe unique pour éviter les collisions
  const originalName = (file instanceof File ? file.name : 'showreel-video')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.[^.]+$/, '');
  const rand = Math.random().toString(36).slice(2, 8);
  const storagePath = `site/showreel/videos/${originalName}_${rand}.${ext}`;

  try {
    const { app } = getFirebaseAdmin();
    const bucket = getStorage(app).bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
      public: false,
    });

    await fileRef.makePublic();

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
    console.error('[site-web/upload-video] Firebase Storage error:', msg);
    return NextResponse.json(
      { success: false, error: `Échec du téléversement : ${msg}` },
      { status: 500 }
    );
  }
}
