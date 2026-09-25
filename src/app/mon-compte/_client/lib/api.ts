import type { ClientDispute, ClientInvoice, ClientOrder, ClientProfile, EligibleOrder } from '../types';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string })?.error || 'Erreur serveur';
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

function post<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export interface SessionStatusPayload extends Partial<ClientProfile> {
  loggedIn: boolean;
  email: string;
  customerId?: string;
  displayName?: string;
  companyName?: string;
  phone?: string;
  officePhone?: string;
  companyAddress?: string;
  addressLine2?: string;
  country?: string;
  city?: string;
  zipCode?: string;
  civility?: string;
  siret?: string;
  siretVerified?: boolean;
  vatNumber?: string;
  vatValidated?: boolean;
  emailVerified?: boolean;
  hasPassword?: boolean;
  avatarUrl?: string;
  legalStatus?: string;
  nafCode?: string;
}

export const clientApi = {
  sessionStatus: () => request<SessionStatusPayload>('/api/boutique/session-status'),
  orders: () => request<{ orders: ClientOrder[] }>('/api/boutique/orders'),
  invoices: () => request<{ invoices: ClientInvoice[] }>('/api/boutique/invoices/list'),
  eligibleOrders: () => request<{ orders: EligibleOrder[]; counters?: Record<string, number> }>('/api/boutique/invoices/eligible-orders'),
  generateInvoice: (orderId: string, orderType: 'sale' | 'rental', billingType?: string) =>
    post<{ invoice: Record<string, unknown>; emailSentAt?: string | null }>('/api/boutique/invoices/generate', { orderId, orderType, billingType }),
  invoicePdf: (invoiceId: string) => `/api/boutique/invoices/${invoiceId}/pdf`,
  invoicePreview: (invoiceId: string) => `/api/boutique/invoices/${invoiceId}/preview`,

  disputes: () => request<{ disputes: ClientDispute[] }>('/api/boutique/litige'),
  createDispute: (payload: { reason: string; description: string; orderId?: string; orderType?: 'sale' | 'rental' }) =>
    post<{ success: boolean; disputeId: string }>('/api/boutique/litige', payload),
  replyDispute: (disputeId: string, text: string) =>
    post<{ success: boolean }>('/api/boutique/litige/reply', { disputeId, text }),
  markDisputeRead: (disputeId: string) => post<{ success: boolean }>('/api/boutique/litige/read', { disputeId }),

  professionalInfo: () => request<{ professionalInfo: Record<string, unknown> | null }>('/api/boutique/customer/get-professional-info'),
  updateProfessionalInfo: (payload: Record<string, unknown>) =>
    post<{ success: boolean; vatValidated?: boolean }>('/api/boutique/customer/update-professional-info', payload),

  requestEmailCode: () => post<{ success: boolean }>('/api/boutique/email/request-code', {}),
  verifyEmailCode: (code: string) => post<{ success: boolean; verified: boolean }>('/api/boutique/email/verify-code', { code }),

  lookupSiret: (siret: string) => request<Record<string, unknown>>(`/api/siret?siret=${encodeURIComponent(siret)}`),
  verifySiret: (payload: Record<string, unknown>) =>
    post<{ success: boolean; siretVerified: boolean }>('/api/boutique/customer/verify-siret', payload),

  changePassword: (currentPassword: string, newPassword: string) =>
    post<{ success: boolean }>('/api/boutique/change-password', { currentPassword, newPassword }),
  updatePhone: (phone: string) => post<{ success: boolean; phone: string }>('/api/boutique/customer/update-phone', { phone }),
  updateAvatar: (avatarUrl: string) =>
    post<{ success: boolean; avatarUrl: string }>('/api/boutique/customer/upload-avatar', { avatarUrl }),
  updateAddress: (payload: Record<string, unknown>) =>
    request<{ success: boolean }>('/api/boutique/customer/address', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
