/**
 * Deterministic parser for the PIXIATECH product sheet (site-web format).
 *
 * Converts the model PDF (docs/product-system/fiche-technique-modele.pdf,
 * sections 1-17) into the Phase A `Product` model (src/lib/products/types.ts).
 * NO AI / LLM / API calls — pure regex and string parsing, like the boutique
 * parser (src/lib/product-pdf-parser.ts) that powers /admin/produits.
 *
 * The site-web sheet uses a strict layout: `KEY | VALUE` rows and
 * `MODULE | DESCRIPTION | RÉFÉRENCE` table columns, split by the text
 * extraction's X-gap detection (see extractProductPdfText). Free-text
 * paragraphs wrap onto standalone lines that are joined back.
 *
 * This parser is self-contained: it does NOT touch the boutique parser.
 */

import { slugify, isValidSlug } from './types';
import type { Product, ProductStat, SellingMode, ProductEnvironment } from './types';

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

/** Keys accepted in the comparative matrix (section 15). Unknown keys are ignored. */
export const PRODUCT_SPEC_KEYS = [
  'env',
  'arrangement',
  'pitch',
  'density',
  'moduleRes',
  'moduleDim',
  'cabRes',
  'cabDim',
  'weight',
  'brightness',
  'refresh',
  'scan',
  'angle',
  'maxPower',
  'avgPower',
  'powerSource',
  'signal',
  'ip',
  'temp',
  'certs',
  'transparency',
] as const;

export type ProductSpecKey = (typeof PRODUCT_SPEC_KEYS)[number];

const SPEC_KEY_TO_CANONICAL = new Map<string, ProductSpecKey>(
  PRODUCT_SPEC_KEYS.map((k) => [k.toLowerCase(), k])
);

/** Standard matrix groups (same structure as the seed product). */
export const PRODUCT_SPEC_GROUPS: NonNullable<Product['specs']>['groups'] = [
  {
    id: 'general',
    label: 'GENERAL',
    rows: [
      { key: 'env', label: 'IN / OUT' },
      { key: 'arrangement', label: 'LED ARRANGEMENT' },
    ],
  },
  {
    id: 'physical',
    label: 'PHYSICAL',
    rows: [
      { key: 'pitch', label: 'PIXEL PITCH' },
      { key: 'density', label: 'PHYSICAL DENSITY' },
      { key: 'moduleRes', label: 'MODULE RESOLUTION (H/V)' },
      { key: 'moduleDim', label: 'MODULE DIMENSIONS' },
      { key: 'cabRes', label: 'CABINET RESOLUTION (H/V)' },
      { key: 'cabDim', label: 'CABINET DIMENSIONS' },
      { key: 'weight', label: 'CABINET WEIGHT' },
    ],
  },
  {
    id: 'optical',
    label: 'OPTICAL',
    rows: [
      { key: 'brightness', label: 'BRIGHTNESS' },
      { key: 'refresh', label: 'REFRESH RATE' },
      { key: 'scan', label: 'SCAN RATE' },
      { key: 'angle', label: 'VIEWING ANGLE (H/V)' },
    ],
  },
  {
    id: 'electrical',
    label: 'ELECTRICAL',
    rows: [
      { key: 'maxPower', label: 'MAX POWER (W / PANEL)' },
      { key: 'avgPower', label: 'AVG POWER (W / PANEL)' },
      { key: 'powerSource', label: 'OPERATING POWER SOURCE' },
      { key: 'signal', label: 'SIGNAL INPUT' },
    ],
  },
  {
    id: 'environmental',
    label: 'ENVIRONMENTAL',
    rows: [
      { key: 'ip', label: 'IP RATING' },
      { key: 'temp', label: 'OPERATING TEMPERATURE' },
      { key: 'transparency', label: 'TRANSPARENCY' },
      { key: 'certs', label: 'CERTIFICATIONS' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ParsedProductText {
  productName?: string;
  sellingModes?: string[];
  badge?: string;
  environment?: string;
  characteristics?: { key: string; value: string }[];
  buttons?: { study?: string; datasheet?: string };
  variants?: { name: string; value: string; reference?: string }[];
  shortDescription?: string;
  detailedDescription?: string;
  keywords?: string[];
  slug?: string;
  menu?: { groupFr?: string; groupEn?: string; tag?: string };
  hero?: { subtitle?: string; primaryCta?: string; bgColor?: string; tags?: string[] };
  overview?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    stats?: { value: string; label: string }[];
  };
  design?: { eyebrow?: string; title?: string; cabinetDim?: string; weight?: string; material?: string };
  features?: { num?: string; title: string; description?: string }[];
  specModels?: { name: string; specs: Record<string, string> }[];
  fieldwork?: { title: string; location?: string; pitch?: string }[];
  photoName?: string;
  galleryNames?: string[];
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const SPACED_BRAND = /^P\s*I\s*X\s*I\s*A\s*T\s*E\s*C\s*H/i;
const SPACED_DOC = /^F\s*I\s*C\s*H\s*E\s*P\s*R\s*O\s*D\s*U\s*I\s*T/i;
/** Standalone lines that never carry data. */
const STOP_LINE = /^(P\s*I\s*X\s*I\s*A\s*T\s*E\s*C\s*H|F\s*I\s*C\s*H\s*E\s*P\s*R\s*O\s*D\s*U\s*I\s*T|Une\s+ligne|«|Pour\s+CHAQUE|Ajoutez\s+ou\s+supprimez|L'URL\s+publique\s+sera|\/web\/product|Fiche\s+Produit|Statistiques\s*:|Les\s+fichiers|Remplissez|Au\s+moment|Fichier)/i;
const SECTION_HEADER = /^\s*\d+\.\s+[A-ZÀ-Ý]/;

function cleanLine(line: string): string {
  return line.replace(/\u00A0/g, ' ').replace(/\r/g, '').trim();
}

function splitCols(line: string): string[] {
  return line
    .split(/\s*\|\s*/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function isStopLine(line: string): boolean {
  const c = cleanLine(line);
  if (!c) return true;
  if (SPACED_BRAND.test(c) || SPACED_DOC.test(c)) return true;
  if (SECTION_HEADER.test(c)) return true;
  if (STOP_LINE.test(c)) return true;
  return false;
}

function keyOf(line: string): string {
  const idx = line.indexOf('|');
  return idx === -1 ? cleanLine(line) : line.slice(0, idx).trim();
}

function valueOf(line: string): string | undefined {
  const idx = line.indexOf('|');
  if (idx === -1) return undefined;
  const v = line.slice(idx + 1).trim();
  return v.length > 0 ? v : undefined;
}

// ---------------------------------------------------------------------------
// PDF text extraction (client-side, same algorithm as the boutique parser)
// ---------------------------------------------------------------------------

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

/**
 * Groups a page's text items into display lines, inserting " | " between
 * columns separated by a large X-gap (same threshold as the boutique parser).
 * Exported as a pure function so tests can reuse the exact algorithm.
 */
export function itemsToLines(items: PdfTextItem[]): string[] {
  // Group items by Y coordinate (same line)
  const yTolerance = 3;
  const rawYGroups: { y: number; items: PdfTextItem[] }[] = [];
  for (const item of items) {
    const y = Math.round(item.y);
    const existing = rawYGroups.find(g => Math.abs(g.y - y) <= yTolerance);
    if (existing) {
      existing.items.push(item);
    } else {
      rawYGroups.push({ y, items: [item] });
    }
  }

  rawYGroups.sort((a, b) => b.y - a.y);

  const lines: string[] = [];
  for (const group of rawYGroups) {
    const contentItems = group.items
      .filter(g => g.str.trim().length > 0)
      .sort((a, b) => a.x - b.x);
    if (contentItems.length === 0) continue;

    let line = contentItems[0].str;
    for (let j = 1; j < contentItems.length; j++) {
      const gap = contentItems[j].x - contentItems[j - 1].x;
      line += gap > 30 ? ' | ' : ' ';
      line += contentItems[j].str;
    }
    lines.push(line.trim());
  }
  return lines;
}

/** Extracts plain text (with column pipes) from a product sheet PDF. */
export async function extractProductPdfText(
  data: File | ArrayBuffer | Uint8Array
): Promise<string> {
  // Lazy import keeps pdfjs out of the initial bundle.
  const pdfjsLib = (await import('pdfjs-dist')) as typeof import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = data instanceof File ? (await data.arrayBuffer()) : data;
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const allLines: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items
      .map((it) =>
        'str' in it
          ? { str: it.str, x: Math.round(it.transform[4]), y: Math.round(it.transform[5]) }
          : null
      )
      .filter((it): it is { str: string; x: number; y: number } => it !== null);
    const pageLines = itemsToLines(items);
    for (const line of pageLines) {
      if (SPACED_BRAND.test(line) || SPACED_DOC.test(line)) continue;
      if (!line) continue;
      allLines.push(line);
    }
  }
  return allLines.join('\n');
}

// ---------------------------------------------------------------------------
// Section routing
// ---------------------------------------------------------------------------

function toSections(text: string): Map<number, string[]> {
  const sections = new Map<number, string[]>();
  let current: string[] = [];
  let hasCurrent = false;
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw);
    if (!line) continue;
    const m = line.match(/^\s*(\d+)\.\s+[A-ZÀ-Ý]/);
    if (m) {
      current = [line];
      sections.set(Number(m[1]), current);
      hasCurrent = true;
    } else if (hasCurrent) {
      current.push(line);
    }
  }
  return sections;
}

/**
 * Value of a `.field` row whose key matches `keyRegex`.
 * Returns the text after the first " | " plus any wrapped continuation lines
 * (when `collectContinuation` — free-text fields only).
 */
function fieldValue(
  section: string[],
  keyRegex: RegExp,
  collectContinuation = false
): string | undefined {
  for (let i = 0; i < section.length; i++) {
    if (!keyRegex.test(section[i])) continue;
    const rest = valueOf(section[i]);
    if (!rest) return undefined;
    if (!collectContinuation) {
      return rest.replace(/\s+/g, ' ').trim();
    }
    const parts: string[] = [rest];
    for (let j = i + 1; j < section.length; j++) {
      const line = section[j];
      if (isStopLine(line)) break;
      if (line.includes('|')) break;
      parts.push(line);
    }
    return parts
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return undefined;
}

/** Rows of a table section (skips hints and the column header). */
function tableRows(
  section: string[],
  opts: { header: RegExp; hint?: RegExp; minParts: number; startAfterHeader?: boolean }
): string[][] {
  const { header, hint, minParts, startAfterHeader = true } = opts;
  const rows: string[][] = [];
  let started = !startAfterHeader;
  for (const line of section) {
    if (!started && header.test(line)) {
      started = true;
      continue;
    }
    if (!started) continue;
    if (header.test(line)) continue;
    if (hint && hint.test(line)) continue;
    if (SECTION_HEADER.test(line)) break;
    const parts = splitCols(line);
    if (parts.length >= minParts && parts[0] && parts[1]) {
      rows.push(parts);
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Section parsers
// ---------------------------------------------------------------------------

function parseName(section: string[]): string | undefined {
  return fieldValue(section, /D[ée]nomination/);
}

function parseSellingModes(section: string[]): string[] | undefined {
  const v = fieldValue(section, /^\s*vente\s*\/\s*location/);
  if (!v) return undefined;
  const modes: string[] = [];
  const s = v.toLowerCase();
  if (s.includes('vente')) modes.push('vente');
  if (s.includes('location')) modes.push('location');
  if (s.includes('sur commande') || s.includes('sur-commande')) modes.push('sur commande');
  return modes.length > 0 ? modes : undefined;
}

function parseBadge(section: string[]): string | undefined {
  return fieldValue(section, /^\s*nouveau\s*\/\s*populaire\s*\/\s*promotion/);
}

function parseEnvironment(section: string[]): string | undefined {
  return fieldValue(section, /^\s*int[ée]rieur\s*\/\s*ext[ée]rieur/);
}

function parseCharacteristics(section: string[]): { key: string; value: string }[] {
  const items: { key: string; value: string }[] = [];
  let started = false;
  for (const line of section) {
    if (!started && /^CARACT[ÉE]RISTIQUE\s*\|/.test(line)) {
      started = true;
      continue;
    }
    if (!started) continue;
    if (/^CARACT[ÉE]RISTIQUE\s*\|/.test(line)) continue;
    if (/^Une\s+ligne/.test(line)) continue;
    if (SECTION_HEADER.test(line)) break;
    const key = keyOf(line);
    const value = valueOf(line);
    if (key && value) {
      items.push({ key, value });
    }
  }
  return items;
}

function parseButtons(section: string[]): { study?: string; datasheet?: string } {
  const study = fieldValue(section, /Bouton\s+1\s*\(CTA\s+principal\)/);
  const datasheet = fieldValue(section, /Bouton\s+2\s*\(CTA\s+secondaire\)/);
  return {
    ...(study ? { study } : {}),
    ...(datasheet ? { datasheet } : {}),
  };
}

function parseVariants(section: string[]): { name: string; value: string; reference?: string }[] {
  const items: { name: string; value: string; reference?: string }[] = [];
  let started = false;
  for (const line of section) {
    if (!started && /^NOM\s+DU\s+MOD[ÈE]LE\s*\|/.test(line)) {
      started = true;
      continue;
    }
    if (!started) continue;
    if (/^NOM\s+DU\s+MOD[ÈE]LE\s*\|/.test(line)) continue;
    if (/^Nom\s+du\s+mod[èe]le/.test(line)) continue;
    if (/tableau\s+comparatif/.test(line)) continue;
    if (SECTION_HEADER.test(line)) break;
    const parts = splitCols(line);
    if (parts.length >= 2) {
      items.push({
        name: parts[0],
        value: parts[1],
        reference: parts.length >= 3 ? parts[2] : undefined,
      });
    }
  }
  return items;
}

function parseDescription(section: string[]): {
  shortDescription?: string;
  detailedDescription?: string;
  keywords?: string[];
} {
  const shortDescription = fieldValue(section, /Petite\s+description\s*:/i, true);
  const detailedDescription = fieldValue(section, /Description\s+d[ée]taill[ée]e\s*:/i, true);
  const kw = fieldValue(section, /Mots-cl[ée]s\s*\(s[ée]par[ée]s\s+par\s+•\)\s*:/i);
  const keywords = kw
    ? kw
        .split('•')
        .map(k => k.trim())
        .filter(k => k.length > 0)
    : undefined;
  return {
    ...(shortDescription ? { shortDescription } : {}),
    ...(detailedDescription ? { detailedDescription } : {}),
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
  };
}

function parseSlug(section: string[]): string | undefined {
  const v = fieldValue(section, /Identifiant\s+d'URL/);
  if (!v) return undefined;
  return isValidSlug(v) ? v : undefined;
}

function parseMenu(section: string[]): { groupFr?: string; groupEn?: string; tag?: string } {
  const groupFr = fieldValue(section, /Groupe\s*\(fran[çc]ais\)/);
  const groupEn = fieldValue(section, /Groupe\s*\(anglais\)/);
  const tag = fieldValue(section, /[ÉE]tiquette\s*\(tag\)/);
  return {
    ...(groupFr ? { groupFr } : {}),
    ...(groupEn ? { groupEn } : {}),
    ...(tag ? { tag } : {}),
  };
}

function parseHero(section: string[]): {
  subtitle?: string;
  primaryCta?: string;
  bgColor?: string;
  tags?: string[];
} {
  const subtitle = fieldValue(section, /Slogan\s*\/\s*sous-titre/, true);
  const primaryCta = fieldValue(section, /^\s*CTA\s+principal/);
  const bgColor = fieldValue(section, /Couleur\s+de\s+fond/);
  const tagsRaw = fieldValue(section, /[ÉE]tiquettes\s*\(tags,\s*s[ée]par[ée]es\s+par\s+•\)/, true);
  const tags = tagsRaw
    ? tagsRaw
        .split('•')
        .map(t => t.trim())
        .filter(t => t.length > 0)
    : undefined;
  return {
    ...(subtitle ? { subtitle } : {}),
    ...(primaryCta ? { primaryCta } : {}),
    ...(bgColor ? { bgColor } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
  };
}

function parseOverview(section: string[]): {
  eyebrow?: string;
  title?: string;
  description?: string;
  stats?: { value: string; label: string }[];
} {
  const eyebrow = fieldValue(section, /Liser[ée]\s*\(eyebrow\)/);
  const title = fieldValue(section, /^\s*Titre\b/);
  const description = fieldValue(section, /^\s*Description\b/, true);
  const stats = tableRows(section, {
    header: /^VALEUR\s*\|/,
    minParts: 2,
  }).map(([value, label]) => ({ value, label }));
  return {
    ...(eyebrow ? { eyebrow } : {}),
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(stats.length > 0 ? { stats } : {}),
  };
}

function parseDesign(section: string[]): {
  eyebrow?: string;
  title?: string;
  cabinetDim?: string;
  weight?: string;
  material?: string;
} {
  const eyebrow = fieldValue(section, /Liser[ée]\s*\(eyebrow\)/);
  const title = fieldValue(section, /^\s*Titre\b/);
  const cabinetDim = fieldValue(section, /Dimensions\s+ch[âa]ssis/);
  const weight = fieldValue(section, /^\s*Poids\b/);
  const material = fieldValue(section, /Mat[ée]riau/);
  return {
    ...(eyebrow ? { eyebrow } : {}),
    ...(title ? { title } : {}),
    ...(cabinetDim ? { cabinetDim } : {}),
    ...(weight ? { weight } : {}),
    ...(material ? { material } : {}),
  };
}

function parseFeatures(
  section: string[]
): { num?: string; title: string; description?: string }[] {
  const items: { num?: string; title: string; description?: string }[] = [];
  let started = false;
  for (const line of section) {
    if (!started && /^N\s*°\s*\|\s*TITRE\s*\|/.test(line)) {
      started = true;
      continue;
    }
    if (!started) continue;
    if (/^N\s*°\s*\|\s*TITRE\s*\|/.test(line)) continue;
    if (/^«/.test(line)) continue;
    if (SECTION_HEADER.test(line)) break;
    if (line.includes('|')) {
      const [num, title, ...rest] = splitCols(line);
      if (title) {
        items.push({
          ...(num ? { num } : {}),
          title,
          description: rest.length > 0 ? rest.join(' ') : undefined,
        });
      }
      continue;
    }
    // Wrapped description continuation
    if (items.length > 0 && items[items.length - 1].description) {
      items[items.length - 1].description += (items[items.length - 1].description ? ' ' : '') + line;
    }
  }
  return items;
}

function parseSpecs(section: string[]): { name: string; specs: Record<string, string> }[] {
  const models: { name: string; specs: Record<string, string> }[] = [];
  let started = false;
  let current: { name: string; specs: Record<string, string> } | null = null;
  for (const line of section) {
    if (!started && /^CL[ÉE]\s*\(SP[ÉE]CIFICATION\)/.test(line)) {
      started = true;
      continue;
    }
    if (!started) continue;
    if (/^CL[ÉE]\s*\(SP[ÉE]CIFICATION\)/.test(line)) continue;
    if (SECTION_HEADER.test(line)) break;
    const m = line.match(/^MODELE\s+(.+)$/i);
    if (m) {
      current = { name: m[1].trim(), specs: {} };
      models.push(current);
      continue;
    }
    if (!current) continue;
    if (line.includes('|')) {
      const raw = keyOf(line).trim().toLowerCase();
      const key = SPEC_KEY_TO_CANONICAL.get(raw);
      const value = valueOf(line);
      if (value && key) {
        current.specs[key] = value;
      }
    }
  }
  return models;
}

function parseFieldwork(section: string[]): { title: string; location?: string; pitch?: string }[] {
  const projects: { title: string; location?: string; pitch?: string }[] = [];
  let started = false;
  for (const line of section) {
    if (!started && /^N\s*°\s*\|\s*LIEU\s*\/\s*ANN[ÉE]E?/.test(line)) {
      started = true;
      continue;
    }
    if (!started) continue;
    if (/^N\s*°\s*\|\s*LIEU\s*\/\s*ANN[ÉE]E?/.test(line)) continue;
    if (/^«/.test(line)) continue;
    if (SECTION_HEADER.test(line)) break;
    if (line.includes('|')) {
      const [num, location, ...rest] = splitCols(line);
      if (location) {
        projects.push({
          title: rest.length > 0 ? rest.join(' ') : '',
          location: location,
          pitch: num,
        });
      }
      continue;
    }
    if (projects.length > 0 && projects[projects.length - 1].title) {
      projects[projects.length - 1].title += ' ' + line;
    }
  }
  return projects;
}

function parseFiles(section: string[]): { photo?: string; gallery?: string[] } {
  const photo = fieldValue(section, /Photo\s+principale/);
  const galleryRaw = fieldValue(section, /Galerie\s*\(noms/);
  const gallery = galleryRaw
    ? galleryRaw
        .split('•')
        .map(n => n.trim())
        .filter(n => n.length > 0)
    : undefined;
  return {
    ...(photo ? { photo } : {}),
    ...(gallery && gallery.length > 0 ? { gallery } : {}),
  };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseProductFicheText(text: string): ParsedProductText {
  const sections = toSections(text);
  const get = (num: number): string[] => sections.get(num) ?? [];

  const parsed: ParsedProductText = {};

  const name = parseName(get(1));
  if (name) parsed.productName = name;

  const sellingModes = parseSellingModes(get(2));
  if (sellingModes) parsed.sellingModes = sellingModes;

  const badge = parseBadge(get(3));
  if (badge) parsed.badge = badge;

  const environment = parseEnvironment(get(4));
  if (environment) parsed.environment = environment;

  const characteristics = parseCharacteristics(get(5));
  if (characteristics.length > 0) parsed.characteristics = characteristics;

  const buttons = parseButtons(get(6));
  if (Object.keys(buttons).length > 0) parsed.buttons = buttons;

  const variants = parseVariants(get(7));
  if (variants.length > 0) parsed.variants = variants;

  const desc = parseDescription(get(8));
  if (Object.keys(desc).length > 0) {
    if (desc.shortDescription) parsed.shortDescription = desc.shortDescription;
    if (desc.detailedDescription) parsed.detailedDescription = desc.detailedDescription;
    if (desc.keywords) parsed.keywords = desc.keywords;
  }

  const slug = parseSlug(get(9));
  if (slug) parsed.slug = slug;

  const menu = parseMenu(get(10));
  if (Object.keys(menu).length > 0) parsed.menu = menu;

  const hero = parseHero(get(11));
  if (Object.keys(hero).length > 0) parsed.hero = hero;

  const overview = parseOverview(get(12));
  if (Object.keys(overview).length > 0) parsed.overview = overview;

  const design = parseDesign(get(13));
  if (Object.keys(design).length > 0) parsed.design = design;

  const features = parseFeatures(get(14));
  if (features.length > 0) parsed.features = features;

  const specModels = parseSpecs(get(15));
  if (specModels.length > 0) parsed.specModels = specModels;

  const fieldwork = parseFieldwork(get(16));
  if (fieldwork.length > 0) parsed.fieldwork = fieldwork;

  const files = parseFiles(get(17));
  if (files.photo) parsed.photoName = files.photo;
  if (files.gallery) parsed.galleryNames = files.gallery;

  return parsed;
}

// ---------------------------------------------------------------------------
// Mapping: ParsedProductText → Product (Phase A model)
// ---------------------------------------------------------------------------

const SELLING_MODE_MAP: Record<string, SellingMode> = {
  vente: 'sale',
  location: 'rental',
  'sur commande': 'sale',
  'sur-commande': 'sale',
};

function toEnvironment(raw: string | undefined): ProductEnvironment | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase().replace(/\s+/g, ' ');
  if (s.includes('semi')) return 'showcase';
  if (s.includes('extérieur') || s.includes('exterieur') || s.includes('outdoor')) {
    if (s.includes('intérieur') || s.includes('interieur') || s.includes('indoor')) return 'both';
    return 'outdoor';
  }
  if (s.includes('intérieur') || s.includes('interieur') || s.includes('indoor')) return 'indoor';
  return undefined;
}

function environmentLabels(env: ProductEnvironment | undefined): { fr: string; en: string } | undefined {
  switch (env) {
    case 'indoor':
      return { fr: 'ÉCRAN LED INTÉRIEUR', en: 'INDOOR LED DISPLAY' };
    case 'outdoor':
      return { fr: 'ÉCRAN LED EXTÉRIEUR', en: 'OUTDOOR LED DISPLAY' };
    case 'showcase':
      return { fr: 'ÉCRAN LED VITRINE', en: 'SHOWCASE LED DISPLAY' };
    case 'both':
      return { fr: 'ÉCRAN LED INTÉRIEUR & EXTÉRIEUR', en: 'INDOOR & OUTDOOR LED DISPLAY' };
    default:
      return undefined;
  }
}

function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Caractéristiques canoniques (une caractéristique = une propriété)
// ---------------------------------------------------------------------------

export interface ProductCoreSpecs {
  pixelPitch?: string;
  brightness?: string;
  cabinetDimensions?: string;
  cabinetWeight?: string;
}

/**
 * Extraction sémantique STRICTE des caractéristiques de la section 5.
 * Chaque clé PDF normalisée est mappée vers UNE propriété canonique unique.
 * Aucun fallback croisé (ex. dimensions ⇒ pitch) : une caractéristique absente
 * reste absente. Références sémantiques acceptées sur le même champ :
 * - pitch          → "Pitch pixel"
 * - brightness     → "Luminosité (nits)" / "Luminosité"
 * - cabinetDim     → "Dimensions châssis"
 * - cabinetWeight  → "Poids châssis"
 */
export function deriveCoreSpecs(
  characteristics: { key: string; value: string }[]
): ProductCoreSpecs {
  const map = new Map(characteristics.map((c) => [normalizeKey(c.key), c.value.trim()]));
  const specs: ProductCoreSpecs = {};
  const pitch = map.get('pitch pixel');
  if (pitch) specs.pixelPitch = pitch;
  const brightness = map.get('luminosite nits') ?? map.get('luminosite');
  if (brightness) specs.brightness = brightness;
  const cabinetDimensions = map.get('dimensions chassis');
  if (cabinetDimensions) specs.cabinetDimensions = cabinetDimensions;
  const cabinetWeight = map.get('poids chassis');
  if (cabinetWeight) specs.cabinetWeight = cabinetWeight;
  return specs;
}

/** Select the section-5 characteristics that form the hero/design highlights. */
function deriveHighlights(
  characteristics: { key: string; value: string }[],
  env: ProductEnvironment | undefined
): ProductStat[] {
  const specs = deriveCoreSpecs(characteristics);
  const highlights: ProductStat[] = [];
  if (specs.pixelPitch) highlights.push({ label: 'PITCH PIXEL', value: specs.pixelPitch });
  if (specs.brightness) highlights.push({ label: 'LUMINOSITÉ · NITS', value: specs.brightness });
  if (specs.cabinetDimensions) {
    highlights.push({ label: 'CHÂSSIS', value: specs.cabinetDimensions });
  }
  const labels = environmentLabels(env);
  highlights.push({ label: 'ENVIRONNEMENT', value: labels ? labels.fr : 'INTÉRIEUR' });
  return highlights;
}

/**
 * Converts raw parsed data into a `Product`-shaped draft.
 * Everything is optional except `name`/`slug`/`status`, filled from the PDF
 * when present (slug falls back to the slugified name). The human validates
 * the result in the admin form before saving (status is 'draft').
 */
export function mapParsedToProduct(
  parsed: ParsedProductText,
  fallbackName?: string
): Partial<Product> {
  const product: Partial<Product> = {
    status: 'draft',
  };

  const name = (parsed.productName ?? fallbackName ?? '').replace(/\s+/g, ' ').trim();
  if (name) product.name = name;
  if (parsed.slug) {
    product.slug = parsed.slug;
  } else if (name) {
    product.slug = slugify(name);
  }

  if (parsed.badge) product.badge = parsed.badge;
  const environment = toEnvironment(parsed.environment);
  if (environment) product.environment = environment;

  const sellingModes = parsed.sellingModes
    ?.map(m => SELLING_MODE_MAP[m.toLowerCase().trim()])
    .filter((m): m is SellingMode => Boolean(m));
  if (sellingModes && sellingModes.length > 0) {
    const unique: SellingMode[] = [];
    for (const mode of sellingModes) {
      if (!unique.includes(mode)) unique.push(mode);
    }
    product.sellingModes = unique;
  }

  if (parsed.characteristics && parsed.characteristics.length > 0) {
    product.characteristics = parsed.characteristics.map(c => ({
      key: c.key.trim(),
      value: c.value.replace(/\s+/g, ' ').trim(),
    }));
  }

  const study = parsed.buttons?.study;
  const datasheet = parsed.buttons?.datasheet;
  if (study || datasheet) {
    product.buttons = {
      ...(study ? { study: study.toUpperCase() } : {}),
      ...(datasheet ? { datasheet: datasheet.toUpperCase() } : {}),
    };
  }

  if (parsed.variants && parsed.variants.length > 0) {
    product.variants = parsed.variants.map(v => ({
      name: v.name,
      value: v.value,
      ...(v.reference ? { reference: v.reference } : {}),
    }));
  }

  if (
    parsed.shortDescription ||
    parsed.detailedDescription ||
    (parsed.keywords && parsed.keywords.length > 0)
  ) {
    product.description = {
      shortFr: parsed.shortDescription ?? '',
      detailedFr: parsed.detailedDescription ?? '',
      ...(parsed.keywords && parsed.keywords.length > 0 ? { keywords: parsed.keywords } : {}),
    };
  }

  if (parsed.menu && (parsed.menu.groupFr || parsed.menu.groupEn || parsed.menu.tag)) {
    product.menu = {
      groupFr: parsed.menu.groupFr ?? '',
      groupEn: parsed.menu.groupEn ?? '',
      ...(parsed.menu.tag ? { tag: parsed.menu.tag } : {}),
    };
  }

  const coreSpecs = deriveCoreSpecs(parsed.characteristics ?? []);
  if (coreSpecs.pixelPitch) product.pixelPitch = coreSpecs.pixelPitch;
  if (coreSpecs.brightness) product.brightness = coreSpecs.brightness;
  if (coreSpecs.cabinetDimensions) product.cabinetDimensions = coreSpecs.cabinetDimensions;
  if (coreSpecs.cabinetWeight) product.cabinetWeight = coreSpecs.cabinetWeight;

  const highlights = deriveHighlights(parsed.characteristics ?? [], environment);
  const labels = environmentLabels(environment);
  if (parsed.hero || highlights.length > 0) {
    product.hero = {
      title: name || '',
      ...(parsed.hero?.subtitle ? { subtitle: parsed.hero.subtitle } : {}),
      ...(parsed.hero?.primaryCta ? { primaryCta: parsed.hero.primaryCta } : {}),
      ...(datasheet ? { secondaryCta: datasheet.toUpperCase() } : {}),
      ...(parsed.hero?.bgColor ? { bgColor: parsed.hero.bgColor } : {}),
      ...(parsed.hero?.tags && parsed.hero.tags.length > 0 ? { tags: parsed.hero.tags } : {}),
      ...(labels ? { breadcrumbCategoryFr: labels.fr, breadcrumbCategoryEn: labels.en } : {}),
      ...(highlights.length > 0 ? { specs: highlights } : {}),
    };
  }

  if (parsed.overview) {
    product.overview = {
      ...(parsed.overview.eyebrow ? { eyebrow: parsed.overview.eyebrow } : {}),
      ...(parsed.overview.title ? { title: parsed.overview.title } : {}),
      ...(parsed.overview.description ? { description: parsed.overview.description } : {}),
      ...(parsed.overview.stats && parsed.overview.stats.length > 0
        ? { stats: parsed.overview.stats }
        : {}),
    };
  }

  if (parsed.design) {
    product.design = {
      ...(parsed.design.eyebrow ? { eyebrow: parsed.design.eyebrow } : {}),
      ...(parsed.design.title ? { title: parsed.design.title } : {}),
      ...(parsed.design.cabinetDim ? { cabinetDim: parsed.design.cabinetDim } : {}),
      ...(parsed.design.weight ? { weight: parsed.design.weight } : {}),
      ...(parsed.design.material ? { material: parsed.design.material } : {}),
    };
  }

  if (parsed.features && parsed.features.length > 0) {
    product.features = { items: parsed.features };
  }

  if (parsed.specModels && parsed.specModels.length > 0) {
    product.specs = {
      groups: PRODUCT_SPEC_GROUPS.map(g => ({
        ...g,
        rows: g.rows.map(r => ({ ...r })),
      })),
      models: parsed.specModels.map(m => ({
        name: m.name,
        tag: 'DATASHEET',
        specs: { ...m.specs },
      })),
    };
  }

  if (parsed.fieldwork && parsed.fieldwork.length > 0) {
    product.fieldwork = { projects: parsed.fieldwork };
  }

  const photoNames = [
    ...(parsed.photoName ? [parsed.photoName] : []),
    ...(parsed.galleryNames ?? []),
  ];
  if (photoNames.length > 0) {
    product.media = { photos: photoNames.map(name => ({ name })) };
  }

  if (parsed.shortDescription) {
    product.seo = { description: parsed.shortDescription };
  }

  return product;
}

/** Full browser pipeline: Sheet PDF → text → parsed → Product draft. */
export async function parseProductPdf(
  data: File | ArrayBuffer | Uint8Array,
  fallbackName?: string
): Promise<Partial<Product> | null> {
  try {
    const text = await extractProductPdfText(data);
    const parsed = parseProductFicheText(text);
    const hasContent =
      parsed.productName ||
      parsed.characteristics?.length ||
      parsed.variants?.length ||
      parsed.specModels?.length ||
      parsed.overview ||
      parsed.hero;
    if (!hasContent) return null;
    return mapParsedToProduct(parsed, fallbackName);
  } catch (err: unknown) {
    console.warn('[product-pdf-parser] Échec de l', err);
    return null;
  }
}