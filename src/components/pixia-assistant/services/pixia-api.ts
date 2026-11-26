'use client';

import {
  clearPixiaAssistantClientSession,
  getPixiaAssistantBootstrap,
  resolvePixiaAssistantClientProfile,
} from '@/app/actions/pixia-assistant-actions';
import {
  createPixiaAssistantQuote,
  persistPixiaAssistantQuotePdf,
  resendPixiaAssistantQuoteOtp,
  verifyPixiaAssistantQuoteOtp,
} from '@/app/actions/pixia-assistant-quote-actions';
import type { PriceSnapshot } from '@/lib/types';
import { isBootstrapPayloadValid } from '../core/bootstrap-validation';
import type {
  BootstrapPayload,
  ClientFormState,
  ClientProfile,
  ConfigState,
  Language,
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

/**
 * Le bootstrap vient de la Server Action officielle, jamais d'une route
 * des routes HTTP du prototype : ces routes n'existent pas dans l'application
 * Next.js.
 */
export async function fetchBootstrap(): Promise<BootstrapPayload> {
  const result = await getPixiaAssistantBootstrap();
  if (!result.ok || !isBootstrapPayloadValid(result.bootstrap)) {
    throw new Error('Configuration indisponible');
  }
  return result.bootstrap;
}

export interface CreateQuoteResponse {
  success: boolean;
  quoteId: string;
  reference: string;
  otpRequired: boolean;
  emailMode: 'smtp';
  capabilityToken: null;
  priceSnapshot: PriceSnapshot;
}

export async function createQuoteWithContract(payload: {
  language: Language;
  clientDetails: ClientFormState;
  configState: ConfigState;
  includeDelivery: boolean;
  includeInstallation: boolean;
  signatureDataUrl: string;
  otpEnabledOverride?: boolean;
  selectedCityId?: string | null;
}): Promise<CreateQuoteResponse> {
  const result = await createPixiaAssistantQuote({
    language: payload.language,
    clientDetails: payload.clientDetails,
    configState: {
      projectType: payload.configState.projectType,
      width: payload.configState.width,
      height: payload.configState.height,
      quantity: payload.configState.quantity,
      selectedProductId: payload.configState.selectedProduct?.id ?? null,
      selectedCityId: payload.selectedCityId ?? null,
      rentalStartDate: payload.configState.rentalStartDate,
      rentalEndDate: payload.configState.rentalEndDate,
      rentalStartTime: payload.configState.rentalStartTime,
      rentalEndTime: payload.configState.rentalEndTime,
      installationPhoto: payload.configState.installationPhoto,
    },
    includeDelivery: payload.includeDelivery,
    includeInstallation: payload.includeInstallation,
    signatureDataUrl: payload.signatureDataUrl,
  });

  if (!result.success || !result.quoteId) {
    throw new Error(result.error || 'Création du devis impossible');
  }

  return {
    success: result.success,
    quoteId: result.quoteId,
    reference: result.reference,
    otpRequired: result.otpRequired,
    emailMode: result.emailMode,
    capabilityToken: result.capabilityToken,
    priceSnapshot: result.priceSnapshot as PriceSnapshot,
  };
}

export async function verifyQuoteOtp(
  quoteId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  return verifyPixiaAssistantQuoteOtp(quoteId, code);
}

export async function resendQuoteOtp(
  quoteId: string
): Promise<{
  success: boolean;
  cooldownSeconds?: number;
  resendAttemptsLeft?: number;
  error?: string;
}> {
  return resendPixiaAssistantQuoteOtp(quoteId);
}

export async function uploadQuotePdf(
  quoteId: string,
  pdfBlob: Blob
): Promise<{ success: boolean; pdfUrl: string }> {
  return persistPixiaAssistantQuotePdf(quoteId, pdfBlob);
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
