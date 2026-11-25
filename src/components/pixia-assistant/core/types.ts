export enum STEP {
  PROJECT_TYPE = 1,
  ENVIRONMENT = 2,
  DIMENSIONS = 3,
  DISTANCE = 4,
  PITCH = 5,
  SUMMARY = 6,
  PRODUCTS = 7,
  QUANTITY = 8,
  FORM_EMAIL = 12,
  GENERATING = 16,
  SUCCESS = 17,
  RENTAL_PERIOD = 18,
  SITE_PHOTO = 19,
  CONTRAT = 20,
  SECURITE = 21,
  FELICITATIONS = 22,
  FORM_COMPANY = 25,
  FORM_REPRESENTATIVE = 26,
  FORM_PHONE = 27,
  FORM_ADDRESS = 28,
  INSTALLATION = 29,
  DELIVERY = 30,
  DELIVERY_CHOICE = 31,
  RENTAL_COMMENT = 32,
  CLIENT_ACCOUNT = 33,
}

export interface ClientProfile {
  id: string;
  avatarUrl: string;
  company: string;
  representative: string;
  email: string;
  phone: string;
  address: string;
  deliveryCity: string;
  deliveryPostcode: string;
}

export type Language = 'fr' | 'en';
export type ProjectType = 'vente' | 'location';
export type EnvironmentType = 'interieur' | 'semi-exterieur' | 'exterieur';
export type ScreenShape = 'flat' | 'curved' | '360';

export interface Product {
  id: string;
  name: string;
  sku: string;
  pitch: number | null;
  distance: string | null;
  availableFor: ProjectType[];
  environments: EnvironmentType[];
  isHidden?: boolean;
  tileWidthMm: number;
  tileHeightMm: number;
  brightnessNits: number;
  refreshRateHz: number;
  ipRating: string;
  weightKgPerSqm: number;
  salePricePerSqm: number | null;
  rentalPricePerSqmDay: number | null;
  promotionPercent?: number | null;
  images: string[];
  descriptionFr: string;
  descriptionEn: string;
}

export interface WizardPitchOption {
  value: number;
  label: string;
  marketingLabelFr: string;
  marketingLabelEn: string;
}

export interface WizardSettings {
  projectTypes: {
    location: { enabled: boolean; imageUrl: string };
    vente: { enabled: boolean; imageUrl: string };
  };
  environments: {
    interieur: { enabled: boolean; imageUrl: string };
    'semi-exterieur': { enabled: boolean; imageUrl: string };
    exterieur: { enabled: boolean; imageUrl: string };
  };
  viewingDistances: string[];
  pixelPitches: WizardPitchOption[];
}

export interface Settings {
  isWizardBotEnabled: boolean;
  botWelcomeMessage: string;
  isEmailVerificationEnabled: boolean;
  isPriceHidden: boolean;
  estimationFlow: {
    taxMode: 'ht' | 'ttc';
    taxEnabled: boolean;
    taxRate: number;
    contractTemplateFr: string;
    contractTemplateEn: string;
  };
  emailVerification: {
    validityMinutes: number;
  };
}

export interface DeliveryZone {
  id: string;
  name: string;
  baseCost: number | null;
}

export interface DeliverySettings {
  zones: DeliveryZone[];
  currency: 'EUR';
}

export interface LaborSettings {
  baseTechnicianRate: number | null;
}

export interface LocationCity {
  id: string;
  name: string;
  postcode: string;
  zoneId: string;
}

export interface Locations {
  villes: LocationCity[];
}

export interface BlockedPeriod {
  id: string;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  reasonFr: string;
  reasonEn: string;
}

export interface PdfSettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  siret: string;
  footerFr: string;
  footerEn: string;
}

export interface BootstrapPayload {
  demoMode: boolean;
  pricingFormulaStatus: 'on_quote_isolated' | 'configured';
  emailMode: 'dev-simulated' | 'smtp';
  settings: Settings;
  wizardSettings: WizardSettings;
  deliverySettings: DeliverySettings;
  laborSettings: LaborSettings;
  products: Product[];
  locations: Locations;
  blockedPeriods: BlockedPeriod[];
  pdfSettings: PdfSettings;
  clientProfile?: ClientProfile | null;
}

export interface ConfigState {
  projectType: ProjectType | null;
  environment: EnvironmentType | null;
  width: number | null;
  height: number | null;
  screenShape?: ScreenShape;
  curveLeft?: number;
  curveRight?: number;
  distance: string | null;
  pixelPitch: number | null;
  pitchLabel: string | null;
  selectedProduct: Product | null;
  quantity: number;
  installationPhoto: string | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  rentalStartTime: string;
  rentalEndTime: string;
  rentalComment?: string;
}

export interface ClientFormState {
  company: string;
  representative: string;
  email: string;
  phone: string;
  address: string;
  deliveryCity: string;
  deliveryPostcode: string;
}

export interface SecurityState {
  contractAccepted: boolean;
  contractReadApproved: boolean;
  signatureValidated: boolean;
  signatureDataUrl: string | null;
  otpVerified: boolean;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  otpCooldownSeconds: number;
  pdfUrl: string | null;
}

export interface MessageOption {
  id: string;
  label: string;
  labelKey?: string;
  value: string;
  imageUrl?: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  senderId: 'bot' | 'user';
  content: string;
  translationKey?: string;
  translationParams?: Record<string, string | number>;
  options?: MessageOption[];
  optionsDisabled?: boolean;
  fileUrl?: string;
  selectedProduct?: Product;
  createdAt: number;
}

export interface StepSnapshot {
  step: STEP;
  messages: ChatMessage[];
  configState: ConfigState;
  form: ClientFormState;
  includeDelivery: boolean | null;
  includeInstallation: boolean | null;
  errorCount: number;
}

export interface PricingCalculationResult {
  formulaStatus: 'on_quote_isolated' | 'configured';
  displayMode: 'on_quote' | 'calculated';
  areaSqm: number;
  totalAreaSqm: number;
  rentalDays: number;
  effectiveBillingDays: number;
  destination: {
    cityName: string;
    postcode: string;
    zoneId: string | null;
    matched: boolean;
  };
  lineTotal: number | null;
  installationCost: number | null;
  techniciansRequired: number | null;
  deliveryCost: number | null;
  subtotal: number | null;
  taxRate: number;
  taxMode: 'ht' | 'ttc';
  total: number | null;
  deposit: number | null;
  promotionPercent: number | null;
}

export interface QuoteRecord {
  id: string;
  reference: string;
  configuratorType: 'lumi';
  status: 'pending' | 'verified';
  createdAt: string;
  language: Language;
  clientDetails: ClientFormState;
  configState: {
    projectType: ProjectType;
    environment: EnvironmentType;
    width: number;
    height: number;
    distance: string;
    pixelPitch: number;
    pitchLabel: string;
    productId: string;
    productName: string;
    quantity: number;
    hasInstallationPhoto: boolean;
    rentalPeriod: {
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
    } | null;
  };
  includeDelivery: boolean;
  includeInstallation: boolean;
  priceSnapshot: PricingCalculationResult;
  signatureDataUrl: string;
  otpRequired: boolean;
  emailVerified: boolean;
  pdfUrl: string | null;
}
