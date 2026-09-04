import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const EMPTY_PROFILE = { loggedIn: false, email: '', displayName: '', companyName: '', phone: '', companyAddress: '', country: '', city: '', zipCode: '' };

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('client_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json(EMPTY_PROFILE);
  }

  try {
    const payload = await decrypt(sessionCookie);
    const customerId = payload.customerId || '';
    let profile = {
      displayName: '',
      companyName: '',
      phone: '',
      officePhone: '',
      companyAddress: '',
      country: '',
      city: '',
      zipCode: '',
    };

    if (customerId) {
      try {
        const { adminDb } = getFirebaseAdmin();
        const snap = await adminDb.collection('customers').doc(customerId).get();
        if (snap.exists) {
          const d = snap.data() || {};
          profile = {
            displayName: typeof d.displayName === 'string' ? d.displayName : '',
            companyName: typeof d.companyName === 'string' ? d.companyName : '',
            phone: typeof d.phone === 'string' ? d.phone : '',
            officePhone: typeof d.officePhone === 'string' ? d.officePhone : '',
            companyAddress: typeof d.companyAddress === 'string' ? d.companyAddress : '',
            country: typeof d.country === 'string' ? d.country : '',
            city: typeof d.city === 'string' ? d.city : '',
            zipCode: typeof d.zipCode === 'string' ? d.zipCode : '',
          };
        }
      } catch {
        // Le profil est optionnel : on pré-remplit simplement moins de champs.
      }
    }

    return NextResponse.json({
      loggedIn: true,
      email: payload.email || '',
      customerId,
      displayName: profile.displayName,
      companyName: profile.companyName,
      phone: profile.phone,
      officePhone: profile.officePhone,
      companyAddress: profile.companyAddress,
      country: profile.country,
      city: profile.city,
      zipCode: profile.zipCode,
    });
  } catch {
    return NextResponse.json(EMPTY_PROFILE);
  }
}