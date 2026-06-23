import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail } from '@/lib/customers';
import { createMagicLink } from '@/lib/magic-link';
import { getSmtpTransport } from '@/lib/smtpService';

function isSandboxEmail(email: string): boolean {
  return email.includes('@sandbox') || email.includes('@personal.example.com');
}

function buildMagicLinkEmailHtml(linkUrl: string, expiresInMinutes: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">Connexion à votre espace client</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
            Cliquez sur le bouton ci-dessous pour accéder à votre espace client.
            Ce lien expire dans ${expiresInMinutes} minutes.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <a href="${linkUrl}" style="display:inline-block;padding:14px 40px;background:#111827;color:#fff;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
            Se connecter
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.4;">
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
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find customer — don't leak whether email exists
    const customer = await findCustomerByEmail(normalizedEmail);

    // Always return the same message to prevent email enumeration
    if (!customer) {
      return NextResponse.json({
        message: 'Si cet email est associé à un compte, un lien de connexion vous a été envoyé.',
      });
    }

    // Create magic link
    const origin = req.nextUrl.origin;
    const { url } = await createMagicLink(normalizedEmail, customer.id!, origin);

    // Determine recipient
    const isSandbox = isSandboxEmail(normalizedEmail);
    const toEmail = isSandbox ? 'ayanhil@gmail.com' : normalizedEmail;

    // Send email
    const { transporter, fromHeader } = await getSmtpTransport();
    await transporter.sendMail({
      from: fromHeader,
      to: toEmail,
      subject: 'Connexion à votre espace client PIXIATECH',
      html: buildMagicLinkEmailHtml(url, 15),
    });

    console.log(`[MagicLink] Sent to ${toEmail}${isSandbox ? ` (redirected from ${normalizedEmail})` : ''}`);

    return NextResponse.json({
      message: 'Si cet email est associé à un compte, un lien de connexion vous a été envoyé.',
    });
  } catch (err: any) {
    console.error('[MagicLink] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du lien' }, { status: 500 });
  }
}
