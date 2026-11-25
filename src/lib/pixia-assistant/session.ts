import { cookies } from 'next/headers';
import type { ClientProfile } from '../../components/pixia-assistant/core/types';
import { decrypt } from '../auth';
import { getFirebaseAdmin } from '../firebase-admin';
import type { PixiaAssistantSessionSnapshot } from './bootstrap-types';

const ANONYMOUS_SESSION: PixiaAssistantSessionSnapshot = {
  loggedIn: false,
  customerId: null,
  email: '',
  profile: null,
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Résout l'état client uniquement depuis le cookie signé `client_session`.
 * Aucun identifiant fourni par le navigateur n'est accepté, et toute anomalie
 * (cookie invalide, compte supprimé/désactivé, Firestore indisponible) retombe
 * sur un état anonyme valide.
 */
export async function readPixiaAssistantSession(): Promise<PixiaAssistantSessionSnapshot> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('client_session')?.value;
    if (!sessionCookie) return ANONYMOUS_SESSION;

    const payload = await decrypt(sessionCookie);
    const customerId = readString(payload?.customerId);
    if (!customerId) return ANONYMOUS_SESSION;

    const { adminDb } = getFirebaseAdmin();
    if (!adminDb) return ANONYMOUS_SESSION;

    const snapshot = await adminDb.collection('customers').doc(customerId).get();
    if (!snapshot.exists) return ANONYMOUS_SESSION;

    const data = snapshot.data() || {};
    if (data.status !== undefined && data.status !== 'active') {
      return ANONYMOUS_SESSION;
    }

    const companyAddress = [
      readString(data.companyAddress) || readString(data.addressLine1),
      readString(data.addressLine2),
    ]
      .filter(Boolean)
      .join(', ');

    const profile: ClientProfile = {
      id: customerId,
      avatarUrl: readString(data.avatarUrl),
      company: readString(data.companyName),
      representative: readString(data.displayName),
      email: readString(payload?.email) || readString(data.email),
      phone: readString(data.phone) || readString(data.officePhone),
      address: companyAddress,
      deliveryCity: readString(data.city),
      deliveryPostcode: readString(data.zipCode) || readString(data.postcode),
    };

    return {
      loggedIn: true,
      customerId,
      email: profile.email,
      profile,
    };
  } catch (error) {
    console.error('[pixia-assistant] client session resolution failed:', error);
    return ANONYMOUS_SESSION;
  }
}
