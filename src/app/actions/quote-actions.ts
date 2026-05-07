
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

const formSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().min(1, 'Le numéro de téléphone est requis'),
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
  // ✅ Priorité : variable d'env → sinon localhost en dev → sinon pixiatech.com en prod
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') 
    || (process.env.NODE_ENV === 'production' 
        ? 'https://pixiatech.com' 
        : 'http://localhost:3000');

  // ✅ Nettoyer l'URL : supprimer les domaines Firebase Studio/Cloud Workstation automatiquement
  const safeBaseUrl = baseUrl.includes('cloudworkstations.dev') || baseUrl.includes('firebase-studio')
    ? 'http://localhost:3000' 
    : baseUrl;

  const verificationUrl = `${safeBaseUrl}/quote/verify?token=${verificationToken}`;
  const pdfSettings = await getPdfSettings(true);
  
  // Use the logo from settings, or a reliable fallback
  const logoSource = pdfSettings.logoUrl || 'https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.appspot.com/o/uploads%2Flogo.png?alt=media&token=8544c77c-6554-46c5-ac33-0c464c8d50d0';
  const t = translations[lang] || translations.fr;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

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

  await transporter.sendMail({
    from: `"PixiaTech" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: t.email.subject,
    html: emailHtml,
    attachments: [{
      filename: 'logo.png',
      path: logoSource,
      cid: 'pixiatech-logo' // Same CID value as in the html img src
    }]
  });
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
            // Trigger email sending in background (don't await)
            // Note: In some serverless environments, this might need a more robust solution like a queue, 
            // but for immediate UI responsiveness as requested, we fire and forget.
            sendQuoteEmail(formData.email, token, quoteDetails.lang).catch(e => console.error("Background email error:", e));
        }
        return { id, success: true, requiresVerification: emailVerificationEnabled };
    }
    
    return { id: null, success: false, requiresVerification: emailVerificationEnabled, error: "Une erreur est survenue lors de la création de l'estimation." };
}
