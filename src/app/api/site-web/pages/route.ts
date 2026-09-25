import { NextResponse } from 'next/server';
import { getCmsPages, getCmsSettings } from '@/lib/site-web/pages-store';

// Lecture publique : le site public a besoin des contenus CMS sans être connecté.
export async function GET() {
  try {
    const pages = getCmsPages();
    const settings = getCmsSettings();
    return NextResponse.json({
      success: true,
      pages,
      settings,
      count: Object.keys(pages).length,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
