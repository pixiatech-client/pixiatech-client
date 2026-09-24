import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { resetCmsPages } from '@/lib/site-web/pages-store';

// Reset du CMS (retour aux valeurs par défaut) — admin uniquement.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const db = resetCmsPages();
    return NextResponse.json({
      success: true,
      message: 'Base de données CMS réinitialisée aux valeurs par défaut.',
      pages: db.pages,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}