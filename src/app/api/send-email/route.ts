import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { buildOtpEmailHtml } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, code, smtpConfig } = body;

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

    const emailHtml = buildOtpEmailHtml(code);

    const result = await transporter.sendMail({
      from: finalFrom,
      to,
      subject: '🛡️ Authentification PixiaTech',
      html: emailHtml,
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('[API/send-email] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
