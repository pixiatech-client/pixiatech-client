'use server';

import {
  getDeliverySettings,
  getLaborSettings,
  getLocations,
  getProducts,
  getQuoteRequest,
  getSettings,
  updateQuotePdfUrl,
} from '@/app/actions/public-actions';
import {
  createQuoteWithContract,
  resendQuoteOtp,
  verifyQuoteOtp,
} from '@/app/actions/quote-actions';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { buildAssistantQuotePricing } from '@/lib/pixia-assistant/quote-pricing';
import { readPixiaAssistantSession } from '@/lib/pixia-assistant/session';
import type { PriceSnapshot } from '@/lib/types';
import { getStorage } from 'firebase-admin/storage';

interface AssistantQuoteInput {
  language: 'fr' | 'en';
  clientDetails: {
    company: string;
    representative: string;
    email: string;
    phone: string;
    address: string;
    deliveryCity: string;
    deliveryPostcode: string;
  };
  configState: {
    projectType: 'vente' | 'location' | null;
    width: number | null;
    height: number | null;
    quantity: number;
    selectedProductId?: string | null;
    selectedCityId?: string | null;
    rentalStartDate?: string | null;
    rentalEndDate?: string | null;
    rentalStartTime?: string;
    rentalEndTime?: string;
    installationPhoto?: string | null;
  };
  includeDelivery: boolean;
  includeInstallation: boolean;
  signatureDataUrl: string;
}

interface AssistantQuoteResult {
  success: boolean;
  quoteId: string;
  reference: string;
  otpRequired: boolean;
  emailMode: 'smtp';
  capabilityToken: null;
  priceSnapshot: PriceSnapshot | null;
  error?: string;
}

/**
 * Point d'entrée serveur du contrat de l'Assistant Bot Pixia.
 *
 * Le devis est créé par createQuoteWithContract (quotes/{id}, numéro
 * EST-########, OTP SMTP). Aucune donnée de prix, aucune référence et aucun
 * jeton de capacité ne sont fabriqués ici : les montants viennent des moteurs
 * officiels et la référence est relue sur le devis créé.
 */
export async function createPixiaAssistantQuote(
  input: AssistantQuoteInput
): Promise<AssistantQuoteResult> {
  const failure = (error: string): AssistantQuoteResult => ({
    success: false,
    quoteId: '',
    reference: '',
    otpRequired: false,
    emailMode: 'smtp',
    capabilityToken: null,
    priceSnapshot: null,
    error,
  });

  try {
    const [session, settings, deliverySettings, laborSettings, locations, catalog] =
      await Promise.all([
        readPixiaAssistantSession(),
        getSettings(),
        getDeliverySettings(),
        getLaborSettings(),
        getLocations(),
        getProducts({ page: 1, limit: 1000 }),
      ]);

    const product = input.configState.selectedProductId
      ? catalog.products.find((item) => item.id === input.configState.selectedProductId) ?? null
      : null;

    if (!product) {
      return failure('Produit indisponible : le devis n’a pas été créé.');
    }

    const pricing = buildAssistantQuotePricing({
      lang: input.language,
      config: {
        projectType: input.configState.projectType,
        width: input.configState.width,
        height: input.configState.height,
        quantity: input.configState.quantity,
        selectedProductId: product.id,
        selectedCityId: input.configState.selectedCityId,
        rentalStartDate: input.configState.rentalStartDate,
        rentalEndDate: input.configState.rentalEndDate,
        rentalStartTime: input.configState.rentalStartTime,
        rentalEndTime: input.configState.rentalEndTime,
      },
      client: {
        deliveryCity: input.clientDetails.deliveryCity,
        deliveryPostcode: input.clientDetails.deliveryPostcode,
      },
      includeDelivery: input.includeDelivery,
      includeInstallation: input.includeInstallation,
      product,
      locations,
      settings,
      deliverySettings,
      laborSettings,
    });

    const sitePhoto = input.configState.installationPhoto?.startsWith('https://')
      ? input.configState.installationPhoto
      : '';

    const result = await createQuoteWithContract(
      session.customerId ?? 'anonymous',
      {
        company: input.clientDetails.company,
        representative: input.clientDetails.representative,
        address: input.clientDetails.address,
        postcode: input.clientDetails.deliveryPostcode,
        city: input.clientDetails.deliveryCity,
        email: input.clientDetails.email,
        phone: input.clientDetails.phone,
        sitePhoto,
      },
      pricing.quoteDetails as Parameters<typeof createQuoteWithContract>[2],
      input.signatureDataUrl
    );

    if (!result.success || !result.id) {
      return failure(result.error || 'Création du devis impossible.');
    }

    const officialQuote = await getQuoteRequest(result.id);
    if (!officialQuote?.number) {
      return failure('Référence officielle indisponible : contactez-nous.');
    }

    return {
      success: true,
      quoteId: result.id,
      reference: officialQuote.number,
      otpRequired: Boolean(settings.isEmailVerificationEnabled),
      emailMode: 'smtp',
      capabilityToken: null,
      priceSnapshot: pricing.snapshot,
    };
  } catch (error) {
    console.error('[pixia-assistant] createQuote failed:', error);
    return failure(error instanceof Error ? error.message : 'Création du devis impossible.');
  }
}

export async function verifyPixiaAssistantQuoteOtp(
  quoteId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await verifyQuoteOtp(quoteId, code);
    return result.success ? { success: true } : { success: false, error: result.error || 'Code incorrect.' };
  } catch (error) {
    console.error('[pixia-assistant] verify OTP failed:', error);
    return { success: false, error: 'Vérification du code impossible.' };
  }
}

export async function resendPixiaAssistantQuoteOtp(
  quoteId: string
): Promise<{ success: boolean; error?: string; cooldownSeconds: number; resendAttemptsLeft?: number }> {
  const cooldownSeconds = 10 * 60;
  try {
    const result = await resendQuoteOtp(quoteId);
    if (!result.success) {
      return { success: false, cooldownSeconds, error: result.error || 'Renvoi du code impossible.' };
    }

    const [settings, { adminDb }] = await Promise.all([
      getSettings(),
      Promise.resolve(getFirebaseAdmin()),
    ]);
    const snapshot = adminDb ? await adminDb.collection('quotes').doc(quoteId).get() : null;
    const resendCount = Number(snapshot?.data()?.resendCount) || 0;
    const validity = Number(settings.emailVerification?.validityMinutes) || 10;

    return {
      success: true,
      cooldownSeconds: validity * 60,
      resendAttemptsLeft: Math.max(0, 3 - resendCount),
    };
  } catch (error) {
    console.error('[pixia-assistant] resend OTP failed:', error);
    return { success: false, cooldownSeconds, error: 'Renvoi du code impossible.' };
  }
}

/** Persiste le PDF réellement généré dans Firebase Storage puis dans le devis. */
export async function persistPixiaAssistantQuotePdf(
  quoteId: string,
  pdfBlob: Blob
): Promise<{ success: boolean; pdfUrl: string; error?: string }> {
  try {
    // Le PDF voyage comme Blob (partie binaire FormData), pas comme chaîne
    // base64 : React Flight limiterait sinon la longueur des chaînes contenues
    // dans le tableau d'arguments des Server Actions à 1 000 000 de caractères.
    if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
      return { success: false, pdfUrl: '', error: 'PDF invalide.' };
    }

    const bytes = Buffer.from(await pdfBlob.arrayBuffer());
    if (bytes.subarray(0, 4).toString() !== '%PDF') {
      return { success: false, pdfUrl: '', error: 'PDF invalide.' };
    }

    const { app } = getFirebaseAdmin();
    const file = getStorage(app).bucket().file(`quotes/pdfs/${quoteId}.pdf`);
    await file.save(bytes, { contentType: 'application/pdf', resumable: false });
    await file.makePublic();
    const pdfUrl = file.publicUrl();

    const updated = await updateQuotePdfUrl(quoteId, pdfUrl);
    if (!updated.success) {
      return { success: false, pdfUrl: '', error: updated.error || 'Enregistrement du PDF impossible.' };
    }

    return { success: true, pdfUrl };
  } catch (error) {
    console.error('[pixia-assistant] PDF persistence failed:', error);
    return {
      success: false,
      pdfUrl: '',
      error: error instanceof Error ? error.message : 'Envoi du PDF impossible.',
    };
  }
}
