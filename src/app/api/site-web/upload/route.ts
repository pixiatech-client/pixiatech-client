import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/site-web/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'cms');

// Upload d'image base64 — admin uniquement. Reprend le schéma de site/server.ts:268.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = (await request.json()) as { image?: string; filename?: string };
    if (!body.image) {
      return NextResponse.json({ success: false, message: 'Image manquante.' }, { status: 400 });
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const matches = body.image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1].split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const safeName =
        (body.filename ? body.filename.replace(/[^a-zA-Z0-9.-]/g, '_') : `upload_${Date.now()}`) + `.${ext}`;
      const filePath = path.join(UPLOAD_DIR, safeName);
      fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
      const publicUrl = `/uploads/cms/${safeName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: safeName,
        size: fs.statSync(filePath).size,
      });
    }

    return NextResponse.json({ success: true, url: body.image, filename: body.filename || 'url' });
  } catch (err: unknown) {
    console.error('[site-web upload] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement du fichier: ' + (err as Error).message },
      { status: 500 }
    );
  }
}
