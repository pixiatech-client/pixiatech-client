import { NextResponse } from 'next/server';
import { getCmsPages, getCmsSettings } from '@/lib/site-web/pages-store';

// Désactive le cache Next.js : le fichier JSON source peut changer à tout moment.
export const dynamic = 'force-dynamic';

// Lecture publique : le site public a besoin des contenus CMS sans être connecté.
export async function GET() {
  try {
    const pages = getCmsPages();
    const settings = getCmsSettings();
    return NextResponse.json(
      {
        success: true,
        pages,
        settings,
        count: Object.keys(pages).length,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
