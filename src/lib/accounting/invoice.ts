import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getAccountingSettings } from './settings';
import { sendInvoiceToConnect } from './connect';
import { logAccountingEvent } from './events';
import { round2 } from '@/lib/invoices';
import type {
  AccountingInvoiceTrigger,
  AccountingOrderType,
  ConnectInvoicePayload,
  ConnectInvoiceResult,
  InvoiceSyncState,
} from './types';

const SYNC_COLLECTION = 'pennylane_sync';

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return typeof value === 'string' && value ? value.trim() : '';
}

export function orderVatRate(order: any): number {
  const subtotal = toNumber(order.subtotal);
  const vat = toNumber(order.vat);
  if (subtotal <= 0) return 0;
  if (vat <= 0) return 0;
  return round2((vat / subtotal) * 100);
}

export function buildInvoicePayload(
  order: any,
  opts: { orderType: AccountingOrderType; trigger: AccountingInvoiceTrigger }
): ConnectInvoicePayload {
  const { orderType, trigger } = opts;

  const isSale = orderType === 'sale';

  const customerName = isSale
    ? str(order.customerName) || str(order.customerEmail)
    : str(order.renterRepresentative) || str(order.renterCompany) || str(order.renterEmail);

  const phone = isSale ? str(order.customerPhone) : str(order.renterPhone);
  const company = isSale ? str(order.customerCompany) : str(order.renterCompany);
  const address = isSale ? str(order.customerAddress) : str(order.renterAddress);
  const city = isSale ? str(order.customerCity) : str(order.renterCity);
  const postalCode = isSale ? str(order.customerPostcode) : str(order.renterPostcode);
  const country = isSale ? str(order.customerCountry) || 'FR' : 'FR';

  const descriptionParts = [str(order.productName) || str(order.productReference) || 'Produit'];
  if (str(order.variantName)) descriptionParts.push(str(order.variantName));
  if (!isSale && (str(order.rentalStartDate) || str(order.rentalEndDate))) {
    descriptionParts.push(`Du ${str(order.rentalStartDate)} au ${str(order.rentalEndDate)}`);
  }

  return {
    orderId: str(order.id),
    orderType,
    invoiceTrigger: trigger,
    currency: 'EUR',
    customer: {
      name: customerName,
      email: (isSale ? str(order.customerEmail) : str(order.renterEmail)) || 'contact@pixiatech.com',
      company: company || null,
      phone: phone || null,
      address: address || null,
      postalCode: postalCode || null,
      city: city || null,
      country: country || null,
    },
    items: [
      {
        description: descriptionParts.join(' — '),
        quantity: Math.max(1, Math.floor(toNumber(order.quantity)) || 1),
        unitPrice: toNumber(order.productPrice),
        vatRate: orderVatRate(order),
      },
    ],
  };
}

async function getSyncState(orderId: string): Promise<InvoiceSyncState | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(SYNC_COLLECTION).doc(orderId).get();
  if (!snap.exists) return null;
  return snap.data() as InvoiceSyncState;
}

async function saveSyncState(orderId: string, state: Omit<InvoiceSyncState, 'externalReference' | 'orderId'>) {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  await adminDb
    .collection(SYNC_COLLECTION)
    .doc(orderId)
    .set(
      {
        ...state,
        orderId,
        externalReference: `PIXIATECH_ORDER_${orderId}`,
        lastSyncedAt: new Date().toISOString(),
        attempts: FieldValue.increment(1),
      },
      { merge: true }
    );
}

function parseProviderIds(data: unknown): {
  providerInvoiceId?: number | null;
  providerCustomerId?: number | null;
  invoiceNumber?: string | null;
} {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, any>;
  const pick = (keys: string[]): number | null => {
    for (const k of keys) {
      const v = d[k];
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && v !== '') {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
      if (typeof d.invoice === 'object' && d.invoice !== null && k in d.invoice) {
        const iv = d.invoice[k];
        if (typeof iv === 'number') return iv;
        if (typeof iv === 'string' && iv !== '') {
          const n = Number(iv);
          if (Number.isFinite(n)) return n;
        }
      }
    }
    return null;
  };
  return {
    providerInvoiceId: pick(['id', 'invoice_id', 'invoiceId', 'provider_invoice_id']),
    providerCustomerId: pick(['customer_id', 'customerId', 'provider_customer_id']),
    invoiceNumber: str(d.invoice_number) || str(d.invoiceNumber) || str(d.number) || null,
  };
}

/**
 * Envoie la facture vers PIXIATECH Connect. Ce chemin ne doit JAMAIS bloquer le
 * flux commercial : appelants → fire-and-forget (void). L'échec d'envoi est
 * enregistré (pennylane_sync + accounting_events) mais ne rejette jamais la
 * commande.
 */
export async function createInvoiceForOrder(
  order: any,
  opts: { orderType: AccountingOrderType; trigger: AccountingInvoiceTrigger }
): Promise<ConnectInvoiceResult> {
  const orderId = str(order.id);
  if (!orderId) {
    return { ok: false, status: 0, error: 'orderId manquant' };
  }

  const settings = await getAccountingSettings();
  if (!settings.enabled) {
    await logAccountingEvent({
      provider: settings.provider,
      action: 'invoice.create',
      status: 'error',
      orderId,
      error: 'Accounting module disabled',
      attempts: 1,
    });
    return { ok: false, status: 0, error: 'Comptabilité désactivée' };
  }

  // Le déclenchement manuel (route admin) est toujours permis : il représente
  // une action humaine explicite, quelle que soit la configuration.
  if (opts.trigger !== 'manual') {
    if (settings.invoiceTrigger === 'manual') {
      return { ok: false, status: 0, error: `Trigger ${opts.trigger} inactif (config: manual)` };
    }
    if (settings.invoiceTrigger !== opts.trigger) {
      return { ok: false, status: 0, error: `Trigger ${opts.trigger} inactif (config: ${settings.invoiceTrigger})` };
    }
  }

  try {
    const existing = await getSyncState(orderId);
    if (existing && (existing.status === 'created' || existing.status === 'pending')) {
      return { ok: true, status: 200, error: 'already sent', data: existing };
    }

    const payload = buildInvoicePayload(order, opts);

    const result = await sendInvoiceToConnect(payload);

    if (result.ok) {
      const ids = parseProviderIds(result.data);
      await saveSyncState(orderId, {
        orderType: opts.orderType,
        provider: settings.provider,
        status: 'created',
        providerInvoiceId: ids.providerInvoiceId,
        providerCustomerId: ids.providerCustomerId,
        invoiceNumber: ids.invoiceNumber,
      });
      await logAccountingEvent({
        provider: settings.provider,
        action: 'invoice.create',
        status: 'success',
        orderId,
        providerId: ids.providerInvoiceId,
        providerInvoiceNumber: ids.invoiceNumber,
        attempts: 1,
      });
    } else {
      await saveSyncState(orderId, {
        orderType: opts.orderType,
        provider: settings.provider,
        status: 'error',
        lastSyncError: result.error || null,
      });
      await logAccountingEvent({
        provider: settings.provider,
        action: 'invoice.create',
        status: 'error',
        orderId,
        error: result.error || 'Connect call failed',
        attempts: 1,
      });
    }

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await saveSyncState(orderId, {
      orderType: opts.orderType,
      provider: 'unknown',
      status: 'error',
      lastSyncError: message,
    }).catch(() => {});
    await logAccountingEvent({
      provider: 'unknown',
      action: 'invoice.create',
      status: 'error',
      orderId,
      error: message,
      attempts: 1,
    }).catch(() => {});
    return { ok: false, status: 0, error: message };
  }
}