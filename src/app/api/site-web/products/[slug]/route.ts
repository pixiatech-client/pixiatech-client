import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getProductBySlug, saveProduct, deleteProduct } from '@/lib/products/products-store';
import {
  SYSTEM_TEMPLATE_PROTECTED_CODE,
  SYSTEM_TEMPLATE_PROTECTED_MESSAGE,
  isSystemTemplateSlug,
} from '@/lib/products/system-template';
import { slugify, type Product } from '@/lib/products/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json(
        { success: false, message: `Produit '${slug}' introuvable dans la base produits.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, product },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    console.error('GET /api/site-web/products/[slug]', err);
    return NextResponse.json(
      { success: false, message: 'Impossible de charger le produit. La base est momentanément indisponible — réessayez dans un instant.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as Partial<Product>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Corps de requête invalide.' }, { status: 400 });
    }
    // `deleted` est le statut de la corbeille : l'y faire glisser effacerait le
    // template du back-office sans passer par la suppression, qui est bloquée
    // plus bas. Même refus, même règle.
    if (body.status === 'deleted' && isSystemTemplateSlug(slug)) {
      return NextResponse.json(
        { success: false, code: SYSTEM_TEMPLATE_PROTECTED_CODE, message: SYSTEM_TEMPLATE_PROTECTED_MESSAGE },
        { status: 403 }
      );
    }

    const targetSlug =
      typeof body.slug === 'string' && body.slug.trim()
        ? slugify(body.slug.trim())
        : slug;

    if (targetSlug !== slug) {
      if (isSystemTemplateSlug(slug)) {
        return NextResponse.json(
          {
            success: false,
            code: SYSTEM_TEMPLATE_PROTECTED_CODE,
            message: 'Le slug du template système est verrouillé et ne peut pas être modifié.',
          },
          { status: 403 }
        );
      }
      if (isSystemTemplateSlug(targetSlug)) {
        return NextResponse.json(
          { success: false, message: 'Le slug choisi est réservé au template système.' },
          { status: 400 }
        );
      }
      const conflict = await getProductBySlug(targetSlug);
      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            message: `Un produit existe déjà avec le lien '/web/product/${targetSlug}'. Choisissez un autre lien.`,
          },
          { status: 409 }
        );
      }
    }

    const existing = await getProductBySlug(slug);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Produit '${slug}' introuvable dans la base produits.` },
        { status: 404 }
      );
    }
    const product = await saveProduct(
      slug,
      { ...body, slug: targetSlug, createdAt: existing.createdAt },
      targetSlug
    );
    return NextResponse.json({
      success: true,
      message: `Produit '${targetSlug}' mis à jour dans la base produits (site web).`,
      product,
      oldSlug: slug,
      newSlug: targetSlug,
    });
  } catch (err: unknown) {
    console.error('PUT /api/site-web/products/[slug]', err);
    return NextResponse.json(
      { success: false, message: 'Échec de l’enregistrement du produit. La base est momentanément indisponible — réessayez dans un instant.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { slug } = await context.params;
    // Refus explicite AVANT `deleteProduct` : l'API répond par une intention
    // claire (403) au lieu de laisser remonter une exception, et l'appel direct
    // sur cette URL ne peut pas aboutir. `deleteProduct` garde la même garde,
    // donc même un futur batch ou une corbeille passerait par ici.
    if (isSystemTemplateSlug(slug)) {
      return NextResponse.json(
        { success: false, code: SYSTEM_TEMPLATE_PROTECTED_CODE, message: SYSTEM_TEMPLATE_PROTECTED_MESSAGE },
        { status: 403 }
      );
    }
    const ok = await deleteProduct(slug);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: `Produit '${slug}' introuvable dans la base produits.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: `Produit '${slug}' supprimé de la base produits.` });
  } catch (err: unknown) {
    console.error('DELETE /api/site-web/products/[slug]', err);
    return NextResponse.json(
      { success: false, message: 'Échec de la suppression du produit. La base est momentanément indisponible — réessayez dans un instant.' },
      { status: 500 }
    );
  }
}