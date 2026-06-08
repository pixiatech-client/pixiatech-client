'use server';

import type { QuoteDetails } from '@/lib/types';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';
import type { PdfSettings } from '@/lib/types';
import fr from '@/lib/locales/fr.json';
import en from '@/lib/locales/en.json';
import { getSettings } from '@/app/admin/actions';
import { updateStatsOnCreate } from '@/lib/statsService';
import { createHash } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

type Locale = 'fr' | 'en';
const translations = { fr, en };

import { validatePhone } from '@/lib/phone-validation';

const formSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().min(1, 'Le numéro de téléphone est requis').superRefine((val, ctx) => {
    const result = validatePhone(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || "Numéro de téléphone invalide",
      });
    }
  }),
  address: z.string().min(1, "L'adresse est requise"),
  notes: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions pour continuer.",
  }),
});

type FormValues = z.infer<typeof formSchema>;


async function urlToDataUri(url: string | undefined): Promise<string> {
  if (!url) return '';
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText} for URL: ${url}`);
      return '';
    }
    const arrayBuffer = await response.arrayBuffer();
    let contentType = response.headers.get('content-type') || 'image/png';
    if (url.endsWith('.svg') || contentType === 'image/svg+xml') {
      contentType = 'image/svg+xml';
    }
    const buffer = Buffer.from(arrayBuffer);
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error converting URL to data URI for ${url}:`, error);
    return '';
  }
}


export async function getPdfSettings(rawUrls = false): Promise<PdfSettings> {
  const { adminDb } = getFirebaseAdmin();
  const defaultSettings: PdfSettings = {
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Flogo.png?alt=media&token=8544c77c-6554-46c5-ac33-0c464c8d50d0",
    logoWidth: 190,
    backgroundUrl: "https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Fbackground.jpg?alt=media&token=0a32d431-1554-4648-9b88-be9c73eac09f",
    companyName: "PIXIATECH",
    siret: "123 456 789 00010 100",
    capital: "100000€",
    address: "123 Rue de l'Exemple, 75001 Paris, France",
    phone: "+33 1 23 45 67 89",
    email: "contact@pixiatech.com",
    textColor: "#000000",
    titleColor: "#000000",
    headerColor: "#0a5499",
    quoteTitle: "Estimation",
    quoteNumberPrefix: "EST-",
    termsAndConditions: "Merci de votre confiance. Cette estimation est valable 30 jours.",
  };

  try {
    const docRef = adminDb.collection('settings').doc('pdf');
    const docSnap = await docRef.get();
    const settings = docSnap.exists ? { ...defaultSettings, ...docSnap.data() } : defaultSettings;

    if (rawUrls) {
      return settings;
    }

    const [logoDataUri, backgroundDataUri] = await Promise.all([
      urlToDataUri(settings.logoUrl),
      urlToDataUri(settings.backgroundUrl)
    ]);

    return { ...settings, logoUrl: logoDataUri, backgroundUrl: backgroundDataUri };
  } catch (error) {
    console.error("Error fetching PDF settings from Firestore:", error);
    return defaultSettings;
  }
}

export async function updatePdfSettings(data: Partial<PdfSettings>) {
  const { adminDb } = getFirebaseAdmin();
  try {
    await adminDb.collection('settings').doc('pdf').set(data, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating PDF settings:", error);
    return { success: false, error: error.message };
  }
}


async function sendQuoteEmail(recipientEmail: string, verificationToken: string, lang: Locale) {
  // ✅ Priorité : variable d'env → sinon URL de production App Hosting → sinon localhost
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
    || (process.env.NODE_ENV === 'production'
      ? 'https://studio--studio-9205859220-a6440.us-central1.hosted.app'
      : 'http://localhost:3000');

  // ✅ Nettoyer l'URL : s'assurer qu'on n'utilise pas localhost en production si le lien vient d'une workstation
  const safeBaseUrl = (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost'))
    ? 'https://studio--studio-9205859220-a6440.us-central1.hosted.app'
    : baseUrl;

  const verificationUrl = `${safeBaseUrl}/quote/verify?token=${verificationToken}`;
  const pdfSettings = await getPdfSettings(true);

  // Use the logo from settings, or a reliable fallback
  const logoSource = pdfSettings.logoUrl || 'https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Flogo.png?alt=media&token=8544c77c-6554-46c5-ac33-0c464c8d50d0';
  const t = translations[lang] || translations.fr;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const isSecure = smtpPort === 465;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error(`[Email] WARNING: Missing SMTP configuration in environment!`, {
      SMTP_HOST: smtpHost ? 'Present' : 'MISSING',
      SMTP_USER: smtpUser ? 'Present' : 'MISSING',
      SMTP_PASS: smtpPass ? 'Present' : 'MISSING',
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log(`[Email] Preparing to send to: ${recipientEmail}`);
  console.log(`[Email] Using baseUrl: ${safeBaseUrl}`);
  console.log(`[Email] Transport configured:`, { host: smtpHost, port: smtpPort, secure: isSecure, user: smtpUser, hasPassword: !!smtpPass });

  let logoBuffer: Buffer | null = null;
  let logoContentType = 'image/png';

  try {
    const logoResponse = await fetch(logoSource, { cache: 'no-store' });
    if (logoResponse.ok) {
      const arrayBuffer = await logoResponse.arrayBuffer();
      logoBuffer = Buffer.from(arrayBuffer);
      logoContentType = logoResponse.headers.get('content-type') || 'image/png';
    } else {
      console.warn(`[Email] Failed to fetch logo (${logoResponse.status}), sending without attachment.`);
    }
  } catch (fetchError) {
    console.warn('[Email] Error fetching logo, sending without attachment:', fetchError);
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background-color: #f4f4f4; border-radius: 20px;">
      <div style="background-color: white; padding: 40px; border-radius: 30px; max-width: 500px; margin: 0 auto; shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <img src="cid:pixiatech-logo" alt="PixiaTech Logo" style="max-width: 150px; margin-bottom: 30px;">
        <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 900; margin-bottom: 20px; text-transform: uppercase; letter-spacing: -0.5px;">
          ${t.email.title}
        </h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          ${t.email.body}
        </p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 18px 32px; text-decoration: none; border-radius: 14px; display: inline-block; font-size: 16px; font-weight: bold; box-shadow: 0 8px 20px rgba(0, 123, 255, 0.3);">
          ${t.email.button}
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; pt: 20px;">
          ${t.email.footer}
        </p>
      </div>
    </div>
  `;

  try {
    const result = await transporter.sendMail({
      from: `"PixiaTech" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: t.email.subject,
      html: emailHtml,
      attachments: logoBuffer
        ? [
          {
            filename: 'logo.png',
            content: logoBuffer,
            cid: 'pixiatech-logo',
            contentType: logoContentType,
          },
        ]
        : [],
    });
    console.log(`[Email] Sent successfully! MessageId: ${result.messageId}`);
  } catch (error) {
    console.error(`[Email] Error sending email to ${recipientEmail}:`, error);
    throw error; // Re-throw to be caught by createQuoteRequest
  }
}

export async function testSmtpConnection(
  testEmail?: string
): Promise<{ success: boolean; message: string; details?: Record<string, any> }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const isSecure = smtpPort === 465;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return {
      success: false,
      message: 'Configuration SMTP manquante (SMTP_HOST, SMTP_USER ou SMTP_PASS absents).',
      details: {
        hostPresent: !!smtpHost,
        userPresent: !!smtpUser,
        passPresent: !!smtpPass,
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    await transporter.verify();

    if (testEmail) {
      const info = await transporter.sendMail({
        from: `"PixiaTech Test" <${smtpUser}>`,
        to: testEmail,
        subject: 'Test SMTP PixiaTech - Connexion réussie',
        text: 'Ce message confirme que la configuration SMTP est opérationnelle.',
      });
      return {
        success: true,
        message: `Connexion SMTP réussie. Email de test envoyé à ${testEmail}.`,
        details: { messageId: info.messageId },
      };
    }

    return {
      success: true,
      message: `Connexion SMTP réussie (${smtpHost}:${smtpPort}).`,
    };
  } catch (error: any) {
    const code = error.code;
    const errno = error.errno;
    const responseCode = error.responseCode;
    let diagnosticMessage = 'Erreur lors de la connexion SMTP.';

    if (code === 'ECONNECTION' || errno === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      diagnosticMessage = 'Port bloqué ou hôte introuvable (connexion refusée).';
    } else if (responseCode === 535 || error.message?.includes('Invalid login') || error.message?.includes('535')) {
      diagnosticMessage = 'Authentification refusée : utilisateur ou mot de passe incorrect.';
    } else if (error.message?.includes('self signed certificate') || error.message?.includes('certificate')) {
      diagnosticMessage = 'Erreur de certificat SSL/TLS. Essayez le port 587 sans SSL.';
    } else if (error.message?.includes('ETIMEDOUT') || error.message?.includes('ESOCKETTIMEDOUT')) {
      diagnosticMessage = 'Délai dépassé : hôte ou port bloqué par le firewall.';
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      diagnosticMessage = 'Hôte introuvable : vérifiez SMTP_HOST.';
    }

    return {
      success: false,
      message: diagnosticMessage,
      details: { code, errno, responseCode, rawError: error.message },
    };
  }
}

async function createQuoteDocument(
  userId: string,
  formData: FormValues,
  quoteDetails: QuoteDetails,
  emailVerification: boolean
): Promise<{ id: string; token: string; error?: string }> {
  const { adminDb, FieldValue } = getFirebaseAdmin();

  if (!userId) {
    throw new Error("User ID is required to create a quote request.");
  }

  const pdfSettings = await getPdfSettings(true); // Get raw URLs for DB
  const cleanedQuoteDetails = JSON.parse(JSON.stringify(quoteDetails));

  const documentData: any = {
    ...cleanedQuoteDetails,
    client: {
      companyName: formData.companyName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes || '',
      sitePhoto: cleanedQuoteDetails.sitePhoto || ''
    },
    userId: userId,
    createdAt: FieldValue.serverTimestamp(),
    isRead: false,
    status: 'pending',
    emailVerified: !emailVerification,
    pdfSettings: pdfSettings,
  };

  // Remove sitePhoto from root after placing it in client
  delete documentData.sitePhoto;

  let token = '';
  if (emailVerification) {
    token = require('crypto').randomBytes(32).toString('hex');
    const verificationToken = createHash('sha256').update(token).digest('hex');
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    documentData.verificationToken = verificationToken;
    documentData.verificationTokenExpires = Timestamp.fromDate(expirationDate);
  }

  if (quoteDetails.unconfiguredCityQuery) {
    documentData.unconfiguredCityQuery = quoteDetails.unconfiguredCityQuery;
  } else {
    delete documentData.unconfiguredCityQuery;
  }

  if (quoteDetails.selectedCityId) {
    documentData.selectedCityId = quoteDetails.selectedCityId;
  } else {
    delete documentData.selectedCityId;
  }

  try {
    const docRef = await adminDb.collection('quotes').add(documentData);

    // Phase 3: Increment stats on create
    const amount = documentData.totalClient || documentData.totalQuote || 0;
    try {
      await updateStatsOnCreate('pending', amount);
    } catch (statsError) {
      console.error("Error updating stats on create:", statsError);
    }

    // Create notifications for admins, commerciaux, and fournisseurs
    try {
      const usersSnapshot = await adminDb.collection('users')
        .where('role', 'in', ['admin', 'commercial', 'fournisseur'])
        .where('status', '==', 'approved')
        .get();

      const notificationsBatch: any[] = [];
      usersSnapshot.forEach((userDoc: any) => {
        const userData = userDoc.data();
        if (userData.uid !== userId) { // Don't notify the user who created the quote
          notificationsBatch.push({
            userId: userData.uid,
            type: 'estimation',
            title: 'Nouvelle demande client',
            description: `Nouveau devis de ${formData.companyName || 'Client'}`,
            href: `/admin/quotes/${docRef.id}`,
            read: false,
            createdAt: FieldValue.serverTimestamp()
          });
        }
      });

      // Batch create notifications
      if (notificationsBatch.length > 0) {
        const batch = adminDb.batch();
        notificationsBatch.forEach(notifData => {
          const notifRef = adminDb.collection('notifications').doc();
          batch.set(notifRef, notifData);
        });
        await batch.commit();
      }
    } catch (notifError) {
      console.error("Error creating notifications:", notifError);
      // Don't fail the quote creation if notifications fail
    }


    return { id: docRef.id, token };
  } catch (error: any) {
    console.error("Error creating quote document:", error);
    return { id: '', token: '', error: error.message };
  }
}

export async function createQuoteRequest(userId: string, formData: FormValues, quoteDetails: QuoteDetails, skipVerification: boolean = false): Promise<{ id: string | null; success: boolean, requiresVerification: boolean, error?: string }> {
  if (!userId) {
    return { id: null, success: false, requiresVerification: true, error: 'Session utilisateur invalide. Veuillez rafraîchir la page.' };
  }

  const generalSettings = await getSettings();
  const emailVerificationEnabled = skipVerification ? false : (generalSettings.isEmailVerificationEnabled ?? true);

  const { id, token, error: createError } = await createQuoteDocument(userId, formData, quoteDetails, emailVerificationEnabled);

  if (createError) {
    return { id: null, success: false, requiresVerification: emailVerificationEnabled, error: createError };
  }

  if (id) {
    if (emailVerificationEnabled) {
      try {
        await sendQuoteEmail(formData.email, token, quoteDetails.lang || 'fr');
      } catch (e) {
        console.error("Critical email error:", e);
        // On peut décider de retourner une erreur ici ou de laisser l'utilisateur voir le message de succès
        // Pour le débug, on va retourner l'erreur
        return { id, success: false, requiresVerification: true, error: "Erreur lors de l'envoi de l'email de confirmation. Veuillez vérifier la configuration SMTP." };
      }
    }
    return { id, success: true, requiresVerification: emailVerificationEnabled };
  }

  return { id: null, success: false, requiresVerification: emailVerificationEnabled, error: "Une erreur est survenue lors de la création de l'estimation." };
}

export async function getProductBlockedPeriodsAction(
  productId: string,
  quantityRequested: number,
  excludeQuoteId?: string
): Promise<{ from: string; to: string }[]> {
  try {
    const { getProductBlockedPeriods } = await import('@/lib/stockService');
    return await getProductBlockedPeriods(productId, quantityRequested, excludeQuoteId);
  } catch (error) {
    console.error('[quote-actions] getProductBlockedPeriodsAction error:', error);
    return [];
  }
}

export async function getProductRentalAvailabilityAction(
  productId: string,
  fromISO: string,
  toISO: string,
  quantityRequested: number,
  excludeQuoteId?: string
): Promise<{ available: boolean; total: number; reserved: number; remaining: number; nextAvailableDate: string | null }> {
  try {
    const { getProductRentalAvailability } = await import('@/lib/stockService');
    const result = await getProductRentalAvailability(
      productId,
      new Date(fromISO),
      new Date(toISO),
      quantityRequested,
      excludeQuoteId
    );
    return {
      ...result,
      nextAvailableDate: result.nextAvailableDate ? result.nextAvailableDate.toISOString() : null
    };
  } catch (error) {
    console.error('[quote-actions] getProductRentalAvailabilityAction error:', error);
    return { available: false, total: 0, reserved: 0, remaining: 0, nextAvailableDate: null };
  }
}

export async function getProductsRentalAvailabilityAction(
  productIds: string[],
  fromISO: string,
  toISO: string,
  neededTilesMap: Record<string, number>,
  excludeQuoteId?: string
): Promise<Record<string, { available: boolean; total: number; reserved: number; remaining: number; nextAvailableDate: string | null }>> {
  try {
    const { getProductsRentalAvailability } = await import('@/lib/stockService');
    const results = await getProductsRentalAvailability(
      productIds,
      new Date(fromISO),
      new Date(toISO),
      neededTilesMap,
      excludeQuoteId
    );

    // Convert Dates to ISO strings
    const serializedResults: Record<string, any> = {};
    for (const [key, val] of Object.entries(results)) {
      serializedResults[key] = {
        ...val,
        nextAvailableDate: val.nextAvailableDate ? val.nextAvailableDate.toISOString() : null
      };
    }
    return serializedResults;
  } catch (error) {
    console.error('[quote-actions] getProductsRentalAvailabilityAction error:', error);
    return {};
  }
}
export async function getBlockedPeriods(): Promise<{ from: string; to: string }[]> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('quotes')
      .where('status', 'in', ['processed', 'rented'])
      .get();

    const periods: { from: string; to: string }[] = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (data.rentalPeriod) {
        let fromStr = '';
        let toStr = '';
        if (data.rentalPeriod.from) {
          const fromDate = data.rentalPeriod.from.toDate ? data.rentalPeriod.from.toDate() : new Date(data.rentalPeriod.from);
          fromStr = fromDate.toISOString().split('T')[0];
        }
        if (data.rentalPeriod.to) {
          const toDate = data.rentalPeriod.to.toDate ? data.rentalPeriod.to.toDate() : new Date(data.rentalPeriod.to);
          toStr = toDate.toISOString().split('T')[0];
        }
        if (fromStr && toStr) {
          periods.push({ from: fromStr, to: toStr });
        }
      } else if (data.products) {
        data.products.forEach((p: any) => {
          if (p.rentalPeriod) {
            let fromStr = '';
            let toStr = '';
            if (p.rentalPeriod.from) {
              const fromDate = p.rentalPeriod.from.toDate ? p.rentalPeriod.from.toDate() : new Date(p.rentalPeriod.from);
              fromStr = fromDate.toISOString().split('T')[0];
            }
            if (p.rentalPeriod.to) {
              const toDate = p.rentalPeriod.to.toDate ? p.rentalPeriod.to.toDate() : new Date(p.rentalPeriod.to);
              toStr = toDate.toISOString().split('T')[0];
            }
            if (fromStr && toStr) {
              periods.push({ from: fromStr, to: toStr });
            }
          }
        });
      }
    });

    return periods;
  } catch (error) {
    console.error("Error fetching blocked periods:", error);
    return [];
  }
}

export async function createQuoteWithContract(
  userId: string,
  clientDetails: {
    company: string;
    representative: string;
    address: string;
    postcode: string;
    city: string;
    email: string;
    phone: string;
    notes?: string;
  },
  quoteDetails: {
    products: any[];
    transactionType: 'sale' | 'rental';
    includeInstallation: boolean;
    installationCost: number;
    techniciansRequired: number;
    includeDelivery: boolean;
    deliveryCost: number;
    totalQuote: number;
    width: number;
    height: number;
    productName: string;
    lang: 'fr' | 'en';
  },
  signatureDataUrl: string
): Promise<{ success: boolean; id?: string; otpCode?: string; error?: string }> {
  const { adminDb, FieldValue, Timestamp } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Database service unavailable' };

  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10); // 10 minutes expiration

    const pdfSettings = await getPdfSettings(true);

    const docData: any = {
      ...quoteDetails,
      client: {
        companyName: clientDetails.company,
        representative: clientDetails.representative,
        address: `${clientDetails.address}, ${clientDetails.postcode} ${clientDetails.city}`,
        email: clientDetails.email,
        phone: clientDetails.phone,
        notes: clientDetails.notes || '',
      },
      userId,
      createdAt: FieldValue.serverTimestamp(),
      isRead: false,
      status: 'pending',
      emailVerified: false,
      signatureDataUrl,
      signedAt: FieldValue.serverTimestamp(),
      otpCode,
      otpExpires: Timestamp.fromDate(expirationDate),
      pdfSettings,
    };

    const docRef = await adminDb.collection('quotes').add(docData);

    // Increment stats on create
    try {
      await updateStatsOnCreate('pending', quoteDetails.totalQuote);
    } catch (statsError) {
      console.error("Error updating stats on create:", statsError);
    }

    // Prepare SMTP and send OTP email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
      || (process.env.NODE_ENV === 'production'
        ? 'https://studio--studio-9205859220-a6440.us-central1.hosted.app'
        : 'http://localhost:3000');

    const safeBaseUrl = (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost'))
      ? 'https://studio--studio-9205859220-a6440.us-central1.hosted.app'
      : baseUrl;

    const verificationUrl = `${safeBaseUrl}/quote/verify?otp=${otpCode}&id=${docRef.id}`;

    await sendSignatureOtpEmail(
      clientDetails.email,
      otpCode,
      quoteDetails.lang || 'fr',
      clientDetails.company,
      clientDetails.representative,
      quoteDetails.totalQuote,
      `${quoteDetails.width}m x ${quoteDetails.height}m - ${quoteDetails.productName}`,
      verificationUrl
    );

    return { success: true, id: docRef.id, otpCode };
  } catch (error: any) {
    console.error("Error in createQuoteWithContract:", error);
    return { success: false, error: error.message || 'Failed to create contract quote' };
  }
}

async function sendSignatureOtpEmail(
  recipientEmail: string,
  otpCode: string,
  lang: 'fr' | 'en',
  companyName: string,
  representative: string,
  totalAmount: number,
  details: string,
  verificationUrl: string
) {
  const pdfSettings = await getPdfSettings(true);
  const logoSource = pdfSettings.logoUrl || 'https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Flogo.png?alt=media&token=8544c77c-6554-46c5-ac33-0c464c8d50d0';

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const isSecure = smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  let logoBuffer: Buffer | null = null;
  let logoContentType = 'image/png';

  try {
    const logoResponse = await fetch(logoSource, { cache: 'no-store' });
    if (logoResponse.ok) {
      const arrayBuffer = await logoResponse.arrayBuffer();
      logoBuffer = Buffer.from(arrayBuffer);
      logoContentType = logoResponse.headers.get('content-type') || 'image/png';
    }
  } catch (fetchError) {
    console.warn('[Email] Error fetching logo:', fetchError);
  }

  const digitsHtml = otpCode.split('').map(digit => `
    <div style="width: 42px; height: 50px; background-color: #eff6ff; border: 2px solid #dbeafe; color: #2563eb; font-weight: 900; font-family: monospace; font-size: 24px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin: 0 4px; line-height: 50px; text-align: center;">
      ${digit}
    </div>
  `).join('');

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; background-color: #FAF8F5; min-height: 100%;">
      <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
        
        <!-- Apple style header -->
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

        <!-- Header -->
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

        <!-- Body -->
        <div style="padding: 30px; text-align: center;">
          <p style="color: #71717a; font-size: 13px; line-height: 1.5; margin-bottom: 25px; text-align: left;">
            ${lang === 'fr'
      ? `Bonjour ${representative},<br/><br/>Un code d'authentification temporaire a été généré pour finaliser la signature électronique de votre estimation PixiaTech.`
      : `Hello ${representative},<br/><br/>A temporary authentication code was generated to finalize the electronic signature of your PixiaTech estimation.`}
          </p>

          <div style="margin: 25px 0;">
            <span style="display: block; font-size: 9px; text-transform: uppercase; color: #a1a1aa; letter-spacing: 1px; margin-bottom: 10px; font-weight: bold;">
              ${lang === 'fr' ? "Votre code d'authentification" : "Your authentication code"}
            </span>
            <div style="text-align: center; display: block; margin: 15px 0;">
              ${digitsHtml}
            </div>
          </div>

          <!-- Direct Link -->
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 9999px; display: inline-block; font-size: 13px; font-weight: bold; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
              ${lang === 'fr' ? 'Valider et continuer (Lien direct)' : 'Validate and continue (Direct Link)'}
            </a>
          </div>

          <!-- Information de sécurité -->
          <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 11px; color: #1e3a8a; line-height: 1.5; font-weight: bold;">
              🚨 ${lang === 'fr' ? "Information de sécurité :" : "Security Information:"}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #1e40af; line-height: 1.5;">
              ${lang === 'fr'
      ? '"Ce code est strictement personnel. Ne le partagez jamais avec un tiers, y compris un collaborateur Pixatech."'
      : '"This code is strictly personal. Do not share it with a third party, including a Pixatech representative."'}
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #f4f4f5; padding-top: 20px; color: #a1a1aa; font-size: 10px; line-height: 1.4;">
            ${lang === 'fr'
      ? "Ce message automatique est crypté. PandaDoc Secure Shield."
      : "This automatic message is encrypted. PandaDoc Secure Shield."}
          </div>

        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"PixiaTech" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: lang === 'fr' ? "🔑 Authentification PixiaTech" : "🔑 PixiaTech Authentication",
      html: emailHtml,
      attachments: logoBuffer
        ? [
          {
            filename: 'logo.png',
            content: logoBuffer,
            cid: 'pixiatech-logo',
            contentType: logoContentType,
          },
        ]
        : [],
    });
  } catch (error) {
    console.error(`[Email] Error sending OTP email to ${recipientEmail}:`, error);
  }
}

export async function verifyQuoteOtp(quoteId: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Database service unavailable' };

  try {
    const docRef = adminDb.collection('quotes').doc(quoteId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: 'Estimation introuvable.' };
    }

    const quoteData = docSnap.data();
    if (!quoteData) {
      return { success: false, error: 'Estimation invalide.' };
    }

    if (quoteData.otpCode !== otpCode) {
      return { success: false, error: 'Validation automatique impossible. Entrez le code reçu par e-mail.' };
    }

    const expiresTimestamp = quoteData.otpExpires;
    if (expiresTimestamp && new Date() > expiresTimestamp.toDate()) {
      return { success: false, error: 'Le code de vérification a expiré.' };
    }

    if (!quoteData.emailVerified) {
      await docRef.update({ emailVerified: true });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in verifyQuoteOtp:", error);
    return { success: false, error: 'Erreur lors de la vérification.' };
  }
}

export async function resendQuoteOtp(quoteId: string): Promise<{ success: boolean; error?: string }> {
  const { adminDb, Timestamp } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Database service unavailable' };

  try {
    const docRef = adminDb.collection('quotes').doc(quoteId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: 'Estimation introuvable.' };
    }

    const quoteData = docSnap.data();
    if (!quoteData) {
      return { success: false, error: 'Estimation invalide.' };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10); // 10 minutes expiration

    await docRef.update({
      otpCode,
      otpExpires: Timestamp.fromDate(expirationDate),
      emailVerified: false
    });

    const clientEmail = quoteData.client?.email || quoteData.email;
    const clientCompany = quoteData.client?.companyName || quoteData.company || '';
    const clientRepresentative = quoteData.client?.representative || quoteData.representative || '';
    const totalAmount = quoteData.totalQuote || 0;
    const lang = quoteData.lang || 'fr';
    const width = quoteData.width || 0;
    const height = quoteData.height || 0;
    const productName = quoteData.productName || '';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
      || (process.env.NODE_ENV === 'production'
        ? 'https://studio--studio-9205859220-a6440.us-central1.hosted.app'
        : 'http://localhost:3000');

    const safeBaseUrl = (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost'))
      ? 'https://studio--studio-9205859220-a6440.us-central1.hosted.app'
      : baseUrl;

    const verificationUrl = `${safeBaseUrl}/quote/verify?otp=${otpCode}&id=${quoteId}`;

    await sendSignatureOtpEmail(
      clientEmail,
      otpCode,
      lang,
      clientCompany,
      clientRepresentative,
      totalAmount,
      `${width}m x ${height}m - ${productName}`,
      verificationUrl
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error in resendQuoteOtp:", error);
    return { success: false, error: error.message || 'Failed to resend OTP' };
  }
}


