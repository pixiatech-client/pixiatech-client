import { isBootstrapPayloadValid } from '../../components/pixia-assistant/core/bootstrap-validation';
import type {
  BlockedPeriod,
  BootstrapPayload,
  DeliverySettings,
  EnvironmentType,
  LaborSettings,
  Locations,
  PdfSettings,
  Product,
  ProjectType,
  Settings,
  WizardPitchOption,
  WizardSettings,
} from '../../components/pixia-assistant/core/types';
import { getContractTemplate } from '../contract-templates';
import { calculatePromotionPercent } from '../pricing-engine';
import type { PixiaBootstrapBuildInput, PixiaBootstrapResult } from './bootstrap-types';

type LooseRecord = Record<string, unknown>;

/**
 * Couche de conversion entre les types du service PixiaTech et ceux du module
 * Assistant Bot Pixia. Les deux modèles divergent (noms, unités, sémantique) :
 * chaque champ est converti explicitement, sans jamais inventer de valeur.
 *
 * Règles générales :
 * - les champs absents restent `''`, `0` ou `null` ;
 * - aucun champ brut (specs, productUrl, secrets, champs admin) n'est propagé ;
 * - les produits inexploitables ou masqués sont écartés côté serveur.
 */

function asRecord(value: unknown): LooseRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as LooseRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstString(source: LooseRecord, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return '';
}

function firstNullableString(source: LooseRecord, keys: string[]): string | null {
  const found = firstString(source, keys);
  return found.length > 0 ? found : null;
}

function firstNumber(source: LooseRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function firstBoolean(source: LooseRecord, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    if (typeof source[key] === 'boolean') return source[key] as boolean;
  }
  return fallback;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

/** `'P2.5'`, `'p3,91'` → nombre ; les libellés non numériques donnent `null`. */
function parsePitch(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/^p/i, '').replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProjectType(value: string): ProjectType | null {
  const normalized = value.toLowerCase();
  if (normalized === 'sale' || normalized === 'vente') return 'vente';
  if (normalized === 'rental' || normalized === 'location') return 'location';
  return null;
}

function normalizeEnvironment(value: string): EnvironmentType | null {
  const normalized = value.toLowerCase();
  if (['indoor', 'interieur', 'intérieur'].includes(normalized)) return 'interieur';
  if (['showcase', 'semi-exterieur', 'semi-extérieur', 'vitrine'].includes(normalized)) {
    return 'semi-exterieur';
  }
  if (['outdoor', 'exterieur', 'extérieur'].includes(normalized)) return 'exterieur';
  return null;
}

/** Extrait une liste de chaînes depuis un champ ou un tableau. */
function stringList(source: LooseRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return [value];
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      );
    }
  }
  return [];
}

/**
 * Produits publics : mapping strict depuis `lib/types.ts::Product`.
 * `tileWidth`/`tileHeight` sont en cm côté PixiaTech, en mm côté module.
 */
function convertProducts(rawProducts: unknown[]): Product[] {
  const products: Product[] = [];

  for (const rawProduct of rawProducts) {
    const raw = asRecord(rawProduct);
    const id = firstString(raw, ['id']);
    if (!id) continue;

    // Les produits masqués ou retirés ne doivent jamais atteindre le client.
    if (firstBoolean(raw, ['isHidden'], false)) continue;
    const status = firstString(raw, ['status', 'published']);
    if (status && status !== 'active' && status !== 'published' && status !== 'true') continue;

    const availableFor = unique(
      stringList(raw, ['availableFor'])
        .map(normalizeProjectType)
        .filter((value): value is ProjectType => value !== null)
    );
    if (availableFor.length === 0) continue;

    const environments = unique(
      stringList(raw, ['type'])
        .map(normalizeEnvironment)
        .filter((value): value is EnvironmentType => value !== null)
    );

    const salePrice = firstNumber(raw, ['salePricePerSqM', 'price']);
    const rentalPrice = firstNumber(raw, ['rentalPricePerDay']);
    // Un produit sans prix exploitable ne peut pas entrer dans un parcours commercial.
    if (salePrice === null && rentalPrice === null) continue;

    const oldPrice = firstNumber(raw, ['oldPrice']);
    const currentPrice = salePrice ?? rentalPrice ?? 0;
    const promotionPercent =
      oldPrice !== null ? calculatePromotionPercent(oldPrice, currentPrice) : null;

    const images = unique([
      firstString(raw, ['imageUrl', 'image']),
      ...stringList(raw, ['images']),
    ].filter(Boolean));

    // Les specs ne sont transmises que si elles portent exactement ces clés
    // connues ; tout le reste (fournisseur, coût, URL PDF, upsell) est écarté.
    const specs = asRecord(raw.specs);
    const brightnessNits = firstNumber(specs, ['brightnessNits', 'luminosite']) ?? 0;
    const refreshRateHz = firstNumber(specs, ['refreshRateHz', 'refresh']) ?? 0;
    const ipRating = firstString(specs, ['ipRating', 'ip']);
    const weightKgPerSqm = firstNumber(specs, ['weightKgPerSqm', 'poids']) ?? 0;

    const tileWidthCm = firstNumber(raw, ['tileWidth', 'largeurDalle']);
    const tileHeightCm = firstNumber(raw, ['tileHeight', 'hauteurDalle']);

    products.push({
      id,
      name: firstString(raw, ['name']) || id,
      // `sku` n'existe pas dans le modèle PixiaTech : on ne l'invente pas.
      sku: '',
      pitch: parsePitch(raw.pitch),
      distance: firstNullableString(raw, ['distance']),
      availableFor,
      environments,
      isHidden: false,
      tileWidthMm: tileWidthCm === null ? 0 : Math.round(tileWidthCm * 10),
      tileHeightMm: tileHeightCm === null ? 0 : Math.round(tileHeightCm * 10),
      brightnessNits,
      refreshRateHz,
      ipRating,
      weightKgPerSqm,
      salePricePerSqm: salePrice,
      rentalPricePerSqmDay: rentalPrice,
      promotionPercent,
      images,
      descriptionFr: '',
      descriptionEn: '',
    });
  }

  return products;
}

/**
 * `getWizardSettings()` (lib/types.ts::WizardSettings) → module WizardSettings.
 * Les valeurs par défaut `picsum.photos` de l'action sont filtrées : seules les
 * URL réellement configurées sont conservées.
 */
function convertWizardSettings(rawWizard: unknown): WizardSettings {
  const wizard = asRecord(rawWizard);
  const rawProjectTypes = asRecord(wizard.projectTypes);
  const rawEnvironments = asRecord(wizard.environments);

  const projectType = (key: 'location' | 'vente') => {
    const raw = asRecord(rawProjectTypes[key]);
    const imageUrl = firstString(raw, ['imageUrl']);
    return {
      enabled: firstBoolean(raw, ['enabled'], false),
      imageUrl: imageUrl.includes('picsum.photos') ? '' : imageUrl,
    };
  };

  const environment = (key: 'interieur' | 'semi-exterieur' | 'exterieur') => {
    const raw = asRecord(rawEnvironments[key]);
    const imageUrl = firstString(raw, ['imageUrl']);
    return {
      // Le modèle réel n'a pas de champ `enabled` sur les environnements ;
      // une clé explicite est respectée si elle existe, sinon actif par défaut.
      enabled: firstBoolean(raw, ['enabled'], true),
      imageUrl: imageUrl.includes('picsum.photos') ? '' : imageUrl,
    };
  };

  const viewingDistances = unique(
    asArray(wizard.viewingDistances)
      .map((entry) => firstString(asRecord(entry), ['value']))
      .filter(Boolean)
  );

  const pixelPitches: WizardPitchOption[] = [];
  for (const entry of asArray(wizard.pixelPitches)) {
    const raw = asRecord(entry);
    const label = firstString(raw, ['value']);
    const value = parsePitch(raw.value);
    if (!label || value === null) continue;
    pixelPitches.push({
      value,
      label,
      // PixiaTech ne fournit pas de libellé marketing bilingue : on conserve
      // la valeur réelle plutôt que d'en inventer un.
      marketingLabelFr: label,
      marketingLabelEn: label,
    });
  }

  return {
    projectTypes: {
      location: projectType('location'),
      vente: projectType('vente'),
    },
    environments: {
      interieur: environment('interieur'),
      'semi-exterieur': environment('semi-exterieur'),
      exterieur: environment('exterieur'),
    },
    viewingDistances,
    pixelPitches,
  };
}

interface ConvertedSettings {
  moduleSettings: Settings;
  wizardSettings: WizardSettings;
}

/**
 * `getSettings()` (lib/types.ts::Settings) → module Settings.
 * Seuls les champs autorisés sont copiés : `emailVerification.code` (code
 * master admin) et `companySignatureDataUrl` sont délibérément exclus.
 */
function convertSettings(rawSettings: unknown, rawWizard: unknown): ConvertedSettings {
  const settings = asRecord(rawSettings);
  const estimation = asRecord(settings.estimationFlow);
  const emailVerification = asRecord(settings.emailVerification);
  const taxMode = firstString(estimation, ['taxMode']);

  // Templates contractuels : valeur réelle configurée, sinon modèle officiel.
  const contractTemplateFr =
    firstString(settings, ['saleContractTemplate']) ||
    getContractTemplate('vente', 'fr');
  const contractTemplateEn =
    firstString(settings, ['saleContractTemplateEn']) ||
    getContractTemplate('vente', 'en');

  return {
    moduleSettings: {
      isWizardBotEnabled: firstBoolean(settings, ['isWizardBotEnabled'], false),
      botWelcomeMessage: firstString(settings, ['botWelcomeMessage']),
      isEmailVerificationEnabled: firstBoolean(settings, ['isEmailVerificationEnabled'], false),
      isPriceHidden: firstBoolean(settings, ['isPriceHidden'], false),
      estimationFlow: {
        taxMode: taxMode === 'ttc' ? 'ttc' : 'ht',
        taxEnabled: firstBoolean(estimation, ['taxEnabled'], false),
        taxRate: firstNumber(estimation, ['taxRate']) ?? 0,
        contractTemplateFr,
        contractTemplateEn,
      },
      // Seule la durée de validité est transmise ; jamais le code admin.
      emailVerification: {
        validityMinutes: firstNumber(emailVerification, ['validityMinutes']) ?? 0,
      },
    },
    wizardSettings: convertWizardSettings(rawWizard),
  };
}

function convertDeliverySettings(value: unknown): DeliverySettings {
  const raw = asRecord(value);
  // Seules les règles générales (sans cityId) deviennent des zones : on ne
  // synthétise pas de zone à partir de `defaultFee`.
  const zones = asArray(raw.deliveryFeeRules)
    .map((rawRule) => asRecord(rawRule))
    .filter((rule) => !rule.cityId)
    .map((rule) => ({
      id: firstString(rule, ['zoneId']),
      name: firstString(rule, ['zoneId']),
      baseCost: firstNumber(rule, ['fee']),
    }))
    .filter((zone) => zone.id.length > 0);

  return { zones, currency: 'EUR' };
}

function convertLaborSettings(value: unknown): LaborSettings {
  // `hourlyRate` est le seul champ du modèle réel correspondant à un taux
  // horaire ; `rules[].price` est un forfait d'installation et est écarté.
  return { baseTechnicianRate: firstNumber(asRecord(value), ['hourlyRate']) };
}

function convertLocations(value: unknown): Locations {
  const villes = asArray(asRecord(value).villes)
    .map((rawCity) => {
      const city = asRecord(rawCity);
      return {
        id: firstString(city, ['id']),
        name: firstString(city, ['name']),
        postcode: firstString(city, ['postalCode']),
        zoneId: firstString(city, ['zoneId']),
      };
    })
    .filter((city) => city.id.length > 0);

  return { villes };
}

function convertBlockedPeriods(value: unknown[]): BlockedPeriod[] {
  const periods: BlockedPeriod[] = [];
  for (const rawPeriod of value) {
    const period = asRecord(rawPeriod);
    const from = firstString(period, ['from']);
    const to = firstString(period, ['to']);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) continue;
    // Aucune donnée de devis (client, statut, montant) n'est transmise.
    periods.push({
      id: `${from}_${to}`,
      from,
      to,
      reasonFr: 'Réservation ou maintenance',
      reasonEn: 'Reservation or maintenance',
    });
  }
  return periods;
}

function convertPdfSettings(value: unknown): PdfSettings {
  const raw = asRecord(value);
  const termsAndConditions = firstString(raw, ['termsAndConditions']);
  const optionalString = (keys: string[]) => {
    const found = firstString(raw, keys);
    return found.length > 0 ? found : undefined;
  };
  return {
    companyName: firstString(raw, ['companyName']),
    companyAddress: firstString(raw, ['address']),
    companyEmail: firstString(raw, ['email']),
    companyPhone: firstString(raw, ['phone']),
    siret: firstString(raw, ['siret']),
    // PixiaTech n'a qu'un seul texte de conditions générales.
    footerFr: termsAndConditions,
    footerEn: termsAndConditions,
    // Le modèle de devis officiel utilise ces champs ; ils doivent arriver
    // intactes au navigateur pour un rendu identique au parcours client.
    logoUrl: optionalString(['logoUrl']),
    backgroundUrl: optionalString(['backgroundUrl']),
    quoteTitle: optionalString(['quoteTitle']),
    quoteNumberPrefix: optionalString(['quoteNumberPrefix']),
    termsAndConditions: optionalString(['termsAndConditions']),
    bgColor: optionalString(['bgColor']),
    themeId: optionalString(['themeId']),
  };
}

/**
 * Assemble un bootstrap à partir des services officiels déjà présents dans
 * l'application. Aucune donnée n'est inventée : les champs absents restent
 * vides ou `null`, et les produits inexploitables sont ignorés.
 */
export function buildPixiaAssistantBootstrap(
  input: PixiaBootstrapBuildInput
): PixiaBootstrapResult {
  const { session, data } = input;

  try {
    // Une source absente ou non objét signale un service indisponible :
    // on échoue fermé plutôt que de produire un bootstrap vide et trompeur.
    if (
      data.settings === null ||
      data.settings === undefined ||
      typeof data.settings !== 'object' ||
      data.wizardSettings === null ||
      data.wizardSettings === undefined ||
      typeof data.wizardSettings !== 'object' ||
      data.deliverySettings === null ||
      data.deliverySettings === undefined ||
      typeof data.deliverySettings !== 'object' ||
      data.laborSettings === null ||
      data.laborSettings === undefined ||
      typeof data.laborSettings !== 'object' ||
      data.locations === null ||
      data.locations === undefined ||
      typeof data.locations !== 'object' ||
      data.pdfSettings === null ||
      data.pdfSettings === undefined ||
      typeof data.pdfSettings !== 'object'
    ) {
      return { ok: false, reason: 'service_unavailable' };
    }
    if (!Array.isArray(data.products) || !Array.isArray(data.blockedPeriods)) {
      return { ok: false, reason: 'service_unavailable' };
    }

    const products = convertProducts(data.products);
    const settings = convertSettings(data.settings, data.wizardSettings);

    const bootstrap: BootstrapPayload = {
      demoMode: false,
      // Le moteur officiel n'expose pas encore de hook branché sur le module.
      pricingFormulaStatus: 'on_quote_isolated',
      // Aucune simulation d'e-mail n'est disponible en production.
      emailMode: 'smtp',
      settings: settings.moduleSettings,
      wizardSettings: settings.wizardSettings,
      deliverySettings: convertDeliverySettings(data.deliverySettings),
      laborSettings: convertLaborSettings(data.laborSettings),
      products,
      locations: convertLocations(data.locations),
      blockedPeriods: convertBlockedPeriods(data.blockedPeriods),
      pdfSettings: convertPdfSettings(data.pdfSettings),
      clientProfile: session.loggedIn ? session.profile : null,
    };

    if (!isBootstrapPayloadValid(bootstrap)) {
      return { ok: false, reason: 'invalid_bootstrap' };
    }

    return { ok: true, bootstrap };
  } catch (error) {
    console.error('[pixia-assistant] bootstrap assembly failed:', error);
    return { ok: false, reason: 'service_unavailable' };
  }
}
