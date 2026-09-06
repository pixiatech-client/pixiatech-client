import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { rateLimitExceeded } from '@/lib/rate-limit';
import { getSaleBlockReason, getVariantSaleBlockReason, effectiveVariantStock } from '@/lib/product-status';

/**
 * POST /api/boutique/verify-cart
 *
 * Verifie le stock de chaque article du panier avant affichage des boutons
 * de paiement. Retourne les productId en rupture de stock.
 * Appele au montage de la page paiement pour bloquer les boutons avant le clic PayPal.
 */
export async function POST(req: NextRequest) {
  try {
    if (rateLimitExceeded(req, 60, 60)) {
      return NextResponse.json({ error: 'Trop de requetes' }, { status: 429 });
    }

    const body = await req.json();
    const items: Array<{
      productId: string;
      type: 'purchase' | 'rental';
      quantity: number;
      variantReference?: string;
      variantName?: string;
    }> = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ outOfStockProductIds: [] });
    }

    const { adminDb } = getFirebaseAdmin();
    const outOfStockProductIds: string[] = [];

    for (const item of items) {
      if (!item.productId || item.type !== 'purchase') continue;

      let productSnap = await adminDb.collection('boutique_products').doc(item.productId).get();
      if (!productSnap.exists) {
        productSnap = await adminDb.collection('products').doc(item.productId).get();
      }
      if (!productSnap.exists) {
        outOfStockProductIds.push(item.productId);
        continue;
      }

      const data = productSnap.data() || {};

      const variants: any[] = Array.isArray(data.variants) ? data.variants : [];
      const hasVariant = !!(item.variantReference || item.variantName);
      const variant = hasVariant
        ? variants.find(
            (v: any) =>
              (item.variantReference && v.reference === item.variantReference) ||
              (item.variantName && v.name === item.variantName)
          )
        : undefined;

      const blockReason =
        variant !== undefined
          ? getVariantSaleBlockReason(data, effectiveVariantStock(variant, data.stock))
          : getSaleBlockReason(data);

      if (blockReason) {
        outOfStockProductIds.push(item.productId);
      }
    }

    return NextResponse.json({ outOfStockProductIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
