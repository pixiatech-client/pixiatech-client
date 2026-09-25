import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { listProducts, saveProduct, getProductBySlug } from '@/lib/products/products-store';
import { isValidSlug } from '@/lib/products/types';
import type { Product } from '@/lib/products/types';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const products = await listProducts();
    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = (await request.json()) as Partial<Product>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Corps de requête invalide.' }, { status: 400 });
    }
    const slug = body.slug?.trim();
    if (!slug || !isValidSlug(slug)) {
      return NextResponse.json(
        { success: false, message: 'Slug manquant ou invalide (uniquement lettres, chiffres, tirets).' },
        { status: 400 }
      );
    }
    const existing = await getProductBySlug(slug);
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Un produit existe déjà avec le slug '${slug}'.` },
        { status: 409 }
      );
    }
    const product = await saveProduct(slug, {
      ...body,
      slug,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({
      success: true,
      message: `Produit '${slug}' créé dans la base produits (site web).`,
      product,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}