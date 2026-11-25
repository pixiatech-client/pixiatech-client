import { cookies } from 'next/headers';
import type { ClientProfile } from '../../components/pixia-assistant/core/types';
import { requireRole } from '../auth-guards';
import { decrypt } from '../auth';
import { findCustomerByEmail } from '../customers';
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

/** Construit un profil uniquement à partir de champs Firestore réels. */
function buildProfile(
  customerId: string,
  data: Record<string, unknown>,
  emailFallback: string
): ClientProfile {
  const companyAddress = [
    readString(data.companyAddress) || readString(data.addressLine1),
    readString(data.addressLine2),
  ]
    .filter(Boolean)
    .join(', ');

  return {
    id: customerId,
    avatarUrl: readString(data.avatarUrl),
    company: readString(data.companyName),
    representative: readString(data.displayName),
    email: readString(data.email) || emailFallback,
    phone: readString(data.phone) || readString(data.officePhone),
    address: companyAddress,
    deliveryCity: readString(data.city),
    deliveryPostcode: readString(data.zipCode) || readString(data.postcode),
  };
}

function snapshotFromCustomer(
  customerId: string,
  data: Record<string, unknown>,
  emailFallback: string
): PixiaAssistantSessionSnapshot {
  if (data.status !== undefined && data.status !== 'active') {
    return ANONYMOUS_SESSION;
  }

  const profile = buildProfile(customerId, data, emailFallback);
  return {
    loggedIn: true,
    customerId,
    email: profile.email,
    profile,
  };
}

/**
 * Session client réelle : cookie signé `client_session` puis document
 * `customers/{customerId}` actif. Aucun identifiant fourni par le navigateur
 * n'est accepté.
 */
async function readClientSession(): Promise<PixiaAssistantSessionSnapshot> {
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

    return snapshotFromCustomer(
      customerId,
      snapshot.data() || {},
      readString(payload?.email)
    );
  } catch (error) {
    console.error('[pixia-assistant] client session resolution failed:', error);
    return ANONYMOUS_SESSION;
  }
}

/**
 * Un administrateur déjà connecté ne doit pas ressaisir ses identifiants.
 * Son cookie Firebase est vérifié côté serveur, son rôle est relu dans
 * `users/{uid}`, puis son profil client existant est recherché par email dans
 * `customers`. Aucune session client n'est créée et aucun rôle issu du
 * navigateur n'est accepté.
 */
async function readAdminMatchedSession(): Promise<PixiaAssistantSessionSnapshot> {
  try {
    const admin = await requireRole('admin', 'super_admin');
    if (admin.status !== 'approved') return ANONYMOUS_SESSION;

    const email = admin.email.toLowerCase().trim();
    if (!email) return ANONYMOUS_SESSION;

    const customer = await findCustomerByEmail(email);
    if (!customer?.id) return ANONYMOUS_SESSION;

    const { adminDb } = getFirebaseAdmin();
    if (!adminDb) return ANONYMOUS_SESSION;

    const snapshot = await adminDb.collection('customers').doc(customer.id).get();
    if (!snapshot.exists) return ANONYMOUS_SESSION;

    return snapshotFromCustomer(customer.id, snapshot.data() || {}, email);
  } catch {
    // Pas de session administrateur valide, rôle insuffisant ou service
    // indisponible : comportement anonyme normal, sans fuite de données.
    return ANONYMOUS_SESSION;
  }
}

/**
 * Résolution de session dans l'ordre imposé : client réel, puis
 * administrateur vérifié associé à un profil client réel.
 */
export async function readPixiaAssistantSession(): Promise<PixiaAssistantSessionSnapshot> {
  const clientSession = await readClientSession();
  if (clientSession.loggedIn) return clientSession;
  return readAdminMatchedSession();
}
