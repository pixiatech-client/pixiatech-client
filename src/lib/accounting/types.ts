export type AccountingInvoiceTrigger = 'payment' | 'delivery' | 'withdrawal_period_end' | 'manual';

export type AccountingOrderType = 'sale' | 'rental';

export interface AccountingCustomerInput {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface AccountingItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface ConnectInvoicePayload {
  orderId: string;
  orderType: AccountingOrderType;
  invoiceTrigger: AccountingInvoiceTrigger;
  currency: string;
  customer: AccountingCustomerInput;
  items: AccountingItemInput[];
}

export interface ConnectInvoiceResult {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string | null;
}

export interface AccountingSettings {
  enabled: boolean;
  provider: string;
  invoiceTrigger: AccountingInvoiceTrigger;
}

export interface InvoiceSyncState {
  orderId: string;
  orderType: AccountingOrderType;
  provider: string;
  status: 'pending' | 'created' | 'error';
  externalReference: string;
  providerInvoiceId?: number | null;
  providerCustomerId?: number | null;
  invoiceNumber?: string | null;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

export interface AccountingEvent {
  orderId?: string;
  provider: string;
  action: string;
  status: 'pending' | 'success' | 'error';
  providerId?: number | null;
  providerInvoiceNumber?: string | null;
  requestId?: string | null;
  error?: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}