import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('client_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    let customerId: string;
    try {
      const payload = await decrypt(sessionCookie);
      customerId = payload.customerId;
    } catch {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection('customers').doc(customerId).get();

    if (!snap.exists) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

    const data = snap.data();
    return NextResponse.json({
      companyName: data?.companyName || '',
      siret: data?.siret || '',
      vatNumber: data?.vatNumber || '',
      address: data?.fiscalAddress || '',
      city: data?.fiscalCity || '',
      postalCode: data?.fiscalPostalCode || '',
      country: data?.fiscalCountry || 'France',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
