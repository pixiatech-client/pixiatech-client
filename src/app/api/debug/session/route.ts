export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET() {
  const { adminAuth } = getFirebaseAdmin();
  if (!adminAuth) {
    return NextResponse.json({ ok: false, reason: 'admin_sdk_not_initialized' }, { status: 500 });
  }
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        return NextResponse.json({ ok: false, reason: 'no_cookie' }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ ok: true, decoded });
  } catch (err: any) {
    console.error('verifySessionCookie error:', err);
    return NextResponse.json({ ok: false, reason: err?.code || err?.message || 'verify_error' }, { status: 401 });
  }
}
