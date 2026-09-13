import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { INVOICES_COLLECTION } from '@/lib/invoices';
import { products as catalogProducts } from '@/lib/boutique-data';
import {
  computeVatRate,
  formatOrderNumber,
  rentalOrderStatus,
  saleOrderStatus,
  getInvoiceStatusLabel,
  type ClientOrderKind,
  type OrderVisualStatus,
} from '@/lib/client-status';

interface OrderItemView {
  id: string;
  img: string;
  title: string;
  subtitle: string;
  kindLabel: 'Achat' | 'Location';
  unitPriceHT: number;
  unitPriceTTC: number;
  quantity: number;
  deliveryAddress: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  deliveryCountry: string;
  deliveryFees: number;
  carrier: string;
  trackingNumber: string;
  deliveryPinCode: string;
  estimatedDeliveryDate: string;
  vatRate: number;
  note?: string;
}

interface OrderView {
  id: string;
  number: string;
  date: string;
  itemCount: number;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  statusKey: OrderVisualStatus['key'];
  statusLabel: string;
  type: ClientOrderKind;
  kindLabel: 'Achat' | 'Location';
  hasInvoice: boolean;
  invoiceId?: string;
  invoiceStatusLabel?: string;
  items: OrderItemView[];
}

const catalogIndex = new Map(catalogProducts.map((p) => [String(p.id), p]));

function productMeta(productId: unknown, fallbackName?: unknown, fallbackImage?: unknown) {
  const hit = catalogIndex.get(String(productId || ''));
  if (hit) return { title: hit.name, img: hit.image };
  return { title: String(fallbackName || 'Produit'), img: String(fallbackImage || '') };
}

function toMoney(value: unknown): number {
  const n = Number(value);
  return isFinite(n) ? n : 0;
}

function buildItem(
  type: ClientOrderKind,
  order: Record<string, unknown>,
  delivery: Omit<OrderItemView, 'id' | 'img' | 'title' | 'subtitle' | 'kindLabel' | 'unitPriceHT' | 'unitPriceTTC' | 'quantity' | 'vatRate'>
): OrderItemView {
  const quantity = Math.max(1, Math.round(toMoney(order.quantity) || 1));
  const unitPriceHT = toMoney(order.productPrice) || toMoney(order.amountPaid) / quantity;
  const vatRate = computeVatRate(toMoney(order.vat), unitPriceHT * quantity);
  const meta = productMeta(order.productId, order.productName, order.productImage);
  const subtitle = type === 'sale' ? 'Achat LED' : 'Location LED';
  return {
    id: String(order.productId || order.id || type),
    img: meta.img,
    title: meta.title,
    subtitle,
    kindLabel: type === 'sale' ? 'Achat' : 'Location',
    unitPriceHT,
    unitPriceTTC: unitPriceHT * (1 + vatRate),
    quantity,
    vatRate,
    ...delivery,
  };
}

export async function GET(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { adminDb } = getFirebaseAdmin();

    const [saleSnap, rentalSnap, invoiceSnap] = await Promise.all([
      adminDb.collection('sale_orders').where('customerId', '==', customerId).get(),
      adminDb.collection('rental_orders').where('customerId', '==', customerId).get(),
      adminDb.collection(INVOICES_COLLECTION).where('customerId', '==', customerId).get(),
    ]);

    const invoiceByOrder = new Map<string, { id: string; status?: string }>();
    invoiceSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.orderType && data.orderId) {
        invoiceByOrder.set(`${data.orderType}_${data.orderId}`, {
          id: d.id,
          status: typeof data.status === 'string' ? data.status : undefined,
        });
      }
    });

    const orders: OrderView[] = [];

    for (const snap of saleSnap.docs) {
      const order = snap.data() as Record<string, unknown>;
      const q = Math.max(1, Math.round(toMoney(order.quantity) || 1));
      const unitPriceHT = toMoney(order.productPrice) || toMoney(order.amountPaid) / q;
      const subtotalHT = unitPriceHT * q;
      const deliveryCost = toMoney(order.deliveryCost);
      const vatAmount = toMoney(order.vat);
      const totalTTC = toMoney(order.amountPaid) || Math.round((subtotalHT + deliveryCost + vatAmount) * 100) / 100;
      const vatRate = computeVatRate(vatAmount, subtotalHT + deliveryCost);
      const tracking = String(order.trackingNumber || '');
      const visual = saleOrderStatus(String(order.status || 'commande'), !!tracking);

      const deliveryAddressLine = String(
        order.customerAddress || order.customerCompany || ''
      );

      orders.push({
        id: snap.id,
        number: formatOrderNumber('sale', snap.id, order.createdAt),
        date: String(order.createdAt || ''),
        itemCount: q,
        totalHT: Math.round((subtotalHT + deliveryCost) * 100) / 100,
        totalVAT: Math.round(vatAmount * 100) / 100,
        totalTTC,
        statusKey: visual.key,
        statusLabel: visual.label,
        type: 'sale',
        kindLabel: 'Achat',
        hasInvoice: invoiceByOrder.has(`sale_${snap.id}`),
        invoiceId: invoiceByOrder.get(`sale_${snap.id}`)?.id,
        invoiceStatusLabel: invoiceByOrder.get(`sale_${snap.id}`)?.status
          ? getInvoiceStatusLabel(invoiceByOrder.get(`sale_${snap.id}`)!.status!)
          : undefined,
        items: [
          buildItem('sale', order, {
            deliveryAddress: deliveryAddressLine,
            deliveryPostalCode: String(order.customerPostcode || order.postcode || ''),
            deliveryCity: String(order.customerCity || ''),
            deliveryCountry: String(order.customerCountry || 'FR'),
            deliveryFees: deliveryCost,
            carrier: tracking ? 'Chronopost Spécialiste Frêt' : '',
            trackingNumber: tracking,
            deliveryPinCode: '',
            estimatedDeliveryDate: '',
            note: undefined,
          }),
        ],
      });
    }

    for (const snap of rentalSnap.docs) {
      const order = snap.data() as Record<string, unknown>;
      const q = Math.max(1, Math.round(toMoney(order.quantity) || 1));
      const unitPriceHT = toMoney(order.productPrice) || toMoney(order.amountPaid) / q;
      const subtotalHT = unitPriceHT * q;
      const deliveryCost = toMoney(order.deliveryCost);
      const vatAmount = toMoney(order.vat);
      const totalTTC = toMoney(order.amountPaid) || Math.round((subtotalHT + deliveryCost + vatAmount) * 100) / 100;
      const vatRate = computeVatRate(vatAmount, subtotalHT + deliveryCost);
      const tracking = String(order.trackingNumber || '');
      const visual = rentalOrderStatus(String(order.status || 'pending_validation'));

      const start = String(order.rentalStartDate || '');
      const end = String(order.rentalEndDate || '');
      const note = [start && end ? `Location du ${start} au ${end}` : '', String(order.additionalNotes || '')]
        .filter(Boolean)
        .join('. ') || undefined;

      orders.push({
        id: snap.id,
        number: formatOrderNumber('rental', snap.id, order.createdAt),
        date: String(order.createdAt || ''),
        itemCount: q,
        totalHT: Math.round((subtotalHT + deliveryCost) * 100) / 100,
        totalVAT: Math.round(vatAmount * 100) / 100,
        totalTTC,
        statusKey: visual.key,
        statusLabel: visual.label,
        type: 'rental',
        kindLabel: 'Location',
        hasInvoice: invoiceByOrder.has(`rental_${snap.id}`),
        invoiceId: invoiceByOrder.get(`rental_${snap.id}`)?.id,
        invoiceStatusLabel: invoiceByOrder.get(`rental_${snap.id}`)?.status
          ? getInvoiceStatusLabel(invoiceByOrder.get(`rental_${snap.id}`)!.status!)
          : undefined,
        items: [
          buildItem('rental', order, {
            deliveryAddress: String(order.renterAddress || order.renterCompany || ''),
            deliveryPostalCode: String(order.renterPostcode || ''),
            deliveryCity: String(order.renterCity || ''),
            deliveryCountry: String(order.renterCountry || 'FR'),
            deliveryFees: deliveryCost,
            carrier: tracking ? 'Chronopost Spécialiste Frêt' : '',
            trackingNumber: tracking,
            deliveryPinCode: '',
            estimatedDeliveryDate: end,
            note,
          }),
        ],
      });
    }

    orders.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}