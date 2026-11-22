import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function requireAdmin(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  const sessionCookie =
    request.cookies.get('session')?.value || request.cookies.get('__session')?.value;

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  // En local / développement : si aucun cookie/token n'est transmis,
  // autoriser la session locale dev pour ne pas bloquer les modifications CMS.
  if (!sessionCookie && !bearerToken) {
    if (process.env.NODE_ENV === 'development') {
      return { uid: 'dev-admin-local' };
    }
    return NextResponse.json(
      { success: false, message: 'Non authentifié', error: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    let uid = '';

    if (bearerToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(bearerToken);
        uid = decodedToken.uid;
      } catch {
        // Fallback vers sessionCookie si le bearer token a expiré
      }
    }

    if (!uid && sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      uid = decoded.uid;
    }

    if (!uid) {
      if (process.env.NODE_ENV === 'development') {
        return { uid: 'dev-admin-local' };
      }
      return NextResponse.json(
        { success: false, message: 'Session invalide ou expirée', error: 'Session invalide' },
        { status: 401 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : null;
    const isAllowed = userDoc.exists && (role === 'admin' || role === 'super_admin' || role === 'commercial');

    if (!isAllowed) {
      if (process.env.NODE_ENV === 'development') {
        return { uid };
      }
      return NextResponse.json(
        { success: false, message: 'Non autorisé', error: 'Non autorisé' },
        { status: 403 }
      );
    }
    return { uid };
  } catch (err: unknown) {
    console.error('[siteWeb requireAdmin] Error:', err);
    if (process.env.NODE_ENV === 'development') {
      console.warn('[siteWeb requireAdmin] Dev fallback actif malgré l\'erreur d\'authentification:', (err as Error).message);
      return { uid: 'dev-admin-local' };
    }
    return NextResponse.json(
      {
        success: false,
        message: "Erreur d'authentification",
        error: (err as Error).message,
      },
      { status: 401 }
    );
  }
}
