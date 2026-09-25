import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
  countProductsUsingCategory,
  removeCategoryFromProducts,
} from '@/lib/products/categories-store';
import { isValidSlug } from '@/lib/products/types';

const CATEGORY_ID_PATTERN = /^cat_[a-z0-9]+$/;

function categoryIdError(id: string): NextResponse | null {
  if (!CATEGORY_ID_PATTERN.test(id)) {
    return NextResponse.json({ success: false, message: "Identifiant de catégorie invalide (format 'cat_…')." }, { status: 400 });
  }
  return null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const request = _request;
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const idErr = categoryIdError(id);
  if (idErr) return idErr;
  try {
    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Catégorie introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, category });
  } catch (err: unknown) {
    console.error(`GET /api/site-web/categories/${id}`, err);
    return NextResponse.json({ success: false, message: 'Impossible de charger la catégorie.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const idErr = categoryIdError(id);
  if (idErr) return idErr;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ success: false, message: 'Le libellé ne peut pas être vide.' }, { status: 400 });
      }
      patch.name = name;
    }
    if (typeof body.slug === 'string') {
      const slug = body.slug.trim();
      if (!isValidSlug(slug)) {
        return NextResponse.json({ success: false, message: 'Slug invalide (uniquement lettres, chiffres, tirets).' }, { status: 400 });
      }
      patch.slug = slug;
    }
    if (typeof body.type === 'string') patch.type = body.type;
    if (typeof body.active === 'boolean') patch.active = body.active;
    if (typeof body.order === 'number') patch.order = body.order;
    // Libellés localisés : chaîne vide → null → le store efface le champ
    // (retour au libellé canonique `name`).
    if (typeof body.nameFr === 'string') patch.nameFr = body.nameFr.trim() || null;
    if (typeof body.nameEn === 'string') patch.nameEn = body.nameEn.trim() || null;

    const category = await updateCategory(id, patch as never);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Catégorie introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Catégorie '${category.name}' mise à jour.`, category });
  } catch (err: unknown) {
    console.error(`PUT /api/site-web/categories/${id}`, err);
    return NextResponse.json({ success: false, message: 'Échec de la mise à jour de la catégorie.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const idErr = categoryIdError(id);
  if (idErr) return idErr;
  try {
    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Catégorie introuvable.' }, { status: 404 });
    }
    const usage = await countProductsUsingCategory(id);
    if (usage > 0) {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      } catch {
        // corps absent → suppression simple
      }
      if (body.removeFromProducts !== true) {
        return NextResponse.json(
          {
            success: false,
            message: `La catégorie '${category.name}' est utilisée par ${usage} produit(s). Deux options : la désactiver (recommandé) ou la supprimer et la retirer de ces produits.`,
            usage,
          },
          { status: 409 }
        );
      }
      const removed = await removeCategoryFromProducts(id);
      await deleteCategory(id);
      return NextResponse.json({
        success: true,
        message: `Catégorie '${category.name}' supprimée et retirée de ${removed} produit(s).`,
      });
    }
    await deleteCategory(id);
    return NextResponse.json({ success: true, message: `Catégorie '${category.name}' supprimée.` });
  } catch (err: unknown) {
    console.error(`DELETE /api/site-web/categories/${id}`, err);
    return NextResponse.json({ success: false, message: 'Échec de la suppression de la catégorie.' }, { status: 500 });
  }
}