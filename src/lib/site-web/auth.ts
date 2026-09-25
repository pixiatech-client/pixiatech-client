import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function requireAdmin(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié', error: 'Non authentifié' },
      { status: 401 }
    );
  }
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé', error: 'Non autorisé' },
        { status: 403 }
      );
    }
    return { uid: decoded.uid };
  } catch (err: unknown) {
    console.error('[siteWeb requireAdmin] Error:', err);
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
