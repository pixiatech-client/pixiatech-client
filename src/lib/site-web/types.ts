export interface ContactInfo {
  companyName: string;
  tagline: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  primaryEmail: string;
  supportEmail: string;
  phone1: string;
  phone2: string;
  whatsappNumber: string;
  workingHours: string;
  responseTimeCommitment: string;
  googleMapsUrl: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromEmail: string;
  recipientEmail: string;
  enabled: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  projectType: string;
  subject: string;
  message: string;
  consent: boolean;
  createdAt: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  emailDeliveryStatus: 'sent' | 'simulated' | 'failed' | 'disabled';
  deliveryNote?: string;
}

export interface ContactSubmissionPayload {
  name: string;
  email: string;
  phone: string;
  company?: string;
  projectType: string;
  subject: string;
  message: string;
  consent: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ProjectCategoryConfig {
  id: string;
  title: string;
  desc: string;
  tag: string;
  visible: boolean;
}

export interface FaqItemConfig {
  id: string;
  category: string;
  question: string;
  answer: string;
  visible: boolean;
}

export interface PageContentConfig {
  visibility: {
    // Hero
    heroBadge: boolean;
    heroTitle: boolean;
    heroSubtitle: boolean;
    heroStatsPills: boolean;
    heroCtaButton: boolean;
    // Form
    contactFormCard: boolean;
    formCategorySelection: boolean;
    formPhoneField: boolean;
    formCompanyField: boolean;
    formSubjectField: boolean;
    // Info Column
    contactInfoCard: boolean;
    infoHqHeroCard: boolean;
    infoCoordinatesCard: boolean;
    infoCompanyRow: boolean;
    infoAddressRow: boolean;
    infoPhonesRow: boolean;
    infoEmailRow: boolean;
    infoSupportEmailRow: boolean;
    infoWhatsappRow: boolean;
    infoWorkingHoursRow: boolean;
    infoRadarMapCard: boolean;
    // FAQ
    faqSection: boolean;
    // Footer
    footerSection: boolean;
    footerTagsRow: boolean;
    footerCoordinatesCol: boolean;
    footerLinksCol: boolean;
    footerSocialsRow: boolean;
  };
  hero: {
    badgeText: string;
    badgeLocation: string;
    titleLine1: string;
    titleHighlight: string;
    subtitle: string;
    stat1Text: string;
    stat2Text: string;
    stat3Text: string;
    ctaButtonText: string;
  };
  form: {
    badge: string;
    headerSubtext: string;
    title: string;
    subtitle: string;
    step1Title: string;
    categories: ProjectCategoryConfig[];
    step2Title: string;
    step3Title: string;
    submitButtonText: string;
    trustReassuranceText: string;
  };
  /**
   * Mise en forme de la colonne « Coordonnées » uniquement.
   *
   * SOURCE UNIQUE : `addressValue`, `phone1`, `phone2`, `emailValue`,
   * `whatsappNumber` et `hoursValue` ne sont plus lus ici. Ces VALEURS sont
   * définies par `ContactInfo` (`siteWeb/contactInfo`), seul document qui les
   * possède ; `ContactSections` lit `contactInfo` et ne se rabat sur ces champs
   * que si l'API est injoignable. Les champs restent dans le type parce que les
   * documents déjà enregistrés en contiennent : ne pas les écrire, ne pas les
   * lire comme source.
   */
  info: {
    hqBadge: string;
    hqLocation: string;
    hqTitle: string;
    hqDesc: string;
    stat1Label: string;
    stat1Value: string;
    stat2Label: string;
    stat2Value: string;
    coordsTitle: string;
    addressLabel: string;
    /** Déprécié : lire `ContactInfo.address`. Conservé pour les documents existants. */
    addressValue: string;
    phonesLabel: string;
    /** Déprécié : lire `ContactInfo.phone1`. Conservé pour les documents existants. */
    phone1: string;
    /** Déprécié : lire `ContactInfo.phone2`. Conservé pour les documents existants. */
    phone2: string;
    emailLabel: string;
    /** Déprécié : lire `ContactInfo.primaryEmail`. Conservé pour les documents existants. */
    emailValue: string;
    whatsappLabel: string;
    whatsappSubtext: string;
    /** Déprécié : lire `ContactInfo.whatsappNumber`. Conservé pour les documents existants. */
    whatsappNumber: string;
    hoursLabel: string;
    /** Déprécié : lire `ContactInfo.workingHours`. Conservé pour les documents existants. */
    hoursValue: string;
    mapTitle: string;
    mapBadge: string;
    mapPinLabel: string;
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    items: FaqItemConfig[];
  };
  footer: FooterConfig;
}

export interface FooterTagItem {
  id: string;
  text: string;
  visible: boolean;
}

export interface FooterLinkItem {
  id: string;
  label: string;
  url: string;
  iconName: string;
  visible: boolean;
}

export interface FooterSocialItem {
  id: string;
  name: string;
  url: string;
  iconName: string;
  visible: boolean;
}

export interface FooterConfig {
  companyName: string;
  badgeText: string;
  description: string;
  tags: FooterTagItem[];
  col2Title: string;
  addressIcon: string;
  addressText: string;
  phoneIcon: string;
  phoneText: string;
  emailIcon: string;
  emailText: string;
  col3Title: string;
  links: FooterLinkItem[];
  socialsTitle: string;
  socials: FooterSocialItem[];
  copyrightText: string;
  locationBadge: string;
  warrantyText: string;
}
