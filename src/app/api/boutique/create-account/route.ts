import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  createCustomer,
  findCustomerByEmail,
  updateCustomer,
  upsertCustomer,
} from '@/lib/customers';
import { encrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createMagicLink } from '@/lib/magic-link';
import { getSmtpTransport } from '@/lib/smtpService';

function buildMagicLinkEmailHtml(linkUrl: string, expiresInMinutes: number): string {
  const setPasswordUrl = `${linkUrl}&set-password=1`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">Bienvenue chez PIXIATECH</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
            Votre compte client a été créé automatiquement.<br/>
            Cliquez sur le bouton ci-dessous pour accéder à votre espace client grâce au lien sécurisé.
            Ce lien expire dans ${expiresInMinutes} minutes.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <a href="${linkUrl}" style="display:inline-block;padding:14px 40px;background:#111827;color:#fff;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
            Accéder à mon espace
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;border-top:1px solid #f0f0f0;">
          <p style="font-size:13px;color:#6b7280;margin:16px 0 8px;line-height:1.5;">
            Vous préférez utiliser un mot de passe ?
          </p>
          <a href="${setPasswordUrl}" style="display:inline-block;padding:12px 28px;background:#ffffff;color:#111827;border:1px solid #d1d5db;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;">
            Créer mon mot de passe
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;line-height:1.4;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, password, civility, companyName, phone, addressLine1, addressLine2, postcode, city, country } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await findCustomerByEmail(normalizedEmail);

    // Compte complet avec mot de passe : création + connexion automatique
    if (password && typeof password === 'string' && password.length > 0) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
      }
      if (existing) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();
      const passwordHash = await bcrypt.hash(password, 10);
      const id = await createCustomer({
        email: normalizedEmail,
        displayName: displayName.trim(),
        phone: phone || '',
        createdAt: now,
        lastLoginAt: now,
        status: 'active',
      });
      if (!id) {
        return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
      }

      const { adminDb } = getFirebaseAdmin();
      await adminDb.collection('customers').doc(id).update({
        passwordHash,
        civility: civility || '',
        companyName: companyName || '',
        addressLine1: addressLine1 || '',
        addressLine2: addressLine2 || '',
        postcode: postcode || '',
        city: city || '',
        country: country || 'FR',
      });

      // Connexion automatique
      const sessionToken = await encrypt(
        { customerId: id, email: normalizedEmail, type: 'client' },
        '12h'
      );
      const response = NextResponse.json({
        success: true,
        message: 'Votre compte a été créé et vous êtes connecté.',
      });
      response.cookies.set('client_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12,
      });
      return response;
    }

    // Flux sans mot de passe : upsert + lien magique (rétrocompatible)
    const { id } = await upsertCustomer(normalizedEmail, displayName.trim(), phone || '');
    if (!id) {
      return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
    }

    const origin = req.nextUrl.origin;
    const { url } = await createMagicLink(normalizedEmail, id, origin);

    const { transporter, fromHeader } = await getSmtpTransport();
    await transporter.sendMail({
      from: fromHeader,
      to: normalizedEmail,
      subject: 'Bienvenue chez PIXIATECH — Confirmez votre email',
      html: buildMagicLinkEmailHtml(url, 15),
    });

    return NextResponse.json({
      message: 'Votre compte a été créé. Vérifiez votre boîte email pour vous connecter.',
    });
  } catch (err: any) {
    console.error('[CreateAccount] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
  }
}