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
  vatRate: number;
  taxRate: number;
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

    // Taux de TVA admin (pourcentage entier, ex: 19). Fallback 19 % si absent.
    // Renvoyé dans la réponse (`taxRate` + `vatRate` décimal) pour l'affichage wizard.
    const settingsSnap = await adminDb.collection('settings').doc('main').get();
    const settingsData = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
    const adminTaxRate =
      typeof settingsData?.estimationFlow?.taxRate === 'number' && settingsData.estimationFlow.taxRate >= 0
        ? settingsData.estimationFlow.taxRate
        : 19;

    const [saleSnap, rentalSnap] = await Promise.all([
      adminDb.collection('sale_orders').where('customerId', '==', customerId).get(),
      adminDb.collection('rental_orders').where('customerId', '==', customerId).get(),
    ]);

    const allOrders = [
      ...saleSnap.docs.map((d) => ({ id: d.id, orderType: 'sale' as const, ...d.data() }) as any),
      ...rentalSnap.docs.map((d) => ({ id: d.id, orderType: 'rental' as const, ...d.data() }) as any),
    ];

    const CANCELLED_STATUSES = ['corbeille', 'cancelled', 'canceled', 'refunded', 'rembourse'];

    const nonBillableOrders = allOrders.filter(
      (o) => !SALE_BILLABLE_STATUSES.includes(o.status) && !RENTAL_BILLABLE_STATUSES.includes(o.status)
    );
    const cancelledOrders = nonBillableOrders.filter((o) => CANCELLED_STATUSES.includes(o.status)).length;
    const otherNonBillableOrders = nonBillableOrders.length - cancelledOrders;

    const saleOrders = allOrders
      .filter((o) => o.orderType === 'sale')
      .filter((o) => SALE_BILLABLE_STATUSES.includes(o.status));

    const rentalOrders = allOrders
      .filter((o) => o.orderType === 'rental')
      .filter((o) => RENTAL_BILLABLE_STATUSES.includes(o.status));

    const candidates = [...saleOrders, ...rentalOrders];
    const results: EligibleOrder[] = [];
    let invoicedOrders = 0;

    for (const order of candidates) {
      const exists = await adminDb
        .collection('invoices')
        .doc(invoiceDocId(order.orderType, order.id))
        .get()
        .then((s) => s.exists)
        .catch(() => false);
      if (exists) {
        invoicedOrders += 1;
        continue;
      }

      const orderAny: any = order;
      const vatValidated = orderAny.customerVatValidated === true;
      const vatNumber = typeof orderAny.customerVatNumber === 'string' ? orderAny.customerVatNumber : '';
      const amounts = computeInvoiceAmounts(orderAny, { vatValidated, vatNumber, vatRate: adminTaxRate / 100 });
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
        taxRate: adminTaxRate,
        totalTtc: amounts.totalTtc,
        rentalStartDate: orderAny.rentalStartDate || undefined,
        rentalEndDate: orderAny.rentalEndDate || undefined,
      });
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({
      orders: results,
      counters: {
        totalOrders: allOrders.length,
        cancelledOrders,
        otherNonBillableOrders,
        invoicedOrders,
        eligibleOrders: results.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}