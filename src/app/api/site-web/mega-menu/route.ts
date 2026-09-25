import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import {
  getStoredMegaMenu,
  saveStoredMegaMenu,
  deleteStoredMegaMenu,
} from '@/lib/products/products-store';
import { sanitizeMegaMenu } from '@/lib/products/mega-menu';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const menu = await getStoredMegaMenu();
    return NextResponse.json({ success: true, menu });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Corps de requête JSON invalide.' },
      { status: 400 }
    );
  }
  try {
    const menu = sanitizeMegaMenu(body);
    const saved = await saveStoredMegaMenu(menu);
    return NextResponse.json({
      success: true,
      message: 'Méga-menu enregistré : le site public référence désormais ces produits.',
      menu: saved,
    });
  } catch (err: unknown) {
    const message = (err as Error).message;
    return NextResponse.json({ success: false, message, error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    await deleteStoredMegaMenu();
    return NextResponse.json({
      success: true,
      message:
        'Méga-menu supprimé : le site public revient au méga-menu de référence (MEGA_COLUMNS).',
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}