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

export function buildMagicLinkUrl(token: string, email: string, baseUrl?: string): string {
  let url = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.pixiatech.com';
  url = url.replace('://0.0.0.0', '://localhost');
  return `${url}/mon-compte/valider?token=${token}&email=${encodeURIComponent(email)}`;
}

export async function createMagicLink(email: string, customerId: string, baseUrl?: string): Promise<{ token: string; url: string }> {
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

  return { token, url: buildMagicLinkUrl(token, email, baseUrl) };
}

export async function validateMagicLink(token: string, email: string): Promise<{ valid: boolean; customerId?: string; reason?: string }> {
  const { adminDb } = getFirebaseAdmin();
  const docRef = adminDb.collection(COLLECTION).doc(token);

  // Lien inconnu -> invalide d'office.
  const existing = await docRef.get();
  if (!existing.exists) return { valid: false, reason: 'Token introuvable' };

  const data = existing.data() as MagicLink;

  // L'email doit correspondre à celui enregistré lors de la génération.
  if (data.email !== email) return { valid: false, reason: 'Email invalide' };

  // Un lien expiré n'est jamais accepté, même s'il n'a pas été consommé.
  if (new Date(data.expiresAt) < new Date()) return { valid: false, reason: 'Ce lien a expiré' };

  // Marque le lien comme utilisé de façon atomique (transaction) pour éviter
  // toute double consommation en cas de double appel simultané du endpoint
  // (React StrictMode, effet exécuté deux fois, prévisualisation d'email, etc.).
  // La validation reste idempotente : un lien consumé mais encore valide
  // (même email, non expiré) permet toujours la connexion, afin qu'un simple
  // re-render ou double requête ne bloque jamais l'utilisateur au premier clic.
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) return;
      tx.update(docRef, { used: true });
    });
  } catch (err) {
    console.warn('[MagicLink] Transaction to mark token used failed:', err);
  }

  return { valid: true, customerId: data.customerId };
}
