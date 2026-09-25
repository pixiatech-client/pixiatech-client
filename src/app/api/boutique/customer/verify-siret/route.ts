import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { upsertProfessionalInfo } from '@/lib/professional-info';

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const siret = String(body.siret || '').replace(/\s+/g, '');

    if (!/^\d{14}$/.test(siret)) {
      return NextResponse.json({ error: 'Le numéro SIRET doit contenir 14 chiffres.' }, { status: 400 });
    }

    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    if (!companyName) {
      return NextResponse.json({ error: 'Raison sociale manquante.' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const customerRef = adminDb.collection('customers').doc(customerId);
    const customerSnap = await customerRef.get();

    const address = typeof body.address === 'string' ? body.address : '';
    const postcode = typeof body.postcode === 'string' ? body.postcode : '';
    const city = typeof body.city === 'string' ? body.city : '';
    const country = typeof body.country === 'string' && body.country ? body.country : 'France';
    const vatNumber = typeof body.vatNumber === 'string' ? body.vatNumber : '';
    const nafCode = typeof body.nafCode === 'string' ? body.nafCode : '';

    const now = new Date().toISOString();
    const email =
      customerSnap.exists && typeof customerSnap.data()?.email === 'string'
        ? String(customerSnap.data()!.email)
        : '';

    await customerRef.set(
      {
        siret,
        siretVerified: true,
        siretVerifiedAt: now,
        companyName,
        companyAddress: address || String(customerSnap.data()?.companyAddress || ''),
        companyCity: city,
        companyPostalCode: postcode,
        companyCountry: country,
        vatNumber: vatNumber || String(customerSnap.data()?.vatNumber || ''),
        updatedAt: now,
      },
      { merge: true }
    );

    await upsertProfessionalInfo(customerId, {
      companyName,
      siret,
      vatNumber,
      address,
      city,
      state: typeof body.state === 'string' ? body.state : '',
      postcode,
      country,
      officePhone: '',
      companyEmail: email,
      position: '',
      employees: '',
      website: '',
      fax: '',
      vatValidated: false,
      vatRate: 0,
      nafCode,
    });

    return NextResponse.json({ success: true, siretVerified: true });
  } catch (err: any) {
    console.error('[VerifySiret] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
