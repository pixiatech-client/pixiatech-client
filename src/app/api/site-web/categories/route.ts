import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import {
  listCategoriesAdmin,
  createCategory,
  assertValidGroupKey,
} from '@/lib/products/categories-store';
import { isValidSlug } from '@/lib/products/types';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const categories = await listCategoriesAdmin();
    return NextResponse.json({ success: true, categories });
  } catch (err: unknown) {
    console.error('GET /api/site-web/categories', err);
    return NextResponse.json(
      { success: false, message: 'Impossible de charger les catégories. La base est momentanément indisponible — réessayez dans un instant.' },
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
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, message: 'Le libellé est requis.' }, { status: 400 });
    }
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { success: false, message: 'Slug invalide (uniquement lettres, chiffres, tirets).' },
        { status: 400 }
      );
    }
    const type = await assertValidGroupKey(body.type);
    const active = typeof body.active === 'boolean' ? body.active : true;
    const order = typeof body.order === 'number' ? body.order : 9999;
    const nameFr = typeof body.nameFr === 'string' ? body.nameFr.trim() : null;
    const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : null;

    const existing = await listCategoriesAdmin();
    if (existing.some((c) => c.slug === slug && c.type === type)) {
      return NextResponse.json(
        { success: false, message: `Une catégorie '${name}' (slug '${slug}') existe déjà pour ce type.` },
        { status: 409 }
      );
    }

    const category = await createCategory({ name, slug, type, active, order, nameFr, nameEn });
    return NextResponse.json({ success: true, message: `Catégorie '${name}' créée.`, category });
  } catch (err: unknown) {
    console.error('POST /api/site-web/categories', err);
    return NextResponse.json(
      { success: false, message: 'Échec de la création de la catégorie. La base est momentanément indisponible — réessayez dans un instant.' },
      { status: 500 }
    );
  }
}