import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#141412"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-family="monospace" font-size="12">PIXIATECH</text></svg>`;

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  const { path: segments } = await props.params;
  const relPath = segments ? segments.join('/') : '';
  const localFile = path.join(process.cwd(), 'public', 'uploads', relPath);

  if (fs.existsSync(localFile)) {
    try {
      const stat = fs.statSync(localFile);
      if (stat.isFile()) {
        const buffer = fs.readFileSync(localFile);
        const ext = path.extname(localFile).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.gif': 'image/gif',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch {}
  }

  // Fichier introuvable sur le disque : retourner immédiatement un placeholder SVG neutre en 200
  // pour éviter toute boucle de redirection 307 ou surcharge du serveur en local.
  return new NextResponse(PLACEHOLDER_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
