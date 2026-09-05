import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail } from '@/lib/customers';
import { createMagicLink } from '@/lib/magic-link';
import { getSmtpTransport } from '@/lib/smtpService';
import { rateLimitExceeded } from '@/lib/rate-limit';

function buildMagicLinkEmailHtml(linkUrl: string, expiresInMinutes: number, hasPassword: boolean, mode: 'login' | 'password', loginUrl: string): string {
  const setPasswordUrl = `${linkUrl}&set-password=1`;
  const primaryHref = mode === 'password' ? setPasswordUrl : linkUrl;
  const primaryLabel = mode === 'password' ? 'Créer mon mot de passe' : 'Se connecter';
  const title = mode === 'password' ? 'Créer votre mot de passe' : 'Connexion à votre espace client';
  const intro = mode === 'password'
    ? 'Cliquez sur le bouton ci-dessous pour créer le mot de passe de votre compte client.'
    : 'Cliquez sur le bouton ci-dessous pour accéder à votre espace client.';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">${title}</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
            ${intro}
            Ce lien expire dans ${expiresInMinutes} minutes.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <a href="${primaryHref}" style="display:inline-block;padding:14px 40px;background:#111827;color:#fff;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
            ${primaryLabel}
          </a>
        </td></tr>
        ${mode === 'login' ? `
        <tr><td style="padding:0 32px 24px;border-top:1px solid #f0f0f0;">
          <p style="font-size:13px;color:#6b7280;margin:16px 0 8px;line-height:1.5;">
            ${hasPassword ? 'Vous pouvez aussi vous connecter avec votre adresse email et votre mot de passe.' : 'Vous préférez utiliser un mot de passe ?'}
          </p>
          <a href="${hasPassword ? loginUrl : setPasswordUrl}" style="display:inline-block;padding:12px 28px;background:#ffffff;color:#111827;border:1px solid #d1d5db;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;">
            ${hasPassword ? 'Se connecter avec mon mot de passe' : 'Créer mon mot de passe'}
          </a>
        </td></tr>` : `
        <tr><td style="padding:0 32px 24px;border-top:1px solid #f0f0f0;">
          <p style="font-size:13px;color:#6b7280;margin:16px 0 8px;line-height:1.5;">
            Vous pourrez ensuite vous connecter avec votre adresse email et votre mot de passe. Votre lien de connexion par email continuera de fonctionner à tout moment.
          </p>
        </td></tr>`}
        <tr><td style="padding:0 32px 24px;">
          <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;line-height:1.4;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            Aucun changement n'a été apporté à votre compte.
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
    if (rateLimitExceeded(req, 6, 240, 60_000)) {
      return NextResponse.json({ error: 'Trop de demandes de lien, veuillez réessayer plus tard' }, { status: 429 });
    }

    const { email, setPassword } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const customer = await findCustomerByEmail(normalizedEmail);

    if (!customer) {
      // Anti-énumération : réponse 200 identique à celle d'un compte existant.
      // On ne révèle jamais si le compte existe ou non.
      return NextResponse.json({
        message: 'Si un compte correspondant existe, un lien de connexion vous sera envoyé à cette adresse.',
      });
    }

    const hasPassword = !!(customer as any).passwordHash;

    // Create magic link
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const { url } = await createMagicLink(normalizedEmail, customer.id!, origin);

    const mode: 'login' | 'password' = setPassword ? 'password' : 'login';

    // Send email to the actual recipient (no more sandbox redirect)
    const { transporter, fromHeader } = await getSmtpTransport();
    await transporter.sendMail({
      from: fromHeader,
      to: normalizedEmail,
      subject: mode === 'password' ? 'Créer votre mot de passe PIXIATECH' : 'Connexion à votre espace client PIXIATECH',
      html: buildMagicLinkEmailHtml(url, 15, hasPassword, mode, `${origin}/mon-compte/connexion`),
    });

    console.log(`[MagicLink] Sent to ${normalizedEmail} (mode: ${mode})`);

    return NextResponse.json({
      message: 'Si un compte correspondant existe, un lien de connexion vous sera envoyé à cette adresse.',
    });
  } catch (err: any) {
    console.error('[MagicLink] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du lien' }, { status: 500 });
  }
}
