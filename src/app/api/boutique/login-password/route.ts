import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findCustomerByEmail, updateCustomer } from '@/lib/customers';
import { encrypt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const customer = await findCustomerByEmail(normalizedEmail);
    if (!customer) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Check if customer has a password set
    const { adminDb } = await import('@/lib/firebase-admin').then(m => m.getFirebaseAdmin());
    const fresh = await adminDb.collection('customers').doc(customer.id!).get();
    const customerData = fresh.data()!;
    const hash = customerData.passwordHash || null;

    if (!hash) {
      return NextResponse.json({
        error: 'Aucun mot de passe défini. Utilisez la connexion par lien magique.',
      }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Update lastLoginAt
    await updateCustomer(customer.id!, { lastLoginAt: new Date().toISOString() });

    // Create session cookie
    const sessionToken = await encrypt(
      { customerId: customer.id, email: normalizedEmail, type: 'client' },
      '12h'
    );

    const response = NextResponse.json({ success: true });
    response.cookies.set('client_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (err: any) {
    console.error('[LoginPassword] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
