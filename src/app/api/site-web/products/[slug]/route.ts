import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getProductBySlug, saveProduct, deleteProduct } from '@/lib/products/products-store';
import type { Product } from '@/lib/products/types';

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
    return NextResponse.json({ success: true, product });
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
    if (body.slug && body.slug !== slug) {
      return NextResponse.json(
        { success: false, message: 'Le slug n’est pas modifiable ici : supprimez puis recréez le produit.' },
        { status: 400 }
      );
    }
    const existing = await getProductBySlug(slug);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Produit '${slug}' introuvable dans la base produits.` },
        { status: 404 }
      );
    }
    const product = await saveProduct(slug, { ...body, slug, createdAt: existing.createdAt });
    return NextResponse.json({
      success: true,
      message: `Produit '${slug}' mis à jour dans la base produits (site web).`,
      product,
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