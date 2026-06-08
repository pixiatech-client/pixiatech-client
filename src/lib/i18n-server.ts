/**
 * Server-side i18n utilities for use in Server Actions
 * These functions can be used outside of React components
 */

import fr from './locales/fr.json';
import en from './locales/en.json';

export type Locale = 'fr' | 'en';

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K
      : never
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<typeof fr>;

// Flatten nested objects for easier lookup
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  }
  
  return result;
}

// Create flat translation maps for fast lookup
const flatFr = flattenObject(fr);
const flatEn = flattenObject(en);

/**
 * Get the translation for a key in the specified locale
 * Falls back to French if key not found
 */
export function getTranslation(key: string, locale: Locale = 'en'): string {
  const translations = locale === 'en' ? flatEn : flatFr;
  return translations[key] || flatFr[key] || key;
}

/**
 * Create a translator function for a specific locale
 */
export function createTranslator(locale: Locale) {
  return (key: string, replacements?: Record<string, string | number>): string => {
    let text = getTranslation(key, locale);
    
    if (replacements) {
      for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
      }
    }
    
    return text;
  };
}

/**
 * Get user locale from request cookies (for server components)
 * This is a placeholder - actual implementation should read from cookies
 */
export function getLocaleFromCookie(cookieHeader?: string): Locale {
  if (!cookieHeader) return 'en';
  
  const match = cookieHeader.match(/admin-locale=(fr|en)/);
  return (match?.[1] as Locale) || 'en';
}

// Pre-defined translation keys for backend (Server Actions)
// This ensures type safety and documents all available backend translations

export const backendTranslations = {
  // Error messages
  'errors.serviceUnavailable': { fr: 'Service indisponible.', en: 'Service unavailable.' },
  'errors.accountNotFound': { fr: 'Compte non trouvé.', en: 'Account not found.' },
  'errors.invalidData': { fr: 'Données invalides.', en: 'Invalid data.' },
  'errors.userAlreadyExists': { fr: 'Un utilisateur avec cet email existe déjà.', en: 'A user with this email already exists.' },
  'errors.invalidPhoneFormat': { fr: "Le format du numéro de téléphone est invalide. Veuillez utiliser un format international (ex: +33612345678).", en: "The phone number format is invalid. Please use an international format (e.g. +33612345678)." },
  'errors.registrationFailed': { fr: "Une erreur est survenue lors de l'inscription.", en: "An error occurred during registration." },
  'errors.roleNotFound': { fr: 'Rôle introuvable', en: 'Role not found' },
  'errors.cannotModifyDefaultRole': { fr: 'Impossible de modifier un rôle par défaut', en: 'Cannot modify a default role' },
  'errors.cannotDeleteDefaultRole': { fr: 'Impossible de supprimer un rôle par défaut', en: 'Cannot delete a default role' },
  'errors.invalidPassword': { fr: 'Mot de passe invalide.', en: 'Invalid password.' },
  'errors.noActiveSession': { fr: "Pas de session active.", en: "No active session." },
  'errors.notImpersonationSession': { fr: "Ce n'est pas une session d'impersonation.", en: "This is not an impersonation session." },
  'errors.adminSdkNotInitialized': { fr: "Admin SDK non initialisé", en: "Admin SDK not initialized" },
  'errors.databaseResetSuccess': { fr: "Toutes les données (utilisateurs, rôles, estimations) ont été supprimées. La page va se rafraîchir.", en: "All data (users, roles, estimations) has been deleted. The page will refresh." },
  'errors.databaseResetFailed': { fr: "Erreur lors de la réinitialisation de la BDD :", en: "Error during database reset:" },
  
  // Status translations
  'status.pending': { fr: 'en attente', en: 'pending' },
  'status.processed': { fr: 'traité', en: 'processed' },
  'status.trashed': { fr: 'mis à la corbeille', en: 'trashed' },
  'status.inProgress': { fr: 'en cours', en: 'in progress' },
  'status.sent': { fr: 'envoyé', en: 'sent' },
  
  // Role names
  'roles.admin': { fr: 'Administrateur', en: 'Administrator' },
  'roles.supplier': { fr: 'Fournisseur', en: 'Supplier' },
  'roles.commercial': { fr: 'Commercial', en: 'Sales Rep' },
  'roles.fournisseur': { fr: 'Fournisseur', en: 'Supplier' },
  
  // User status
  'userStatus.approved': { fr: 'Approuvé', en: 'Approved' },
  'userStatus.pending': { fr: 'En attente', en: 'Pending' },
  'userStatus.rejected': { fr: 'Rejeté', en: 'Rejected' },
  'userStatus.suspended': { fr: 'Suspendu', en: 'Suspended' },
  
  // Quote status
  'quoteStatus.pending': { fr: 'En attente', en: 'Pending' },
  'quoteStatus.processed': { fr: 'Traité', en: 'Processed' },
  'quoteStatus.trash': { fr: 'Corbeille', en: 'Trash' },
  'quoteStatus.archived': { fr: 'Archivé', en: 'Archived' },
  
  // Notifications
  'notifications.newEstimation': { fr: 'Nouvelle estimation reçue', en: 'New estimation received' },
  'notifications.estimationCompleted': { fr: 'Estimation complétée par le fournisseur', en: 'Estimation completed by supplier' },
  'notifications.inDelivery': { fr: 'Estimation en cours de livraison', en: 'Estimation out for delivery' },
  'notifications.estimationRefused': { fr: 'Estimation refusée', en: 'Estimation refused' },
  'notifications.orderValidated': { fr: 'Commande validée par le fournisseur', en: 'Order validated by supplier' },
  'notifications.estimationArchived': { fr: 'Estimation archivée', en: 'Estimation archived' },
  'notifications.estimationUnarchived': { fr: 'Estimation désarchivée', en: 'Estimation restored' },
  'notifications.statusUpdate': { fr: 'Mise à jour du statut', en: 'Status update' },
  'notifications.transmittedTo': { fr: 'Transmis au fournisseur: ', en: 'Transmitted to supplier: ' },
  'notifications.unknown': { fr: 'Inconnu', en: 'Unknown' },
  'notifications.processed': { fr: 'traité', en: 'processed' },
  'notifications.delivered': { fr: 'livré', en: 'delivered' },
  
  // Email content
  'email.newEstimationSubject': { fr: 'Nouvelle Estimation Transmise', en: 'New Estimation Transmitted' },
  'email.hello': { fr: 'Bonjour,', en: 'Hello,' },
  'email.newRequest': { fr: 'Une nouvelle demande d\'estimation', en: 'A new estimation request' },
  'email.forClient': { fr: 'pour le client', en: 'for the client' },
  'email.hasBeenTransmitted': { fr: 'vous a été transmise.', en: 'has been transmitted to you.' },
  'email.loginToProcess': { fr: 'Veuillez vous connecter à votre tableau de bord pour traiter cette demande.', en: 'Please log in to your dashboard to process this request.' },
  'email.accessDashboard': { fr: 'Accéder au tableau de bord', en: 'Access Dashboard' },
  'email.pixiatechSubject': { fr: '[PIXIATECH] Nouvelle estimation', en: '[PIXIATECH] New Estimation' },
  
  // Quote details
  'quote.clientUnknown': { fr: 'Client Inconnu', en: 'Unknown Client' },
  'quote.unknown': { fr: 'Inconnu', en: 'Unknown' },
  'quote.statusChangedTo': { fr: 'Statut changé vers', en: 'Status changed to' },
  'quote.statusChangedFor': { fr: 'Statut changé pour', en: 'Status changed for' },
  'quote.archivedBy': { fr: 'a été mise à la corbeille par', en: 'has been moved to trash by' },
  'quote.anAdministrator': { fr: 'un administrateur', en: 'an administrator' },
  'quote.restored': { fr: 'a été désarchivée', en: 'has been restored' },
  'quote.at': { fr: 'le', en: 'on' },
  'quote.atTime': { fr: 'à', en: 'at' },
  
  // Common
  'common.admin': { fr: 'Admin', en: 'Admin' },
  'common.required': { fr: 'est obligatoire', en: 'is required' },
} as const;

/**
 * Get a backend translation with automatic locale detection
 * @param key The translation key from backendTranslations
 * @param locale The target locale (fr or en)
 */
export function t(key: keyof typeof backendTranslations, locale: Locale): string {
  const translations = backendTranslations[key];
  if (!translations) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return translations[locale] || translations.en;
}
