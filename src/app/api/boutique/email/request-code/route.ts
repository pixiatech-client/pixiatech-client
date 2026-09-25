import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { getSmtpTransport } from '@/lib/smtpService';

const MIN_RETRY_DELAY_MS = 60_000;
const CODE_TTL_MS = 15 * 60_000;

function buildCodeEmailHtml(customerName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 8px;">Vérification de votre adresse e-mail</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.5;">
            Bonjour ${customerName || ''},<br/>
            Utilisez le code ci-dessous pour confirmer votre adresse e-mail dans votre espace client :
          </p>
          <p style="font-size:32px;font-weight:800;letter-spacing:12px;color:#111827;background:#fafafa;border:1px dashed #e5e7eb;border-radius:12px;padding:16px 0;text-align:center;margin:0 0 16px;">${code}</p>
          <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.4;">Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { adminDb } = getFirebaseAdmin();
    const customerRef = adminDb.collection('customers').doc(customerId);
    const customerSnap = await customerRef.get();
    if (!customerSnap.exists) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const data = customerSnap.data() || {};
    const email = String(data.email || '');
    if (!email) {
      return NextResponse.json({ error: 'Aucune adresse e-mail associée' }, { status: 400 });
    }

    const lastRequestedAt = data.emailVerificationRequestedAt;
    if (lastRequestedAt) {
      const last = new Date(String(lastRequestedAt)).getTime();
      if (!isNaN(last) && Date.now() - last < MIN_RETRY_DELAY_MS) {
        return NextResponse.json(
          { error: 'Un code a déjà été envoyé. Patientez une minute avant de réessayer.' },
          { status: 429 }
        );
      }
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const now = Date.now();

    await customerRef.set(
      {
        emailVerificationCode: code,
        emailVerificationCodeExpiresAt: new Date(now + CODE_TTL_MS).toISOString(),
        emailVerificationRequestedAt: new Date(now).toISOString(),
      },
      { merge: true }
    );

    let emailSent = false;
    try {
      const { transporter, fromHeader } = await getSmtpTransport();
      await transporter.sendMail({
        from: fromHeader,
        to: email,
        subject: 'Votre code de vérification — PIXIATECH',
        html: buildCodeEmailHtml(String(data.displayName || ''), code),
      });
      emailSent = true;
    } catch (err) {
      console.error('[EmailRequestCode] Failed to send code email:', err);
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: "Impossible d'envoyer le code par e-mail. Réessayez dans quelques minutes." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[EmailRequestCode] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
