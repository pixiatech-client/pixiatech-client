'use client';

export type OrderType = 'sale' | 'rental';

export interface EligibleOrder {
  orderId: string;
  orderType: OrderType;
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

export type InvoiceStatus = 'generated' | 'sent' | 'failed' | (string & {});

export interface InvoiceSummary {
  id: string;
  orderId: string;
  orderType: OrderType;
  customerId: string;
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  isB2B: boolean;
  vatValidated: boolean;
  subtotal: number;
  discount: number;
  deliveryCost: number;
  vat: number;
  vatRate: 0 | 0.2;
  totalTtc: number;
  orderDate: string;
  generatedAt: string;
  emailSentAt?: string;
  order?: any;
  [key: string]: unknown;
}

export class APIError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string' && data.error) return data.error;
  } catch {
    // corps non JSON : on garde le message par défaut
  }
  return fallback;
}

export async function fetchEligibleOrders(): Promise<EligibleOrder[]> {
  const res = await fetch('/api/boutique/invoices/eligible-orders', { cache: 'no-store' });
  if (!res.ok) {
    throw new APIError(res.status, await readError(res, 'Impossible de récupérer vos commandes facturables.'));
  }
  const data = await res.json();
  return Array.isArray(data?.orders) ? data.orders : [];
}

export async function fetchInvoiceList(): Promise<InvoiceSummary[]> {
  const res = await fetch('/api/boutique/invoices/list', { cache: 'no-store' });
  if (!res.ok) {
    throw new APIError(res.status, await readError(res, 'Impossible de récupérer vos factures.'));
  }
  const data = await res.json();
  return Array.isArray(data?.invoices) ? data.invoices : [];
}

export async function generateInvoice(
  orderId: string,
  orderType: OrderType
): Promise<{ invoice: Partial<InvoiceSummary>; emailSentAt: string | null }> {
  const res = await fetch('/api/boutique/invoices/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, orderType }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new APIError(res.status, await readError(res, 'Impossible de générer la facture.'));
  }

  const data = await res.json();
  return { invoice: data?.invoice ?? {}, emailSentAt: data?.emailSentAt ?? null };
}