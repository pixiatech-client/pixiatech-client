import { getFirebaseAdmin } from './firebase-admin';
import crypto from 'crypto';

export interface MagicLink {
  id?: string;
  email: string;
  customerId: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

const COLLECTION = 'magic_links';
const TOKEN_EXPIRY_MINUTES = 15;

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function buildMagicLinkUrl(token: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/boutique/mon-compte/valider?token=${token}&email=${encodeURIComponent(email)}`;
}

export async function createMagicLink(email: string, customerId: string): Promise<{ token: string; url: string }> {
  const { adminDb } = getFirebaseAdmin();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await adminDb.collection(COLLECTION).doc(token).set({
    email,
    customerId,
    expiresAt,
    used: false,
    createdAt: now.toISOString(),
  });

  return { token, url: buildMagicLinkUrl(token, email) };
}

export async function validateMagicLink(token: string, email: string): Promise<{ valid: boolean; customerId?: string; reason?: string }> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(COLLECTION).where('__name__', '==', token).limit(1).get();
  if (snap.empty) return { valid: false, reason: 'Token introuvable' };

  const doc = snap.docs[0];
  const data = doc.data() as MagicLink;

  if (data.used) return { valid: false, reason: 'Ce lien a déjà été utilisé' };
  if (data.email !== email) return { valid: false, reason: 'Email invalide' };
  if (new Date(data.expiresAt) < new Date()) return { valid: false, reason: 'Ce lien a expiré' };

  await adminDb.collection(COLLECTION).doc(doc.id).update({ used: true });

  return { valid: true, customerId: data.customerId };
}
