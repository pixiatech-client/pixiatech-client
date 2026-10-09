import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

// Modifie les images des sliders du Hero du site public.
// Stockage permanent : Firebase Storage (site/hero/...), admin uniquement,
// avec vérification d'accessibilité réelle avant de publier l'URL.
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const FILE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: { image?: string; slider?: number };
  try {
    body = (await request.json()) as { image?: string; slider?: number };
  } catch {
    return NextResponse.json({ success: false, error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const slider = Number(body.slider);
  if (!Number.isInteger(slider) || slider < 1 || slider > 3) {
    return NextResponse.json(
      { success: false, error: 'Identifiant de slider invalide (attendu 1, 2 ou 3).' },
      { status: 400 }
    );
  }

  const matches =
    typeof body.image === 'string' ? body.image.match(/^data:([A-Za-z0-9-+/.]+);base64,(.+)$/) : null;
  if (!matches || matches.length !== 3) {
    return NextResponse.json(
      { success: false, error: 'Image en data URL base64 requise.' },
      { status: 400 }
    );
  }

  const contentType = matches[1].toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { success: false, error: "Format d'image non pris en charge (JPG, PNG ou WEBP uniquement)." },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.byteLength === 0) {
    return NextResponse.json({ success: false, error: 'Image vide.' }, { status: 400 });
  }
  if (buffer.byteLength > MAX_FILE_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Image trop volumineuse (maximum 5 Mo).' },
      { status: 413 }
    );
  }

  const ext = FILE_EXT[contentType];
  const rand = Math.random().toString(36).slice(2, 8);
  const destinationPath = `site/hero/hero-slide-${slider}-${Date.now()}-${rand}.${ext}`;

  try {
    const { app } = getFirebaseAdmin();
    const bucket = getStorage(app).bucket();
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
      metadata: { contentType },
      public: false,
    });
    await file.makePublic();

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media`;

    // L'URL n'est pas publiée tant que l'image n'est pas réellement accessible.
    const check = await fetch(publicUrl, {
      headers: { Range: 'bytes=0-0' },
      redirect: 'follow',
    });
    if (!check.ok) {
      return NextResponse.json(
        { success: false, error: `L'image a été téléversée mais n'est pas accessible (HTTP ${check.status}).` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: destinationPath,
      size: buffer.byteLength,
      contentType,
    });
  } catch (err: unknown) {
    console.error('[hero-image] Upload failed:', err);
    return NextResponse.json(
      { success: false, error: "Échec du téléversement : " + (err as Error).message },
      { status: 500 }
    );
  }
}