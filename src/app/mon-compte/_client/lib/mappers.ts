/**
 * mappers.ts — Converts raw API response shapes into typed UI models.
 * API (Firebase/Next.js routes) → ClientPortal internal types
 */
import type {
  Order,
  Invoice,
  Dispute,
  DisputeMessage,
  InvoiceStatus,
  OrderStatus,
} from '../types';

// ─── STATUS MAPS ─────────────────────────────────────────────────────────────

const INVOICE_STATUS_MAP: Record<string, InvoiceStatus> = {
  pending:          'EN ATTENTE',
  in_progress:      'EN COURS',
  completed:        'FACTURE DISPONIBLE',
  generated:        'FACTURE DISPONIBLE',
  sent:             'FACTURE DISPONIBLE',
  paid:             'FACTURE DISPONIBLE',
  // legacy labels
  'EN ATTENTE':     'EN ATTENTE',
  'EN COURS':       'EN COURS',
  'FACTURE DISPONIBLE': 'FACTURE DISPONIBLE',
};

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  delivered:    'delivered',
  in_transit:   'in_transit',
  shipped:      'in_transit',
  processing:   'processing',
  cancelled:    'cancelled',
  commande:     'processing',
  'en-cours':   'in_transit',
  confirmed:    'processing',
};

function toOrderStatus(key: string): OrderStatus {
  return ORDER_STATUS_MAP[key] ?? 'processing';
}

function toInvoiceStatus(raw: string): InvoiceStatus {
  return INVOICE_STATUS_MAP[raw] ?? 'EN ATTENTE';
}

// ─── ORDER MAPPER ────────────────────────────────────────────────────────────

export function mapApiOrder(o: any): Order {
  const item0 = Array.isArray(o.items) && o.items.length > 0 ? o.items[0] : null as any;

  return {
    id:              o.id,
    orderNumber:     o.number || o.id,
    date:            o.date ? new Date(o.date).toLocaleDateString('fr-FR') : '',
    status:          toOrderStatus(o.statusKey || ''),
    statusKey:       o.statusKey,
    type:            o.type || 'sale',
    carrier:         item0?.carrier || 'Chronopost Spécialiste Frêt',
    trackingNumber:  item0?.trackingNumber || '',
    deliveryPin:     item0?.deliveryPinCode || '',
    deliveryPinCode: item0?.deliveryPinCode || '',
    shippingAddress: [
      item0?.deliveryAddress,
      item0?.deliveryPostalCode,
      item0?.deliveryCity,
    ]
      .filter(Boolean)
      .join(', ') || '',
    subtotalHT:  typeof o.totalHT  === 'number' ? o.totalHT  : 0,
    vatAmount:   typeof o.totalVAT === 'number' ? o.totalVAT : 0,
    totalTTC:    typeof o.totalTTC === 'number' ? o.totalTTC : 0,
    vatRate:     0.2,
    hasInvoice:  Boolean(o.hasInvoice),
    invoiceId:   o.invoiceId,
    invoiceStatus: o.invoiceStatusLabel
      ? toInvoiceStatus(o.invoiceStatusLabel)
      : undefined,
    items: item0
      ? [
          {
            productId:    item0.id || o.id,
            productName:  item0.title || 'Produit PIXIATECH',
            productImage: item0.img   || '',
            quantity:     item0.quantity  || 1,
            unitPriceHT:  item0.unitPriceHT  || 0,
            unitPriceTTC: item0.unitPriceTTC || 0,
            vatRate:      item0.vatRate || 0.2,
            category:     o.kindLabel  || 'Informatique',
          },
        ]
      : [],
  };
}

export function mapApiOrders(raw: any[]): Order[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.map((o, idx) => {
    const mapped = mapApiOrder(o);
    const base = String(mapped.id || mapped.orderNumber || `order-${idx}`);
    let id = base;
    let n = 1;
    while (seen.has(id)) {
      id = `${base}-${n++}`;
    }
    seen.add(id);
    return { ...mapped, id };
  });
}

// ─── INVOICE MAPPER ──────────────────────────────────────────────────────────

export function mapApiInvoice(inv: any): Invoice {
  const firstImage =
    inv.firstProductImage ||
    (Array.isArray(inv.items) && inv.items[0]?.productImage) ||
    '';
  const firstProductName =
    (Array.isArray(inv.items) && inv.items[0]?.productName) ||
    inv.productName ||
    'Produit PIXIATECH';

  const subtotalHT =
    typeof inv.totalHt    === 'number' ? inv.totalHt    :
    typeof inv.subtotalHT === 'number' ? inv.subtotalHT : 0;
  const vatAmount =
    typeof inv.vat       === 'number' ? inv.vat       :
    typeof inv.vatAmount === 'number' ? inv.vatAmount : 0;
  const totalTTC =
    typeof inv.totalTtc === 'number' ? inv.totalTtc :
    typeof inv.totalTTC === 'number' ? inv.totalTTC : 0;
  const realVatRate =
    typeof inv.vatRate === 'number' && inv.vatRate >= 0 && inv.vatRate <= 0.5
      ? inv.vatRate
      : null;

  const status = toInvoiceStatus(typeof inv.status === 'string' ? inv.status : 'pending');
  const snap   = inv.clientSnapshot || {};

  return {
    id:            inv.id,
    invoiceNumber: inv.number || inv.invoiceNumber || inv.id,
    orderId:       inv.orderId  || '',
    orderNumber:   inv.orderNumber || inv.orderId || '',
    productId:     (Array.isArray(inv.items) && inv.items[0]?.productId) || inv.orderId || '',
    productName:   firstProductName,
    productImage:  firstImage,
    productUrl:    '/boutique',
    issueDate:     inv.generatedAt
      ? new Date(inv.generatedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    subtotalHT,
    vatRate:       0.2,
    vatAmount,
    totalTTC,
    status,
    pdfUrl:        status === 'FACTURE DISPONIBLE'
      ? `/api/boutique/invoices/${inv.id}/pdf`
      : undefined,
    downloadable:  status === 'FACTURE DISPONIBLE',
    definitiveDocumentUploaded: status === 'FACTURE DISPONIBLE',
    billingType:   inv.billingType || snap.billingType || 'particulier',
    clientSnapshot: {
      billingType:    (inv.billingType || snap.billingType || 'particulier') as 'particulier' | 'entreprise',
      clientName:     snap.clientName || snap.name || inv.customerName || '',
      email:          snap.email || inv.customerEmail || '',
      siret:          snap.siret || inv.siret,
      companyName:    snap.companyName || inv.companyName,
      vatNumber:      snap.vatNumber || inv.vatNumber,
      billingAddress: snap.billingAddress || snap.address || inv.address || '',
      city:           snap.city        || inv.city || '',
      postalCode:     snap.postalCode  || inv.postalCode || '',
      country:        snap.country     || inv.country || 'France',
    },
  };
}

export function mapApiInvoices(raw: any[]): Invoice[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.map((inv, idx) => {
    const mapped = mapApiInvoice(inv);
    const base = String(mapped.id || mapped.invoiceNumber || `invoice-${idx}`);
    let id = base;
    let n = 1;
    while (seen.has(id)) {
      id = `${base}-${n++}`;
    }
    seen.add(id);
    return { ...mapped, id };
  });
}

// ─── DISPUTE MAPPER ──────────────────────────────────────────────────────────

const DISPUTE_STATUS_MAP: Record<string, string> = {
  open:     'Ouvert',
  pending:  'En attente',
  ongoing:  'En cours',
  resolved: 'Résolu',
  closed:   'Fermé',
};

export function mapApiDispute(d: any): Dispute {
  const messages: DisputeMessage[] = Array.isArray(d.messages)
    ? d.messages.map((m: any, i: number) => ({
        id:         m.id    || String(i),
        sender:     (m.sender === 'admin' ? 'admin' : 'client') as 'admin' | 'client',
        senderName: m.senderName ||
          (m.sender === 'admin' ? 'Service Client PIXIATECH' : 'Client'),
        message:    m.message || m.text || '',
        date:       m.date || '',
        time:       m.time || '',
        attachment: m.attachment || undefined,
        mediaUrl:   m.mediaUrl || null,
        mediaType:  m.mediaType || (m.mediaUrl && /\.(mp4|webm|mov)$/i.test(m.mediaUrl) ? 'video' : m.mediaUrl ? 'image' : null),
        mediaName:  m.mediaName || null,
      }))
    : [];

  return {
    id:               d.id,
    orderId:          d.orderId      || '',
    orderNumber:      d.orderNumber  || d.orderId || '',
    productName:      d.productName  || '',
    productImage:     d.productImage || '',
    reason:           d.reason       || 'other',
    reasonLabel:      d.reasonLabel  || d.reason  || '',
    description:      d.description  || '',
    status:           (DISPUTE_STATUS_MAP[d.status] || d.statusLabel || 'Ouvert') as any,
    date:             d.date         || '',
    unreadByClient:   Boolean(d.unreadByClient),
    lastResponseDate: d.lastResponseDate || '',
    carrierNote:      d.carrierNote  || '',
    messages,
  };
}

export function mapApiDisputes(raw: any[]): Dispute[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapApiDispute);
}
