import type {
  BlockedPeriod,
  DeliverySettings,
  LaborSettings,
  Locations,
  PdfSettings,
  Product,
  Settings,
  WizardSettings,
} from '../src/core/types.ts';

export const DEMO_IMAGES = {
  indoor: '/src/assets/images/led_indoor_fine_pitch_1795455824708.jpg',
  outdoor: '/src/assets/images/led_outdoor_billboard_1795455824519.jpg',
  rental: '/src/assets/images/led_rental_stage_1795455825676.jpg',
  semiOutdoor: '/src/assets/images/led_semi_outdoor_retail_1795455826034.jpg',
  avatar: '/src/assets/images/pixia_assistant_avatar_1795455826234.jpg',
};

export const DEMO_SETTINGS: Settings = {
  isWizardBotEnabled: true,
  botWelcomeMessage: '',
  isEmailVerificationEnabled: true,
  isPriceHidden: false,
  estimationFlow: {
    taxMode: 'ht',
    taxEnabled: true,
    taxRate: 20,
    contractTemplateFr: `ARTICLE 1 — OBJET DE LA PROPOSITION
Le présent document formalise la configuration technique d'écran LED définie avec l'assistant PIXIA pour le compte du Client.

ARTICLE 2 — VALIDITÉ ET TARIFICATION
Les montants marqués « Sur estimation » font l'objet d'une validation technique finale par le bureau d'études Pixiatech (structure porteuse, raccordement électrique et logistique d'accès) avant édition de la facture d'acompte.

ARTICLE 3 — DÉLAIS, LIVRAISON ET POSE
Si la livraison ou l'installation est incluse, nos équipes planifient une visite de repérage ou la validation sur photo du site. Pour les locations, le matériel doit être restitué dans l'état d'origine à l'issue de la période réservée.

ARTICLE 4 — SIGNATURE ÉLECTRONIQUE ET VÉRIFICATION
La signature électronique apposée ci-dessous, complétée le cas échéant par la vérification par code OTP à usage unique, vaut accord de demande d’estimation ferme auprès de Pixiatech.`,
    contractTemplateEn: `ARTICLE 1 — SCOPE OF PROPOSAL
This document records the technical LED screen configuration defined with the PIXIA assistant on behalf of the Client.

ARTICLE 2 — VALIDITY & PRICING
Items marked "On quote" undergo final engineering review by Pixiatech (mounting structure, power feed, and site access logistics) prior to issuing the deposit invoice.

ARTICLE 3 — DELIVERY & INSTALLATION
When delivery or installation is selected, our technical crew schedules site verification based on submitted documentation. Rental hardware must be returned in original condition at the end of the reserved period.

ARTICLE 4 — ELECTRONIC SIGNATURE & VERIFICATION
The electronic signature below, together with one-time OTP verification when enabled, confirms submission of this quote request to Pixiatech.`,
  },
  emailVerification: {
    validityMinutes: 10,
  },
};

export const DEMO_WIZARD_SETTINGS: WizardSettings = {
  projectTypes: {
    vente: { enabled: true, imageUrl: DEMO_IMAGES.indoor },
    location: { enabled: true, imageUrl: DEMO_IMAGES.rental },
  },
  environments: {
    interieur: { enabled: true, imageUrl: DEMO_IMAGES.indoor },
    'semi-exterieur': { enabled: true, imageUrl: DEMO_IMAGES.semiOutdoor },
    exterieur: { enabled: true, imageUrl: DEMO_IMAGES.outdoor },
  },
  viewingDistances: ['0.5-2m', '2-5m', '5-10m', '10-20m', '+20m'],
  pixelPitches: [
    {
      value: 1.5,
      label: 'P1.5',
      marketingLabelFr: 'P1.5 • Ultra HD Proximité',
      marketingLabelEn: 'P1.5 • Ultra HD Close-Range',
    },
    {
      value: 2.5,
      label: 'P2.5',
      marketingLabelFr: 'P2.5 • Full HD Polyvalent',
      marketingLabelEn: 'P2.5 • Full HD Versatile',
    },
    {
      value: 3.9,
      label: 'P3.9',
      marketingLabelFr: 'P3.9 • Événementiel & Vitrine',
      marketingLabelEn: 'P3.9 • Events & Storefront',
    },
    {
      value: 4.8,
      label: 'P4.8',
      marketingLabelFr: 'P4.8 • Grand Format Scène',
      marketingLabelEn: 'P4.8 • Large Stage Format',
    },
    {
      value: 6.0,
      label: 'P6.0',
      marketingLabelFr: 'P6.0 • Moyenne Distance Extérieur',
      marketingLabelEn: 'P6.0 • Mid-Range Outdoor',
    },
    {
      value: 10.0,
      label: 'P10.0',
      marketingLabelFr: 'P10.0 • Façade & Longue Portée',
      marketingLabelEn: 'P10.0 • Facade & Long-Range',
    },
  ],
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-lumi-p15',
    name: 'LUMI Architectural P1.5 COB',
    sku: 'PX-LM-15',
    pitch: 1.5,
    distance: '0.5-2m',
    availableFor: ['vente'],
    environments: ['interieur'],
    tileWidthMm: 600,
    tileHeightMm: 337.5,
    brightnessNits: 1000,
    refreshRateHz: 3840,
    ipRating: 'IP40',
    weightKgPerSqm: 22,
    salePricePerSqm: null,
    rentalPricePerSqmDay: null,
    promotionPercent: null,
    images: [DEMO_IMAGES.indoor, DEMO_IMAGES.semiOutdoor],
    descriptionFr: 'Dalle COB sans bordure pour halls d’accueil corporate et salles de contrôle.',
    descriptionEn: 'Seamless COB cabinet engineered for corporate lobbies and control rooms.',
  },
  {
    id: 'prod-lumi-p25',
    name: 'LUMI Studio Pro P2.5',
    sku: 'PX-LM-25',
    pitch: 2.5,
    distance: '2-5m',
    availableFor: ['vente', 'location'],
    environments: ['interieur', 'semi-exterieur'],
    tileWidthMm: 500,
    tileHeightMm: 500,
    brightnessNits: 1400,
    refreshRateHz: 3840,
    ipRating: 'IP43',
    weightKgPerSqm: 24,
    salePricePerSqm: null,
    rentalPricePerSqmDay: null,
    promotionPercent: null,
    images: [DEMO_IMAGES.indoor, DEMO_IMAGES.rental],
    descriptionFr: 'Modèle polyvalent haute fréquence pour auditoriums, showrooms et conférences.',
    descriptionEn: 'High-refresh versatile display built for auditoriums, showrooms, and conferences.',
  },
  {
    id: 'prod-stage-p39',
    name: 'PIXIA Tour Rigging P3.9',
    sku: 'PX-TR-39',
    pitch: 3.9,
    distance: '2-5m',
    availableFor: ['location', 'vente'],
    environments: ['interieur', 'semi-exterieur', 'exterieur'],
    tileWidthMm: 500,
    tileHeightMm: 1000,
    brightnessNits: 4200,
    refreshRateHz: 3840,
    ipRating: 'IP65',
    weightKgPerSqm: 27,
    salePricePerSqm: null,
    rentalPricePerSqmDay: null,
    promotionPercent: null,
    images: [DEMO_IMAGES.rental, DEMO_IMAGES.semiOutdoor],
    descriptionFr: 'Châssis magnésium à verrouillage rapide conçu pour le montage scénique et salons.',
    descriptionEn: 'Quick-lock magnesium rental cabinet built for stage rigging and trade shows.',
  },
  {
    id: 'prod-retail-p48',
    name: 'VITRINE High-Bright P4.8',
    sku: 'PX-VT-48',
    pitch: 4.8,
    distance: '5-10m',
    availableFor: ['vente', 'location'],
    environments: ['semi-exterieur', 'exterieur'],
    tileWidthMm: 500,
    tileHeightMm: 500,
    brightnessNits: 5000,
    refreshRateHz: 3840,
    ipRating: 'IP54',
    weightKgPerSqm: 26,
    salePricePerSqm: null,
    rentalPricePerSqmDay: null,
    promotionPercent: null,
    images: [DEMO_IMAGES.semiOutdoor, DEMO_IMAGES.outdoor],
    descriptionFr: 'Haute luminosité anti-reflet optimisée pour vitrines commerciales et galeries.',
    descriptionEn: 'High-luminance anti-glare cabinet optimized for luxury retail windows.',
  },
  {
    id: 'prod-urban-p60',
    name: 'URBAN Facade P6.0 IP65',
    sku: 'PX-UR-60',
    pitch: 6.0,
    distance: '5-10m',
    availableFor: ['vente'],
    environments: ['exterieur'],
    tileWidthMm: 960,
    tileHeightMm: 960,
    brightnessNits: 6500,
    refreshRateHz: 3840,
    ipRating: 'IP65',
    weightKgPerSqm: 31,
    salePricePerSqm: null,
    rentalPricePerSqmDay: null,
    promotionPercent: null,
    images: [DEMO_IMAGES.outdoor, DEMO_IMAGES.semiOutdoor],
    descriptionFr: 'Caisson aluminium étanche à maintenance frontale pour façades et totems urbains.',
    descriptionEn: 'Weatherproof front-service aluminum cabinet for urban facades and signage.',
  },
  {
    id: 'prod-skyline-p10',
    name: 'SKYLINE Billboard P10.0',
    sku: 'PX-SK-100',
    pitch: 10.0,
    distance: '+20m',
    availableFor: ['vente'],
    environments: ['exterieur'],
    tileWidthMm: 960,
    tileHeightMm: 960,
    brightnessNits: 8000,
    refreshRateHz: 1920,
    ipRating: 'IP66',
    weightKgPerSqm: 34,
    salePricePerSqm: null,
    rentalPricePerSqmDay: null,
    promotionPercent: null,
    images: [DEMO_IMAGES.outdoor, DEMO_IMAGES.rental],
    descriptionFr: 'Grand format longue portée pour axes routiers, stades et toitures.',
    descriptionEn: 'Long-range large-format billboard engineered for stadiums and highways.',
  },
];

export const DEMO_LOCATIONS: Locations = {
  villes: [
    { id: 'city-paris', name: 'Paris', postcode: '75000', zoneId: 'zone-idf' },
    { id: 'city-lyon', name: 'Lyon', postcode: '69000', zoneId: 'zone-aura' },
    { id: 'city-marseille', name: 'Marseille', postcode: '13000', zoneId: 'zone-paca' },
    { id: 'city-bordeaux', name: 'Bordeaux', postcode: '33000', zoneId: 'zone-naq' },
    { id: 'city-lille', name: 'Lille', postcode: '59000', zoneId: 'zone-hdf' },
    { id: 'city-nantes', name: 'Nantes', postcode: '44000', zoneId: 'zone-pdl' },
  ],
};

export const DEMO_DELIVERY_SETTINGS: DeliverySettings = {
  currency: 'EUR',
  zones: [
    { id: 'zone-idf', name: 'Île-de-France', baseCost: null },
    { id: 'zone-aura', name: 'Auvergne-Rhône-Alpes', baseCost: null },
    { id: 'zone-paca', name: 'Provence-Alpes-Côte d’Azur', baseCost: null },
  ],
};

export const DEMO_LABOR_SETTINGS: LaborSettings = {
  baseTechnicianRate: null,
};

export function getDemoBlockedPeriods(): BlockedPeriod[] {
  return [];
}

export const DEMO_PDF_SETTINGS: PdfSettings = {
  companyName: 'Pixiatech LED Systems',
  companyAddress: '18 Avenue de l’Innovation, 75011 Paris',
  companyEmail: 'devis@pixiatech.demo',
  companyPhone: '+33 1 84 00 00 00',
  siret: 'DEMO-PIXIA-LED-001',
  footerFr: 'Document de démonstration généré par PIXIA — Les lignes « Sur estimation » sont soumises à validation technique finale.',
  footerEn: 'Demonstration quote generated by PIXIA — Items marked "On quote" undergo final engineering review.',
};

export const DEMO_CLIENT_ACCOUNT = {
  id: 'client-atelier-lumiere',
  avatarUrl: DEMO_IMAGES.avatar,
  company: 'Atelier Lumière SAS',
  representative: 'Camille Laurent',
  email: 'camille.laurent@atelier-lumiere.fr',
  phone: '+33612345678',
  address: '18 Avenue de la République, 69002 Lyon',
  deliveryCity: 'Lyon',
  deliveryPostcode: '69002',
};
