import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import {
  listGroupsAdmin,
  createGroup,
} from '@/lib/products/categories-store';
import { isValidSlug, slugify } from '@/lib/products/types';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const groups = await listGroupsAdmin();
    return NextResponse.json({ success: true, groups });
  } catch (err: unknown) {
    console.error('GET /api/site-web/category-groups', err);
    return NextResponse.json(
      { success: false, message: 'Impossible de charger les groupes de filtres.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Corps de requête invalide.' }, { status: 400 });
    }
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    if (!label) {
      return NextResponse.json({ success: false, message: 'Le libellé du groupe est requis.' }, { status: 400 });
    }
    const key =
      typeof body.key === 'string' && body.key.trim() ? body.key.trim() : slugify(label);
    if (!isValidSlug(key)) {
      return NextResponse.json(
        { success: false, message: 'Clé de groupe invalide (lettres minuscules, chiffres, tirets).' },
        { status: 400 }
      );
    }
    const labelFr = typeof body.labelFr === 'string' ? body.labelFr.trim() : null;
    const labelEn = typeof body.labelEn === 'string' ? body.labelEn.trim() : null;
    const active = typeof body.active === 'boolean' ? body.active : true;
    const order = typeof body.order === 'number' ? body.order : 9999;

    const existing = await listGroupsAdmin();
    if (existing.some((g) => g.key === key)) {
      return NextResponse.json(
        { success: false, message: `Un groupe de filtres avec la clé « ${key} » existe déjà.` },
        { status: 409 }
      );
    }

    const group = await createGroup({ key, label, labelFr, labelEn, active, order });
    return NextResponse.json({ success: true, message: `Groupe « ${label} » créé.`, group });
  } catch (err: unknown) {
    console.error('POST /api/site-web/category-groups', err);
    return NextResponse.json(
      { success: false, message: 'Échec de la création du groupe de filtres.' },
      { status: 500 }
    );
  }
}