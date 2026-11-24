import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { deleteRange, listRangesAdmin, updateRange } from '@/lib/products/ranges-store';
import { slugify } from '@/lib/products/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID de gamme requis.' }, { status: 400 });
    }
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
      (r) => r.id !== id && (r.slug === slug || r.name.toLowerCase() === name.toLowerCase())
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `Une gamme « ${duplicate.name} » existe déjà.` },
        { status: 409 }
      );
    }

    const updated = await updateRange(id, {
      name,
      slug,
      nameFr: typeof body.nameFr === 'string' ? body.nameFr.trim() : name,
      nameEn: typeof body.nameEn === 'string' ? body.nameEn.trim() : name,
      ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
      ...(typeof body.order === 'number' ? { order: body.order } : {}),
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Gamme introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Gamme renommée en « ${updated.name} ».`, range: updated });
  } catch (err: unknown) {
    console.error('PATCH /api/site-web/ranges/[id]', err);
    return NextResponse.json(
      { success: false, message: 'Échec de la modification de la gamme.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID de gamme requis.' }, { status: 400 });
    }

    const ok = await deleteRange(id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Gamme introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Gamme supprimée.' });
  } catch (err: unknown) {
    console.error('DELETE /api/site-web/ranges/[id]', err);
    return NextResponse.json(
      { success: false, message: 'Échec de la suppression de la gamme.' },
      { status: 500 }
    );
  }
}
