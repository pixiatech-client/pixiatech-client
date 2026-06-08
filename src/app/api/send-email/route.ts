import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, code, companyName, clientName, totalAmount, details, appUrl, smtpConfig } = body;

    if (!to) {
      return NextResponse.json({ error: "L'adresse e-mail du destinataire est requise." }, { status: 400 });
    }

    const host = smtpConfig?.host || process.env.SMTP_HOST || process.env.MAIL_HOST;
    const portStr = smtpConfig?.port || process.env.SMTP_PORT || process.env.MAIL_PORT;
    const user = smtpConfig?.user || process.env.SMTP_USER || process.env.MAIL_USER || process.env.MAIL_USERNAME;
    const pass = smtpConfig?.pass || process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.MAIL_PASSWORD;
    const from = smtpConfig?.from || process.env.SMTP_FROM || process.env.MAIL_FROM || 'PixiaTech Pro <noreply@pixiatech.com>';

    if (!host || !user || !pass) {
      return NextResponse.json({ 
        success: true, 
        simulated: true, 
        message: 'SMTP non configuré dans l\'environnement.' 
      });
    }

    const port = portStr ? parseInt(portStr, 10) : 587;
    const isSecure = port === 465;

    let finalFrom = from;
    if (user && user.includes('@')) {
      const namePart = from.includes('<') ? from.split('<')[0].trim() : 'PixiaTech Pro';
      finalFrom = `${namePart} <${user}>`;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });

    const directConnectUrl = `${appUrl}?code=${code}`;
    const copyConnectUrl = `${appUrl}?code=${code}&copy=true`;
    const cleanAppUrl = appUrl.split('?')[0];

    const emissionTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
    const expirationDate = new Date(Date.now() + 10 * 60 * 1000);
    const expirationTime = expirationDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Authentification Sécurisée PixiaTech Pro</title>
      </head>
      <body style="margin: 0; padding: 40px 10px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Title mock browser bar (Apple inspired dots & label) -->
          <div style="background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; padding: 12px 20px; box-sizing: border-box;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="text-align: left; width: 33%;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #ff5f56; margin-right: 4px;"></span>
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #ffbd2e; margin-right: 4px;"></span>
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #27c93f;"></span>
                </td>
                <td style="text-align: right; font-family: monospace; font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; width: 67%;">
                  Client Webmail Sécurisé
                </td>
              </tr>
            </table>
          </div>

          <!-- Main Card Body -->
          <div style="padding: 40px 30px; text-align: center;">
            
            <!-- Premium PixiaTech Brand Logo (Circular Gradient representation) -->
            <table align="center" style="margin: 0 auto 18px auto; border-collapse: collapse; text-align: center;">
              <tr>
                <td align="center" style="padding: 0;">
                  <div style="background-color: #0c0d12; border-radius: 20px; padding: 10px 24px; display: inline-block; border: 1px solid #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <table style="border-collapse: collapse; margin: 0 auto;">
                      <tr>
                        <td style="padding: 0; vertical-align: middle; text-align: left;">
                          <div style="width: 32px; height: 32px; background-color: #090a0f; border: 2.5px solid #8076f8; border-radius: 50%; text-align: center; display: inline-block; vertical-align: middle; box-sizing: border-box;">
                            <div style="font-family: Arial, sans-serif; font-size: 6.5px; font-weight: 900; color: #ffffff; padding-top: 6px; line-height: 1.1; letter-spacing: 0.3px;">PIXIA</div>
                            <div style="font-family: Arial, sans-serif; font-size: 6.5px; font-weight: 900; color: #ffffff; line-height: 1.1; letter-spacing: 0.3px;">TECH</div>
                          </div>
                        </td>
                        <td style="padding-left: 10px; vertical-align: middle; text-align: left;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 1px; line-height: 1.1;">PIXIATECH</div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 8px; font-weight: 700; color: #3b82f6; letter-spacing: 2px; margin-top: 1px; text-transform: uppercase; line-height: 1;">TECHNOLOGY PRO</div>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Header title -->
            <h3 style="margin: 0 0 6px 0; font-family: sans-serif; font-size: 14px; font-weight: 900; color: #111827; letter-spacing: 1px; text-transform: uppercase;">
              Authentification
            </h3>
            <p style="margin: 0 auto 15px auto; font-family: sans-serif; font-size: 12px; color: #4b5563; line-height: 1.5; max-width: 360px;">
              Un code de sécurité est requis pour accéder à votre estimation Pixiatech.
            </p>

            <!-- Dynamic Clock countdown showing absolute times -->
            <div style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; padding: 6px 16px; font-family: sans-serif; font-size: 11px; font-weight: bold; color: #2563eb; margin-bottom: 25px; box-shadow: 0 1px 2px rgba(37,99,235,0.05);">
              🕒 Émis à ${emissionTime} • Valide 10 min • Expire à ${expirationTime} (Europe/Paris)
            </div>

            <!-- Segmented OTP Letters with single-unit copying -->
            <table style="margin: 0 auto 24px auto; text-align: center; border-collapse: collapse; width: 100%;">
              <tr>
                <td style="font-family: sans-serif; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 12px; font-weight: bold; text-align: center;">
                  Votre code temporaire d'authentification
                </td>
              </tr>
              <tr>
                <td style="text-align: center;">
                  <div style="margin: 0 auto 16px auto; display: inline-block; padding: 12px 24px; background-color: #f5fafd; border: 2.5px solid #3b82f6; border-radius: 14px; text-align: center; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.05);">
                    <span style="font-family: monospace, Courier, monospace; font-size: 26px; font-weight: 950; color: #2563eb; letter-spacing: 5px; text-transform: uppercase; user-select: all; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all;">${code}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="text-align: center; padding-top: 2px;">
                  <a href="${copyConnectUrl}" style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px 20px; font-family: sans-serif; font-size: 11px; font-weight: bold; color: #2563eb; text-decoration: none; cursor: pointer; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.04);">
                    📋 Copier le code dans le presse-papier
                  </a>
                </td>
              </tr>
            </table>

            <!-- Red security warning block card -->
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 16px 18px; text-align: left; margin-bottom: 25px; box-sizing: border-box;">
              <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
                <tr>
                  <td style="vertical-align: top; width: 20px; padding: 0;">
                    <span style="font-size: 16px; line-height: 1.2;">⚠️</span>
                  </td>
                  <td style="vertical-align: top; padding: 0 0 0 10px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; font-weight: 900; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; line-height: 1;">
                      Information de sécurité importante
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 600; color: #991b1b; line-height: 1.5;">
                      Ce code est strictement personnel. Ne le communiquez sous aucun prétexte, y compris aux collaborateurs Pixiatech. Il sert à prouver votre identité pour signer électroniquement l'estimation.
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Direct validate link button -->
            <div style="margin-bottom: 25px;">
              <a href="${directConnectUrl}" style="display: inline-block; background-color: #00a870; color: #ffffff; padding: 14px 34px; font-family: sans-serif; font-weight: bold; border-radius: 9999px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 6px 20px rgba(0, 168, 112, 0.25);">
                Valider et continuer (Lien direct)
              </a>
            </div>

            <a href="${cleanAppUrl}" style="display: inline-block; font-family: sans-serif; font-size: 10px; color: #6b7280; text-decoration: underline;">
              Créer un nouveau devis
            </a>

          </div>

          <div style="background-color: #fafafa; border-top: 1px solid #f3f4f6; padding: 20px 24px; text-align: center; font-family: sans-serif; font-size: 10px; color: #9ca3af; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">Ce message automatique est crypté. PandaDoc Secure Shield.</p>
            <p style="margin: 0;">© 2026 PixiaTech Europe. <a href="mailto:contact@pixiatech.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Contacter le support</a></p>
          </div>

        </div>
      </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: finalFrom,
      to,
      subject: '🔑 Authentification PixiaTech',
      html: emailHtml,
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('[API/send-email] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
