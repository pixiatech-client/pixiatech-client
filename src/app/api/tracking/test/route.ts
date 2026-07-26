import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/tracking/api';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

async function requireAdminSession(req: Request): Promise<NextResponse | null> {
  const cookieHeader = req.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  if (!sessionMatch) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }
    const decoded = await adminAuth.verifySessionCookie(decodeURIComponent(sessionMatch[1]), true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const authErr = await requireAdminSession(req);
    if (authErr) return authErr;

    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider et API key requis' }, { status: 400 });
    }

    if (provider === '17track') {
      const ok = await testConnection(apiKey);
      if (!ok) {
        return NextResponse.json({ error: 'Connexion échouée' }, { status: 401 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Test non supporté pour ${provider}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
