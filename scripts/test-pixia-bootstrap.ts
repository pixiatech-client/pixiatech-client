/**
 * Tests de non-régression du bootstrap réel du nouvel Assistant Bot Pixia.
 *
 * Exécution : npx tsx scripts/test-pixia-bootstrap.ts
 *
 * Ces tests vérifient l'alimentation en données réelles et le comportement
 * fail-closed du point d'entrée unique, sans jamais injecter de démonstration.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  isBootstrapPayloadValid,
} from '../src/components/pixia-assistant/core/bootstrap-validation';
import type {
  BootstrapPayload,
  ClientProfile,
} from '../src/components/pixia-assistant/core/types';
import { buildPixiaAssistantBootstrap } from '../src/lib/pixia-assistant/bootstrap-builder';
import type {
  PixiaAssistantSessionSnapshot,
  PixiaBootstrapBuildInput,
  PixiaBootstrapSourceData,
  PixiaBootstrapResult,
} from '../src/lib/pixia-assistant/bootstrap-types';

let failures = 0;
let assertions = 0;

function check(condition: boolean, label: string): void {
  assertions++;
  if (condition) {
    console.log(`  PASS | ${label}`);
  } else {
    failures++;
    console.log(`  FAIL | ${label}`);
  }
}

const ANONYMOUS: PixiaAssistantSessionSnapshot = {
  loggedIn: false,
  customerId: null,
  email: '',
  profile: null,
};

const LOGGED_IN_PROFILE: ClientProfile = {
  id: 'customer-123',
  avatarUrl: '',
  company: 'Client SARL',
  representative: 'Jean Dupont',
  email: 'jean@example.com',
  phone: '0600000000',
  address: '1 rue de Paris',
  deliveryCity: 'Paris',
  deliveryPostcode: '75001',
};

const LOGGED_IN: PixiaAssistantSessionSnapshot = {
  loggedIn: true,
  customerId: LOGGED_IN_PROFILE.id,
  email: LOGGED_IN_PROFILE.email,
  profile: LOGGED_IN_PROFILE,
};

function sourceData(overrides: Partial<PixiaBootstrapSourceData> = {}): PixiaBootstrapSourceData {
  return {
    settings: {
      isWizardBotEnabled: true,
      botWelcomeMessage: 'Bienvenue chez PixiaTech',
      isEmailVerificationEnabled: false,
      isPriceHidden: false,
      estimationFlow: {
        taxMode: 'ht',
        taxEnabled: true,
        taxRate: 20,
      },
      // Secrets qui ne doivent JAMAIS apparaître dans le bootstrap.
      emailVerification: { validityMinutes: 10, code: 'MASTER-SECRET-CODE' },
      companySignatureDataUrl: 'data:image/png;base64,SECRET',
      adminNote: 'confidentiel',
    },
    wizardSettings: {
      projectTypes: {
        location: { enabled: true, imageUrl: 'https://pixiatech.com/location.jpg' },
        vente: { enabled: true, imageUrl: '' },
      },
      environments: {
        interieur: { imageUrl: '' },
        'semi-exterieur': { imageUrl: '' },
        exterieur: { imageUrl: '' },
      },
      viewingDistances: [{ value: '0-2m' }, { value: '2-5m' }],
      pixelPitches: [
        { value: 'P2.5', recommended: true },
        { value: 'P3.91', recommended: false },
      ],
    },
    deliverySettings: {
      defaultFee: 99,
      isDefaultFeeEnabled: false,
      deliveryFeeRules: [
        { id: 'r1', zoneId: 'Paris', fee: 25 },
        { id: 'r2', zoneId: 'Lyon', fee: 30 },
        { id: 'r3', zoneId: 'Paris', cityId: 'city-1', fee: 10 },
      ],
    },
    laborSettings: { hourlyRate: 55, rules: [{ price: 500 }] },
    products: [
      {
        id: 'dalle-p25',
        name: 'Dalle P2.5',
        availableFor: ['sale', 'rental'],
        type: ['indoor', 'showcase'],
        pitch: 'P2.5',
        distance: '0-2m',
        tileWidth: 50,
        tileHeight: 50,
        salePricePerSqM: 1000,
        rentalPricePerDay: 15,
        oldPrice: 1250,
        imageUrl: 'https://pixiatech.com/dalle.jpg',
        isHidden: false,
        productUrl: 'https://pixiatech.com/devis-confidentiel.pdf',
        upsellFor: ['other-product'],
        specs: { secretFournisseur: 'NE-DOIT-PAS-SORTIR', brightnessNits: '800' },
      },
      {
        id: 'dalle-hidden',
        name: 'Dalle masquée',
        availableFor: ['sale'],
        type: ['outdoor'],
        salePricePerSqM: 500,
        isHidden: true,
      },
      {
        id: 'dalle-no-price',
        name: 'Dalle sans prix',
        availableFor: ['sale'],
        type: ['indoor'],
      },
    ],
    locations: {
      villes: [
        { id: 'city-1', name: 'Paris', postalCode: '75001', zoneId: 'Paris' },
      ],
    },
    blockedPeriods: [
      { from: '2026-12-24', to: '2026-12-26', quoteId: 'QUOTE-SECRET', client: 'Autre client' },
      { from: 'invalid', to: '2026-12-26' },
    ],
    pdfSettings: {
      companyName: 'PIXIATECH',
      address: '5 Rue La Fontaine',
      email: 'contact@pixiatech.com',
      phone: '07 56 81 66 26',
      siret: '993 747 161',
      termsAndConditions: 'CGV',
      capital: 'SECRET-ADMIN',
      logoUrl: 'https://pixiatech.com/logo.png',
    },
    ...overrides,
  };
}

function build(session: PixiaAssistantSessionSnapshot, overrides: Partial<PixiaBootstrapSourceData> = {}): PixiaBootstrapResult {
  const input: PixiaBootstrapBuildInput = { session, data: sourceData(overrides) };
  return buildPixiaAssistantBootstrap(input);
}

function bootstrapFrom(result: PixiaBootstrapResult): BootstrapPayload {
  if (!result.ok) throw new Error(`Bootstrap attendu valide, obtenu: ${result.reason}`);
  return result.bootstrap;
}

function assertNoSecrets(payload: BootstrapPayload, label: string): void {
  const serialized = JSON.stringify(payload);
  const forbidden = [
    'MASTER-SECRET-CODE',
    'SECRET',
    'confidentiel',
    'NE-DOIT-PAS-SORTIR',
    'devis-confidentiel',
    'QUOTE-SECRET',
    'Autre client',
    'SECRET-ADMIN',
    'passwordHash',
    'siretVerified',
    'vatValidated',
  ];
  check(
    forbidden.every((needle) => !serialized.includes(needle)),
    `${label} : aucun secret ni donnée d'un autre client`
  );
}

console.log('--- 1. Visiteur non connecté ---');
{
  const result = build(ANONYMOUS);
  check(result.ok, 'bootstrap anonyme accepté');
  const payload = bootstrapFrom(result);
  check(payload.clientProfile === null, 'profil client null pour un visiteur');
  check(payload.demoMode === false, 'demoMode=false');
  check(payload.pricingFormulaStatus === 'on_quote_isolated', 'tarification isolée');
  check(payload.emailMode === 'smtp', 'emailMode=smtp');
  assertNoSecrets(payload, 'Anonyme');
}

console.log('--- 2. Client connecté avec session valide ---');
{
  const result = build(LOGGED_IN);
  check(result.ok, 'bootstrap client accepté');
  const payload = bootstrapFrom(result);
  check(payload.clientProfile?.id === LOGGED_IN_PROFILE.id, 'profil du client connecté fourni');
  check(payload.clientProfile?.email === LOGGED_IN_PROFILE.email, 'email issu de la session');
  assertNoSecrets(payload, 'Connecté');
}

console.log('--- 3. Session expirée ou invalide ---');
{
  // Une session expirée/invalide est résolue comme anonyme par le serveur :
  // aucun profil, aucun identifiant, aucun email ne doit fuir.
  const expiredSession: PixiaAssistantSessionSnapshot = ANONYMOUS;
  const result = build(expiredSession);
  check(result.ok, 'session invalide → état anonyme valide');
  const payload = bootstrapFrom(result);
  check(payload.clientProfile === null, 'aucun profil pour une session expirée');
  assertNoSecrets(payload, 'Session expirée');
}

console.log('--- 4. Erreur Firestore / service indisponible ---');
{
  // Des données de service corrompues (équivalent d'une indisponibilité)
  // produisent un bootstrap invalide, jamais un fallback de démonstration.
  const result = build(ANONYMOUS, { products: 'indisponible' as unknown as [] });
  check(!result.ok, 'service indisponible → échec du bootstrap');
  if (!result.ok) {
    check(
      result.reason === 'invalid_bootstrap' || result.reason === 'service_unavailable',
      'motif d’échec explicite'
    );
  }
  check(
    build(ANONYMOUS, { settings: null }).ok === false,
    'settings absents → aucun bootstrap valide'
  );
}

console.log('--- 5. Catalogue vide ---');
{
  const result = build(ANONYMOUS, { products: [] });
  check(result.ok, 'catalogue vide accepté sans fallback');
  const payload = bootstrapFrom(result);
  check(payload.products.length === 0, 'aucun produit de démonstration injecté');
  check(
    payload.wizardSettings.viewingDistances.join(',') === '0-2m,2-5m',
    'distances issues des réglages réels, aucune valeur de démonstration'
  );
}

console.log('--- 6. Produits désactivés ou non disponibles ---');
{
  const payload = bootstrapFrom(build(ANONYMOUS));
  check(payload.products.length === 1, 'seul le produit exploitable est conservé');
  check(payload.products[0]?.id === 'dalle-p25', 'produit masqué et sans prix écartés');
  check(payload.products[0]?.sku === '', 'sku non inventé');
  check(payload.products[0]?.pitch === 2.5, "'P2.5' converti en 2.5");
  check(payload.products[0]?.tileWidthMm === 500, 'cm converti en mm (500)');
  check(payload.products[0]?.promotionPercent === 20, 'promotion calculée depuis oldPrice');
  check(
    payload.wizardSettings.pixelPitches.map((p) => p.value).join(',') === '2.5,3.91',
    'pitches du wizard parsés depuis P2.5/P3.91'
  );
  check(
    payload.deliverySettings.zones.length === 2 &&
      payload.deliverySettings.zones.every((z) => z.baseCost !== 10),
    'override ville écarté, aucune zone synthétique depuis defaultFee'
  );
  check(payload.laborSettings.baseTechnicianRate === 55, 'hourlyRate utilisé comme taux horaire');
  check(payload.locations.villes[0]?.postcode === '75001', 'postalCode mappé');
  check(payload.blockedPeriods.length === 1, 'période invalide écartée');
  check(
    !payload.blockedPeriods[0]?.id.includes('QUOTE'),
    'aucun identifiant de devis exposé'
  );
  check(payload.settings.estimationFlow.contractTemplateFr.length > 0, 'template FR réel');
  check(payload.settings.estimationFlow.contractTemplateEn.length > 0, 'template EN réel');
  check(
    payload.settings.emailVerification.validityMinutes === 10,
    'validité email transmise sans code admin'
  );
  assertNoSecrets(payload, 'Produits');
}

console.log('--- 7. Bootstrap invalide ---');
{
  const invalid = bootstrapFrom(build(ANONYMOUS));
  const demo = { ...invalid, demoMode: true };
  check(!isBootstrapPayloadValid(demo), 'demoMode=true rejeté par le validateur');
  const simulated = { ...invalid, emailMode: 'dev-simulated' as const };
  check(!isBootstrapPayloadValid(simulated), 'emailMode simulé rejeté');
  const missingTemplates = {
    ...invalid,
    settings: {
      ...invalid.settings,
      estimationFlow: { ...invalid.settings.estimationFlow, contractTemplateFr: '' },
    },
  };
  check(!isBootstrapPayloadValid(missingTemplates), 'templates vides rejetés');
  const invalidProduct = {
    ...invalid,
    products: [{ ...invalid.products[0]!, tileWidthMm: 'oops' }],
  };
  check(!isBootstrapPayloadValid(invalidProduct), 'produit mal formé rejeté');
}

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

function readSourceIfExists(relativePath: string): string {
  const absolute = resolve(process.cwd(), relativePath);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
}

async function importIfExists<T>(relativePath: string): Promise<T | null> {
  const absolute = resolve(process.cwd(), relativePath);
  if (!existsSync(absolute)) return null;
  try {
    return (await import(pathToFileURL(absolute).href)) as T;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  console.log('--- 8. Point d’entrée unique : validation fail-closed ---');
  {
    const valid = bootstrapFrom(build(ANONYMOUS));
    check(isBootstrapPayloadValid(valid), 'bootstrap réel accepté par le validateur');
    check(!isBootstrapPayloadValid(null), 'payload absent rejeté');
    check(!isBootstrapPayloadValid(undefined), 'payload indéfini rejeté');
    check(
      !isBootstrapPayloadValid({ ...valid, pricingFormulaStatus: 'local' }),
      'tarification locale rejetée'
    );
    check(
      !isBootstrapPayloadValid({ ...valid, products: [{ ...valid.products[0]!, id: '' }] }),
      'produit sans identifiant rejeté'
    );
  }

  console.log('--- 9. Intégration fidèle et connexion réelle ---');
  {
    const api = readSource('src/components/pixia-assistant/services/pixia-api.ts');
    check(!api.includes('/api/pixia/auth/login'), 'aucun appel à la route de connexion fictive');
    check(!api.includes('/api/pixia/auth/logout'), 'aucun appel à la route de déconnexion fictive');
    check(api.includes('/api/boutique/login-password'), 'connexion client via la vraie route boutique');
    check(api.includes('application/json'), 'réponses JSON contrôlées par Content-Type');

    const session = readSource('src/lib/pixia-assistant/session.ts');
    check(session.includes('requireRole'), 'session administrateur vérifiée côté serveur');
    check(session.includes("collection('customers')"), 'profil client réel lu dans Firestore');
    check(!session.includes('upsertCustomer'), 'aucune création de profil client depuis la session admin');

    const css = readSource('src/components/pixia-assistant/pixia-assistant.css');
    check(css.includes('.pixia-assistant-scope'), 'scope CSS étendu à toutes les surfaces du module');
    check(css.includes('outline: none'), 'outline du site hôte neutralisé dans le module');
    check(css.includes('--font-mono'), 'polices originales du module restaurées');

    const widget = readSource('src/components/pixia-assistant/surfaces/FloatingChatWidget.tsx');
    const mascot = readSource('src/components/pixia-assistant/features/pixia-bot/components/PixiaFloatingMascot.tsx');
    const catalog = readSource('src/components/pixia-assistant/features/pixia-bot/components/ProductCatalogStep.tsx');
    check(widget.includes('pixia-assistant-scope'), 'panneau modal dans le scope assistant');
    check(mascot.includes('pixia-assistant-scope'), 'mascotte dans le scope assistant');
    check(catalog.includes('pixia-assistant-scope'), 'portal volant dans le scope assistant');
  }

  console.log('--- 10. Contrat : services officiels, aucune simulation ---');
  {
    const api = readSource('src/components/pixia-assistant/services/pixia-api.ts');
    check(!api.includes('/api/pixia/'), 'aucun appel aux routes /api/pixia/* inexistantes');
    check(!api.includes('/api/pixia/quotes'), 'aucun appel à la route de devis /api/pixia/quotes');
    check(!api.includes('/api/pixia/dev/simulated-inbox'), 'aucune boîte de courrier simulée');
    check(!api.includes('fetchDevSimulatedInbox'), 'aucune fonction OTP simulée dans le client');
    check(api.includes("from '@/app/actions/pixia-assistant-quote-actions'"), 'devis/OTP/PDF passe par les Server Actions');

    const actionsPath = 'src/app/actions/pixia-assistant-quote-actions.ts';
    const actions = readSourceIfExists(actionsPath);
    check(actions.length > 0, 'actions serveur de devis présentes');
    check(actions.includes('createQuoteWithContract('), 'création via le service officiel createQuoteWithContract');
    check(actions.includes('verifyQuoteOtp('), 'vérification via le service officiel verifyQuoteOtp');
    check(actions.includes('resendQuoteOtp('), 'renvoi via le service officiel resendQuoteOtp');
    check(actions.includes('updateQuotePdfUrl('), 'PDF persisté via updateQuotePdfUrl');
    check(actions.includes('readPixiaAssistantSession()'), 'userid dérivé de la session serveur');
    check(!actions.includes('otpCode:'), 'aucun code OTP renvoyé au navigateur');
    check(actions.includes("emailMode: 'smtp'"), 'mode email réel, jamais simulé');
    check(actions.includes('capabilityToken: null'), 'aucun jeton de capacité JSON fabriqué');
    check(actions.includes('getQuoteRequest('), 'référence lue sur le devis officiel');
    check(actions.includes('quotes/pdfs/'), 'PDF stocké à l’emplacement officiel');
  }

  console.log('--- 11. Montants : moteur partagé, aucun tarif inventé ---');
  {
    const path = 'src/lib/pixia-assistant/quote-pricing.ts';
    const pricingSource = readSourceIfExists(path);
    check(pricingSource.includes('computeProductLineTotal('), 'ligne produit calculée par le moteur partagé');
    check(pricingSource.includes('computeDeliveryCostDetails('), 'livraison calculée par le moteur partagé');
    check(pricingSource.includes('computeLaborCost('), 'installation calculée par le moteur partagé');
    check(pricingSource.includes('buildPriceSnapshot('), 'snapshot figé par le constructeur officiel');
    check(pricingSource.includes('resolveDestination('), 'destination résolue par le résolveur centralisé');

    const pricing = await importIfExists<{
      buildAssistantQuotePricing: (input: Record<string, unknown>) => {
        snapshot: { productsSubtotal: number; delivery: { cost: number }; installation: { cost: number }; total: number };
        productItems: Array<{ lineTotal: number }>;
      };
    }>(path);
    check(pricing !== null, 'module de calcul de devis importable');
    if (pricing) {
      const base = {
        config: {
          projectType: 'vente', width: 2, height: 1, quantity: 1,
          pixelPitch: 2.5, pitchLabel: 'P2.5',
          selectedProductId: 'produit-officiel',
          rentalStartDate: null, rentalEndDate: null,
        },
        client: { deliveryCity: 'Paris', deliveryPostcode: '75001' },
        includeDelivery: true,
        includeInstallation: true,
        product: { id: 'produit-officiel', name: 'Dalle', salePricePerSqM: 100 },
        locations: { villes: [{ id: 'city-1', name: 'Paris', postcode: '75001', postalCode: '75001', zoneId: 'Paris' }] },
        settings: { estimationFlow: { taxEnabled: false, taxRate: 0, taxMode: 'ht' } },
        laborSettings: { rules: [] },
      };
      const configured = pricing.buildAssistantQuotePricing({
        ...base,
        deliverySettings: {
          defaultFee: 999, isDefaultFeeEnabled: false, isFreeDeliveryEnabled: false,
          freeDeliveryThreshold: 0, deliveryFeeRules: [{ id: 'r1', zoneId: 'Paris', fee: 25 }],
          unconfiguredZoneMessage: '',
        },
      });
      check(configured.snapshot.productsSubtotal === 200, 'montant produits issu du moteur (2m × 1m × 100€)');
      check(configured.snapshot.delivery.cost === 25, 'frais de livraison issus de la règle zone réelle');
      check(configured.snapshot.installation.cost === 0, 'aucun coût d’installation inventé sans règle');
      check(configured.snapshot.total === 225, 'total figé par le snapshot officiel');
      check(configured.productItems[0]?.lineTotal === 200, 'ligne produit transmise au devis officiel');

      const unknownCity = pricing.buildAssistantQuotePricing({
        ...base,
        client: { deliveryCity: 'Ville inconnue', deliveryPostcode: '' },
        locations: { villes: [] },
        deliverySettings: {
          defaultFee: 999, isDefaultFeeEnabled: false, isFreeDeliveryEnabled: false,
          freeDeliveryThreshold: 0, deliveryFeeRules: [], unconfiguredZoneMessage: '',
        },
      });
      check(unknownCity.snapshot.delivery.cost === 0, 'ville non configurée → 0€, pas de tarif par défaut inventé');
      check(unknownCity.snapshot.total === 200, 'total sans livraison non configurée');
    }
  }

  console.log('--- 12. Villes : clés React stables et suggestions dédupliquées ---');
  {
    const suggestionsPath = 'src/components/pixia-assistant/features/pixia-bot/city-suggestions.ts';
    const suggestionsModule = await importIfExists<{
      buildCitySuggestions: (villes: Array<{ id: string; name: string; postcode: string; zoneId: string }>) => Array<{ id: string; name: string }>;
    }>(suggestionsPath);
    check(suggestionsModule !== null, 'utilitaire de suggestions de villes présent');
    if (suggestionsModule) {
      const suggestions = suggestionsModule.buildCitySuggestions([
        { id: 'sd-93000', name: 'Saint-Denis', postcode: '93000', zoneId: 'z1' },
        { id: 'sd-93200', name: 'Saint-Denis', postcode: '93200', zoneId: 'z2' },
        { id: 'paris', name: 'Paris', postcode: '75001', zoneId: 'z3' },
      ]);
      check(suggestions.length === 2, 'deux Saint-Denis distinctes → un seul chip affiché');
      check(suggestions.map((s) => s.name).join(',') === 'Saint-Denis,Paris', 'ordre des villes préservé');
      check(new Set(suggestions.map((s) => s.id)).size === 2, 'clés de suggestions réellement uniques');
      check(suggestions[0]?.id === 'sd-93000', 'clé issue de l’identifiant réel de la ville');
    }

    const workspace = readSource('src/components/pixia-assistant/features/pixia-bot/PixiaChatWorkspace.tsx');
    check(workspace.includes('buildCitySuggestions('), 'suggestions construites depuis les vraies villes du bootstrap');
    check(!workspace.includes('villes.map((v) => v.name)'), 'plus de liste de noms bruts avec doublons');
    const field = readSource('src/components/pixia-assistant/features/pixia-bot/components/ClientFieldInputStep.tsx');
    check(field.includes('key={suggestion.id}'), 'clé React = identifiant stable de la ville');
    check(!/key=\{(city|index|i)\}/.test(field), 'aucune clé par nom de ville ni par index');
  }

  console.log('--- 13. PDF : modèle officiel du parcours client réutilisé par le bot ---');
  {
    const generator = readSource('src/components/pixia-assistant/features/pdf/pdf-generator.ts');
    check(generator.includes("from 'html2canvas'"), 'capture DOM par html2canvas comme le parcours client');
    check(generator.includes('.page-break-after'), 'capture des pages du modèle de devis officiel');
    check(!generator.includes('doc.text('), 'aucun PDF redessiné texte par texte dans le bot');
    check(generator.includes("orientation: 'portrait', unit: 'mm', format: 'a4'"), 'assemblage A4 identique à SignatureFlow');

    const template = readSource('src/components/pixia-assistant/features/pdf/assistant-quote-pdf-template.tsx');
    check(template.includes("from '@/app/admin/quote-pdf'"), 'rend le composant QuotePDF de l’application');
    check(template.includes('createPortal('), 'modèle rendu hors du scope CSS du bot');

    const model = readSource('src/components/pixia-assistant/features/pdf/quote-request-from-engine.ts');
    check(model.includes('snapshot.productsSubtotal'), 'montant produit issu du snapshot officiel');
    check(model.includes('snapshot.total'), 'total issu du snapshot officiel');
    check(model.includes('priceSnapshot: snapshot'), 'snapshot transmis au modèle de devis');

    const workspace = readSource('src/components/pixia-assistant/features/pixia-bot/PixiaChatWorkspace.tsx');
    check(workspace.includes('<AssistantQuotePdfTemplate'), 'modèle officiel monté par le workspace du bot');
    check(workspace.includes('pdfContainerRef: assistantPdfContainerRef'), 'conteneur du modèle fourni au moteur');

    const bootstrapBuilder = readSource('src/lib/pixia-assistant/bootstrap-builder.ts');
    check(bootstrapBuilder.includes("optionalString(['themeId'])"), 'thème du PDF officiel transmis au bot');
    check(bootstrapBuilder.includes("optionalString(['logoUrl'])"), 'logo du PDF officiel transmis au bot');
    check(!bootstrapBuilder.includes("optionalString(['capital'])"), 'capital admin jamais exposé au navigateur');
  }

  console.log(`\nRésultat : ${assertions - failures}/${assertions} assertions réussies.`);
  if (failures > 0) {
    console.error(`${failures} échec(s).`);
    process.exit(1);
  }
}

void main();
