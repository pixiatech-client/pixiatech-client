import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

export async function PUT(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, addressLine1, addressLine2, postcode, city, country, companyName, civility } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Prénom, nom et e-mail sont obligatoires.' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('customers').doc(customerId).update({
      displayName: `${firstName} ${lastName}`.trim(),
      email: String(email || '').toLowerCase().trim(),
      phone: phone || '',
      addressLine1: addressLine1 || '',
      addressLine2: addressLine2 || '',
      postcode: postcode || '',
      city: city || '',
      country: country || 'FR',
      civility: civility || '',
      companyName: companyName || '',
      companyAddress: addressLine1 || '',
      zipCode: postcode || '',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}