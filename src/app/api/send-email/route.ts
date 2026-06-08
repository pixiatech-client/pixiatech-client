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

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; background-color: #f8fafc; min-height: 100%;">
        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
          
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; padding: 10px 16px;">
            <tr>
              <td align="left" style="line-height: 0;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; margin-right: 4px;"></span>
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #f59e0b; margin-right: 4px;"></span>
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #10b981;"></span>
              </td>
              <td align="right" style="color: #a1a1aa; font-size: 9px; font-family: monospace;">
                Client Webmail Sécurisé
              </td>
            </tr>
          </table>

          <div style="padding: 30px; text-align: center; border-bottom: 1px solid #f4f4f5;">
            <div style="margin-bottom: 15px; text-align: center;">
              <span style="background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 9px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                Reçu à l'instant
              </span>
            </div>
            <h1 style="color: #18181b; font-size: 22px; font-weight: 800; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
              AUTHENTIFICATION
            </h1>
            <div style="display: inline-flex; align-items: center; background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: bold; color: #2563eb; margin: 5px 0;">
              ⏳ 10:00
            </div>
          </div>

          <div style="padding: 30px; text-align: center;">
            <p style="color: #71717a; font-size: 13px; line-height: 1.5; margin-bottom: 25px; text-align: left;">
              Bonjour ${clientName || ''},<br/><br/>Un code d'authentification temporaire a été généré pour finaliser la signature électronique de votre estimation PixiaTech.
            </p>

            <div style="margin: 25px 0;">
              <span style="display: block; font-size: 9px; text-transform: uppercase; color: #a1a1aa; letter-spacing: 1px; margin-bottom: 10px; font-weight: bold;">
                Votre code d'authentification
              </span>
              <div style="text-align: center; display: block; margin: 15px 0;">
                ${code.split('').map(digit => `
                  <div style="width: 42px; height: 50px; background-color: #eff6ff; border: 2px solid #dbeafe; color: #2563eb; font-weight: 900; font-family: monospace; font-size: 24px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin: 0 4px; line-height: 50px; text-align: center;">
                    ${digit}
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="margin: 30px 0;">
              <a href="${directConnectUrl}" style="background-color: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 9999px; display: inline-block; font-size: 13px; font-weight: bold; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                Valider et continuer (Lien direct)
              </a>
            </div>

            <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 11px; color: #1e3a8a; line-height: 1.5; font-weight: bold;">
                🚨 Information de sécurité :
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #1e40af; line-height: 1.5;">
                "Ce code est strictement personnel. Ne le partagez jamais avec un tiers, y compris un collaborateur PixiaTech."
              </p>
            </div>

            <div style="border-top: 1px solid #f4f4f5; padding-top: 20px; color: #a1a1aa; font-size: 10px; line-height: 1.4;">
              Ce message automatique est crypté. PandaDoc Secure Shield.
            </div>

          </div>
        </div>
      </div>
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
