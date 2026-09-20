import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
