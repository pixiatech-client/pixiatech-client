export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

const SETTINGS_DOC_ID = 'main';

export async function GET() {
  const { adminAuth, adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ valid: false, reason: 'admin_sdk_not_initialized' }, { status: 500 });
  }

  try {
    const sessionCookie = (await cookies()).get('session')?.value;
    const sessionTokenCookie = (await cookies()).get('sessionToken')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ valid: false, reason: 'no_session' });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const uid = decoded.uid;

    // Check if single-session is enabled
    let isSingleSession = false;
    try {
      const settingsDoc = await adminDb.collection('settings').doc(SETTINGS_DOC_ID).get();
      isSingleSession = settingsDoc.data()?.isSingleSessionEnabled === true;
    } catch {
      // If we can't read settings, don't enforce single session
    }

    if (!isSingleSession) {
      return NextResponse.json({ valid: true, uid });
    }

    // Check sessionToken match
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ valid: false, reason: 'user_not_found' });
    }

    const userData = userDoc.data();
    const storedToken = userData?.sessionToken;
    const storedCreatedAt = userData?.sessionCreatedAt ?? null;

    // Parse cookieToken and cookieCreatedAt from compound cookie "uuid:timestamp"
    let cookieToken = sessionTokenCookie;
    let cookieCreatedAt: number | null = null;
    if (sessionTokenCookie && sessionTokenCookie.includes(':')) {
      const colonIdx = sessionTokenCookie.lastIndexOf(':');
      cookieToken = sessionTokenCookie.substring(0, colonIdx);
      const tsStr = sessionTokenCookie.substring(colonIdx + 1);
      const parsed = parseInt(tsStr, 10);
      if (!isNaN(parsed)) {
        cookieCreatedAt = parsed;
      }
    }

    if (storedCreatedAt !== null && cookieCreatedAt !== null) {
      // If Firestore has a NEWER sessionCreatedAt, the session was taken over
      if (storedCreatedAt > cookieCreatedAt) {
        return NextResponse.json({ 
          valid: false, 
          reason: 'session_mismatch', 
          uid, 
          sessionCreatedAt: storedCreatedAt 
        });
      }
    } else {
      // Fallback: opaque token comparison for sessions created before the timestamp format
      if (storedToken && storedToken !== cookieToken) {
        return NextResponse.json({ 
          valid: false, 
          reason: 'session_mismatch', 
          uid, 
          sessionCreatedAt: storedCreatedAt 
        });
      }
    }

    return NextResponse.json({ valid: true, uid });
  } catch (err: any) {
    console.error('[verify-session] Error:', err);
    return NextResponse.json({ valid: false, reason: err?.code || 'error' });
  }
}
