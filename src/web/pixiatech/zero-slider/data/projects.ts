const entrepriseImg = '/assets/images/pixiatech/01-entreprise.webp';
const commerceRetailImg = '/assets/images/pixiatech/02-commerce-retail.webp';
const doohImg = '/assets/images/pixiatech/03-dooh.webp';
const locationEvenementsImg = '/assets/images/pixiatech/04-location-evenements.webp';
const xrProductionImg = '/assets/images/pixiatech/05-xr-production.webp';
const sportsImg = '/assets/images/pixiatech/06-sports.webp';
const sallesControleImg = '/assets/images/pixiatech/07-salles-controle.webp';
const creatifArchitectureImg = '/assets/images/pixiatech/08-creatif-architecture.webp';

export interface ProjectTag {
  title: string;
  url?: string;
}

export interface ProjectMediaFrame {
  id: string;
  kind: 'image' | 'specimen';
  src?: string;
  aspectRatio: string;
  caption?: string;
  objectPosition?: string;
  specimenTitle?: string;
  specimenSubtitle?: string;
  specimenBg?: string;
  specimenFg?: string;
}

export interface FeaturedProject {
  slug: string;
  title: string;
  description: string;
  awards: number | null;
  link: string;
  tags: ProjectTag[];
  aspect: number; // width / height
  heroImage: string;
  cardOverlayTitle?: string;
  cardOverlayFont?: 'serif' | 'sans';
  cardAccentHex: string;
  gallery: ProjectMediaFrame[];
}

export interface ArchiveItem {
  slug: string;
  title: string;
  featuredSlug?: string;
  externalUrl: string;
  previewImage: string;
  year?: string;
  role?: string;
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    slug: 'entreprise',
    title: '01 — Entreprise',
    description:
      'Des écrans de précision pour les espaces où chaque détail compte.',
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '01 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: entrepriseImg,
    cardAccentHex: '#e67e22',
    gallery: [
      {
        id: 'ent-1',
        kind: 'image',
        src: entrepriseImg,
        aspectRatio: '16 / 9',
        caption: '01 — Entreprise · Pixiatech',
      },
      {
        id: 'ent-2',
        kind: 'image',
        src: entrepriseImg,
        aspectRatio: '16 / 9',
        caption: 'Salles de direction & présentations commerciales',
      },
      {
        id: 'ent-3',
        kind: 'image',
        src: entrepriseImg,
        aspectRatio: '16 / 9',
        caption: 'Écrans LED haute résolution pour environnements corporate',
      },
      {
        id: 'ent-4',
        kind: 'image',
        src: entrepriseImg,
        aspectRatio: '16 / 9',
        caption: 'Intégration architecturale sur mesure',
      },
    ],
  },
  {
    slug: 'commerce-retail',
    title: '02 — Commerce & Retail',
    description:
      'Des affichages qui transforment les visiteurs en audiences captivées.',
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '02 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: commerceRetailImg,
    cardAccentHex: '#d99026',
    gallery: [
      {
        id: 'ret-1',
        kind: 'image',
        src: commerceRetailImg,
        aspectRatio: '16 / 9',
        caption: '02 — Commerce & Retail · Pixiatech',
      },
      {
        id: 'ret-2',
        kind: 'image',
        src: commerceRetailImg,
        aspectRatio: '16 / 9',
        caption: 'Vitrines dynamiques & points de vente',
      },
      {
        id: 'ret-3',
        kind: 'image',
        src: commerceRetailImg,
        aspectRatio: '16 / 9',
        caption: 'Haute luminosité pour galeries et boutiques',
      },
      {
        id: 'ret-4',
        kind: 'image',
        src: commerceRetailImg,
        aspectRatio: '16 / 9',
        caption: 'Expérience client immersive en magasin',
      },
    ],
  },
  {
    slug: 'dooh',
    title: '03 — DOOH',
    description:
      'La toile urbaine monumentale — ultra-lumineuse, audacieuse et parée contre les éléments.',
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '03 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: doohImg,
    cardAccentHex: '#e67e22',
    gallery: [
      {
        id: 'dooh-1',
        kind: 'image',
        src: doohImg,
        aspectRatio: '16 / 9',
        caption: '03 — DOOH · Pixiatech',
      },
      {
        id: 'dooh-2',
        kind: 'image',
        src: doohImg,
        aspectRatio: '16 / 9',
        caption: 'Affichage LED extérieur grand format',
      },
      {
        id: 'dooh-3',
        kind: 'image',
        src: doohImg,
        aspectRatio: '16 / 9',
        caption: 'Façades commerciales & mobilier urbain numérique',
      },
      {
        id: 'dooh-4',
        kind: 'image',
        src: doohImg,
        aspectRatio: '16 / 9',
        caption: 'Lisibilité plein soleil & étanchéité IP65',
      },
    ],
  },
  {
    slug: 'location-evenements',
    title: '04 — Location & Événements',
    description: 'Rapide à monter, sûr en tournée, impossible à ignorer.',
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '04 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: locationEvenementsImg,
    cardAccentHex: '#f59e0b',
    gallery: [
      {
        id: 'loc-1',
        kind: 'image',
        src: locationEvenementsImg,
        aspectRatio: '16 / 9',
        caption: '04 — Location & Événements · Pixiatech',
      },
      {
        id: 'loc-2',
        kind: 'image',
        src: locationEvenementsImg,
        aspectRatio: '16 / 9',
        caption: 'Scènes de concerts, festivals & tournées',
      },
      {
        id: 'loc-3',
        kind: 'image',
        src: locationEvenementsImg,
        aspectRatio: '16 / 9',
        caption: 'Dalles modulaires légères à verrouillage rapide',
      },
      {
        id: 'loc-4',
        kind: 'image',
        src: locationEvenementsImg,
        aspectRatio: '16 / 9',
        caption: 'Configuration scénique intérieure & extérieure',
      },
    ],
  },
  {
    slug: 'xr-production-virtuelle',
    title: '05 — XR & Production Virtuelle',
    description: 'Conçu avec une précision millimétrique pour la caméra.',
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '05 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: xrProductionImg,
    cardAccentHex: '#3b82f6',
    gallery: [
      {
        id: 'xr-1',
        kind: 'image',
        src: xrProductionImg,
        aspectRatio: '16 / 9',
        caption: '05 — XR & Production Virtuelle · Pixiatech',
      },
      {
        id: 'xr-2',
        kind: 'image',
        src: xrProductionImg,
        aspectRatio: '16 / 9',
        caption: 'Studios audiovisuels & plateaux broadcast',
      },
      {
        id: 'xr-3',
        kind: 'image',
        src: xrProductionImg,
        aspectRatio: '16 / 9',
        caption: 'Taux de rafraîchissement élevé sans moiré caméra',
      },
      {
        id: 'xr-4',
        kind: 'image',
        src: xrProductionImg,
        aspectRatio: '16 / 9',
        caption: 'Calibration colorimétrique de précision',
      },
    ],
  },
  {
    slug: 'sports',
    title: '06 — Sports',
    description:
      "Conçu pour l'échelle des stades et la lumière broadcast.",
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '06 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: sportsImg,
    cardAccentHex: '#2563eb',
    gallery: [
      {
        id: 'sp-1',
        kind: 'image',
        src: sportsImg,
        aspectRatio: '16 / 9',
        caption: '06 — Sports · Pixiatech',
      },
      {
        id: 'sp-2',
        kind: 'image',
        src: sportsImg,
        aspectRatio: '16 / 9',
        caption: 'Écrans géants de stades & périmètre terrain',
      },
      {
        id: 'sp-3',
        kind: 'image',
        src: sportsImg,
        aspectRatio: '16 / 9',
        caption: 'Contraste optimal sous éclairage broadcast',
      },
      {
        id: 'sp-4',
        kind: 'image',
        src: sportsImg,
        aspectRatio: '16 / 9',
        caption: 'Affichage scores, replays et sponsoring',
      },
    ],
  },
  {
    slug: 'salles-de-controle',
    title: '07 — Salles de Contrôle',
    description:
      'Fiabilité 24/7 pour les environnements de mission critique.',
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '07 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: sallesControleImg,
    cardAccentHex: '#0ea5e9',
    gallery: [
      {
        id: 'ctrl-1',
        kind: 'image',
        src: sallesControleImg,
        aspectRatio: '16 / 9',
        caption: '07 — Salles de Contrôle · Pixiatech',
      },
      {
        id: 'ctrl-2',
        kind: 'image',
        src: sallesControleImg,
        aspectRatio: '16 / 9',
        caption: 'Murs d’images LED pour supervision continue',
      },
      {
        id: 'ctrl-3',
        kind: 'image',
        src: sallesControleImg,
        aspectRatio: '16 / 9',
        caption: 'Fine pitch haute densité & redondance alimentation',
      },
      {
        id: 'ctrl-4',
        kind: 'image',
        src: sallesControleImg,
        aspectRatio: '16 / 9',
        caption: 'Centres opérationnels & surveillance réseau',
      },
    ],
  },
  {
    slug: 'creatif-architecture',
    title: '08 — Créatif & Architecture',
    description: 'Surfaces courbées, transparentes et sculpturales.',
    awards: null,
    link: 'https://pixiatech.com/web/contact',
    tags: [
      { title: '08 / Marchés' },
      { title: 'Pixiatech', url: 'https://pixiatech.com/' },
    ],
    aspect: 16 / 9,
    heroImage: creatifArchitectureImg,
    cardAccentHex: '#d97706',
    gallery: [
      {
        id: 'crea-1',
        kind: 'image',
        src: creatifArchitectureImg,
        aspectRatio: '16 / 9',
        caption: '08 — Créatif & Architecture · Pixiatech',
      },
      {
        id: 'crea-2',
        kind: 'image',
        src: creatifArchitectureImg,
        aspectRatio: '16 / 9',
        caption: 'Halls monumentaux, gares & espaces publics',
      },
      {
        id: 'crea-3',
        kind: 'image',
        src: creatifArchitectureImg,
        aspectRatio: '16 / 9',
        caption: 'Volumes incurvés et intégration sur mesure',
      },
      {
        id: 'crea-4',
        kind: 'image',
        src: creatifArchitectureImg,
        aspectRatio: '16 / 9',
        caption: 'Design architectural & signalétique digitale',
      },
    ],
  },
];

export const ARCHIVE_PROJECTS: ArchiveItem[] = [
  {
    slug: 'entreprise',
    title: '01 — Entreprise',
    featuredSlug: 'entreprise',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: entrepriseImg,
    year: '01',
    role: 'Marchés',
  },
  {
    slug: 'commerce-retail',
    title: '02 — Commerce & Retail',
    featuredSlug: 'commerce-retail',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: commerceRetailImg,
    year: '02',
    role: 'Marchés',
  },
  {
    slug: 'dooh',
    title: '03 — DOOH',
    featuredSlug: 'dooh',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: doohImg,
    year: '03',
    role: 'Marchés',
  },
  {
    slug: 'location-evenements',
    title: '04 — Location & Événements',
    featuredSlug: 'location-evenements',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: locationEvenementsImg,
    year: '04',
    role: 'Marchés',
  },
  {
    slug: 'xr-production-virtuelle',
    title: '05 — XR & Production Virtuelle',
    featuredSlug: 'xr-production-virtuelle',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: xrProductionImg,
    year: '05',
    role: 'Marchés',
  },
  {
    slug: 'sports',
    title: '06 — Sports',
    featuredSlug: 'sports',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: sportsImg,
    year: '06',
    role: 'Marchés',
  },
  {
    slug: 'salles-de-controle',
    title: '07 — Salles de Contrôle',
    featuredSlug: 'salles-de-controle',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: sallesControleImg,
    year: '07',
    role: 'Marchés',
  },
  {
    slug: 'creatif-architecture',
    title: '08 — Créatif & Architecture',
    featuredSlug: 'creatif-architecture',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: creatifArchitectureImg,
    year: '08',
    role: 'Marchés',
  },
  {
    slug: 'pxt-fine',
    title: 'PXT Fine Pitch',
    externalUrl: 'https://pixiatech.com/product/pxt-fine',
    previewImage: sallesControleImg,
    year: 'LED',
    role: 'Produit',
  },
  {
    slug: 'caissons-dynamiques',
    title: 'Caissons Dynamiques LED',
    externalUrl: 'https://pixiatech.com/web/products',
    previewImage: doohImg,
    year: 'LED',
    role: 'Produit',
  },
  {
    slug: 'planchers-led',
    title: 'Écrans Planchers LED',
    externalUrl: 'https://pixiatech.com/web/insights/led-floor-screens',
    previewImage: creatifArchitectureImg,
    year: 'LED',
    role: 'Solution',
  },
  {
    slug: 'contact-pixiatech',
    title: 'Estimer mon projet',
    externalUrl: 'https://pixiatech.com/web/contact',
    previewImage: entrepriseImg,
    year: 'Devis',
    role: 'Pixiatech',
  },
];
