import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { INVOICES_COLLECTION } from '@/lib/invoices';

export async function GET(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const orderId = req.nextUrl.searchParams.get('orderId');
    const orderType = req.nextUrl.searchParams.get('orderType');

    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb
      .collection(INVOICES_COLLECTION)
      .where('customerId', '==', customerId)
      .get();

    let invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

    if (orderId && orderType) {
      invoices = invoices.filter((i) => i.orderId === orderId && i.orderType === orderType);
    }

    invoices.sort((a, b) => String(b.generatedAt || '').localeCompare(String(a.generatedAt || '')));

    const ordersMap = new Map<string, any>();
    for (const inv of invoices) {
      const orderColl = inv.orderType === 'sale' ? 'sale_orders' : 'rental_orders';
      const key = `${inv.orderType}:${inv.orderId}`;
      if (ordersMap.has(key)) continue;
      try {
        const orderSnap = await adminDb.collection(orderColl).doc(inv.orderId).get();
        if (orderSnap.exists) {
          const d = orderSnap.data() || {};
          ordersMap.set(key, {
            orderId: orderSnap.id,
            orderType: inv.orderType,
            status: d.status || '',
            amountPaid: d.amountPaid ?? null,
            createdAt: d.createdAt || '',
          });
        } else {
          ordersMap.set(key, null);
        }
      } catch (err) {
        console.error('[InvoicesList] Failed to join order', inv.orderId, err);
        ordersMap.set(key, null);
      }
    }

    const result = invoices.map((inv) => ({
      ...inv,
      order: ordersMap.get(`${inv.orderType}:${inv.orderId}`) || null,
    }));

    return NextResponse.json({ invoices: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}