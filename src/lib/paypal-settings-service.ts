import { getFirebaseAdmin } from './firebase-admin';

// ── Types ────────────────────────────────────────────────────────────────────

/** Configuration pour le mode "Compte PayPal" (bouton PayPal jaune) */
export type PayPalAccountSettings = {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  /** Activer le bouton "Payer avec PayPal" sur le checkout */
  enablePaypal: boolean;
};

/** Configuration pour le mode "Carte bancaire via PayPal" (FUNDING.CARD) */
export type PayPalCardSettings = {
  /**
   * ClientId spécifique pour la carte. Si vide, le clientId du compte PayPal
   * est utilisé en fallback (les deux modes partagent alors les mêmes credentials).
   */
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  /** Activer le bouton "Payer par carte" sur le checkout */
  enableCardPayments: boolean;
};

/** Shape complète du document Firestore `settings/paypal` */
export type PayPalSettings = PayPalAccountSettings & {
  /**
   * @deprecated Conservé pour rétrocompatibilité — piloté par enablePaypal + enableCardPayments
   */
  enableCardPayments: boolean;
  card: PayPalCardSettings;
};

// ── Valeurs par défaut ────────────────────────────────────────────────────────

const DEFAULT_ACCOUNT: PayPalAccountSettings = {
  clientId: '',
  clientSecret: '',
  environment: 'sandbox',
  enablePaypal: true,
};

const DEFAULT_CARD: PayPalCardSettings = {
  clientId: '',
  clientSecret: '',
  environment: 'sandbox',
  enableCardPayments: true,
};

// ── Lecture ───────────────────────────────────────────────────────────────────

/**
 * Lit la configuration PayPal depuis Firestore avec fallback .env.
 * Rétrocompatible : un ancien document sans `enablePaypal` / `card` est lisible.
 */
export async function getPayPalSettings(): Promise<PayPalSettings> {
  const envSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() || '';
  const envClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || '';

  try {
    const { adminDb } = getFirebaseAdmin();
    const docRef = adminDb.collection('settings').doc('paypal');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() || {};
      let clientSecret = (data.clientSecret || '').trim();
      let clientId = (data.clientId || '').trim();

      // Auto-repair : secret tronqué en Firestore mais complet en env → on répare
      if (clientSecret.length < 75 && envSecret.length >= 75) {
        clientSecret = envSecret;
        docRef.set({ clientSecret, clientId: clientId || envClientId }, { merge: true }).catch(() => {});
      }

      // Sous-objet carte (peut être absent sur les anciens documents)
      const cardData = data.card || {};

      return {
        // Mode compte PayPal
        clientId: clientId || envClientId,
        clientSecret: clientSecret || envSecret,
        environment: data.environment || 'sandbox',
        enablePaypal: data.enablePaypal !== false, // défaut true pour compat
        // Mode carte bancaire
        enableCardPayments: data.enableCardPayments !== false, // compat legacy
        card: {
          clientId: (cardData.clientId || '').trim(),
          clientSecret: (cardData.clientSecret || '').trim(),
          environment: cardData.environment || 'sandbox',
          enableCardPayments: data.enableCardPayments !== false, // synced avec racine
        },
      };
    }
  } catch (error) {
    console.error('Error fetching PayPal settings from Firestore:', error);
  }

  // Fallback total sur les variables d'environnement
  return {
    clientId: envClientId,
    clientSecret: envSecret,
    environment: 'sandbox',
    enablePaypal: true,
    enableCardPayments: true,
    card: {
      ...DEFAULT_CARD,
      // Fallback sur les credentials principaux si rien en Firestore
      clientId: '',
      clientSecret: '',
    },
  };
}

/**
 * Résout les credentials effectifs pour le mode carte :
 * si card.clientId est vide, utilise le clientId principal.
 */
export async function getEffectiveCardSettings(): Promise<{
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  enableCardPayments: boolean;
}> {
  const settings = await getPayPalSettings();
  return {
    clientId: settings.card.clientId || settings.clientId,
    clientSecret: settings.card.clientSecret || settings.clientSecret,
    environment: settings.card.environment || settings.environment,
    enableCardPayments: settings.enableCardPayments,
  };
}

// ── Écriture ──────────────────────────────────────────────────────────────────

export type PayPalSettingsUpdate = {
  // Mode compte PayPal
  clientId?: string;
  clientSecret?: string;
  environment?: 'sandbox' | 'live';
  enablePaypal?: boolean;
  // Toggle carte (niveau racine pour compat)
  enableCardPayments?: boolean;
  // Mode carte bancaire
  card?: {
    clientId?: string;
    clientSecret?: string;
    environment?: 'sandbox' | 'live';
  };
};

export async function updatePayPalSettings(data: PayPalSettingsUpdate) {
  try {
    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('settings').doc('paypal').set(data, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating PayPal settings in Firestore:', error);
    return { success: false, error: error.message };
  }
}
