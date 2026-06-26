import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSmtpSettings } from '@/lib/smtpService';
import { verifyAdminSession } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const auth = await verifyAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const startTime = Date.now();

  const logs: string[] = [];

  try {
    const body = await request.json();
    const testEmail = body.to || process.env.SMTP_USER;

    // --- 1. Read env variables ---
    const envHost = process.env.SMTP_HOST || '';
    const envUser = process.env.SMTP_USER || '';
    const envPass = process.env.SMTP_PASS || '';
    const envPort = process.env.SMTP_PORT || '587';

    logs.push(`[ENV] SMTP_HOST=${envHost || '(not set)'}`);
    logs.push(`[ENV] SMTP_USER=${envUser || '(not set)'}`);
    logs.push(`[ENV] SMTP_PASS=${envPass ? '(set, length=' + envPass.length + ')' : '(not set)'}`);
    logs.push(`[ENV] SMTP_PORT=${envPort}`);

    // --- 2. Read Firestore SMTP settings ---
    let dbSmtp: any = null;
    try {
      dbSmtp = await getSmtpSettings();
      logs.push(`[DB] isCustom=${dbSmtp?.isCustom}, host=${dbSmtp?.host || '(empty)'}, user=${dbSmtp?.user || '(empty)'}`);
    } catch (dbErr: any) {
      logs.push(`[DB] Error reading Firestore SMTP: ${dbErr.message}`);
    }

    // --- 3. Determine effective SMTP config ---
    const useCustom = dbSmtp?.isCustom && dbSmtp?.host && dbSmtp?.user && dbSmtp?.pass;
    const host = useCustom ? dbSmtp.host : (envHost || 'smtp.gmail.com');
    const user = useCustom ? dbSmtp.user : envUser;
    const pass = useCustom ? dbSmtp.pass : envPass;
    const portNum = useCustom ? (dbSmtp.port || 587) : (envPort ? parseInt(envPort, 10) : 587);
    const isSecure = portNum === 465;
    const fromEmail = useCustom ? dbSmtp.fromEmail : envUser;
    const fromName = useCustom ? dbSmtp.fromName : 'PixiaTech';

    logs.push(`[RESOLVE] Using ${useCustom ? 'Custom Firestore' : 'ENV'} config`);
    logs.push(`[RESOLVE] host=${host}, port=${portNum}, secure=${isSecure}, user=${user}`);

    if (!host || !user || !pass) {
      return NextResponse.json({
        success: false,
        error: 'SMTP credentials incomplete — host, user or pass missing',
        logs,
        duration: Date.now() - startTime,
      }, { status: 400 });
    }

    // --- 4. Create transporter ---
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: isSecure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    logs.push(`[NODEMAILER] Transporter created. Verifying connection...`);

    // --- 5. Verify SMTP connection ---
    try {
      await transporter.verify();
      logs.push(`[NODEMAILER] ✅ SMTP connection verified successfully!`);
    } catch (verifyErr: any) {
      logs.push(`[NODEMAILER] ❌ SMTP connection FAILED: ${verifyErr.message}`);
      return NextResponse.json({
        success: false,
        error: `SMTP Connection Error: ${verifyErr.message}`,
        logs,
        duration: Date.now() - startTime,
      }, { status: 500 });
    }

    // --- 6. Send test email ---
    const to = testEmail;
    logs.push(`[SEND] Sending test email to: ${to}`);

    const result = await transporter.sendMail({
      from: `"${fromName} Test" <${fromEmail || user}>`,
      to,
      subject: `🔧 Test SMTP Pixiatech — ${new Date().toLocaleString('fr-FR')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #2563eb;">✅ Test SMTP Réussi</h2>
          <p>Cet email confirme que votre configuration SMTP fonctionne correctement.</p>
          <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px; background:#fff; border: 1px solid #e5e7eb;"><strong>Hôte</strong></td><td style="padding: 8px; background:#fff; border: 1px solid #e5e7eb;">${host}</td></tr>
            <tr><td style="padding: 8px; background:#f3f4f6; border: 1px solid #e5e7eb;"><strong>Port</strong></td><td style="padding: 8px; background:#f3f4f6; border: 1px solid #e5e7eb;">${portNum}</td></tr>
            <tr><td style="padding: 8px; background:#fff; border: 1px solid #e5e7eb;"><strong>Utilisateur</strong></td><td style="padding: 8px; background:#fff; border: 1px solid #e5e7eb;">${user}</td></tr>
            <tr><td style="padding: 8px; background:#f3f4f6; border: 1px solid #e5e7eb;"><strong>Sécurisé (SSL)</strong></td><td style="padding: 8px; background:#f3f4f6; border: 1px solid #e5e7eb;">${isSecure ? 'Oui (port 465)' : 'Non (STARTTLS 587)'}</td></tr>
            <tr><td style="padding: 8px; background:#fff; border: 1px solid #e5e7eb;"><strong>Config source</strong></td><td style="padding: 8px; background:#fff; border: 1px solid #e5e7eb;">${useCustom ? 'Firestore personnalisé' : 'Variables d\'environnement (.env)'}</td></tr>
          </table>
          <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">Envoyé automatiquement depuis le diagnostic Pixiatech — ${new Date().toISOString()}</p>
        </div>
      `,
    });

    logs.push(`[SEND] ✅ Email sent! MessageId: ${result.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      to,
      host,
      port: portNum,
      user,
      secure: isSecure,
      configSource: useCustom ? 'firestore-custom' : 'env-variables',
      logs,
      duration: Date.now() - startTime,
    });

  } catch (error: any) {
    logs.push(`[FATAL] Unhandled error: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
      logs,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}

// GET: quick health check
export async function GET() {
  const auth = await verifyAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const envHost = process.env.SMTP_HOST || '';
  const envUser = process.env.SMTP_USER || '';
  const envPass = process.env.SMTP_PASS || '';

  return NextResponse.json({
    env: {
      SMTP_HOST: envHost || null,
      SMTP_USER: envUser || null,
      SMTP_PASS_SET: !!envPass,
      SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
    },
    configured: !!(envHost && envUser && envPass),
    message: 'POST to this endpoint with { "to": "your@email.com" } to send a test email',
  });
}
