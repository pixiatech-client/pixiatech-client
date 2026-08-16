import { cookies } from 'next/headers';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { DocumentData } from 'firebase-admin/firestore';

export class AuthError extends Error {
  readonly status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    Object.defineProperty(this, 'message', { value: message, enumerable: true });
  }
}

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  status: 'pending' | 'approved';
  phone?: string;
  photoURL?: string;
  originalAdminUid?: string;
};

export async function requireSession(): Promise<AuthUser> {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) {
    throw new AuthError('Access denied. No active session.', 401);
  }

  const { adminAuth, adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    throw new AuthError('Service unavailable.', 503);
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
    if (!userDoc.exists) {
      throw new AuthError('Access denied. Account not found.', 403);
    }

    const data = userDoc.data() as DocumentData;
    return {
      uid: decodedClaims.uid,
      email: data.email ?? '',
      displayName: data.displayName ?? data.email ?? '',
      role: data.role ?? '',
      status: data.status === 'approved' ? 'approved' : 'pending',
      phone: data.phone,
      photoURL: data.photoURL,
      originalAdminUid: decodedClaims.original_admin_uid,
    };
  } catch (error: any) {
    if (error instanceof AuthError) throw error;
    if (error?.code === 'auth/session-cookie-revoked') {
      throw new AuthError('Access denied. Session revoked.', 401);
    }
    throw new AuthError('Access denied. Invalid session.', 401);
  }
}

export async function requireRole(...allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireSession();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError('Access denied. Insufficient role.', 403);
  }
  return user;
}

export async function requireAdminFresh(): Promise<AuthUser> {
  const user = await requireRole('admin');
  if (user.status !== 'approved') {
    throw new AuthError('Access denied. Account not approved.', 403);
  }
  return user;
}
