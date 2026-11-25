'use client';

import {
  clearPixiaAssistantClientSession,
  resolvePixiaAssistantClientProfile,
} from '@/app/actions/pixia-assistant-actions';
import type {
  BootstrapPayload,
  ClientFormState,
  ClientProfile,
  ConfigState,
  Language,
  PricingCalculationResult,
} from '../core/types';

/**
 * Une réponse HTML (404, redirection, erreur serveur) ne doit jamais être
 * parsée comme du JSON : le message d'erreur reste explicite et la vraie cause
 * peut être corrigée côté serveur.
 */
async function readJsonBody<T>(res: Response, fallbackMessage: string): Promise<T> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    throw new Error(`${fallbackMessage} (réponse inattendue du serveur)`);
  }
  return (await res.json()) as T;
}

async function readJsonOrThrow<T>(res: Response, fallbackMessage: string): Promise<T> {
  const data = await readJsonBody<{ error?: string } & T>(res, fallbackMessage);
  if (!res.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

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
  return readJsonOrThrow<BootstrapPayload>(res, 'Configuration indisponible');
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

  return readJsonOrThrow<CreateQuoteResponse>(res, 'Création du devis impossible');
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
  const data = await readJsonBody<{
    success: boolean;
    capabilityToken?: string;
    error?: string;
    attemptsLeft?: number;
  }>(res, 'Vérification du code impossible');
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
  return readJsonBody(res, 'Renvoi du code impossible');
}

export async function fetchDevSimulatedInbox(quoteId: string): Promise<{
  devSimulation: boolean;
  to: string;
  code: string;
  expiresAt: number;
} | null> {
  const res = await fetch(`/api/pixia/dev/simulated-inbox/${encodeURIComponent(quoteId)}`);
  if (!res.ok) return null;
  return readJsonBody(res, 'Boîte de simulation indisponible');
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
  return readJsonOrThrow<{ success: boolean; pdfUrl: string }>(res, 'Envoi du PDF impossible');
}

/**
 * Connexion client réelle : la route boutique existante vérifie le mot de passe
 * et pose le cookie signé `client_session`. Le profil affiché est ensuite
 * résolu côté serveur, jamais fabriqué dans le navigateur.
 */
export async function loginClientAccount(
  email: string,
  password: string
): Promise<{ success: boolean; profile?: ClientProfile; error?: string }> {
  const res = await fetch('/api/boutique/login-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await readJsonBody<{ error?: string }>(res, 'Connexion impossible');
    return { success: false, error: data.error || 'Connexion impossible' };
  }

  await readJsonBody<{ success: boolean }>(res, 'Connexion impossible');
  const session = await resolvePixiaAssistantClientProfile();
  if (!session.profile) {
    return {
      success: false,
      error: 'Aucun profil client actif ne correspond à cette session.',
    };
  }
  return { success: true, profile: session.profile };
}

export async function logoutClientAccount(): Promise<void> {
  await clearPixiaAssistantClientSession();
}
