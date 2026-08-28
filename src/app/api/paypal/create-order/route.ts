import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';
import {
  PaypalAmountError,
  resolveOfferAmount,
  resolveSignQuoteAmount,
  resolveBoutiqueAmount,
} from '@/lib/paypal-amount';
import type { BoutiqueAmountInput } from '@/lib/paypal-amount';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Le montant ne doit JAMAIS provenir du navigateur.
    if (body.amount !== undefined) {
      return NextResponse.json(
        { error: 'Montant client non accepté : le montant est résolu côté serveur' },
        { status: 400 }
      );
    }

    let resolved;
    if (body.quoteRequestId) {
      resolved = await resolveOfferAmount(body.quoteRequestId, {
        promoCode: body.promoCode,
        promoDocId: body.promoDocId,
      });
    } else if (body.quoteId) {
      resolved = await resolveSignQuoteAmount(body.quoteId, {
        promoCode: body.promoCode,
        promoDocId: body.promoDocId,
      });
    } else if (body.cart) {
      resolved = await resolveBoutiqueAmount(body.cart as BoutiqueAmountInput);
    } else {
      return NextResponse.json({ error: 'Contexte de paiement manquant' }, { status: 400 });
    }

    const order = await createPayPalOrder(resolved.amount);

    return NextResponse.json({
      id: order.id,
      amount: resolved.amount,
      source: resolved.source,
    });
  } catch (err: any) {
    if (err instanceof PaypalAmountError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}