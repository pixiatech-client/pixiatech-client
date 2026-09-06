import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { rateLimitExceeded } from '@/lib/rate-limit';

/**
 * GET /api/boutique/check-email?email=...
 *
 * Verifie si un email est deja associe a un compte client existant.
 * Utilise au debounce de la saisie d'email en checkout pour forcer
 * la connexion avant paiement si le compte existe.
 *
 * Ne renvoie pas d'information sur le compte (nom, solde, etc.)
 * pour eviter l'enumeration : uniquement { exists: boolean }.
 */
export async function GET(req: NextRequest) {
  try {
    if (rateLimitExceeded(req, 20, 60)) {
      return NextResponse.json({ error: 'Trop de requetes' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ exists: false });
    }

    const { adminAuth } = getFirebaseAdmin();

    let exists = false;
    try {
      await adminAuth.getUserByEmail(email);
      exists = true;
    } catch (err: any) {
      // auth/user-not-found => exists reste false
      if (err?.code !== 'auth/user-not-found') throw err;
    }

    return NextResponse.json({ exists });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
