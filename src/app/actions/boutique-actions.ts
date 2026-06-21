'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { buildSecureEmailHtml } from '@/lib/email-templates';
import { getSmtpTransport } from '@/lib/smtpService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendBoutiqueOtp(
  email: string
): Promise<{ success: boolean; pendingId?: string; otpCode?: string; error?: string }> {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Database service unavailable' };

  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Format d\'email invalide.' };
  }

  try {
    let validityMinutes = 10;
    try {
      const settingsSnap = await adminDb.collection('settings').doc('wizard').get();
      if (settingsSnap.exists) {
        const ev = settingsSnap.data()?.estimationFlow;
        if (ev?.validityMinutes && typeof ev.validityMinutes === 'number') {
          validityMinutes = ev.validityMinutes;
        }
      }
    } catch {
      // use default
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + validityMinutes);

    const docRef = await adminDb.collection('pendingVerifications').add({
      email,
      otpCode,
      otpExpires: Timestamp.fromDate(expirationDate),
      verified: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    try {
      const { transporter, fromHeader } = await getSmtpTransport();
      const emailHtml = buildSecureEmailHtml({
        code: otpCode,
        companyName: 'PIXIATECH',
        companySlogan: 'TECHNOLOGY PRO',
        documentLabel: 'location boutique',
        validityMinutes,
        messageStyle: 'collaborative_trust',
        theme: 'light_premium',
        lang: 'fr',
      });
      await transporter.sendMail({
        from: fromHeader,
        to: email,
        subject: 'PIXIATECH — Code de vérification',
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error('sendBoutiqueOtp email error:', emailErr);
    }

    return { success: true, pendingId: docRef.id, otpCode };
  } catch (error: any) {
    console.error('sendBoutiqueOtp error:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

export async function sendBoutiqueOtpWithResend(
  email: string,
  pendingId?: string
): Promise<{ success: boolean; pendingId?: string; otpCode?: string; error?: string }> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Database service unavailable' };

  try {
    if (pendingId) {
      const existingRef = adminDb.collection('pendingVerifications').doc(pendingId);
      const existingSnap = await existingRef.get();
      if (existingSnap.exists) {
        await existingRef.delete();
      }
    }
  } catch (cleanupErr) {
    console.error('sendBoutiqueOtpWithResend cleanup error:', cleanupErr);
  }

  return sendBoutiqueOtp(email);
}

export async function verifyBoutiqueOtp(
  pendingId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Database service unavailable' };

  try {
    const docRef = adminDb.collection('pendingVerifications').doc(pendingId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return { success: false, error: 'Session de vérification introuvable.' };
    }

    const data = snap.data();
    if (!data) {
      return { success: false, error: 'Session invalide.' };
    }

    if (data.verified) {
      return { success: true };
    }

    if (data.otpCode !== code) {
      return { success: false, error: 'Code incorrect. Vérifiez votre email.' };
    }

    const expires = data.otpExpires;
    if (expires && new Date() > expires.toDate()) {
      return { success: false, error: 'Le code de vérification a expiré.' };
    }

    await docRef.update({
      verified: true,
      verifiedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('verifyBoutiqueOtp error:', error);
    return { success: false, error: 'Erreur lors de la vérification.' };
  }
}
