import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

const MAX_AVATAR_BYTES = 800 * 1024;

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { avatarUrl } = await req.json();
    if (typeof avatarUrl !== 'string' || !avatarUrl) {
      return NextResponse.json({ error: 'Photo requise' }, { status: 400 });
    }

    const isDataUrl = avatarUrl.startsWith('data:image/');
    const isHttps = avatarUrl.startsWith('https://');
    if (!isDataUrl && !isHttps) {
      return NextResponse.json({ error: 'Format de photo invalide' }, { status: 400 });
    }

    if (isDataUrl) {
      const base64 = avatarUrl.split(',')[1] || '';
      const decoded = Buffer.byteLength(base64, 'base64');
      if (decoded > MAX_AVATAR_BYTES) {
        return NextResponse.json({ error: 'Photo trop lourde (max 800 KB)' }, { status: 413 });
      }
    }

    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('customers').doc(customerId).update({
      avatarUrl,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err: any) {
    console.error('[UploadAvatar] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
