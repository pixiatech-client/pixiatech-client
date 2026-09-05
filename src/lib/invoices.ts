import type { Firestore } from 'firebase-admin/firestore';

export interface InvoiceItem {
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CompanySnapshot {
  companyName: string;
  companySiren: string;
  companySiret: string;
  companyVatNumber: string;
  companyAddress: string;
  companyCity: string;
  companyPostcode: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
}

export type InvoiceStatus = 'draft' | 'generated' | 'sent' | 'failed';

export interface InvoiceDoc extends CompanySnapshot {
  orderId: string;
  orderType: 'sale' | 'rental';
  customerId: string;
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  isB2B: boolean;
  vatValidated: boolean;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  deliveryCost: number;
  vat: number;
  vatRate: 0 | 0.2;
  totalTtc: number;
  orderDate: string;
  generatedAt: string;
  pdfContent: string;
  pdfSize: number;
  emailSentAt?: string;
}

export interface InvoiceAmounts {
  subtotal: number;
  discount: number;
  deliveryCost: number;
  vat: number;
  vatRate: 0 | 0.2;
  totalTtc: number;
}

const COLLECTION = 'invoices';
const COUNTER_YEARLY = 'invoice';
const COUNTER_COLLECTION = 'counters';

export const SALE_BILLABLE_STATUSES = ['commande', 'archive'];
export const RENTAL_BILLABLE_STATUSES = ['validated', 'completed', 'shipped'];

export function invoiceDocId(orderType: string, orderId: string): string {
  return `${orderType}_${orderId}`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function invoiceExists(adminDb: Firestore, orderType: string, orderId: string): Promise<boolean> {
  const snap = await adminDb.collection(COLLECTION).doc(invoiceDocId(orderType, orderId)).get();
  return snap.exists;
}

export async function allocateInvoiceNumber(adminDb: Firestore): Promise<{ invoiceNumber: string; year: number; seq: number }> {
  const counterRef = adminDb.collection(COUNTER_COLLECTION).doc(COUNTER_YEARLY);
  const year = new Date().getFullYear();

  const seq = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = snap.exists ? snap.data() || {} : {};
    let nextSeq = 1;
    if (snap.exists && data.year === year && typeof data.lastSeq === 'number') {
      nextSeq = data.lastSeq + 1;
    }
    tx.set(counterRef, { year, lastSeq: nextSeq }, { merge: true });
    return nextSeq;
  });

  return {
    invoiceNumber: `PIX-${year}-${String(seq).padStart(5, '0')}`,
    year,
    seq,
  };
}

const DEFAULT_COMPANY: CompanySnapshot = {
  companyName: 'PIXIATECH',
  companySiren: '993747161',
  companySiret: '',
  companyVatNumber: 'FR39993747161',
  companyAddress: '5 Rue La Fontaine',
  companyCity: 'Saint-Ouen-sur-Seine',
  companyPostcode: '93400',
  companyCountry: 'France',
  companyPhone: '07 56 81 66 26',
  companyEmail: 'contact@pixiatech.com',
};

export async function getCompanySnapshot(adminDb: Firestore): Promise<CompanySnapshot> {
  try {
    const snap = await adminDb.collection('settings').doc('pdf').get();
    if (!snap.exists) return DEFAULT_COMPANY;
    const d = snap.data() || {};
    const siret = typeof d.siret === 'string' ? d.siret.replace(/\s+/g, '') : '';
    const siren = siret.length >= 9 ? siret.slice(0, 9) : DEFAULT_COMPANY.companySiren;
    return {
      companyName: typeof d.companyName === 'string' && d.companyName ? d.companyName : DEFAULT_COMPANY.companyName,
      companySiren: siren,
      companySiret: siret,
      companyVatNumber: DEFAULT_COMPANY.companyVatNumber,
      companyAddress: typeof d.address === 'string' && d.address ? d.address : DEFAULT_COMPANY.companyAddress,
      companyCity: DEFAULT_COMPANY.companyCity,
      companyPostcode: DEFAULT_COMPANY.companyPostcode,
      companyCountry: DEFAULT_COMPANY.companyCountry,
      companyPhone: typeof d.phone === 'string' && d.phone ? d.phone : DEFAULT_COMPANY.companyPhone,
      companyEmail: typeof d.email === 'string' && d.email ? d.email : DEFAULT_COMPANY.companyEmail,
    };
  } catch (err) {
    console.error('[Invoices] Failed to load company snapshot from settings/pdf:', err);
    return DEFAULT_COMPANY;
  }
}

export function buildInvoiceItems(order: any): InvoiceItem[] {
  const asNumber = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((it: any) => {
      const quantity = Math.floor(asNumber(it.quantity)) || 1;
      const unitPrice = asNumber(it.unitPrice);
      return {
        productName: String(it.productName || it.name || 'Produit'),
        variantName: typeof it.variantName === 'string' && it.variantName ? it.variantName : undefined,
        quantity,
        unitPrice,
        lineTotal: round2(unitPrice * quantity),
      };
    });
  }

  const quantity = Math.max(1, Math.floor(asNumber(order.quantity)) || 1);
  const unitPrice = asNumber(order.productPrice);
  return [
    {
      productName: String(order.productName || order.productReference || 'Produit'),
      variantName: typeof order.variantName === 'string' && order.variantName ? order.variantName : undefined,
      quantity,
      unitPrice,
      lineTotal: round2(unitPrice * quantity),
    },
  ];
}

export function computeInvoiceAmounts(order: any, opts: { vatValidated: boolean; vatRate: 0 | 0.2 }): InvoiceAmounts {
  const asNumber = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const storedSubtotal = asNumber(order.subtotal);
  const storedDiscount = asNumber(order.discount);
  const storedDeliveryCost = asNumber(order.deliveryCost);

  const itemSubtotal = buildInvoiceItems(order).reduce((sum, i) => sum + i.lineTotal, 0);

  const subtotal = round2(storedSubtotal > 0 ? storedSubtotal : itemSubtotal);
  const discount = round2(storedDiscount > 0 ? storedDiscount : 0);
  const deliveryCost = round2(storedDeliveryCost > 0 ? storedDeliveryCost : 0);
  const hasStoredVat = typeof order.vat === 'number' && Number.isFinite(order.vat);

  const vat = hasStoredVat
    ? round2(order.vat)
    : opts.vatValidated
      ? 0
      : round2(subtotal * opts.vatRate);

  const totalTtc = round2(subtotal - discount + deliveryCost + vat);

  return { subtotal, discount, deliveryCost, vat, vatRate: opts.vatRate, totalTtc };
}

export function getInvoice(adminDb: Firestore, orderType: string, orderId: string) {
  return adminDb.collection(COLLECTION).doc(invoiceDocId(orderType, orderId));
}

export const INVOICES_COLLECTION = COLLECTION;