import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { code } = await req.json();
    if (typeof code !== 'string' || !/^\d{4}$/.test(code.trim())) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const customerRef = adminDb.collection('customers').doc(customerId);
    const customerSnap = await customerRef.get();
    if (!customerSnap.exists) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const data = customerSnap.data() || {};
    const storedCode = String(data.emailVerificationCode || '');
    const expiresAt = String(data.emailVerificationCodeExpiresAt || '');

    if (!storedCode) {
      return NextResponse.json({ error: 'Aucun code en attente. Demandez-en un nouveau.' }, { status: 400 });
    }
    if (code.trim() !== storedCode) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 401 });
    }
    if (expiresAt) {
      const exp = new Date(expiresAt).getTime();
      if (!isNaN(exp) && exp < Date.now()) {
        return NextResponse.json({ error: 'Code expiré. Demandez-en un nouveau.' }, { status: 410 });
      }
    }

    await customerRef.update({
      emailVerified: true,
      emailVerificationCode: '',
      emailVerificationCodeExpiresAt: '',
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (err: any) {
    console.error('[EmailVerifyCode] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
