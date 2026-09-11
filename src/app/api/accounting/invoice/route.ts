import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin, verifyAdminSession } from '@/lib/firebase-admin';
import { createInvoiceForOrder } from '@/lib/accounting/invoice';
import type { AccountingOrderType } from '@/lib/accounting/types';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Non autorisé' }, { status: auth.status || 403 });
  }

  let body: { orderId?: unknown; orderType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const orderType = body.orderType === 'sale' || body.orderType === 'rental' ? body.orderType : null;

  if (!orderId || !orderType) {
    return NextResponse.json(
      { error: 'orderId et orderType ("sale" | "rental") sont requis' },
      { status: 400 }
    );
  }

  try {
    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection(orderType === 'sale' ? 'sale_orders' : 'rental_orders').doc(orderId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    const order = { id: orderId, ...snap.data() } as Record<string, unknown>;

    // Trigger manuel : envoi immédiat quelle que soit la config, l'idempotence
    // pennylane_sync/bloquant reste garantie par createInvoiceForOrder.
    const result = await createInvoiceForOrder(order, { orderType: orderType as AccountingOrderType, trigger: 'manual' });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Envoi PIXIATECH Connect échoué' },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err: any) {
    console.error('[Accounting Invoice] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
}