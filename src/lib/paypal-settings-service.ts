import { getFirebaseAdmin } from './firebase-admin';

export type PayPalSettings = {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
};

const DEFAULT_SETTINGS: PayPalSettings = {
  clientId: '',
  clientSecret: '',
  environment: 'sandbox',
};

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

      // If secret in Firestore is truncated (<75 chars) but env has the full secret (80 chars), self-heal!
      if (clientSecret.length < 75 && envSecret.length >= 75) {
        clientSecret = envSecret;
        docRef.set({ clientSecret, clientId: clientId || envClientId }, { merge: true }).catch(() => {});
      }

      return {
        ...DEFAULT_SETTINGS,
        clientId: clientId || envClientId,
        clientSecret: clientSecret || envSecret,
        environment: data.environment || 'sandbox',
      };
    }
  } catch (error) {
    console.error('Error fetching PayPal settings from Firestore:', error);
  }
  return {
    ...DEFAULT_SETTINGS,
    clientId: envClientId,
    clientSecret: envSecret,
  };
}

export async function updatePayPalSettings(data: Partial<PayPalSettings>) {
  try {
    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('settings').doc('paypal').set(data, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating PayPal settings in Firestore:', error);
    return { success: false, error: error.message };
  }
}
