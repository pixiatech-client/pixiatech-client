export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

const SETTINGS_DOC_ID = 'app-settings';

export async function GET() {
  const { adminAuth, adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ valid: false, reason: 'admin_sdk_not_initialized' }, { status: 500 });
  }

  try {
    const sessionCookie = cookies().get('session')?.value;
    const sessionTokenCookie = cookies().get('sessionToken')?.value;

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

    const storedToken = userDoc.data()?.sessionToken;
    if (storedToken && storedToken !== sessionTokenCookie) {
      return NextResponse.json({ valid: false, reason: 'session_mismatch', uid, sessionCreatedAt: userDoc.data()?.sessionCreatedAt ?? null });
    }

    return NextResponse.json({ valid: true, uid });
  } catch (err: any) {
    console.error('[verify-session] Error:', err);
    return NextResponse.json({ valid: false, reason: err?.code || 'error' });
  }
}
