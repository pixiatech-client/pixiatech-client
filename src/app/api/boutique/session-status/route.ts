import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getProfessionalInfo } from '@/lib/professional-info';

const EMPTY_PROFILE = {
  loggedIn: false,
  email: '',
  displayName: '',
  companyName: '',
  phone: '',
  companyAddress: '',
  addressLine2: '',
  country: '',
  city: '',
  zipCode: '',
  civility: '',
};

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

    let extras = {
      siret: '',
      siretVerified: false,
      vatNumber: '',
      vatValidated: false,
      emailVerified: false,
      hasPassword: false,
      avatarUrl: '',
      legalStatus: '',
      nafCode: '',
      createdAt: '',
      lastLoginAt: '',
    };

    if (customerId) {
      try {
        const { adminDb } = getFirebaseAdmin();
        const snap = await adminDb.collection('customers').doc(customerId).get();
        if (!snap.exists) {
          // Compte supprimé : la session n'est plus valide.
          return NextResponse.json(EMPTY_PROFILE);
        }
        const d = snap.data() || {};
        if (d.status !== undefined && d.status !== 'active') {
          // Compte désactivé : la session n'est plus valide.
          return NextResponse.json(EMPTY_PROFILE);
        }
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
        extras = {
          siret: typeof d.siret === 'string' ? d.siret : '',
          siretVerified: d.siretVerified === true,
          vatNumber: typeof d.vatNumber === 'string' ? d.vatNumber : '',
          vatValidated: d.vatValidated === true,
          emailVerified: d.emailVerified === true,
          hasPassword: !!d.passwordHash,
          avatarUrl: typeof d.avatarUrl === 'string' ? d.avatarUrl : '',
          legalStatus: typeof d.legalStatus === 'string' ? d.legalStatus : '',
          nafCode: typeof d.nafCode === 'string' ? d.nafCode : '',
          createdAt: typeof d.createdAt === 'string' ? d.createdAt : '',
          lastLoginAt: typeof d.lastLoginAt === 'string' ? d.lastLoginAt : '',
        };

        try {
          const profInfo = await getProfessionalInfo(customerId);
          if (profInfo) {
            extras = {
              ...extras,
              siret: extras.siret || String(profInfo.siret || ''),
              siretVerified: extras.siretVerified || (!!profInfo.siret && !!profInfo.validatedAt),
              vatNumber: extras.vatNumber || String(profInfo.vatNumber || ''),
              vatValidated: profInfo.vatValidated === true,
              nafCode: String(profInfo.nafCode || ''),
            };
          }
        } catch {
          // Infos pro optionnelles : on pré-remplit simplement moins de champs.
        }
      } catch {
        // Erreur Firestore inattendue : impossible de confirmer la session → fail-closed.
        return NextResponse.json(EMPTY_PROFILE);
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
      ...extras,
    });
  } catch {
    return NextResponse.json(EMPTY_PROFILE);
  }
}
