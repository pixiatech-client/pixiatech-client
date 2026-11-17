import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { DEFAULT_CONTACT_INFO, DEFAULT_PAGE_CONTENT } from './defaultPageContent';
import type {
  AutoResponderConfig,
  ContactInfo,
  ContactMessage,
  ContactMessageReply,
  PageContentConfig,
  SmtpConfig,
} from './types';

const SITE_WEB_COLLECTION = 'siteWeb';
const MESSAGES_COLLECTION = 'siteWebMessages';

export { DEFAULT_CONTACT_INFO } from './defaultPageContent';

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

export async function getMessage(id: string): Promise<ContactMessage | null> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const docSnap = await adminDb.collection(MESSAGES_COLLECTION).doc(id).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...(docSnap.data() as object) } as ContactMessage;
  } catch (error) {
    console.error('[siteWeb] Error getting message:', error);
    return null;
  }
}

export async function saveMessage(message: ContactMessage) {
  const { adminDb } = getFirebaseAdmin();
  await adminDb.collection(MESSAGES_COLLECTION).doc(message.id).set({
    ...message,
    createdAt: message.createdAt || new Date().toISOString(),
  });
}

export async function patchMessageStatus(
  id: string,
  status: ContactMessage['status']
): Promise<ContactMessage | null> {
  const { adminDb } = getFirebaseAdmin();
  const docRef = adminDb.collection(MESSAGES_COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;

  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'trash') {
    updates.trashedAt = new Date().toISOString();
  } else if (status === 'archived') {
    updates.archivedAt = new Date().toISOString();
  } else if (status === 'unread') {
    // Si on restaure vers 'unread', on retire l'ancien trashedAt/archivedAt
    updates.restoredAt = new Date().toISOString();
  }

  await docRef.update(updates);
  const updated = await docRef.get();
  if (!updated.exists) return null;
  return { id: updated.id, ...(updated.data() as object) } as ContactMessage;
}

export async function addMessageReply(
  id: string,
  reply: ContactMessageReply
): Promise<ContactMessage | null> {
  const { adminDb } = getFirebaseAdmin();
  const docRef = adminDb.collection(MESSAGES_COLLECTION).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;

  const data = docSnap.data() || {};
  const currentReplies = Array.isArray(data.replies) ? data.replies : [];
  const updatedReplies = [...currentReplies, reply];

  await docRef.update({
    status: 'replied',
    replies: updatedReplies,
    lastRepliedAt: reply.sentAt,
    updatedAt: new Date().toISOString(),
  });

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

export async function emptyTrashMessages(): Promise<number> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb
      .collection(MESSAGES_COLLECTION)
      .where('status', '==', 'trash')
      .get();

    if (snap.empty) return 0;

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return snap.docs.length;
  } catch (error) {
    console.error('[siteWeb] Error emptying trash messages:', error);
    throw error;
  }
}

// ---- Auto-responder configuration ----

export const DEFAULT_AUTORESPONDER_CONFIG: AutoResponderConfig = {
  enabled: false,
  subject: 'Nous avons bien reçu votre demande – Pixiatech',
  template: `Bonjour {{client_name}},

Nous vous remercions d'avoir contacté Pixiatech.

Nous avons bien reçu votre demande et nous vous confirmons sa bonne réception.

Un conseiller de notre équipe prendra contact avec vous dans un délai maximum de 48 heures ouvrées.

Nous vous remercions pour votre confiance.

Cordialement,

L'équipe Pixiatech`,
};

export async function getAutoResponderConfig(): Promise<AutoResponderConfig> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const docSnap = await adminDb.collection(SITE_WEB_COLLECTION).doc('autoresponder').get();
    if (docSnap.exists) {
      const data = docSnap.data() || {};
      return {
        ...DEFAULT_AUTORESPONDER_CONFIG,
        ...data,
        enabled: Boolean(data.enabled),
        subject: data.subject ? String(data.subject) : DEFAULT_AUTORESPONDER_CONFIG.subject,
        template: data.template ? String(data.template) : DEFAULT_AUTORESPONDER_CONFIG.template,
      };
    }
  } catch (error) {
    console.error('[siteWeb] Error fetching autoresponder config:', error);
  }
  return DEFAULT_AUTORESPONDER_CONFIG;
}

export async function setAutoResponderConfig(
  partial: Partial<AutoResponderConfig>
): Promise<AutoResponderConfig> {
  const current = await getAutoResponderConfig();
  const merged: AutoResponderConfig = {
    enabled: partial.enabled !== undefined ? Boolean(partial.enabled) : current.enabled,
    subject: partial.subject !== undefined ? String(partial.subject).trim() : current.subject,
    template: partial.template !== undefined ? String(partial.template) : current.template,
    updatedAt: new Date().toISOString(),
  };

  const { adminDb } = getFirebaseAdmin();
  await adminDb
    .collection(SITE_WEB_COLLECTION)
    .doc('autoresponder')
    .set(merged);
  return merged;
}
