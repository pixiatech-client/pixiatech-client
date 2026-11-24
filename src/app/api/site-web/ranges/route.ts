import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { listRangesAdmin, createRange } from '@/lib/products/ranges-store';
import { slugify } from '@/lib/products/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const ranges = await listRangesAdmin();
    return NextResponse.json({ success: true, ranges });
  } catch (err: unknown) {
    console.error('GET /api/site-web/ranges', err);
    return NextResponse.json(
      { success: false, message: 'Impossible de charger les gammes. Réessayez dans un instant.' },
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
      return NextResponse.json({ success: false, message: 'Le nom de la gamme est requis.' }, { status: 400 });
    }
    const slug = typeof body.slug === 'string' && body.slug.trim() ? slugify(body.slug) : slugify(name);
    const existingList = await listRangesAdmin();
    const duplicate = existingList.find(
      (r) => r.slug === slug || r.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { success: true, message: `La gamme '${duplicate.name}' existe déjà.`, range: duplicate },
        { status: 200 }
      );
    }
    const active = typeof body.active === 'boolean' ? body.active : true;
    const order = typeof body.order === 'number' ? body.order : existingList.length * 10 + 10;
    const nameFr = typeof body.nameFr === 'string' ? body.nameFr.trim() : name;
    const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : name;

    const range = await createRange({ name, slug, active, order, nameFr, nameEn });
    return NextResponse.json({ success: true, message: `Gamme '${name}' créée.`, range });
  } catch (err: unknown) {
    console.error('POST /api/site-web/ranges', err);
    return NextResponse.json(
      { success: false, message: 'Échec de la création de la gamme.' },
      { status: 500 }
    );
  }
}
