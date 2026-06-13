import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { buildSecureEmailHtml } from '@/lib/email-templates';
import { getSmtpSettings } from '@/lib/smtpService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, code, smtpConfig, companyName, companySlogan, documentLabel, validityMinutes, messageStyle, theme, lang } = body;

    if (!to) {
      return NextResponse.json({ error: "L'adresse e-mail du destinataire est requise." }, { status: 400 });
    }

    const dbSmtp = await getSmtpSettings();
    const host = smtpConfig?.host || (dbSmtp.isCustom ? dbSmtp.host : null) || process.env.SMTP_HOST || process.env.MAIL_HOST;
    const portStr = smtpConfig?.port || (dbSmtp.isCustom ? String(dbSmtp.port) : null) || process.env.SMTP_PORT || process.env.MAIL_PORT;
    const user = smtpConfig?.user || (dbSmtp.isCustom ? dbSmtp.user : null) || process.env.SMTP_USER || process.env.MAIL_USER || process.env.MAIL_USERNAME;
    const pass = smtpConfig?.pass || (dbSmtp.isCustom ? dbSmtp.pass : null) || process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.MAIL_PASSWORD;
    const from = smtpConfig?.from || (dbSmtp.isCustom ? `"${dbSmtp.fromName}" <${dbSmtp.fromEmail}>` : null) || process.env.SMTP_FROM || process.env.MAIL_FROM || 'PixiaTech Pro <noreply@pixiatech.com>';

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

    const emailHtml = buildSecureEmailHtml({
      code,
      companyName: companyName || 'PIXIATECH',
      companySlogan: companySlogan || 'TECHNOLOGY PRO',
      documentLabel: documentLabel || 'estimation du projet',
      validityMinutes: validityMinutes || 10,
      messageStyle: messageStyle || 'collaborative_trust',
      theme: theme || 'light_premium',
      lang: lang || 'fr',
    });

    const result = await transporter.sendMail({
      from: finalFrom,
      to,
      subject: `🛡️ ${companyName || 'PixiaTech'} — ${lang === 'en' ? 'Secure Code' : 'Code de sécurité'}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('[API/send-email] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
