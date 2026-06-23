import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
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

    const { companyName, siret, vatNumber, address, city, postalCode, country } = await req.json();

    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('customers').doc(customerId).update({
      companyName: companyName || '',
      siret: siret || '',
      vatNumber: vatNumber || '',
      fiscalAddress: address || '',
      fiscalCity: city || '',
      fiscalPostalCode: postalCode || '',
      fiscalCountry: country || 'France',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
