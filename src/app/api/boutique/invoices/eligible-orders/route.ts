import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import {
  SALE_BILLABLE_STATUSES,
  RENTAL_BILLABLE_STATUSES,
  invoiceDocId,
  buildInvoiceItems,
  computeInvoiceAmounts,
} from '@/lib/invoices';

interface EligibleOrder {
  orderId: string;
  orderType: 'sale' | 'rental';
  createdAt: string;
  productName: string;
  quantity: number;
  status: string;
  amountPaid: number;
  subtotal: number;
  discount: number;
  deliveryCost: number;
  vat: number;
  vatRate: 0 | 0.2;
  totalTtc: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
}

export async function GET(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { adminDb } = getFirebaseAdmin();

    const [saleSnap, rentalSnap] = await Promise.all([
      adminDb.collection('sale_orders').where('customerId', '==', customerId).get(),
      adminDb.collection('rental_orders').where('customerId', '==', customerId).get(),
    ]);

    const saleOrders = saleSnap.docs
      .map((d) => ({ id: d.id, orderType: 'sale' as const, ...d.data() }) as any)
      .filter((o) => SALE_BILLABLE_STATUSES.includes(o.status));

    const rentalOrders = rentalSnap.docs
      .map((d) => ({ id: d.id, orderType: 'rental' as const, ...d.data() }) as any)
      .filter((o) => RENTAL_BILLABLE_STATUSES.includes(o.status));

    const candidates = [...saleOrders, ...rentalOrders];
    const results: EligibleOrder[] = [];

    for (const order of candidates) {
      const exists = await adminDb
        .collection('invoices')
        .doc(invoiceDocId(order.orderType, order.id))
        .get()
        .then((s) => s.exists)
        .catch(() => false);
      if (exists) continue;

      const orderAny: any = order;
      const vatValidated = orderAny.customerVatValidated === true;
      const amounts = computeInvoiceAmounts(orderAny, { vatValidated, vatRate: vatValidated ? 0 : 0.2 });
      const items = buildInvoiceItems(orderAny);

      results.push({
        orderId: order.id,
        orderType: order.orderType,
        createdAt: orderAny.createdAt || '',
        productName: orderAny.productName || (items[0]?.productName ?? ''),
        quantity: orderAny.quantity ?? items[0]?.quantity ?? 0,
        status: orderAny.status || '',
        amountPaid: Number(orderAny.amountPaid) || (items[0]?.lineTotal ?? 0),
        subtotal: amounts.subtotal,
        discount: amounts.discount,
        deliveryCost: amounts.deliveryCost,
        vat: amounts.vat,
        vatRate: amounts.vatRate,
        totalTtc: amounts.totalTtc,
        rentalStartDate: orderAny.rentalStartDate || undefined,
        rentalEndDate: orderAny.rentalEndDate || undefined,
      });
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ orders: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}