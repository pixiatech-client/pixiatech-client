import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

export async function GET(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
