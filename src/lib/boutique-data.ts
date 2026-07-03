export interface GalleryItem {
  url: string;
  type: 'image' | 'video';
}

export interface ProductVariant {
  name: string;
  description?: string;
  price: number;
  reference?: string;
  image: string;
  order: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  description: string;
  longDescription: string;
  descriptionDetaillee?: string;
  image: string | null;
  gallery?: (string | GalleryItem)[];
  videoUrl?: string;
  pdfUrl?: string;
  availableFor?: ('sale' | 'rental' | 'sur-commande')[];
  specs: Record<string, string>;
  badges?: string[];
  variants?: ProductVariant[];
  stock?: number;
  isHidden?: boolean;
  upsellFor?: string[];
  quoteOnly?: boolean;
  showRating?: boolean;
  downloadEnabled?: boolean;
  downloadLabel?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  downloadLabel2?: string;
  downloadUrl2?: string;
  downloadIcon2?: string;
  downloadCustomIcon2?: string;
  downloadLabel3?: string;
  downloadUrl3?: string;
  downloadIcon3?: string;
  downloadCustomIcon3?: string;
  priceDisplay?: 'zero' | 'free' | 'multiprice' | 'quote';
}

export interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
}

export const products: Product[] = [
  {
    id: 'p1', name: 'CraftyKit Pro v.2', price: 98, rating: 5.0, reviews: 128, category: 'UI Design Kit',
    description: 'Le CraftyKit Pro v.2 représente le summum du design fonctionnel pour les créatifs modernes. Alliant esthétique minimaliste et robustesse industrielle, ce produit a été conçu pour répondre aux exigences les plus élevées des professionnels du design.',
    longDescription: 'Chaque détail a été soigneusement étudié, de la sélection des matériaux premium à la finition impeccable. Le kit inclut tous les outils nécessaires pour transformer vos idées en réalité avec une précision inégalée.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0pj5tI0Q7bZb2MJyUTwhnGKmBzZ_uMwTZFCY7WJwbNBLzHKd-ijIP0HCH1Bulckx-R4DzQUlNHeYlHLyoR0nbA7O0wJpM2Pm9709XUsOYifo3ZOw0KQq1Wj5AnEa-Fnr1wg092N_MROrYT86vsLDu1zQI1tYjxd39-JLPLMcFiRyUErYKtpNMlOUiwq-kokOhNBGykZyhsCjyw8GX5rYpAFQ6uUghXdbxI5nlFu5HSDLm5Wctuk1TM_qtjFul9d8lW2VW4QxRQEYF',
    specs: { 'Dimensions': '45 x 30 x 15 cm', 'Poids': '1.2 kg', 'Matériau': 'Cuir pleine fleur & Aluminium', 'Compatibilité': 'Universelle v.2', 'Origine': 'Fabriqué en France', 'Garantie': '5 ans constructeur' }
  },
  {
    id: 'p2', name: 'Visionary Pack v.2', price: 123, rating: 4.8, reviews: 98, category: 'Fonts',
    description: 'Une collection complète de polices haut de gamme pour designers exigeants. Chaque fonte a été méticuleusement dessinée pour offrir une lisibilité parfaite et une esthétique remarquable.',
    longDescription: 'Ce pack inclut plus de 200 variantes de polices, avec des poids allant du thin au black, des ligatures stylistiques et un support multilingue complet. Idéal pour le branding, l\'édition et le web design.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1NBaM-fQgcZhgyVC6_3aIZ8l7ju8p12VADscsohOBBOfOkWpz1TA59cs7aOiGM9Ut8q8TXGkXrNzN04d0P0DCOqtt9iGKP-K2jlEndzP1dqg_gCEm0QD3U_lqgaggXWwBcaba6OCb_XYP8dR8hJZRYu5GWlvtvIob0SprY4pHaSyf6x2ypa_52Cz0Pr9SlOpls4WXGGkDPICEqVjabjsjTbiM8rMJ2niQdTLoTv47S3mJhF_gC3mwwF7fKIBnko2Gy2a-YQB0LrRv',
    specs: { 'Polices incluses': '212 variantes', 'Formats': 'OTF, TTF, WOFF2', 'Poids': 'Thin à Black', 'Langues': '120+', 'Licence': 'Usage commercial', 'Mise à jour': 'À vie' }
  },
  {
    id: 'p3', name: 'Artistry Bundle v.2', price: 33, rating: 4.5, reviews: 56, category: 'Illustration',
    description: 'Un bundle d\'illustrations vectorielles premium pour donner vie à vos projets créatifs. Des milliers d\'éléments prêts à l\'emploi.',
    longDescription: 'Ce bundle comprend plus de 500 illustrations uniques dans des styles variés : isométrique, flat design, ligne, et bien plus. Tous les fichiers sont entièrement vectorisés et personnalisables.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyftrwCf8fMruUa1mJWbHqs31an-10o3_AxfQcXUDCXm_qMWl3sD6fr69wKW8Eeh1Y-j-SUFCLtSszMYVcWME6cIKUX6CtVWjV0ork6_Q0s62tK6Gi7r4eOj1_bBpzOVOJkU4aPz8Gu5cdz1GxAvHlcllZiKbz_xk1m9KWVglBRonlfqjwJ1tRGE3RdFAsCC0VpBIYbbkKEoTP-U3lZ_RosNJpktKa0tFtevmXmb6QrkQcNUXtcBh4KowuYWa-X54yPiNb243vBeET',
    specs: { 'Nombre d\'illustrations': '500+', 'Formats': 'AI, EPS, SVG, PNG', 'Style': 'Flat, Isométrique, Ligne', 'Couleurs': 'Personnalisables', 'Licence': 'Usage commercial', 'Poids total': '1.8 Go' }
  },
  {
    id: 'p4', name: 'DesignMaster Pro v.2', price: 150, rating: 4.2, reviews: 204, category: 'UI Design Kit',
    description: 'Le kit UI ultime pour concevoir des interfaces modernes et intuitives. Des composants prêts à l\'emploi pour accélérer votre workflow.',
    longDescription: 'DesignMaster Pro v.2 comprend plus de 300 composants UI entièrement responsifs, organisés en catégories : navigation, formulaires, tableaux, cartes, modales, et bien plus. Compatible Figma, Sketch et Adobe XD.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgmyfIHlA9qOZYYIkK1A9hU9VpubeAeudClGXmoukWEoejm9e1yDqeO5P6qjjzdBYc8MVnV5COHBUdo8xwuG3Mvi83iBLmkU3tBAVvpg9K21rA46ZO5yE_KUJBkp_Ovqo6goHf9AvZCC2ndG4dekFBD5Y70B80x8YjrFbslNLfj9MrOjvVYKdsANVNFrpPzM1OBhs1ruF9Iq_sZKxcJGaZRJF1KkaEIgikbKvqM1qpr1i_6DtPe08g6M7HTxju_hzQNoSuCuFPVuQ8',
    specs: { 'Composants': '300+', 'Formats': 'Figma, Sketch, XD', 'Écrans': 'Desktop, Tablet, Mobile', 'Grille': 'Auto-layout', 'Licence': 'Usage commercial', 'Mise à jour': '1 an inclus' }
  },
  {
    id: 'p5', name: 'Cryper – NFT UI Kit', price: 453, rating: 4.7, reviews: 73, category: '3D Assets',
    description: 'Un kit UI premium spécialement conçu pour les plateformes NFT et Web3. Un design futuriste et immersif.',
    longDescription: 'Cryper inclut des interfaces complètes pour marketplace NFT, wallet, dashboard et landing pages. Avec des animations 3D intégrées et des effets glassmorphism, ce kit donne une longueur d\'avance à vos projets blockchain.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCB-QyKbJSg1BkR943bs8l-XrTS9rfXG11TaH1XvDK0uPiZvjg5oE8Fdi3r7yOLN32JihGe7C-C7x5qPcTZ0eiCZGqmeRumYvOb3nmiF_bz6KW3f48Dp-JPRUcx1PpoWCsqI0nYoqQXz19rHQYsHiluFacavcVbknw-APSL8Kh8RUYFxy2VO0QqzG86iA1hDrfLoG7wJhjYrEqfmOMacYp10NDHiFGjZTntdhTRD7teqxvYGi07K0jSBfgyvwd_UEn4Zg25hRDwOY7n',
    specs: { 'Écrans inclus': '48+', 'Formats': 'Figma, Sketch', 'Style': 'Glassmorphism, Futuriste', 'Animations': 'Lottie, CSS', 'Blockchain': 'Ethereum, Solana', 'Licence': 'Usage commercial' }
  },
  {
    id: 'p6', name: 'Visionary Pack v.2', price: 321, rating: 4.9, reviews: 312, category: 'UI Design Kit',
    description: 'La référence absolue en matière de design system. Une collection exhaustive de composants et de templates pour des interfaces d\'exception.',
    longDescription: 'Visionary Pack v.2 est le fruit de 3 ans de recherche et développement. Avec plus de 600 composants, 120 templates et un système de design tokens complet, c\'est l\'outil définitif pour les équipes de design.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfaLg9Qx0akyaimrAEXOXccZ5XFL6lIMv0So__GoNbDVHgcSwRtd_T6NsSHR4AVlGOXKMPbvzBpsspnzisdGJkb_6xfJITj4_KOVEL3AOwnVF45C-Op0Be6tkf4eNh1pkaTTZp1IPwK3J5XerKGdcLD9r8AXgzF6eGXbJ-7QBKTAVz2kgoL1nZNFE0AFUFtQ-8yek2KThX-ZR9WElGJln2FdvtVLDYSjdN7WjjR9uvbbbSPTvtjNQMiFh2vAWBPlWjOgcOM_aEgPyI',
    specs: { 'Composants': '600+', 'Templates': '120+', 'Design tokens': 'Complet', 'Formats': 'Figma, Tailwind, CSS', 'Documentation': 'Storybook incluse', 'Licence': 'Usage commercial illimité' }
  }
];

export const relatedProducts: RelatedProduct[] = [
  { id: 'p7', name: 'EcoKit Essentials', price: 67, rating: 4.3, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0pj5tI0Q7bZb2MJyUTwhnGKmBzZ_uMwTZFCY7WJwbNBLzHKd-ijIP0HCH1Bulckx-R4DzQUlNHeYlHLyoR0nbA7O0wJpM2Pm9709XUsOYifo3ZOw0KQq1Wj5AnEa-Fnr1wg092N_MROrYT86vsLDu1zQI1tYjxd39-JLPLMcFiRyUErYKtpNMlOUiwq-kokOhNBGykZyhsCjyw8GX5rYpAFQ6uUghXdbxI5nlFu5HSDLm5Wctuk1TM_qtjFul9d8lW2VW4QxRQEYF' },
  { id: 'p8', name: 'PixelPerfect Pro', price: 199, rating: 4.6, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1NBaM-fQgcZhgyVC6_3aIZ8l7ju8p12VADscsohOBBOfOkWpz1TA59cs7aOiGM9Ut8q8TXGkXrNzN04d0P0DCOqtt9iGKP-K2jlEndzP1dqg_gCEm0QD3U_lqgaggXWwBcaba6OCb_XYP8dR8hJZRYu5GWlvtvIob0SprY4pHaSyf6x2ypa_52Cz0Pr9SlOpls4WXGGkDPICEqVjabjsjTbiM8rMJ2niQdTLoTv47S3mJhF_gC3mwwF7fKIBnko2Gy2a-YQB0LrRv' },
  { id: 'p9', name: 'BrandKit Studio', price: 89, rating: 4.8, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyftrwCf8fMruUa1mJWbHqs31an-10o3_AxfQcXUDCXm_qMWl3sD6fr69wKW8Eeh1Y-j-SUFCLtSszMYVcWME6cIKUX6CtVWjV0ork6_Q0s62tK6Gi7r4eOj1_bBpzOVOJkU4aPz8Gu5cdz1GxAvHlcllZiKbz_xk1m9KWVglBRonlfqjwJ1tRGE3RdFAsCC0VpBIYbbkKEoTP-U3lZ_RosNJpktKa0tFtevmXmb6QrkQcNUXtcBh4KowuYWa-X54yPiNb243vBeET' },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

export function getProduct(id: string) {
  return products.find(p => p.id === id);
}

import { firestore } from '@/firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function fetchCharacteristicsMap(): Promise<Record<string, string>> {
  try {
    const snap = await getDocs(collection(firestore, 'boutique_characteristics'));
    const map: Record<string, string> = {};
    snap.forEach((d) => {
      const name = d.data().name;
      if (name) map[d.id] = name;
    });
    return map;
  } catch (e) {
    console.warn('fetchCharacteristicsMap failed, using empty map:', e);
    return {};
  }
}

function buildSpecs(data: any, charNameMap: Record<string, string>): Record<string, string> {
  const s: Record<string, string> = {};

  // Resolve selectedChars through characteristics name map (only selected specs)
  if (Array.isArray(data.selectedChars)) {
    for (const sc of data.selectedChars) {
      const name = charNameMap[sc.id] || sc.id;
      s[name] = sc.value;
    }
  }

  // Merge any pre-existing specs
  if (data.specs) Object.assign(s, data.specs);

  return s;
}

const TYPE_LABELS: Record<string, string> = {
  indoor: 'Intérieur',
  outdoor: 'Extérieur',
  showcase: 'Semi-extérieur',
  interieur: 'Intérieur',
  exterieur: 'Extérieur',
  'semi-exterieur': 'Semi-extérieur',
  vitrine: 'Semi-extérieur',
};

function mapFirestoreDoc(docSnap: any, charNameMap: Record<string, string> = {}): Product {
  const data = docSnap.data();
  const name = data.name || docSnap.id;
  const image = data.image || data.imageUrl || null;
  const price = typeof data.price === 'number' ? data.price : parseFloat(String(data.salePricePerSqM || data.price || 0));
  return {
    id: docSnap.id,
    name,
    price: price || 0,
    oldPrice: data.oldPrice || undefined,
    rating: data.rating ?? 5.0,
    reviews: data.reviews ?? 0,
    category: data.category || TYPE_LABELS[data.type?.[0]] || 'Général',
    description: data.description || '',
    longDescription: data.longDescription || '',
    descriptionDetaillee: data.descriptionDetaillee || '',
    image,
    gallery: (data.galleryUrls || data.gallery || []).map((item: any) =>
      typeof item === 'string' ? { url: item, type: 'image' } : item
    ),
    videoUrl: data.videoUrl || '',
    pdfUrl: data.pdfUrl || '',
    availableFor: normalizeAvailableFor(data.availableFor || data.mode || ['sale', 'rental']),
    specs: buildSpecs(data, charNameMap),
    badges: data.badges || [],
    variants: data.variants || [],
    stock: data.stock ?? undefined,
    upsellFor: data.upsellFor || [],
    quoteOnly: !!data.quoteOnly || data.availableFor?.includes('sur-commande') || false,
    isHidden: !!data.isHidden,
    showRating: data.showRating !== false,
    downloadEnabled: data.downloadEnabled !== false,
    downloadLabel: data.downloadLabel || '',
    playStoreUrl: data.playStoreUrl || '',
    appStoreUrl: data.appStoreUrl || '',
    downloadLabel2: data.downloadLabel2 || '',
    downloadUrl2: data.downloadUrl2 || '',
    downloadLabel3: data.downloadLabel3 || '',
    downloadUrl3: data.downloadUrl3 || '',
    priceDisplay: data.priceDisplay || undefined,
  };
}

export async function fetchBoutiqueProducts(): Promise<Product[]> {
  try {
    const charNameMap = await fetchCharacteristicsMap();
    const q = collection(firestore, 'boutique_products');
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => mapFirestoreDoc(d, charNameMap)).filter(p => !p.isHidden).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.warn('fetchBoutiqueProducts failed:', e);
    return [];
  }
}

function normalizeAvailableFor(values: string[]): ('sale' | 'rental' | 'sur-commande')[] {
  return values.map(m => {
    const lower = m.toLowerCase().replace(/[\s_-]/g, '');
    if (lower === 'surcommande' || lower === 'quoterequest' || lower === 'quoteonly') return 'sur-commande';
    if (lower === 'sale' || lower === 'achat' || lower === 'vente' || lower === 'purchase') return 'sale';
    if (lower === 'rental' || lower === 'location' || lower === 'rent') return 'rental';
    return m.toLowerCase() as any;
  });
}

export async function fetchBoutiqueProduct(id: string): Promise<Product | null> {
  try {
    const charNameMap = await fetchCharacteristicsMap();
    const docSnap = await getDoc(doc(firestore, 'boutique_products', id));
    if (!docSnap.exists()) return null;
    return mapFirestoreDoc(docSnap, charNameMap);
  } catch (e) {
    console.warn('fetchBoutiqueProduct failed:', e);
    return null;
  }
}

export async function fetchUpsellProducts(cartProductIds: string[]): Promise<Product[]> {
  if (cartProductIds.length === 0) return [];
  try {
    const charNameMap = await fetchCharacteristicsMap();
    const upsellIdSet = new Set<string>();

    for (const id of cartProductIds) {
      // Try boutique_products first, then fall back to products (legacy data)
      let docSnap = await getDoc(doc(firestore, 'boutique_products', id));
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(firestore, 'products', id));
      }
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.upsellFor) && data.upsellFor.length > 0) {
          data.upsellFor.forEach((uid: string) => {
            if (uid && !cartProductIds.includes(uid)) {
              upsellIdSet.add(uid);
            }
          });
        }
      }
    }

    if (upsellIdSet.size === 0) return [];

    const results: Product[] = [];
    const upsellIds = Array.from(upsellIdSet);
    for (const uid of upsellIds) {
      // Try boutique_products first, then fall back to products (legacy IDs)
      let docSnap = await getDoc(doc(firestore, 'boutique_products', uid));
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(firestore, 'products', uid));
      }
      if (docSnap.exists()) {
        results.push(mapFirestoreDoc(docSnap, charNameMap));
      }
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.warn('fetchUpsellProducts failed:', e);
    return [];
  }
}


export { products as staticProducts };
