import { getFirebaseAdmin } from './firebase-admin';
import nodemailer from 'nodemailer';

export type SmtpSettings = {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  isCustom: boolean;
};

export type SmtpSettingsResponse = SmtpSettings & {
  envConfig: {
    host: string;
    port: number;
    user: string;
    hasPass: boolean;
    fromEmail: string;
  };
};

export async function getSmtpSettings(): Promise<SmtpSettingsResponse> {
  const defaultSettings: SmtpSettings = {
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: 'PixiaTech',
    isCustom: false,
  };

  const envConfig = {
    host: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    user: process.env.SMTP_USER || '',
    hasPass: !!process.env.SMTP_PASS,
    fromEmail: process.env.SMTP_USER || '',
  };

  try {
    const { adminDb } = getFirebaseAdmin();
    const docRef = adminDb.collection('settings').doc('smtp');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data() || {};
      return {
        ...defaultSettings,
        ...data,
        port: data.port ? parseInt(String(data.port), 10) : 587,
        envConfig,
      } as SmtpSettingsResponse;
    }
  } catch (error) {
    console.error('Error fetching SMTP settings from Firestore:', error);
  }
  return { ...defaultSettings, envConfig } as SmtpSettingsResponse;
}

export async function updateSmtpSettings(data: Partial<SmtpSettings>) {
  try {
    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('settings').doc('smtp').set(data, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating SMTP settings in Firestore:', error);
    return { success: false, error: error.message };
  }
}

export async function getSmtpTransport(customConfig?: SmtpSettings) {
  const config = customConfig || await getSmtpSettings();
  
  const isCustom = config.isCustom;
  const host = isCustom ? config.host : process.env.SMTP_HOST;
  const user = isCustom ? config.user : process.env.SMTP_USER;
  const pass = isCustom ? config.pass : process.env.SMTP_PASS;
  const portStr = isCustom ? String(config.port) : process.env.SMTP_PORT;
  const port = portStr ? parseInt(portStr, 10) : 587;
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const fromEmail = isCustom ? config.fromEmail : (process.env.SMTP_USER || 'noreply@pixiatech.com');
  const fromName = isCustom ? config.fromName : 'PixiaTech';
  const fromHeader = `"${fromName}" <${fromEmail}>`;

  return { transporter, fromHeader, host, user, pass, port, isSecure, isCustom };
}
