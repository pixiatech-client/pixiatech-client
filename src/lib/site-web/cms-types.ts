export type CmsTranslationStatus = 'source' | 'translated' | 'manual' | 'missing';

export interface CmsFieldTranslation {
  value: string;
  status: CmsTranslationStatus;
  updatedAt?: string;
  sourceText?: string;
}

// Map: fieldKey -> langCode (e.g. 'fr', 'en', 'ar', 'es') -> CmsFieldTranslation
export type CmsI18nStore = Record<string, Record<string, CmsFieldTranslation>>;

export interface CmsSectionHero {
  _i18n?: CmsI18nStore;
  badge?: string;
  title?: string;
  tagline?: string;
  subtitle?: string;
  ctaText?: string;
  primaryCta?: string;
  secondaryCta?: string;
  heroImage?: string;
  primaryImage?: string;
  heroBgColor?: string;
  titleFontSize?: number;
  textColor?: string;
  [key: string]: unknown;
}

export interface CmsSectionOverview {
  eyebrow?: string;
  title?: string;
  description?: string;
  image?: string;
  stats?: Array<{ val: string; label: string }>;
}

export interface CmsSectionDesign {
  eyebrow?: string;
  title?: string;
  cabinetDim?: string;
  weight?: string;
  material?: string;
  image?: string;
}

export interface CmsSectionFeatures {
  eyebrow?: string;
  title?: string;
  stages?: Array<{ id: string; title: string; desc: string; media: string }>;
}

export interface CmsSectionShowreel {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  tagline?: string;
  billboardImage?: string;
}

export interface CmsSectionMarkets {
  eyebrow?: string;
  title?: string;
  items?: Array<{
    id: string;
    num: string;
    name: string;
    desc: string;
    cta: string;
    img: string;
  }>;
}

export interface CmsSectionKinetic {
  eyebrow?: string;
  title1?: string;
  title2?: string;
  title3?: string;
  stepText?: string;
  accentColor?: string;
}

export interface CmsSectionManifesto {
  eyebrow?: string;
  title?: string;
  body?: string;
}

export interface CmsSectionFieldwork {
  eyebrow?: string;
  title?: string;
  projects?: Array<{
    title: string;
    location: string;
    pitch: string;
    img: string;
  }>;
}

export interface CmsPageData {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  meta?: {
    title?: string;
    description?: string;
  };
  sectionOrder?: string[];
  sections?: {
    hero?: CmsSectionHero;
    overview?: CmsSectionOverview;
    design?: CmsSectionDesign;
    features?: CmsSectionFeatures;
    showreel?: CmsSectionShowreel;
    markets?: CmsSectionMarkets;
    kinetic?: CmsSectionKinetic;
    manifesto?: CmsSectionManifesto;
    fieldwork?: CmsSectionFieldwork;
    [key: string]: unknown;
  };
}

export interface CmsBackendSettings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  officeHours: string;
  accentColor: string;
  backendName: string;
  backendApiUrl: string;
}

export interface CmsDb {
  pages: Record<string, CmsPageData>;
  settings?: CmsBackendSettings;
  updatedAt?: string;
}

export const DEFAULT_CMS_SETTINGS: CmsBackendSettings = {
  companyName: 'PIXIATECH',
  tagline: 'Systèmes LED Architecturaux de Pointe',
  email: 'contact@pixiatech.com',
  phone: '+33 1 89 70 42 00',
  address: '75008 Paris, France',
  officeHours: 'Lun - Ven, 09h00 - 19h00 CET',
  accentColor: '#C3F910',
  backendName: 'Pixel Tech Web',
  backendApiUrl: '/api/site-web',
};
