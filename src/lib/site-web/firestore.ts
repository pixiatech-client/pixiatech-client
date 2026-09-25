import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { DEFAULT_PAGE_CONTENT } from './defaultPageContent';
import type { ContactInfo, ContactMessage, PageContentConfig, SmtpConfig } from './types';

const SITE_WEB_COLLECTION = 'siteWeb';
const MESSAGES_COLLECTION = 'siteWebMessages';

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  companyName: 'PIXIATECH',
  tagline: "Solutions d'affichage dynamique, murs d'images LED & technologies visuelles avancées",
  address: '5 Rue la fontaine',
  postalCode: '93400',
  city: 'Saint-Ouen-sur-Seine',
  country: 'France',
  primaryEmail: 'contact@pixiatech.com',
  supportEmail: 'support@pixiatech.com',
  phone1: '+33 7 56 81 66 26',
  phone2: '+33 7 71 59 31 66',
  whatsappNumber: '+33756816626',
  workingHours: 'Lundi au Vendredi : 09:00 - 18:00 (CET / Paris)',
  responseTimeCommitment: 'Réponse sous 2 heures ouvrées',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=5+Rue+la+fontaine+93400+Saint-Ouen-sur-Seine+France',
};

export function defaultSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || 'mail.pixiatech.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
    user: process.env.SMTP_USER || 'contact@pixiatech.com',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM || 'PIXIATECH <contact@pixiatech.com>',
    recipientEmail: process.env.CONTACT_RECIPIENT || 'contact@pixiatech.com',
    enabled: true,
  };
}

function mergePageContent(parsed: Partial<PageContentConfig>): PageContentConfig {
  return {
    ...DEFAULT_PAGE_CONTENT,
    ...parsed,
    visibility: {
      ...DEFAULT_PAGE_CONTENT.visibility,
      ...(parsed.visibility || {}),
      footerSection: parsed.visibility?.footerSection ?? true,
    },
    hero: { ...DEFAULT_PAGE_CONTENT.hero, ...(parsed.hero || {}) },
    form: { ...DEFAULT_PAGE_CONTENT.form, ...(parsed.form || {}) },
    info: { ...DEFAULT_PAGE_CONTENT.info, ...(parsed.info || {}) },
    faq: { ...DEFAULT_PAGE_CONTENT.faq, ...(parsed.faq || {}) },
    footer: { ...DEFAULT_PAGE_CONTENT.footer, ...(parsed.footer || {}) },
  };
}

export async function getPageContent(): Promise<PageContentConfig> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const docSnap = await adminDb.collection(SITE_WEB_COLLECTION).doc('content').get();
    if (docSnap.exists) {
      const data = docSnap.data() || {};
      return mergePageContent(data as Partial<PageContentConfig>);
    }
  } catch (error) {
    console.error('[siteWeb] Error fetching page content:', error);
  }
  return DEFAULT_PAGE_CONTENT;
}

export async function setPageContent(config: PageContentConfig) {
  const { adminDb } = getFirebaseAdmin();
  await adminDb
    .collection(SITE_WEB_COLLECTION)
    .doc('content')
    .set({ ...config, updatedAt: new Date().toISOString() });
}

export async function resetPageContent(): Promise<PageContentConfig> {
  await setPageContent(DEFAULT_PAGE_CONTENT);
  return DEFAULT_PAGE_CONTENT;
}

export async function getContactInfo(): Promise<ContactInfo> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const docSnap = await adminDb.collection(SITE_WEB_COLLECTION).doc('contactInfo').get();
    if (docSnap.exists) {
      return { ...DEFAULT_CONTACT_INFO, ...(docSnap.data() || {}) } as ContactInfo;
    }
  } catch (error) {
    console.error('[siteWeb] Error fetching contact info:', error);
  }
  return DEFAULT_CONTACT_INFO;
}

export async function setContactInfo(info: Partial<ContactInfo>): Promise<ContactInfo> {
  const current = await getContactInfo();
  const merged = { ...current, ...info };
  const { adminDb } = getFirebaseAdmin();
  await adminDb
    .collection(SITE_WEB_COLLECTION)
    .doc('contactInfo')
    .set({ ...merged, updatedAt: new Date().toISOString() });
  return merged;
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const docSnap = await adminDb.collection(SITE_WEB_COLLECTION).doc('smtp').get();
    if (docSnap.exists) {
      const data = docSnap.data() || {};
      return {
        ...defaultSmtpConfig(),
        ...data,
        port: data.port ? parseInt(String(data.port), 10) : defaultSmtpConfig().port,
        secure: data.secure !== undefined ? Boolean(data.secure) : true,
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
        pass: data.pass ? String(data.pass) : '',
      };
    }
  } catch (error) {
    console.error('[siteWeb] Error fetching SMTP config:', error);
  }
  return defaultSmtpConfig();
}

export async function setSmtpConfig(partial: Partial<SmtpConfig>): Promise<SmtpConfig> {
  const current = await getSmtpConfig();
  const merged: SmtpConfig = {
    host: partial.host !== undefined ? String(partial.host).trim() : current.host,
    port: partial.port !== undefined ? parseInt(String(partial.port), 10) || 587 : current.port,
    secure: partial.secure !== undefined ? Boolean(partial.secure) : current.secure,
    user: partial.user !== undefined ? String(partial.user).trim() : current.user,
    pass: partial.pass !== undefined && partial.pass !== '' ? String(partial.pass) : current.pass,
    fromEmail: partial.fromEmail !== undefined ? String(partial.fromEmail).trim() : current.fromEmail,
    recipientEmail:
      partial.recipientEmail !== undefined ? String(partial.recipientEmail).trim() : current.recipientEmail,
    enabled: partial.enabled !== undefined ? Boolean(partial.enabled) : current.enabled,
  };
  const { adminDb } = getFirebaseAdmin();
  await adminDb
    .collection(SITE_WEB_COLLECTION)
    .doc('smtp')
    .set({ ...merged, hasPassword: Boolean(merged.pass && merged.pass.length > 0), updatedAt: new Date().toISOString() });
  return merged;
}

// ---- Messages inbox ----

export async function listMessages(): Promise<ContactMessage[]> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection(MESSAGES_COLLECTION).orderBy('createdAt', 'desc').limit(200).get();
    return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }) as ContactMessage);
  } catch (error) {
    console.error('[siteWeb] Error listing messages:', error);
    return [];
  }
}

export async function saveMessage(message: ContactMessage) {
  const { adminDb } = getFirebaseAdmin();
  await adminDb.collection(MESSAGES_COLLECTION).doc(message.id).set({
    ...message,
    createdAt: message.createdAt || new Date().toISOString(),
  });
}

export async function patchMessageStatus(id: string, status: ContactMessage['status']): Promise<ContactMessage | null> {
  const { adminDb } = getFirebaseAdmin();
  const docRef = adminDb.collection(MESSAGES_COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;
  await docRef.update({ status, updatedAt: new Date().toISOString() });
  const updated = await docRef.get();
  if (!updated.exists) return null;
  return { id: updated.id, ...(updated.data() as object) } as ContactMessage;
}

export async function deleteMessage(id: string): Promise<boolean> {
  const { adminDb } = getFirebaseAdmin();
  const docRef = adminDb.collection(MESSAGES_COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return false;
  await docRef.delete();
  return true;
}
