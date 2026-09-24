export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export interface HeaderConfig {
  brandName: string;
  brandTagline: string;
  cartCount: number;
  navLinks: NavLink[];
}

export interface QuickHighlight {
  label: string;
  value: string;
  sub: string;
}

export interface Hotspot {
  id: string;
  title: string;
  description: string;
  top: string;
  left: string;
}

export interface HeroSectionData {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  visible: boolean;
  quickHighlights: QuickHighlight[];
  hotspots: Hotspot[];
}

export interface MetricCard {
  id: string;
  title: string;
  value: string;
  unit: string;
  badge: string;
  description: string;
  icon: string;
  visible: boolean;
}

export interface MetricsSectionData {
  badge: string;
  title: string;
  subtitle: string;
  visible: boolean;
  cards: MetricCard[];
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  visible: boolean;
}

export interface FeaturesSectionData {
  badge: string;
  title: string;
  subtitle: string;
  visible: boolean;
  items: FeatureItem[];
}

export interface PitchOption {
  id: string;
  name: string;
  pixelPitchH: number;
  pixelPitchV: number;
  brightness: number;
  transparency: number;
  minDistance: string;
  bestFor: string;
}

export interface ConfiguratorSectionData {
  badge: string;
  title: string;
  subtitle: string;
  visible: boolean;
  disclaimer: string;
  defaultPitch: string;
  defaultWidth: number;
  defaultHeight: number;
  pitchOptions: PitchOption[];
}

export interface ApplicationCase {
  id: string;
  title: string;
  sector: string;
  description: string;
  icon: string;
  stats: string;
  badge: string;
  visible: boolean;
}

export interface ApplicationsSectionData {
  badge: string;
  title: string;
  subtitle: string;
  visible: boolean;
  cases: ApplicationCase[];
}

export interface SpecRow {
  id: string;
  category: string;
  param: string;
  p28: string;
  p39: string;
  p78: string;
  visible: boolean;
}

export interface SpecificationsSectionData {
  badge: string;
  title: string;
  subtitle: string;
  visible: boolean;
  columns: string[];
  rows: SpecRow[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
}

export interface FAQSectionData {
  badge: string;
  title: string;
  subtitle: string;
  visible: boolean;
  items: FAQItem[];
}

export interface SocialLink {
  name: string;
  icon: string;
  url: string;
}

export interface FooterConfig {
  showroomTitle: string;
  showroomAddress: string;
  showroomDesc: string;
  phone: string;
  email: string;
  openingHours: string;
  techTags: string[];
  copyright: string;
  socials: SocialLink[];
}

export interface ProductWPData {
  header: HeaderConfig;
  hero: HeroSectionData;
  metrics: MetricsSectionData;
  features: FeaturesSectionData;
  configurator: ConfiguratorSectionData;
  applications: ApplicationsSectionData;
  specifications: SpecificationsSectionData;
  faq: FAQSectionData;
  footer: FooterConfig;
}

export interface QuoteRequestPayload {
  name: string;
  email: string;
  company?: string;
  phone: string;
  pitch: string;
  widthMeters: number;
  heightMeters: number;
  surfaceM2: number;
  resolutionPx: string;
  installationType: string;
  message?: string;
}
