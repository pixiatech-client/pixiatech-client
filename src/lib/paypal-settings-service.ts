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
  try {
    const { adminDb } = getFirebaseAdmin();
    const docRef = adminDb.collection('settings').doc('paypal');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data() || {};
      return {
        ...DEFAULT_SETTINGS,
        clientId: data.clientId || '',
        clientSecret: data.clientSecret || '',
        environment: data.environment || 'sandbox',
      };
    }
  } catch (error) {
    console.error('Error fetching PayPal settings from Firestore:', error);
  }
  return { ...DEFAULT_SETTINGS };
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
