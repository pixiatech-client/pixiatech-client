'use server';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE PUBLIC — Server Actions destinées aux routes publiques.
//
// S0 (containment) : copie autonome des actions réellement publiques et non
// sensibles qui vivaient dans `@/app/admin/actions` ('use server'). Le but est
// de couper toute liaison entre les routes publiques (/chat-widget, /embed,
// /[[...step]], flows de devis...) et le module admin, car une référence à ce
// module réenregistre l'ensemble de ses exports dans les manifests de build
// des routes publiques.
//
// IMPORTANT : aucune logique métier n'a été modifiée — corps dupliqués à
// l'identique depuis `src/app/admin/actions.ts`. L'état TTL (caches) est local
// à ce module : un `updateSettings` admin ne purgera plus ce cache-ci (dérive
// bornée à 60 s, acceptée en S0).
//
// S1-5 : `getQuoteRequest`, `updateQuotePdfUrl`, `updateQuoteContractUrl` sont
// marquées PUBLIC-BUT-OBJECT-AUTHORIZED — elles sont nécessaires aux flux
// publics mais n'ont PAS de contrôle d'autorisation par objet. Leur correction
// (preuve de possession du devis) est prévue au batch S1-5.
// ─────────────────────────────────────────────────────────────────────────────

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import type { DocumentSnapshot, Query } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { normalizePrice } from '@/lib/pricing-engine';
import type { Product, Settings, DeliverySettings, LaborSettings, PdfSettings, ProductSpec, QuoteRequest, Locations, WizardSettings } from '@/lib/types';
import { checkQuoteCapability } from '@/lib/capability';

// --- Firestore Document IDs for Settings ---
const SETTINGS_DOC_ID = 'main';
const DELIVERY_DOC_ID = 'delivery';
const LABOR_DOC_ID = 'labor';
const PDF_SETTINGS_DOC_ID = 'pdf';
const WIZARD_SETTINGS_DOC_ID = 'wizard';
const ACTIVE_THEME_DOC_ID = 'global';

// --- In-memory TTL caches (shared across calls within the same server process) ---
let _settingsCache: { data: Settings; timestamp: number } | null = null;
const SETTINGS_CACHE_TTL_MS = 60_000; // 60 seconds

export async function clearSettingsCache(): Promise<void> {
  _settingsCache = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  // Serve from in-memory cache if still fresh
  if (_settingsCache && Date.now() - _settingsCache.timestamp < SETTINGS_CACHE_TTL_MS) {
    return _settingsCache.data;
  }

  const { adminDb } = getFirebaseAdmin();
  const defaultSettings: Settings = {
    defaultWidth: 20,
    defaultHeight: 10,
    maxWidth: 20,
    maxHeight: 10,
    maxRentalWidth: 6,
    maxRentalHeight: 5,
    maxProductsPerQuote: 3,
    previewScreenImageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=90&w=2000',
    emergencyStopEnabled: false,
    emergencyReturnUrl: 'https://mahboubidz.com/',
    emergencyStopMessage: "Pour des raisons de maintenance, notre outil d'estimation en ligne est actuellement suspendu. Veuillez nous excuser pour la gêne occasionnée.",
    congratulationsTitle: { fr: "🌟🌟 Félicitations ! 🌟🌟", en: "🌟🌟 Congratulations! 🌟🌟" },
    congratulationsMessage: { fr: "Votre demande d'estimation a bien été envoyée. Un commercial vous contactera dans les plus brefs délais pour discuter de votre projet.", en: "Your quote request has been sent successfully. A sales representative will contact you shortly to discuss your project." },
    deliveryTitle: { fr: "Livraison", en: "Delivery" },
    deliveryMessage: { fr: "Choisissez le lieu de livraison pour calculer les frais.", en: "Choose the delivery location to calculate fees." },
    installationTitle: { fr: "Installation", en: "Installation" },
    installationMessage: { fr: "Souhaitez-vous inclure l'installation par nos techniciens ?", en: "Would you like to include installation by our technicians?" },
    disclaimerMessage: { fr: "L'entreprise PIXIATECH décline toute responsabilité en cas de problème lié à une installation non effectuée par ses techniciens.", en: "PIXIATECH declines all responsibility for any problem related to an installation not carried out by its technicians." },
    quoteFormNotesPlaceholder: { fr: "Merci de préciser l’environnement d’installation, afin que nous vous proposions la solution la plus adaptée.", en: "Please specify the installation environment, so we can offer you the most suitable solution." },
    isDeliveryStepEnabled: true,
    isInstallationStepEnabled: true,
    isEmailVerificationEnabled: true,
    isPriceHidden: false,
    isSingleSessionEnabled: false,
    zoomMaxDistance: 50,
    zoomMinDistance: 0.5,
    isWizardBotEnabled: true,
    hintBubble: {
      enabled: true,
      text: "Pour démarrer, veuillez cliquer sur<br /> le bouton <b>+ Ajouter un produit</b>.",
      desktopBottom: 30,
      desktopRight: 24,
      mobileBottom: 41,
      mobileRight: 8,
      duration: 0
    },
    lightThemeId: '',
    darkThemeId: '',
    estimationFlow: {
      enableRentalPeriod: true,
      enableDigitalSignature: true,
      enableContractEditing: false,
      companySignatureDataUrl: '',
      taxEnabled: false,
      taxRate: 19,
      taxMode: 'ht',
      boutiqueB2B: false,
      sale: {
        maxProductsPerQuote: 3,
        flatScreen: { maxWidth: 20, maxHeight: 10 },
        curvedScreen: { maxWidth: 20, maxHeight: 10, curveMin: -30, curveMax: 30 },
        screen360: { maxDiameter: 10, maxHeight: 8 },
      },
      rental: {
        flatScreen: { maxWidth: 6, maxHeight: 5 },
        curvedScreen: { maxWidth: 6, maxHeight: 5, curveMin: -30, curveMax: 30 },
        screen360: { maxDiameter: 6, maxHeight: 5 },
      },
    },
  };

  try {
    const docRef = adminDb.collection('settings').doc(SETTINGS_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const serializedData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value && typeof value === 'object' && '_seconds' in value) {
          return new Timestamp(value._seconds, value._nanoseconds).toDate().toISOString();
        }
        return value;
      }));
      const merged = { ...defaultSettings, ...serializedData };
      _settingsCache = { data: merged, timestamp: Date.now() };
      return merged;
    } else {
      await docRef.set(defaultSettings);
      _settingsCache = { data: defaultSettings, timestamp: Date.now() };
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching settings from Firestore:", error);
    return defaultSettings;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery / Labor settings
// ─────────────────────────────────────────────────────────────────────────────

export const getDeliverySettings = cache(async (): Promise<DeliverySettings> => {
  const { adminDb } = getFirebaseAdmin();
  const defaults: DeliverySettings = {
    defaultFee: 600,
    isDefaultFeeEnabled: false,
    isFreeDeliveryEnabled: false,
    freeDeliveryThreshold: 10000,
    deliveryFeeRules: [],
    isTotalFreeDeliveryEnabled: false,
    unconfiguredZoneMessage: "Cette zone n’est pas encore configurée dans notre système. Un tarif personnalisé vous sera communiqué rapidement après vérification."
  };
  try {
    const docRef = adminDb.collection('settings').doc(DELIVERY_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { ...defaults, ...docSnap.data() };
    } else {
      await docRef.set(defaults);
      return defaults;
    }
  } catch (error) {
    console.error("Error fetching delivery settings from Firestore:", error);
    return defaults;
  }
});

export const getLaborSettings = cache(async (): Promise<LaborSettings> => {
  const { adminDb } = getFirebaseAdmin();
  const defaults: LaborSettings = {
    rules: [
      { id: 'default_1', minSqM: 2, technicians: 2, price: 200 },
      { id: 'rule_1762391030432', minSqM: 4, technicians: 3, price: 300 },
      { id: 'rule_1762391040555', minSqM: 8, technicians: 4, price: 400 },
      { id: 'rule_1762593299199', minSqM: 10, technicians: 5, price: 500 },
    ],
  };
  try {
    const docRef = adminDb.collection('settings').doc(LABOR_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data() as LaborSettings;
    } else {
      await docRef.set(defaults);
      return defaults;
    }
  } catch (error) {
    console.error("Error fetching labor settings from Firestore:", error);
    return defaults;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Products / specs
// ─────────────────────────────────────────────────────────────────────────────

export async function getProducts(options: { page?: number; limit?: number } = {}): Promise<{ products: Product[]; hasMore: boolean }> {
  const { page = 1, limit = 5 } = options;
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error("Firestore is not initialized for getProducts.");
    return { products: [], hasMore: false };
  }

  try {
    const productsCollection = adminDb.collection('products');

    let products: Product[] = [];
    let hasMore = false;

    if (limit > 0) {
      let query: Query = productsCollection.orderBy('name');

      if (page > 1) {
        const offset = (page - 1) * limit;
        const previousDocsSnapshot = await productsCollection.orderBy('name').limit(offset).get();
        if (!previousDocsSnapshot.empty) {
          const lastVisible = previousDocsSnapshot.docs[previousDocsSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limit + 1).get();
      products = snapshot.docs.map(doc => {
        const data = doc.data();

        // Normalize availableFor to strictly use 'sale' or 'rental' for the UI
        const normalizedAvailableFor = (data.availableFor || data.mode || [])
          .map((m: string) => {
            const val = m.toLowerCase();
            if (val === 'vente' || val === 'sale') return 'sale';
            if (val === 'location' || val === 'rental') return 'rental';
            return val;
          })
          .filter((m: string) => m === 'sale' || m === 'rental');

        // Normalize environment types to strictly use 'indoor', 'outdoor', or 'showcase'
        const normalizedType = (Array.isArray(data.type) ? data.type : [data.type || 'indoor'])
          .map((t: string) => {
            const val = t.toLowerCase();
            if (val === 'interieur' || val === 'indoor') return 'indoor';
            if (val === 'exterieur' || val === 'outdoor') return 'outdoor';
            if (val === 'semi-exterieur' || val === 'showcase' || val === 'vitrine') return 'showcase';
            return val;
          })
          .filter((t: string) => t === 'indoor' || t === 'outdoor' || t === 'showcase');

        return {
          id: doc.id,
          ...data,
          availableFor: normalizedAvailableFor,
          type: normalizedType,
          tileWidth: parseFloat(data.largeurDalle || data.tileWidth || 0),
          tileHeight: parseFloat(data.hauteurDalle || data.tileHeight || 0),
          pricePerTile: parseFloat(data.prixDalle || data.pricePerTile || 0),
          hasDimensions: data.dimensionsEnabled !== undefined ? data.dimensionsEnabled : data.hasDimensions,
          minArea: parseFloat(data.surfaceMinRequise || data.minArea || 0),
          oldPrice: data.oldPrice ? parseFloat(data.oldPrice) : undefined,
          salePricePerSqM: normalizePrice(data.price ?? data.salePricePerSqM),
          rentalPricePerDay: parseFloat(data.prixLocationJour || data.rentalPricePerDay || 0),
          rentalPricePerHour: parseFloat(data.prixLocationHeure || data.rentalPricePerHour || 0),
          productUrl: data.pdfUrl || data.productUrl || '',
          isHidden: !!data.isHidden,
          upsellFor: data.upsellFor || [],
        } as Product;
      });

      hasMore = products.length > limit;
      if (hasMore) {
        products.pop();
      }
    }

    return { products, hasMore };
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return { products: [], hasMore: false };
  }
}

export async function getProductSpecs(): Promise<Record<string, ProductSpec[]>> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return {};

  const specs: Record<string, ProductSpec[]> = {};
  try {
    const snapshot = await adminDb.collection('product_specs').get();
    snapshot.forEach(doc => {
      specs[doc.id] = doc.data().specs as ProductSpec[];
    });
    return specs;
  } catch (error) {
    console.error("Error fetching product specs from Firestore:", error);
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Locations
// ─────────────────────────────────────────────────────────────────────────────

export async function getLocations(): Promise<Locations> {
  const { adminDb } = getFirebaseAdmin();
  const citiesSnapshot = await adminDb.collection('cities').get();
  const cities = citiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return Promise.resolve({ villes: cities as any });
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF settings
// ─────────────────────────────────────────────────────────────────────────────

export async function getPdfSettings(rawUrls = false): Promise<PdfSettings> {
  const { adminDb } = getFirebaseAdmin();
  const defaultSettings: PdfSettings = {
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/pixiatech-client.firebasestorage.app/o/uploads%2Flogo.png?alt=media",
    logoWidth: 190,
    backgroundUrl: "https://firebasestorage.googleapis.com/v0/b/pixiatech-client.firebasestorage.app/o/uploads%2Fbackground.jpg?alt=media",
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
    const docRef = adminDb.collection('settings').doc(PDF_SETTINGS_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { ...defaultSettings, ...docSnap.data() };
    } else {
      await docRef.set(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching PDF settings from Firestore:", error);
    return defaultSettings;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard settings
// ─────────────────────────────────────────────────────────────────────────────

export async function getWizardSettings(): Promise<WizardSettings> {
  const { adminDb } = getFirebaseAdmin();

  const defaultSettings: WizardSettings = {
    projectTypes: {
      location: { enabled: true, imageUrl: 'https://picsum.photos/seed/led-location/800/600' },
      vente: { enabled: true, imageUrl: 'https://picsum.photos/seed/led-sale/800/600' },
    },
    environments: {
      interieur: { imageUrl: 'https://picsum.photos/seed/led-interior/800/1200' },
      'semi-exterieur': { imageUrl: 'https://picsum.photos/seed/led-semi-outdoor/800/1200' },
      exterieur: { imageUrl: 'https://picsum.photos/seed/led-outdoor/800/1200' },
    },
    viewingDistanceImageUrl: 'https://picsum.photos/seed/led-viewing-distance/800/1200',
    viewingDistances: [
      { id: 'vd0', value: '0-0.5m' },
      { id: 'vd1', value: '0.5-2m' },
      { id: 'vd2', value: '2-5m' },
      { id: 'vd3', value: '5-10m' },
      { id: 'vd4', value: '10-20m' },
      { id: 'vd5', value: '20-50m' },
      { id: 'vd6', value: '+50m' },
    ],
    pixelPitchImageUrl: 'https://picsum.photos/seed/led-pixel-pitch/800/1200',
    pixelPitches: [
      { id: 'pp1', value: 'P1.2', recommended: false },
      { id: 'pp2', value: 'P1.5', recommended: false },
      { id: 'pp3', value: 'P2', recommended: false },
      { id: 'pp4', value: 'P2.5', recommended: true },
      { id: 'pp5', value: 'P3', recommended: false },
      { id: 'pp6', value: 'P4', recommended: false },
      { id: 'pp7', value: 'P5', recommended: false },
      { id: 'pp8', value: 'P6', recommended: false },
      { id: 'pp9', value: 'P8', recommended: false },
      { id: 'pp10', value: 'P10', recommended: false },
      { id: 'pp11', value: 'P16', recommended: false },
      { id: 'pp12', value: 'P18', recommended: false },
      { id: 'pp13', value: 'P19', recommended: false },
    ],
  };

  try {
    const docRef = adminDb.collection('settings').doc(WIZARD_SETTINGS_DOC_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const dbData = docSnap.data() as Partial<WizardSettings> | undefined;
      // Deep merge structure-level keys but use Firestore arrays AS-IS (no default injection)
      // so that deletions made by the user are respected after page refresh.
      const mergedData: WizardSettings = {
        projectTypes: {
          location: { ...defaultSettings.projectTypes.location, ...dbData?.projectTypes?.location },
          vente: { ...defaultSettings.projectTypes.vente, ...dbData?.projectTypes?.vente },
        },
        environments: {
          interieur: { ...defaultSettings.environments.interieur, ...dbData?.environments?.interieur },
          'semi-exterieur': { ...defaultSettings.environments['semi-exterieur'], ...dbData?.environments?.['semi-exterieur'] },
          exterieur: { ...defaultSettings.environments.exterieur, ...dbData?.environments?.exterieur },
        },
        viewingDistanceImageUrl: dbData?.viewingDistanceImageUrl ?? defaultSettings.viewingDistanceImageUrl,
        // Use Firestore array directly — do NOT merge with defaults to preserve user deletions
        // but drop entries with an empty value so they never break wizardSettingsSchema.
        viewingDistances: (dbData?.viewingDistances ?? defaultSettings.viewingDistances).filter(
          (v) => v && v.value && v.value.trim() !== ''
        ),
        pixelPitchImageUrl: dbData?.pixelPitchImageUrl ?? defaultSettings.pixelPitchImageUrl,
        // Use Firestore array directly — do NOT merge with defaults to preserve user deletions
        // but drop entries with an empty value so they never break wizardSettingsSchema.
        pixelPitches: (dbData?.pixelPitches ?? defaultSettings.pixelPitches).filter(
          (v) => v && v.value && v.value.trim() !== '' && v.value.trim().toUpperCase() !== 'NON APPLICABLE'
        ),
      };
      return mergedData;
    } else {
      await docRef.set(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching wizard settings from Firestore:", error);
    return defaultSettings;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active global theme (lecture)
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveGlobalTheme(): Promise<{ themeId: string }> {
  const { adminDb } = getFirebaseAdmin();
  try {
    const doc = await adminDb.collection('settings').doc(ACTIVE_THEME_DOC_ID).get();
    const data = doc.data();
    const palettes = (await import('@/lib/color-palettes')).DEFAULT_PALETTES;
    const defaultName = palettes.find(p => p.isDefault)?.name || palettes[0].name;
    return { themeId: data?.activeThemeId || defaultName };
  } catch (error) {
    console.error("Error fetching active theme:", error);
    return { themeId: 'Nuage' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session / statut utilisateur
// ─────────────────────────────────────────────────────────────────────────────

export async function checkUserStatus(uid: string) {
  console.log('[checkUserStatus Action] Verifying status for UID:', uid);
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error('[checkUserStatus Action] adminDb is not initialized');
    return { success: false, error: 'Service unavailable.' };
  }

  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      console.warn('[checkUserStatus Action] User document NOT FOUND for UID:', uid);
      return { success: false, error: 'Account not found.' };
    }
    const userData = userDoc.data();
    console.log('[checkUserStatus Action] User status found:', userData?.status || 'pending');
    return { success: true, status: userData?.status || 'pending' };
  } catch (error: any) {
    console.error('[checkUserStatus Action] Error reading user document:', error);
    return { success: false, error: error.message };
  }
}

export async function logout() {
  const { adminAuth } = getFirebaseAdmin();
  const sessionCookie = (await cookies()).get('session')?.value;
  if (sessionCookie && adminAuth) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      if (!decodedClaims.original_admin_uid) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      }
    } catch (error) {
      // Ignore errors
    }
  }
  (await cookies()).delete('session');
  (await cookies()).delete('sessionToken');
  redirect('/admin/login');
}

/** Clear stale session cookie without revoking tokens or redirecting.
 *  Used by the layout guard to break cookie/Firebase mismatch loops. */
export async function clearSession() {
  (await cookies()).delete('session');
  (await cookies()).delete('sessionToken');
}

// ─────────────────────────────────────────────────────────────────────────────
// Vérification de token de devis (flux public /quote/verify)
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyQuoteToken(token: string): Promise<{ success: boolean; quoteId?: string; userId?: string; error?: string }> {
  const { adminDb } = getFirebaseAdmin();
  try {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const quotesRef = adminDb.collection('quotes');
    const querySnapshot = await quotesRef.where('verificationToken', '==', hashedToken).limit(1).get();

    if (querySnapshot.empty) {
      return { success: false, error: "Invalid or expired token." };
    }

    const quoteDoc = querySnapshot.docs[0];
    const quoteData = quoteDoc.data();

    const expiresTimestamp = quoteData.verificationTokenExpires;
    if (expiresTimestamp && new Date() > expiresTimestamp.toDate()) {
      return { success: false, error: "The verification link has expired." };
    }

    if (!quoteData.emailVerified) {
      await quoteDoc.ref.update({ emailVerified: true });
    }

    if (!quoteData.userId) {
      return { success: false, error: "No user associated with this estimate." };
    }

    return { success: true, quoteId: quoteDoc.id, userId: quoteData.userId };
  } catch (error) {
    console.error("Error verifying estimate:", error);
    return { success: false, error: 'Internal server error.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC-BUT-OBJECT-AUTHORIZED — S1-5
// ─────────────────────────────────────────────────────────────────────────────
// Actions nécessaires aux flux publics (chat-widget, embed, signature, devis)
// mais SANS contrôle d'autorisation par objet. Correction prévue au batch S1-5
// (preuve de possession du devis via OTP/token). Logique inchangée en S0.

// Lecture d'un utilisateur connecté pour le seul usage du contrôle fournisseur
// de getQuoteRequest (équivalent local de getCurrentAdminUser — non exporté
// pour ne pas réintroduire de liaison vers le module admin).
async function getCurrentUserForQuoteAuth(): Promise<{ uid: string; role?: string } | { error: string } | null> {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;

  const { adminAuth, adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    throw new Error("Admin SDK not initialized");
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();

    if (userData.status === 'pending' && userData.role !== 'fournisseur') {
      return { error: 'pending' };
    }

    return {
      uid: decodedClaims.uid,
      role: userData.role,
    };
  } catch (error) {
    console.error("Error fetching current admin user:", error);
    return null;
  }
}

export async function getQuoteRequest(id: string): Promise<QuoteRequest | null> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error("Firestore is not initialized.");
    return null;
  }
  try {
    const quoteRef = adminDb.collection('quotes').doc(id);
    const docSnap = await quoteRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const currentUser = await getCurrentUserForQuoteAuth();

    // Security check for suppliers
    if (currentUser && !('error' in currentUser) && currentUser.role === 'fournisseur') {
      const quoteData = docSnap.data();
      if (quoteData?.supplierId !== currentUser.uid) {
        throw new Error("Unauthorized: You do not have access to this quote.");
      }
    }

    // Public user check (not logged in as admin/commercial/etc.)
    if (!currentUser) {
      const generalSettings = await getSettings();
      const quoteData = docSnap.data();
      // No more blocking throw here, we'll handle verification status on the frontend
      // to allow background PDF generation.
    }

    return processQuoteSnapshot(docSnap);

  } catch (error: any) {
    console.error("Error fetching quote with admin SDK:", error);
    return null;
  }
}

async function processQuoteSnapshot(docSnap: DocumentSnapshot): Promise<QuoteRequest | null> {
  const data = docSnap.data();
  if (!data) return null;

  const [laborSettings, deliverySettings] = await Promise.all([
    getLaborSettings(),
    getDeliverySettings()
  ]);

  const productsRaw = data.products || data.quoteDetails?.products || [];
  const totalArea = productsRaw.reduce((sum: number, p: any) => sum + ((p.width || 0) * (p.height || 0) * (p.quantity || 1)), 0);
  const applicableLaborRule = laborSettings.rules
    .slice()
    .sort((a, b) => b.minSqM - a.minSqM)
    .find(rule => totalArea >= rule.minSqM);

  const installationCost = data.includeInstallation ? (applicableLaborRule?.price || 0) : 0;

  let deliveryCost = 0;
  if (data.includeDelivery) {
    deliveryCost = deliverySettings.defaultFee;
  }

  const structuredQuote: QuoteRequest = {
    id: docSnap.id,
    number: data.number || `EST-${docSnap.id.substring(0,6).toUpperCase()}`,
    client: {
      companyName: data.client?.companyName || data.client?.name || data.companyName || '',
      email: data.client?.email || data.email || '',
      phone: data.client?.phone || data.phone || '',
      address: data.client?.address || data.address || '',
      notes: data.client?.notes || data.notes || '',
      sitePhoto: data.client?.sitePhoto || data.sitePhoto || data.installationPhoto || data.quoteDetails?.sitePhoto || '',
    },
    products: productsRaw.map((p: any) => {
      let rentalPeriod = undefined;
      if (p.rentalPeriod && p.rentalPeriod.from && p.rentalPeriod.to) {
        const fromDate = p.rentalPeriod.from.toDate ? p.rentalPeriod.from.toDate() : new Date(p.rentalPeriod.from);
        const toDate = p.rentalPeriod.to.toDate ? p.rentalPeriod.to.toDate() : new Date(p.rentalPeriod.to);
        rentalPeriod = {
          from: fromDate,
          to: toDate
        };
      }

      let rentalDate = undefined;
      if (p.rentalDate) {
        const date = p.rentalDate.toDate ? p.rentalDate.toDate() : new Date(p.rentalDate);
        rentalDate = date;
      }

      return {
        ...p,
        lineTotal: p.lineTotal || 0,
        rentalPeriod: rentalPeriod,
        rentalDate: rentalDate,
        rentalStartTime: p.rentalStartTime,
        rentalEndTime: p.rentalEndTime,
      };
    }),
    installationCost: data.installationCost ?? data.quoteDetails?.installationCost ?? installationCost,
    deliveryCost: data.deliveryCost ?? data.quoteDetails?.deliveryCost ?? deliveryCost,
    totalQuote: data.totalQuote,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    isRead: data.isRead,
    status: data.status || 'pending',
    includeInstallation: data.includeInstallation,
    includeDelivery: data.includeDelivery,
    transactionType: data.transactionType,
    rentalPeriod: data.rentalPeriod ? {
      from: data.rentalPeriod.from?.toDate ? data.rentalPeriod.from.toDate() : new Date(data.rentalPeriod.from),
      to: data.rentalPeriod.to?.toDate ? data.rentalPeriod.to.toDate() : new Date(data.rentalPeriod.to),
    } : undefined,
    rentalStartTime: data.rentalStartTime,
    rentalEndTime: data.rentalEndTime,
    width: data.width,
    height: data.height,
    unconfiguredCityQuery: data.unconfiguredCityQuery,
    selectedCityId: data.selectedCityId,
    isDeliveryCostFinal: data.isDeliveryCostFinal ?? false,
    emailVerified: data.emailVerified ?? false,
    screenType: data.screenType,
    productName: data.productName,
    lang: data.lang,
    techniciansRequired: data.techniciansRequired || 0,
    supplierId: data.supplierId,
    trackingNumber: data.trackingNumber,
    assignedAt: data.assignedAt?.toDate ? data.assignedAt.toDate() : undefined,
    history: (data.history || []).map((h: any) => ({
      ...h,
      timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp),
    })).sort((a: any, b: any) => b.timestamp - a.timestamp),
    supplierNotes: data.supplierNotes,
    supplierTechDetails: data.supplierTechDetails,
    returnReason: data.returnReason,
    pdfSettings: data.pdfSettings,
    pdfUrl: data.pdfUrl,
    contractUrl: data.contractUrl,
  };

  return structuredQuote;
}

export async function updateQuotePdfUrl(quoteId: string, pdfUrl: string) {
  // S1-5: Verify capability cookie (issued after OTP/token verification).
  const hasCapability = await checkQuoteCapability(quoteId);
  if (!hasCapability) {
    console.warn(`[IDOR] updateQuotePdfUrl blocked: missing capability cookie for quote ${quoteId}`);
    return { success: false, error: 'Unauthorized: email verification required before updating quote.' };
  }

  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Firestore not initialized' };

  try {
    const docRef = adminDb.collection('quotes').doc(quoteId);
    await docRef.update({ pdfUrl });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating quote PDF URL:', error);
    return { success: false, error: error.message };
  }
}

export async function updateQuoteContractUrl(quoteId: string, contractUrl: string) {
  // S1-5: Verify capability cookie (issued after OTP/token verification).
  const hasCapability = await checkQuoteCapability(quoteId);
  if (!hasCapability) {
    console.warn(`[IDOR] updateQuoteContractUrl blocked: missing capability cookie for quote ${quoteId}`);
    return { success: false, error: 'Unauthorized: email verification required before updating quote.' };
  }

  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return { success: false, error: 'Firestore not initialized' };

  try {
    const docRef = adminDb.collection('quotes').doc(quoteId);
    await docRef.update({ contractUrl });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating quote contract URL:', error);
    return { success: false, error: error.message };
  }
}
