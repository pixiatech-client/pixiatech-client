import type {
  BootstrapPayload,
  ClientFormState,
  ClientProfile,
  ConfigState,
  Language,
  PricingCalculationResult,
} from '../core/types.ts';

export async function fetchBootstrap(params?: {
  botEnabled?: boolean;
  otpEnabled?: boolean;
  priceHidden?: boolean;
}): Promise<BootstrapPayload> {
  const query = new URLSearchParams();
  if (params?.botEnabled !== undefined) query.set('botEnabled', String(params.botEnabled));
  if (params?.otpEnabled !== undefined) query.set('otpEnabled', String(params.otpEnabled));
  if (params?.priceHidden !== undefined) query.set('priceHidden', String(params.priceHidden));
  const qs = query.toString();
  const res = await fetch(`/api/pixia/bootstrap${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error('Failed to load PIXIA configuration');
  }
  return res.json() as Promise<BootstrapPayload>;
}

export interface CreateQuoteResponse {
  success: boolean;
  quoteId: string;
  reference: string;
  otpRequired: boolean;
  emailMode: 'dev-simulated' | 'smtp';
  capabilityToken: string | null;
  priceSnapshot: PricingCalculationResult;
}

export async function createQuoteWithContract(payload: {
  language: Language;
  clientDetails: ClientFormState;
  configState: ConfigState;
  includeDelivery: boolean;
  includeInstallation: boolean;
  signatureDataUrl: string;
  otpEnabledOverride?: boolean;
}): Promise<CreateQuoteResponse> {
  const res = await fetch('/api/pixia/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: payload.language,
      clientDetails: payload.clientDetails,
      configState: {
        projectType: payload.configState.projectType,
        environment: payload.configState.environment,
        width: payload.configState.width,
        height: payload.configState.height,
        distance: payload.configState.distance,
        pixelPitch: payload.configState.pixelPitch,
        pitchLabel: payload.configState.pitchLabel,
        productId: payload.configState.selectedProduct?.id,
        quantity: payload.configState.quantity,
        installationPhoto: payload.configState.installationPhoto,
        rentalStartDate: payload.configState.rentalStartDate,
        rentalEndDate: payload.configState.rentalEndDate,
        rentalStartTime: payload.configState.rentalStartTime,
        rentalEndTime: payload.configState.rentalEndTime,
      },
      includeDelivery: payload.includeDelivery,
      includeInstallation: payload.includeInstallation,
      signatureDataUrl: payload.signatureDataUrl,
      otpEnabledOverride: payload.otpEnabledOverride,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Quote creation failed');
  }
  return data as CreateQuoteResponse;
}

export async function verifyQuoteOtp(
  quoteId: string,
  code: string
): Promise<{ success: boolean; capabilityToken?: string; error?: string; attemptsLeft?: number }> {
  const res = await fetch(`/api/pixia/quotes/${encodeURIComponent(quoteId)}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      error: data.error || 'INVALID_CODE',
      attemptsLeft: typeof data.attemptsLeft === 'number' ? data.attemptsLeft : undefined,
    };
  }
  return data;
}

export async function resendQuoteOtp(
  quoteId: string
): Promise<{
  success: boolean;
  cooldownSeconds?: number;
  resendAttemptsLeft?: number;
  retryAfterSeconds?: number;
  error?: string;
}> {
  const res = await fetch(`/api/pixia/quotes/${encodeURIComponent(quoteId)}/otp/resend`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchDevSimulatedInbox(quoteId: string): Promise<{
  devSimulation: boolean;
  to: string;
  code: string;
  expiresAt: number;
} | null> {
  const res = await fetch(`/api/pixia/dev/simulated-inbox/${encodeURIComponent(quoteId)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function uploadQuotePdf(
  quoteId: string,
  pdfBase64: string,
  capabilityToken: string | null
): Promise<{ success: boolean; pdfUrl: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (capabilityToken) {
    headers.Authorization = `Bearer ${capabilityToken}`;
  }
  const res = await fetch(`/api/pixia/quotes/${encodeURIComponent(quoteId)}/pdf`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pdfBase64 }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'PDF upload failed');
  }
  return data;
}

export async function loginClientAccount(
  email: string,
  password: string
): Promise<{ success: boolean; profile?: ClientProfile; error?: string }> {
  const res = await fetch('/api/pixia/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Authentication failed' };
  }
  return data as { success: true; profile: ClientProfile };
}

export async function logoutClientAccount(): Promise<void> {
  await fetch('/api/pixia/auth/logout', { method: 'POST' });
}
