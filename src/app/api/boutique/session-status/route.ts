import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const EMPTY_PROFILE = { loggedIn: false, email: '', displayName: '', companyName: '', phone: '', companyAddress: '', addressLine2: '', country: '', city: '', zipCode: '', civility: '' };

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
      addressLine2: '',
      country: '',
      city: '',
      zipCode: '',
      civility: '',
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
            companyAddress: typeof d.companyAddress === 'string' ? d.companyAddress : (typeof d.addressLine1 === 'string' ? d.addressLine1 : ''),
            addressLine2: typeof d.addressLine2 === 'string' ? d.addressLine2 : '',
            country: typeof d.country === 'string' ? d.country : '',
            city: typeof d.city === 'string' ? d.city : '',
            zipCode: typeof d.zipCode === 'string' ? d.zipCode : (typeof d.postcode === 'string' ? d.postcode : ''),
            civility: typeof d.civility === 'string' ? d.civility : '',
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
      addressLine2: profile.addressLine2,
      country: profile.country,
      city: profile.city,
      zipCode: profile.zipCode,
      civility: profile.civility,
    });
  } catch {
    return NextResponse.json(EMPTY_PROFILE);
  }
}