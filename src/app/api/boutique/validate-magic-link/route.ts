import { NextRequest, NextResponse } from 'next/server';
import { validateMagicLink } from '@/lib/magic-link';
import { updateCustomer } from '@/lib/customers';
import { encrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    const email = req.nextUrl.searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ valid: false, reason: 'Paramètres manquants' }, { status: 400 });
    }

    const result = await validateMagicLink(token, email.toLowerCase().trim());
    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason }, { status: 400 });
    }

    // Update lastLoginAt
    await updateCustomer(result.customerId!, { lastLoginAt: new Date().toISOString() });

    // Create session cookie
    const sessionToken = await encrypt(
      { customerId: result.customerId, email: email.toLowerCase().trim(), type: 'client' },
      '12h'
    );

    const response = NextResponse.json({ valid: true });
    response.cookies.set('client_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (err: any) {
    console.error('[ValidateMagicLink] Error:', err);
    return NextResponse.json({ valid: false, reason: 'Erreur serveur' }, { status: 500 });
  }
}
