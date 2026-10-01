/**
 * Parser déterministe de la fiche technique produit PIXIATECH (site web).
 *
 * SOURCE DE VÉRITÉ : docs/product-system/fiche-technique-modele.pdf
 * Ce PDF est le gabarit officiel. Tous les PDFs produits sont générés depuis
 * ce gabarit : le parser ne doit donc pas comprendre « n'importe quel PDF
 * fabricant », seulement CE format — dont la géométrie a été mesurée et
 * vérifiée item par item (voir `scratch/pdfaudit/reference-dump.txt`).
 *
 * AUCUNE IA / AUCUN LLM / AUCUN appel réseau : extraction pdfjs-dist →
 * regroupement des items en lignes par Y → analyse géométrique (X, taille).
 *
 * ── Principes non négociables ────────────────────────────────────────────────
 * 1. AUCUNE DONNÉE INVENTÉE. Un slot laissé vide par le gabarit (tiret `—`,
 *    placeholder `[ … ]`) reste ABSENT. Jamais de valeur empruntée à un autre
 *    produit, jamais de valeur par défaut, jamais de complétion.
 * 2. `PENDING` est une VALEUR VALIDE du document source : conservée telle
 *    quelle (l'admin peut la remplacer ; l'affichage peut la montrer en `—`).
 * 3. Les UNITÉS font partie de la valeur (« 1.25 mm », « 800 nits ») : jamais
 *    supprimées ni séparées du nombre.
 * 4. ASSOCIATION VARIANTE → SPÉCIFICATION EXACTE. Le nombre de colonnes
 *    correspond au nombre RÉEL de variantes du PDF ; chaque valeur est affectée
 *    par proximité du CENTRE de colonne, donc une cellule vide ne décale jamais
 *    les valeurs suivantes (voir `parseSpecMatrix`).
 * 5. AUCUNE DONNÉE PERDUE EN SILENCE : un label ou un groupe inconnu du gabarit
 *    est conservé via une clé dynamique + un avertissement.
 * 6. Les MÉDIAS ne sont jamais extraits : le PDF ne porte que la description et
 *    l'emplacement. Les fichiers restent gérés dans l'admin.
 *
 * ── Géométrie mesurée du gabarit (unités PDF, page A4 595 × 842) ────────────
 * Rôles des tailles de police (relevées sur le PDF de référence) :
 *   24.0 nom produit · 22.0 numéro de section · 14.0 accroche de section ·
 *   13.0 accroche CTA · 11.5 valeur de badge · 10.0 sous-titre / groupe ·
 *   9.0-9.5 titres de bloc, labels de boîte, médias, features, projets ·
 *   8.5 série · 8.0 pays · 7.5 marchés · 6.8 matrice de specs · 6.6 label badge
 *
 * Colonnes de la matrice comparative : chaque cellule est CENTRÉE sur un centre
 * de colonne fixe, et l'en-tête de variante partage exactement ce centre :
 *   valeur `—`     x=137.2 w=6.8  → centre 140.60
 *   en-tête `1 ]`   x=136.6 w=7.9  → centre 140.55
 *   en-tête `[ Modele` x=126.8 w=27.6 → centre 140.60
 * Le pas de colonne vaut 48.45 pt pour 10 colonnes.
 *
 * Pièges structurels du gabarit, traités explicitement :
 *   - l'en-tête de variante est coupé sur deux lignes (`[ Modele` puis `1 ]`) ;
 *   - les numéros de configuration sont coupés chiffre par chiffre (`0` puis
 *     `1`, 13.5 pt d'écart) → reconstruits par proximité, jamais par index ;
 *   - le libellé de tableau `SPEC` (x=70.3) est dans la zone des labels mais
 *     n'appartient ni à l'en-tête ni aux lignes ;
 *   - la page 4 (`STRUCTURE DE REFERENCE`) est de la DOCUMENTATION : la page
 *     entière est ignorée ;
 *   - le pied de page (`GABARIT VIERGE …` / `PAGE n`) est ignoré.
 */

import type { Product } from './types';

// ===========================================================================
// 1. GÉOMÉTRIE PDF
// ===========================================================================

export interface PdfTextItem {
  str: string;
  /** abscisse du bord gauche (unités PDF) */
  x: number;
  /** ordonnée de la ligne de base (unités PDF, Y vers le haut) */
  y: number;
  /** largeur de l'item */
  w: number;
  /** hauteur d'origine = corps de police effectif */
  size: number;
  font: string;
  /** abscisse du CENTRE de l'item : ancre de colonne du gabarit */
  cx: number;
}

export interface PdfLine {
  y: number;
  items: PdfTextItem[];
  text: string;
}

/** Marge gauche du gabarit : alignement des titres, corps de texte, labels. */
const MARGIN_X = 48.5;
/** Zone des libellés de la matrice (à gauche de la 1re colonne de valeurs). */
const LABEL_ZONE_MAX_X = 112;
/** Zone des en-têtes de groupe de specs (colonne « SPEC » incluse). */
const GROUP_ZONE_MAX_X = 80;
/** Les colonnes de variantes commencent ici (1re en-tête : x=126.8). */
const SPEC_COL_MIN_X = 120;
/** Zone de l'accroche de section (immédiatement après le numéro `NN`). */
const HOOK_MIN_X = 70;
const HOOK_MAX_X = 112;
/** Écart de centre au-delà duquel deux items appartiennent à des colonnes. */
const COLUMN_GAP = 20;
/** Écart horizontal au-delà duquel deux items d'une ligne sont distincts. */
const ITEM_GAP = 30;
/** Un nombre « étroit » = chiffre isolé (le gabarit coupe `01` en `0`+`1`). */
const NARROW_NUM_MAX_W = 14;
/** Tolérance de regroupement des items sur une même ligne visuelle. */
const Y_TOLERANCE = 3;

/** Regroupe les items d'une page en lignes visuelles (tolérance sur Y). */
export function groupItemsIntoLines(items: PdfTextItem[]): PdfLine[] {
  const buckets: { y: number; items: PdfTextItem[] }[] = [];
  for (const item of items) {
    if (!item.str || !item.str.trim()) continue;
    const y = Math.round(item.y);
    const bucket = buckets.find((b) => Math.abs(b.y - y) <= Y_TOLERANCE);
    if (bucket) bucket.items.push(item);
    else buckets.push({ y, items: [item] });
  }
  buckets.sort((a, b) => b.y - a.y);
  return buckets.map((bucket) => {
    const sorted = [...bucket.items].sort((a, b) => a.x - b.x);
    // Déduplication des items superposés identiques (ex: calque gabarit + calque saisi chevauchants)
    const deduped: PdfTextItem[] = [];
    for (const it of sorted) {
      const prev = deduped[deduped.length - 1];
      if (
        prev &&
        normLabel(prev.str) === normLabel(it.str) &&
        (Math.abs(prev.x - it.x) < 25 || (prev.x < LABEL_ZONE_MAX_X && it.x < LABEL_ZONE_MAX_X))
      ) {
        if (it.size > prev.size) {
          deduped[deduped.length - 1] = it;
        }
        continue;
      }
      deduped.push(it);
    }
    return { y: bucket.y, items: deduped, text: joinItems(deduped) };
  });
}

/**
 * Concatène les items d'une ligne. Deux items distants de moins de 2 pt sont
 * recollés sans espace (`×` + `1080` → `×1080`) ; au-delà, un espace est ajouté
 * (`800` + `nits` → `800 nits`).
 */
/**
 * Concatène les items d'une même boîte en restituant les espaces.
 *
 * pdfjs coupe une boîte en items au niveau des runs de police : deux items qui
 * se touchent (écart 0) sont la même suite de caractères (`px/m` + `2)`) et
 * doivent être recollés SANS espace ; dès qu'un écart existe, un espace a été
 * consommé dans le texte d'origine (`1.25` + `mm`) et doit être restitué.
 */
function joinItems(items: PdfTextItem[]): string {
  let text = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) {
      const prev = items[i - 1];
      if (item.x - (prev.x + prev.w) > 0.5) text += ' ';
    }
    text += item.str;
  }
  return text;
}

/**
 * Découpe une ligne en colonnes logiques. Le gabarit espace les boîtes d'une
 * ligne de plus de 30 pt ; en deçà, les items appartiennent au même flux.
 */
function lineColumns(items: PdfTextItem[]): PdfTextItem[] {
  const cols: PdfTextItem[] = [];
  let current: PdfTextItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) {
      const prev = items[i - 1];
      if (item.x - (prev.x + prev.w) > ITEM_GAP) {
        cols.push(mergeColumn(current));
        current = [];
      }
    }
    current.push(item);
  }
  if (current.length) cols.push(mergeColumn(current));
  return cols;
}

/** Fusionne les items d'une colonne en un item synthétique (centre = moyenne). */
function mergeColumn(items: PdfTextItem[]): PdfTextItem {
  if (items.length === 1) return items[0];
  const first = items[0];
  const last = items[items.length - 1];
  return {
    ...first,
    str: joinItems(items),
    x: first.x,
    w: last.x + last.w - first.x,
    cx: (first.cx + last.cx) / 2,
    size: Math.max(...items.map((i) => i.size)),
  };
}

// ===========================================================================
// 2. NORMALISATION
// ===========================================================================

/** Minuscules, sans accents, sans ponctuation, espaces compactés. */
export function normLabel(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const DASH_ONLY = /^[\u2010-\u2015\u2212\u2014]+$/;

/**
 * INVENTAIRE EXACT des slots du gabarit officiel
 * (`docs/product-system/fiche-technique-modele.pdf`).
 *
 * Le gabarit dessine tous ses placeholders entre crochets, et ils le restent
 * après saisie si la personne édite le texte À L'INTÉRIEUR du crochet. Un
 * test « contient un crochet ⇒ placeholder » rejetait donc aussi la vraie
 * donnée (`[ PXT-FINE-500 ]`), tandis qu'une détection par mots-clés laissait
 * passer du gabarit non rempli (`[ Marche 1 ]`, `[ Titre feature ]`).
 *
 * On tranche donc sur l'IDENTITÉ du texte, pas sur sa ponctuation : un slot
 * est vide s'il est l'un de ces libellés, quel que soit le nombre de
 * crochets qu'il traîne. La liste est fermée et vérifiable — toute entrée
 * ajoutée ici doit exister dans le PDF officiel.
 */
const GABARIT_PLACEHOLDERS: string[] = [
  'Accroche design du produit',
  'Accroche editoriale du produit',
  'Accroche features',
  'Accroche finale / CTA',
  'Accroche section projets',
  'Description',
  'Description en 1 a 2 phrases',
  'description en 1 phrase',
  'Description photo',
  'Description produit — 3 a 4 lignes',
  'Description video',
  'EMPLACEMENT MEDIA',
  'L×l mm',
  'Label stat 1',
  'Label stat 2',
  'Label stat 3',
  'Libelle bouton',
  'LOGO / NOM ENTREPRISE',
  'Marche 1',
  'Marche 2',
  'Marche 3',
  'Marche 4',
  'mm',
  'Modele',
  // Le gabarit écrit le nom de variante sur deux lignes : `[ Modele` puis `1 ]`.
  'Modele 1',
  'Modele 2',
  'Modele 3',
  'Modele 4',
  'Modele 5',
  'Modele 6',
  'Modele 7',
  'Modele 8',
  'Modele 9',
  'nom | url',
  'Nom config',
  'NOM DU PRODUIT',
  'Nom du projet / client',
  'Nom technologie',
  'Pays · Annee',
  'Serie / categorie du produit',
  'Sous-titre produit',
  'Titre feature',
  'Titre photo',
  'Titre section',
  'Titre video',
  'Titre visuel 1',
  'Titre visuel 2',
  'valeur',
];

/**
 * Clés normalisées des placeholders, en deux formes : « Modele 1 » et
 * « Modele1 » (le gabarit écrit le nom de variante sur deux lignes, le
 * recollage des items de la matrice ne remet pas d'espace) doivent
 * tous deux être reconnus comme le même placeholder.
 */
const GABARIT_PLACEHOLDER_KEYS = new Set(GABARIT_PLACEHOLDERS.map(normLabel));
const GABARIT_PLACEHOLDER_KEYS_COMPACT = new Set(
  GABARIT_PLACEHOLDERS.map((raw) => normLabel(raw).replace(/\s+/g, ''))
);

/** Un texte normalisé correspond-il à un placeholder du gabarit officiel ? */
function isGabaritPlaceholder(normalized: string): boolean {
  if (
    GABARIT_PLACEHOLDER_KEYS.has(normalized) ||
    GABARIT_PLACEHOLDER_KEYS_COMPACT.has(normalized.replace(/\s+/g, ''))
  ) {
    return true;
  }
  const compact = normalized.replace(/\s+/g, '');
  if (/^MARCHE\d+$/.test(compact)) return true;
  if (/^MODELE\d+$/.test(compact)) return true;
  if (/^LABELSTAT\d+$/.test(compact)) return true;
  if (/^VALEUR(VALEUR)?$/.test(compact)) return true;
  if (/^TITRE(FEATURE|PHOTO|VIDEO|VISUEL\d+|SECTION)?$/.test(compact)) return true;
  if (/^ACCROCHE/.test(compact)) return true;
  if (/^DESCRIPTION/.test(compact)) return true;
  if (/^EMPLACEMENTMEDIA$/.test(compact)) return true;
  if (/^(LX?LMM|MM)$/.test(compact)) return true;
  return false;
}

/**
 * Nettoie le texte d'un slot du gabarit :
 * - élimine les placeholders concaténés (ex: "1000 nits [valeur]" -> "1000 nits", "300 × 168,8 mm [L×l mm]" -> "300 × 168,8 mm") ;
 * - rejette les placeholders résiduels (ex: "valeur [valeur]" -> "", "[Marché 1]" -> "") ;
 * - préserve "PENDING" et les unités ;
 * - retire les crochets si le contenu est une valeur réelle (ex: "[ PXT-S1.2 ]" -> "PXT-S1.2").
 */
export function cleanGabaritString(raw: string | undefined | null): string {
  if (raw === undefined || raw === null) return '';
  let t = cleanValue(raw);
  if (!t) return '';
  if (DASH_ONLY.test(t)) return t;
  if (/^pending$/i.test(t)) return 'PENDING';

  // 1. Si toute la chaîne est entre crochets simples `[ ... ]`
  if (/^\[[^[\]]+\]$/.test(t)) {
    const inner = cleanValue(t.slice(1, -1));
    if (isGabaritPlaceholder(normLabel(inner))) {
      return '';
    }
    return inner;
  }

  // 2. Supprime les placeholders entre crochets inclus dans la chaîne (ex: "1000 nits [ valeur ]", "300 × 168,8 mm [ L×l mm ]")
  const stripped = t.replace(/\[([^[\]]+)\]/g, (match, inner) => {
    if (isGabaritPlaceholder(normLabel(inner))) {
      return '';
    }
    return match;
  });
  t = cleanValue(stripped);

  // 3. Après retrait des crochets, vérifier si le reste n'est lui-même qu'un placeholder (ex: "valeur" ou "valeur valeur")
  if (isGabaritPlaceholder(normLabel(t))) {
    return '';
  }

  // 4. Si la chaîne contient des résidus de découpage du placeholder « Modele N »
  if (/\bModele\b/i.test(t)) {
    const candidate = cleanValue(
      t.replace(/\[?\s*Modele\s*/gi, '').replace(/\s+\d+\s*\]?$/, '').replace(/^[[\s]+/, '').replace(/[\s\]]+$/, '')
    );
    if (!candidate || isGabaritPlaceholder(normLabel(candidate)) || /^\d+$/.test(candidate)) {
      return '';
    }
    return candidate;
  }

  return cleanValue(t.replace(/^[[\s]+/, '').replace(/[\s\]]+$/, ''));
}

/**
 * Retire le chrome du gabarit (`[…]` aux extrémités) d'une valeur retenue et
 * purge tout placeholder résiduel.
 */
function stripSlotChrome(value: string): string {
  return cleanGabaritString(value);
}

/**
 * Un slot du gabarit est-il REMPLI ?
 * `false` pour : vide, tiret seul (`—`), placeholder du gabarit (y compris
 * saisi partiellement), et tout texte contenant un chevron de gabarit.
 *
 * Une valeur réelle entre crochets (`[ PXT-FINE-500 ]`) reste de la donnée.
 * "PENDING" est une valeur autorisée.
 */
export function isFilledSlot(raw: string | undefined | null): boolean {
  if (raw === undefined || raw === null) return false;
  const t = cleanValue(raw);
  if (!t) return false;
  if (DASH_ONLY.test(t)) return false;
  if (t.includes('<') || t.includes('>')) return false;
  if (/^pending$/i.test(t)) return true;

  const cleaned = cleanGabaritString(raw);
  if (!cleaned) return false;
  if (DASH_ONLY.test(cleaned)) return false;
  if (isGabaritPlaceholder(normLabel(cleaned))) return false;
  return true;
}

/** Valeur textuelle nettoyée, unités conservées. */
function cleanValue(raw: string): string {
  return raw.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Majuscules, sans accents. */
function isUpperLabel(raw: string): boolean {
  const t = normLabel(raw);
  if (!t) return false;
  return raw === raw.toUpperCase() && raw !== raw.toLowerCase();
}

// ===========================================================================
// 3. ANCRES STRUCTURELLES DU GABARIT
// ===========================================================================

/** Titres de section, dans l'ordre imposé par le gabarit. */
const SECTION_TITLES: { key: SectionKey; match: string }[] = [
  { key: 'overview', match: 'APERCU PRODUIT' },
  { key: 'design', match: 'CONCEPTION FORMAT' },
  { key: 'features', match: 'POINTS FORTS TECHNIQUES' },
  { key: 'specs', match: 'CARACTERISTIQUES TECHNIQUES' },
  { key: 'fieldwork', match: 'REFERENCES TERRAIN' },
];

type SectionKey = 'masthead' | 'overview' | 'design' | 'features' | 'specs' | 'fieldwork';

/**
 * Textes STATIQUES du gabarit : présents à l'identique dans tout PDF produit,
 * donc jamais des données. Couvrir les hints, les consignes et les libellés de
 * bloc évite qu'un libellé de gabarit ne soit stocké comme donnée produit.
 */
const STATIC_TEXTS = new Set(
  [
    // hints de section
    'Positionnement, technologie phare, usage cible',
    'Dimensions, encombrement, configurations',
    'Exactement 7 caracteristiques cles',
    'Renseigner 1 colonne par modele/variante (3 a 10 recommande)',
    '2 a 3 realisations (optionnel), 1 photo par projet',
    // consignes
    "Ecrire PENDING dans une cellule si la valeur n'est pas encore confirmee par le fabricant.",
    'Navigation serie : Precedent = [ nom | url ] | Suivant = [ nom | url ]',
    // libellés de bloc
    'MEDIAS DE PRESENTATION (1 video + 1 photo)',
    'TECHNOLOGIES EMBARQUEES (2)',
    'VISUELS TECHNIQUES (cote + face)',
    "CONFIGURATIONS D'INSTALLATION (1 a 3)",
    'VISUEL PRODUIT',
    // matrice
    'SPEC',
    'EMPLACEMENT MEDIA',
  ].map(normLabel)
);

/** Le gabarit marque-t-il cette page comme documentation (et non produit) ? */
function isDocumentationPage(lines: PdfLine[]): boolean {
  return lines.some((l) => normLabel(l.text).startsWith('STRUCTURE DE REFERENCE'));
}

/** Pied de page récurrent. */
function isFooterLine(line: PdfLine): boolean {
  if (line.y < 40) return true;
  const n = normLabel(line.text);
  return n.startsWith('GABARIT VIERGE') || /^PAGE \d+$/.test(n);
}

/** Texte statique du gabarit (hint, consigne, libellé de bloc) ? */
function isStaticText(raw: string): boolean {
  return STATIC_TEXTS.has(normLabel(raw));
}

interface ParsedPage {
  lines: PdfLine[];
}

/** Retire les pieds de page et la page de documentation. */
function cleanPages(pages: ParsedPage[]): ParsedPage[] {
  const out: ParsedPage[] = [];
  for (const page of pages) {
    if (isDocumentationPage(page.lines)) continue;
    const lines = page.lines.filter((l) => !isFooterLine(l));
    if (lines.length > 0) out.push({ lines });
  }
  return out;
}

/**
 * Découpe le document en segments ordonnés délimités par les titres de section.
 * Le segment d'index 0 est le MASTHEAD. La lecture est linéaire : un segment
 * peut traverser deux pages (le bloc « visuels techniques » du §02 commence
 * page 1 et se poursuit page 2).
 */
function segmentBySections(pages: ParsedPage[]): Map<SectionKey, PdfLine[]> {
  const segments = new Map<SectionKey, PdfLine[]>();
  segments.set('masthead', []);
  let current: SectionKey = 'masthead';
  for (const page of pages) {
    for (const line of page.lines) {
      const titleMatch = matchSectionTitle(line);
      if (titleMatch) {
        current = titleMatch;
        if (!segments.has(current)) segments.set(current, []);
        continue;
      }
      segments.get(current)!.push(line);
    }
  }
  return segments;
}

/**
 * Un titre de section = item unique, dans la zone de titre, correspondant
 * exactement à un titre connu du gabarit.
 */
function matchSectionTitle(line: PdfLine): SectionKey | null {
  if (line.items.length !== 1) return null;
  const item = line.items[0];
  if (item.x < HOOK_MIN_X || item.x > HOOK_MAX_X) return null;
  const n = normLabel(line.text);
  return SECTION_TITLES.find((s) => s.match === n)?.key ?? null;
}

// ===========================================================================
// 4. RÉSULTAT PARSÉ
// ===========================================================================

/** Emplacement média décrit par le PDF (titre + description). Jamais un fichier. */
export interface ParsedMediaSlot {
  title?: string;
  description?: string;
}

export interface ParsedFiche {
  company?: string;
  series?: string;
  productName?: string;
  subtitle?: string;
  markets?: string[];
  badges?: { label: string; value: string }[];

  overview?: {
    hook?: string;
    description?: string;
    video?: ParsedMediaSlot;
    photo?: ParsedMediaSlot;
    stats?: { value: string; label: string }[];
    technologies?: ProductSubItemDraft[];
  };

  design?: {
    hook?: string;
    dimensions?: { label: string; value: string }[];
    visuals?: ParsedMediaSlot[];
    configs?: ProductSubItemDraft[];
  };

  features?: {
    hook?: string;
    visual?: ParsedMediaSlot;
    items?: ProductSubItemDraft[];
  };

  specs?: {
    groups: { id: string; label: string; rows: { key: string; label: string }[] }[];
    models: { name: string; specs: Record<string, string> }[];
  };

  fieldwork?: {
    hook?: string;
    projects?: { name: string; country?: string; year?: string }[];
  };

  cta?: { title?: string; buttonLabel?: string };
  seriesNavigation?: {
    previous?: { name?: string; url?: string };
    next?: { name?: string; url?: string };
  };

  /** Avertissements : rien n'est jamais perdu en silence. */
  warnings: string[];
}

interface ProductSubItemDraft {
  num?: string;
  title: string;
  description?: string;
}

// ===========================================================================
// 5. OUTILS D'ASSOCIATION PAR COLONNE
// ===========================================================================

/**
 * Regroupe des items en « cellules » par proximité de CENTRE.
 * Deux items d'une même cellule (valeur + unité) partagent le centre de
 * colonne ; deux cellules distinctes sont séparées d'un pas complet.
 */
function clusterByCenter(items: PdfTextItem[]): { cx: number; text: string }[] {
  const sorted = [...items].sort((a, b) => a.cx - b.cx);
  const cells: { cx: number; text: string; items: PdfTextItem[] }[] = [];
  for (const item of sorted) {
    const last = cells[cells.length - 1];
    if (last && item.cx - last.items[last.items.length - 1].cx <= COLUMN_GAP) {
      last.items.push(item);
      last.cx = last.items.reduce((acc, i) => acc + i.cx, 0) / last.items.length;
    } else {
      cells.push({ cx: item.cx, text: item.str, items: [item] });
    }
  }
  // Ordre de lecture d'une cellule : colonne (x) croissante, puis ligne du
  // haut vers le bas. Le gabarit écrit le nom de variante sur la ligne haute
  // (`[ Modele`) et son crochet fermant sur la ligne basse (`1 ]`) : sans ce
  // tri, le `]` arrivait en premier et le nom sortait « ][ PXT-FINE-500 ».
  //
  // Le gabarit imprime un tiret cadratin `—` (U+2014) dans les cellules vides
  // de la matrice comparative. Si un tel tiret partage une grappe avec une
  // valeur réelle (centres à < 20 pt d'écart), il est retiré : sa présence
  // ne signifie jamais « contenu » mais « emplacement réservé, pas encore
  // rempli ». Sans ce filtre, la valeur sortait « —Indoor » ou « COB— ».
  return cells.map((c) => {
    let ordered = [...c.items].sort((a, b) => a.x - b.x || b.y - a.y);
    const hasRealContent = ordered.some((i) => !DASH_ONLY.test(i.str.trim()));
    if (hasRealContent) {
      ordered = ordered.filter((i) => !DASH_ONLY.test(i.str.trim()));
    }
    return { cx: c.cx, text: joinItems(ordered) };
  });
}

/**
 * Colonne de gauche la plus proche d'une cellule, sous la forme d'un index.
 * `-1` si aucune colonne n'est dans la limite d'un demi-pas : c'est la garantie
 * qu'aucune valeur n'est stockée sous la mauvaise variante.
 */
function nearestColumn(centers: number[], cellCx: number, halfPitch: number): number {
  let best = -1;
  let bestDist = Infinity;
  centers.forEach((cx, idx) => {
    const d = Math.abs(cellCx - cx);
    if (d < bestDist) {
      bestDist = d;
      best = idx;
    }
  });
  return bestDist <= halfPitch ? best : -1;
}

/** Demi-pas de colonne : garde-fou d'affectation. */
function halfPitchOf(centers: number[]): number {
  if (centers.length < 2) return Infinity;
  let minGap = Infinity;
  for (let i = 1; i < centers.length; i++) {
    const gap = centers[i] - centers[i - 1];
    if (gap > 0 && gap < minGap) minGap = gap;
  }
  return Number.isFinite(minGap) ? minGap / 2 : Infinity;
}

// ===========================================================================
// 6. PRIMITIVES DE SECTION
// ===========================================================================

/** Nombre étroit et isolé : chiffre du numéro de liste du gabarit. */
function isNarrowNumber(item: PdfTextItem): boolean {
  return item.w <= NARROW_NUM_MAX_W && /^\d{1,2}$/.test(item.str.trim());
}

/** Retire les chiffres de numéro d'une ligne et renvoie le reste. */
function stripNumbers(items: PdfTextItem[]): PdfTextItem[] {
  return items.filter((i) => !isNarrowNumber(i));
}

/**
 * Numéro de liste dont le gabarit a coupé les chiffres sur plusieurs lignes
 * (`0` puis `1`, 13.5 pt d'écart) : on recolle les chiffres proches par Y, du
 * plus haut au plus bas. Aucun index n'est supposé. La fenêtre est asymétrique
 * car les chiffres sont TOUJOURS dessinés sous la ligne de contenu
 * (y = baseY − 1.5 puis baseY − 14.5 sur le gabarit) : sans cela, le dernier
 * chiffre d'une configuration viendrait s'agréger à la configuration suivante.
 */
function joinSplitNumber(lines: PdfLine[], baseY: number, minX: number, maxX: number): string | undefined {
  const digits = lines
    .filter((l) => l.y <= baseY + 6 && l.y >= baseY - 22)
    .flatMap((l) => l.items)
    .filter((i) => isNarrowNumber(i) && i.x >= minX && i.x <= maxX)
    .sort((a, b) => b.y - a.y);
  if (digits.length === 0) return undefined;
  return digits.map((d) => d.str.trim()).join('');
}

/**
 * Accroche de section : ligne `NN` (chiffre large, x≈48.5) suivie du texte de
 * l'accroche (x∈[70,112), corps 14). La ligne d'aide qui suit est un texte
 * statique du gabarit et n'est donc jamais retenue.
 */
function parseHook(lines: PdfLine[]): string | undefined {
  for (const line of lines) {
    const number = line.items.find((i) => i.x < HOOK_MIN_X && i.size >= 20);
    if (!number) continue;
    const text = line.items
      .filter((i) => i.x >= HOOK_MIN_X && i.x <= HOOK_MAX_X)
      .map((i) => i.str)
      .join(' ')
      .trim();
    if (isFilledSlot(text) && !isStaticText(text)) return cleanValue(text);
  }
  return undefined;
}

/**
 * Paragraphe de description : suite de lignes consécutives ancrées à la marge
 * gauche, jusqu'au premier titre de bloc statique. Gère le gabarit « 3 à 4
 * lignes » : toutes les lignes sont conservées, dans l'ordre.
 */
function parseBodyParagraph(lines: PdfLine[], startIndex: number): string | undefined {
  const parts: string[] = [];
  for (const line of lines.slice(startIndex)) {
    const item = line.items[0];
    // Un texte statique du gabarit (ligne d'aide) ne clôt pas le paragraphe
    // tant qu'aucune ligne de corps n'a été lue.
    if (!isStaticText(line.text)) {
      if (!item || line.items.length > 1 || Math.abs(item.x - MARGIN_X) > 3) break;
      if (!isFilledSlot(line.text)) break;
    } else if (parts.length > 0) {
      break;
    }
    if (isFilledSlot(line.text) && !isStaticText(line.text)) parts.push(cleanValue(line.text));
  }
  return parts.length ? parts.join(' ') : undefined;
}

/**
 * Bloc « valeur au-dessus / libellé en dessous » (badges du masthead, stats).
 * L'appariement se fait par proximité de centre de colonne.
 */
function pairValueOverLabel(
  lines: PdfLine[],
  startIndex: number,
  minColumns: number
): { pairs: { value: string; label: string }[]; endIndex: number } {
  const valueLine = lines[startIndex];
  const labelLine = lines[startIndex + 1];
  if (!valueLine || !labelLine) return { pairs: [], endIndex: startIndex };
  const values = lineColumns(valueLine.items);
  const labels = lineColumns(labelLine.items);
  if (values.length < minColumns || labels.length !== values.length) {
    return { pairs: [], endIndex: startIndex };
  }
  const pairs: { value: string; label: string }[] = [];
  for (const value of values) {
    let bestLabel: PdfTextItem | null = null;
    let bestDist = Infinity;
    for (const label of labels) {
      const d = Math.abs(label.cx - value.cx);
      if (d < bestDist) {
        bestDist = d;
        bestLabel = label;
      }
    }
    const v = cleanGabaritString(value.str);
    const l = bestLabel ? cleanGabaritString(bestLabel.str) : '';
    if (isFilledSlot(v) && isFilledSlot(l)) pairs.push({ label: l.toUpperCase(), value: v });
  }
  return { pairs, endIndex: startIndex + 1 };
}

// ===========================================================================
// 7. PARSERS DE SECTION
// ===========================================================================

/**
 * MASTHEAD — structure fixe du gabarit, lue dans l'ordre :
 *   logo/entreprise · série · nom · sous-titre · 4 marchés · 4 badges
 *   (valeur au-dessus, libellé en dessous).
 */
function parseMasthead(lines: PdfLine[]): Partial<ParsedFiche> {
  const out: Partial<ParsedFiche> = {};
  const slots: { key: 'series' | 'productName' | 'subtitle'; x: number; size: number }[] = [
    { key: 'series', x: 60.5, size: 8.5 },
    { key: 'productName', x: 60.5, size: 24 },
    { key: 'subtitle', x: 60.5, size: 10 },
  ];

  for (const line of lines) {
    // Ligne entreprise : 2 items, le premier est le logo (x≈46.5).
    if (line.items.length >= 2 && line.items[0].x < MARGIN_X) {
      const company = cleanGabaritString(line.items[0].str);
      if (isFilledSlot(company) && out.company === undefined) out.company = company;
      continue;
    }

    const rawText = joinItems(line.items);
    const cleaned = cleanGabaritString(rawText);

    // 1. Détection par placeholder du gabarit (ex: "PXT SEAMLESS[ NOM DU PRODUIT ]")
    const norm = rawText.toUpperCase();
    if (norm.includes('NOM DU PRODUIT') && out.productName === undefined) {
      if (isFilledSlot(cleaned)) out.productName = cleaned;
      continue;
    }
    if (norm.includes('SERIE / CATEGORIE') && out.series === undefined) {
      if (isFilledSlot(cleaned)) out.series = cleaned;
      continue;
    }
    if (norm.includes('SOUS-TITRE PRODUIT') && out.subtitle === undefined) {
      if (isFilledSlot(cleaned)) out.subtitle = cleaned;
      continue;
    }

    // 2. Détection géométrique (abscisse, ordonnée, taille) si le placeholder a été remplacé
    const match = slots.find((s) => {
      if (out[s.key] !== undefined) return false;
      if (line.items.length === 0) return false;
      if (Math.abs(line.items[0].x - s.x) > 6 && Math.abs(line.items[0].x - MARGIN_X) > 15) return false;

      const maxSize = Math.max(...line.items.map((i) => i.size));
      if (s.key === 'productName') {
        return maxSize >= 15 || (line.y >= 710 && line.y <= 738);
      }
      if (s.key === 'series') {
        return line.y >= 740 && line.y <= 770 && maxSize <= 13;
      }
      if (s.key === 'subtitle') {
        return line.y >= 690 && line.y <= 715 && maxSize <= 14;
      }
      return false;
    });

    if (match) {
      if (isFilledSlot(cleaned)) out[match.key] = cleaned;
      continue;
    }
  }

  // Grille de badges : 4 VALEURS en corps 11.5, puis 4 libellés en corps 6.6
  // partageant exactement les mêmes centres. On ancre sur les valeurs, sinon
  // les libellés (corps 6.6) passent pour une grille de marchés (corps 7.5).
  const badgeIndex = lines.findIndex((line) => {
    const cols = lineColumns(line.items);
    return cols.length === 4 && cols.every((i) => i.size >= 10.5);
  });
  if (badgeIndex !== -1) {
    const labels = lines[badgeIndex + 1] ? lineColumns(lines[badgeIndex + 1].items) : [];
    if (labels.length === 4) {
      const { pairs } = pairValueOverLabel(lines, badgeIndex, 4);
      if (pairs.length) out.badges = pairs;
    }
  }

  // Marchés : grille de 4 items en corps 7.5, située AU-DESSUS des badges
  // (en coordonnées PDF, « au-dessus » = Y plus grand).
  const badgeY = badgeIndex !== -1 ? lines[badgeIndex].y : -Infinity;
  for (const line of lines) {
    if (line.y <= badgeY) continue;
    const cols = lineColumns(line.items);
    if (cols.length !== 4) continue;
    if (!cols.every((i) => i.size >= 6.9 && i.size <= 8.1)) continue;
    const markets = cols.map((i) => cleanGabaritString(i.str)).filter(isFilledSlot);
    if (markets.length && out.markets === undefined) out.markets = markets;
  }
  return out;
}

/** Numéro de liste « étroit » du gabarit, dans la gouttière des Puces. */
function listNumber(line: PdfLine): string | undefined {
  const item = line.items.find((i) => isNarrowNumber(i) && i.x >= 55 && i.x <= 80);
  return item ? cleanValue(item.str) : undefined;
}

/** Items de contenu d'une ligne de liste, une fois le numéro retiré. */
function listContent(line: PdfLine, minX: number): PdfTextItem[] {
  return line.items.filter((i) => i.x >= minX && !isNarrowNumber(i));
}

/**
 * Sépare le TITRE et la DESCRIPTION d'une ligne de liste.
 *
 * Deux graphies coexistent dans le gabarit officiel : la ligne technologie
 * sépare par un TIRET cadratin au sein d'un même item (`Nom — description`),
 * tandis que la ligne feature place les deux dans des COLONNES distinctes. On
 * tente donc les colonnes d'abord, puis le tiret — quelle que soit la façon
 * dont la personne a.rempli son PDF, les deux ne sont jamais fusionnés.
 */
function splitTitleDescription(items: PdfTextItem[]): { title: string; description?: string } {
  const cols = lineColumns(items);
  if (cols.length >= 2) {
    const title = stripSlotChrome(cols[0].str);
    const description = stripSlotChrome(cols.slice(1).map((c) => c.str).join(' '));
    return { title, ...(isFilledSlot(description) ? { description } : {}) };
  }
  const joined = stripSlotChrome(joinItems(items));
  const [head, ...tail] = joined.split(/\s+[\u2013\u2014\u2212-]\s+/);
  const title = stripSlotChrome(head);
  const description = stripSlotChrome(tail.join(' '));
  return { title, ...(tail.length && isFilledSlot(description) ? { description } : {}) };
}

/** 01 · APERÇU PRODUIT */
function parseOverview(lines: PdfLine[]): ParsedFiche['overview'] {
  const out: NonNullable<ParsedFiche['overview']> = {};
  let hookIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].items.find((it) => it.x < HOOK_MIN_X && it.size >= 20)) continue;
    hookIndex = i;
    const text = lines[i].items
      .filter((it) => it.x >= HOOK_MIN_X && it.x <= HOOK_MAX_X)
      .map((it) => it.str)
      .join(' ')
      .trim();
    if (isFilledSlot(text) && !isStaticText(text)) out.hook = cleanValue(text);
    break;
  }

  // Description : après l'accroche, jusqu'au libellé « MEDIAS DE PRESENTATION ».
  const description = parseBodyParagraph(lines, hookIndex + 1);
  if (description) out.description = description;

  // Médias : 2 titres (video / photo) puis 2 descriptions.
  // On exige EXACTEMENT 2 colonnes : le libellé statique « MEDIAS DE
  // PRESENTATION (1 video + 1 photo) » contient aussi les deux mots, mais tient
  // sur une seule colonne — sans ce filtre il deviendrait le titre du média.
  const titleIndex = lines.findIndex((l) => {
    if (!/video/i.test(l.text) || !/photo/i.test(l.text)) return false;
    return lineColumns(l.items).length === 2;
  });
  if (titleIndex !== -1) {
    const titles = lineColumns(lines[titleIndex].items);
    const descs = lines[titleIndex + 1] ? lineColumns(lines[titleIndex + 1].items) : [];
    if (descs.length === 2) {
      const video = mediaSlot(titles[0], descs[0]);
      const photo = mediaSlot(titles[1], descs[1]);
      if (video) out.video = video;
      if (photo) out.photo = photo;
    }
  }

  // 3 statistiques : valeur (corps 15) au-dessus, label (corps 7.5) en dessous.
  for (let i = 0; i < lines.length; i++) {
    const cols = lineColumns(lines[i].items);
    if (cols.length < 2) continue;
    if (!cols.every((c) => c.size >= 12)) continue;
    const { pairs, endIndex } = pairValueOverLabel(lines, i, 2);
    if (pairs.length) {
      out.stats = pairs;
      i = endIndex;
      break;
    }
  }

  // Technologies : une ligne de liste par technologie. Le gabarit écrit le NOM
  // et la DESCRIPTION soit en deux colonnes, soit séparés par un tiret cadratin
  // selon la ligne : `splitTitleDescription` tranche les deux graphies.
  const technologies: ProductSubItemDraft[] = [];
  for (const line of lines) {
    const num = listNumber(line);
    if (!num) continue;
    const rest = listContent(line, HOOK_MIN_X);
    if (rest.length === 0) continue;
    const { title, description } = splitTitleDescription(rest);
    if (!isFilledSlot(title) || isStaticText(title)) continue;
    technologies.push({
      num,
      title,
      ...(description && isFilledSlot(description) ? { description } : {}),
    });
  }
  if (technologies.length) out.technologies = technologies;

  return Object.keys(out).length ? out : undefined;
}

/**
 * Un texte est-il un NOM DE FICHIER (`PHOTO-01.JPG`, `video.mp4`) ?
 *
 * Le gabarit réserve une zone à l'emplacement du média et une zone au TITRE
 * décrivant ce média. Un nom de fichier tapé dans la zone d'emplacement
 * n'est pas un titre : le contrat de `ParsedMediaSlot` impose « Jamais un
 * fichier », sinon on publie `VIDEO.MP4` comme libellé de média.
 */
function looksLikeFilename(raw: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg|mp4|mov|avi|m4v|webm|pdf|psd|ai|indd|zip)\b/i.test(raw);
}

function mediaSlot(title?: PdfTextItem, description?: PdfTextItem): ParsedMediaSlot | undefined {
  const t = title ? cleanValue(title.str) : '';
  // Un média est identifié par son TITRE : une description orpheline (sans
  // titre) n'est pas un visuel, c'est du texte qui déborde d'un autre bloc.
  if (!isFilledSlot(t)) return undefined;
  if (looksLikeFilename(t)) return undefined;
  const d = description ? cleanValue(description.str) : '';
  return { title: t, ...(isFilledSlot(d) && !looksLikeFilename(d) ? { description: d } : {}) };
}

/** 02 · CONCEPTION & FORMAT */
function parseDesign(lines: PdfLine[]): ParsedFiche['design'] {
  const out: NonNullable<ParsedFiche['design']> = {};
  const hook = parseHook(lines);
  if (hook) out.hook = hook;

  // Dimensions : 3 labels de boîte (corps 9, 1er à la marge) puis les valeurs.
  for (let i = 0; i < lines.length; i++) {
    const labels = lineColumns(lines[i].items);
    if (labels.length < 2) continue;
    if (Math.abs(labels[0].x - MARGIN_X) > 3) continue;
    if (!labels.every((l) => l.size >= 8.8 && l.size < 11)) continue;
    const values = lines[i + 1] ? lineColumns(lines[i + 1].items) : [];
    if (values.length !== labels.length) continue;
    const dimensions: { label: string; value: string }[] = [];
    const taken = new Set<number>();
    for (const label of labels) {
      let best = -1;
      let bestDist = Infinity;
      values.forEach((value, idx) => {
        if (taken.has(idx)) return;
        const d = Math.abs(value.x - label.x);
        if (d < bestDist) {
          bestDist = d;
          best = idx;
        }
      });
      if (best === -1) continue;
      taken.add(best);
      const value = cleanGabaritString(values[best].str);
      const lText = cleanGabaritString(label.str);
      if (isFilledSlot(value)) dimensions.push({ label: lText || cleanValue(label.str), value });
    }
    if (dimensions.length) {
      out.dimensions = dimensions;
      i++;
    }
    break;
  }

  // Visuels techniques : 2 blocs côte/face (colonnes opposées, titre + desc.).
  const visuals: ParsedMediaSlot[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isStaticText(lines[i].text)) continue;
    const cols = lineColumns(lines[i].items);
    if (cols.length !== 2) continue;
    if (cols[1].x - cols[0].x < 200) continue;
    if (!cols.every((c) => c.size < 11 && c.x > MARGIN_X + 10)) continue;
    const descs = lines[i + 1] ? lineColumns(lines[i + 1].items) : [];
    if (descs.length !== cols.length) continue;
    for (let k = 0; k < cols.length; k++) {
      const slot = mediaSlot(cols[k], descs[k]);
      if (slot) visuals.push(slot);
    }
  }
  if (visuals.length) out.visuals = visuals;

  // Configurations : numéro (chiffres coupés) + nom + description.
  const configs: ProductSubItemDraft[] = [];
  for (const line of lines) {
    const num = joinSplitNumber(lines, line.y, 58, 80);
    if (!num) continue;
    const cols = lineColumns(listContent(line, 80));
    if (cols.length < 2) continue;
    const name = cleanValue(cols[0].str);
    if (!isFilledSlot(name)) continue;
    const description = cleanValue(cols.slice(1).map((c) => c.str).join(' '));
    configs.push({
      num,
      title: name,
      ...(isFilledSlot(description) ? { description } : {}),
    });
  }
  if (configs.length) out.configs = configs;

  return Object.keys(out).length ? out : undefined;
}

/** 03 · POINTS FORTS TECHNIQUES */
function parseFeatures(lines: PdfLine[]): ParsedFiche['features'] {
  const out: NonNullable<ParsedFiche['features']> = {};
  const hook = parseHook(lines);
  if (hook) out.hook = hook;

  // Visuel produit : titre + description sous le libellé « VISUEL PRODUIT ».
  const visualIndex = lines.findIndex((l) => normLabel(l.text).startsWith('VISUEL PRODUIT'));
  if (visualIndex !== -1) {
    for (let i = visualIndex + 1; i < lines.length; i++) {
      const cols = lineColumns(lines[i].items);
      if (cols.length !== 1) continue;
      const descs = lines[i + 1] ? lineColumns(lines[i + 1].items) : [];
      const slot = mediaSlot(cols[0], descs[0]);
      if (slot) out.visual = slot;
      break;
    }
  }

  // Features : numéro + titre + description.
  const items: ProductSubItemDraft[] = [];
  for (const line of lines) {
    const numItem = line.items.find((i) => isNarrowNumber(i) && i.x < HOOK_MIN_X);
    if (!numItem) continue;
    const rest = stripNumbers(line.items);
    if (rest.length === 0) continue;
    const { title, description } = splitTitleDescription(rest);
    if (!isFilledSlot(title)) continue;
    items.push({
      num: cleanValue(numItem.str),
      title,
      ...(description && isFilledSlot(description) ? { description } : {}),
    });
  }
  if (items.length) out.items = items;

  return Object.keys(out).length ? out : undefined;
}

// ---------------------------------------------------------------------------
// 04 · MATRICE COMPARATIVE
// ---------------------------------------------------------------------------

/** Groupes du gabarit → clé canonique. */
const SPEC_GROUP_IDS: { match: string; id: string }[] = [
  { match: 'GENERAL', id: 'general' },
  { match: 'PHYSIQUE', id: 'physical' },
  { match: 'OPTIQUE', id: 'optical' },
  { match: 'ELECTRIQUE', id: 'electrical' },
  { match: 'ENVIRONNEMENT', id: 'environmental' },
];

/**
 * Libellés de lignes du gabarit → clés canoniques.
 *
 * Correspondance EXACTE du libellé normalisé, jamais par préfixe : une
 * correspondance partielle mapperait silencieusement un label métier inconnu
 * sur une spec existante. Les libellés du gabarit officiel (`Density (px/m²)`)
 * et leurs équivalents français exacts sont listés côte à côte ; tout autre
 * libellé est conservé tel quel via une clé dynamique + avertissement (§5).
 */
const SPEC_LABEL_KEYS: Record<string, string> = {
  // Gabarit officiel
  'USAGE IN OUT': 'env',
  'LED ARRANGEMENT': 'arrangement',
  'PIXEL PITCH': 'pitch',
  'DENSITY PX M': 'density',
  'DENSITY PX M 2': 'density', // Density (px/m²) : le ² superscript survit à la normalisation
  'MODULE RES': 'moduleRes',
  'CABINET RES': 'cabRes',
  'MODULE DIM': 'moduleDim',
  'CABINET DIM': 'cabDim',
  'POIDS CABINET': 'weight',
  BRIGHTNESS: 'brightness',
  'REFRESH RATE': 'refresh',
  'SCAN RATE': 'scan',
  'VIEWING ANGLE': 'angle',
  'MAX POWER': 'maxPower',
  'AVG POWER': 'avgPower',
  'POWER SOURCE': 'powerSource',
  'SIGNAL INPUT': 'signal',
  'IP RATING': 'ip',
  TEMPERATURE: 'temp',
  TRANSPARENCY: 'transparency',
  CERTIFICATIONS: 'certs',
  // Équivalents français exacts (accents et casse insensibles)
  DENSITE: 'density',
  'RESOLUTION MODULE': 'moduleRes',
  'RESOLUTION CABINET': 'cabRes',
  'TAILLE MODULE': 'moduleDim',
  'TAILLE CABINET': 'cabDim',
  'ANGLE DE VISION': 'angle',
  'CONSOMMATION MAX': 'maxPower',
  'CONSOMMATION MOY': 'avgPower',
  'CONSOMMATION MOYENNE': 'avgPower',
  ALIMENTATION: 'powerSource',
  'ENTREE SIGNAL': 'signal',
  'INDICE IP': 'ip',
  TRANSPARENCE: 'transparency',
  LUMINOSITE: 'brightness',
  'FREQUENCE DE RAFRAICHISSEMENT': 'refresh',
  'FREQUENCE DE BALAYAGE': 'scan',
};

/**
 * Les en-têtes de groupe sont parfois préfixés par le module dans les
 * saisies dérivées (`LED / PHYSIQUE`), et le gabarit officiel les écrit
 * `PHYSIQUE`. On compare donc sur le dernier segment du texte BRUT, mais on
 * conserve le libellé original pour l'affichage.
 */
function groupTail(label: string): string {
  const parts = label.split('/');
  return normLabel(parts[parts.length - 1]);
}

function isGroupHeaderLine(line: PdfLine): boolean {
  if (line.items.length !== 1) return false;
  const item = line.items[0];
  if (item.x < MARGIN_X - 2 || item.x > GROUP_ZONE_MAX_X) return false;
  if (item.size < 8.8) return false; // les libellés de lignes sont en corps 6.8
  return isUpperLabel(line.text);
}

/**
 * Matrice comparative — la partie critique du parser.
 *
 * Colonnes = en-têtes de variante réellement présents. Nombre STRICT : une
 * colonne sans nom n'est pas une variante, aucune variante n'est complétée.
 * Chaque valeur est affectée à la variante dont le CENTRE de colonne est le
 * plus proche, dans la limite d'un demi-pas : une cellule vide ne peut donc
 * pas décaler les valeurs suivantes, et une valeur ne peut pas atterrir sous
 * la mauvaise variante.
 */
/** Une ligne dont tous les items sont dans la zone des colonnes de la matrice. */
function isHeaderZoneLine(line: PdfLine): boolean {
  return line.items.length > 0 && line.items.every((i) => i.x >= SPEC_COL_MIN_X);
}

/** Libellé statique « SPEC » posé à gauche de la zone colonnes. */
function isSpecLabelLine(line: PdfLine): boolean {
  return line.items.length === 1 && normLabel(line.text) === 'SPEC';
}

/** Items d'une ligne appartenant réellement à la zone colonnes. */
function headerZoneItems(line: PdfLine): PdfTextItem[] {
  return line.items.filter((i) => i.x >= SPEC_COL_MIN_X);
}

/**
 * Une ligne appartient à l'en-tête si chacun de ses items est soit dans la zone
 * colonnes, soit le libellé statique « SPEC » posé à gauche.
 *
 * Dans le gabarit officiel, « SPEC » (x=70.3) partage la ligne basse des noms de
 * variante (y=729) avec les seconds fragments `[ Modele` / `1 ]`. Filtrer cette
 * ligne sur le seul critère « tous les items en zone colonnes » la faisait
 * rejeter : une référence qui déborde, comme « PXT-P1.25 » coupée en
 * « [ PXT-P1 » / « .25 ] », perdait son « .25 » et devenait « PXT-P1 ».
 */
function isHeaderLine(line: PdfLine): boolean {
  if (headerZoneItems(line).length === 0) return false;
  return line.items.every((i) => i.x >= SPEC_COL_MIN_X || normLabel(i.str) === 'SPEC');
}

/**
 * Analyse un bloc de la matrice 04.
 *
 * `inheritedVariants` porte les colonnes déjà découvertes par le tableau
 * précédent : une continuation qui ne répète pas l'en-tête de variante (rupture
 * de page, nouveau bandeau de section) reste alors lisible au lieu d'être
 * ignorée. Sans en-tête, ce sont les centres des cellules des lignes de données
 * qui placent chaque valeur sous la bonne colonne.
 */
function parseSingleSpecTable(
  lines: PdfLine[],
  inheritedVariants?: { cx: number; name: string }[]
): {
  groups: NonNullable<ParsedFiche['specs']>['groups'];
  models: { name: string; specs: Record<string, string> }[];
  warnings: string[];
  variants: { cx: number; name: string }[];
} {
  const warnings: string[] = [];
  const groups: NonNullable<ParsedFiche['specs']>['groups'] = [];
  const models: { name: string; specs: Record<string, string> }[] = [];

  // 1. Région d'en-tête : le préambule du gabarit (numéro de section `04 |` à
  //    x=48.5 + ligne d'aide) précède toujours la zone de tête : on l'atteint
  //    avant de chercher les colonnes, sinon le premier `x < 120` ferait
  //    conclure à tort à une matrice sans en-tête.
  //    On collecte ensuite les lignes consécutives dont TOUS les items sont
  //    dans la zone colonnes. Le libellé statique `SPEC` (x=70.3) est ignoré,
  //    mais le décrochement d'en-tête (`[ Modele` puis `1 ]`) est conservé —
  //    y compris quand `SPEC` partage la ligne basse des fragments.
  let start = 0;
  while (start < lines.length && !isHeaderZoneLine(lines[start]) && !isSpecLabelLine(lines[start])) {
    start++;
  }
  const headerItems: PdfTextItem[] = [];
  let cursor = start;
  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor];
    if (isHeaderZoneLine(line)) {
      headerItems.push(...line.items);
      continue;
    }
    if (isSpecLabelLine(line)) continue;
    if (isHeaderLine(line)) {
      headerItems.push(...headerZoneItems(line));
      continue;
    }
    break;
  }
  // 2. Colonnes : regroupement des items d'en-tête par centre.
  const variants: { cx: number; name: string }[] = [];
  if (headerItems.length > 0) {
    const headerCells = clusterByCenter(headerItems);
    let skippedColumns = 0;
    for (const cell of headerCells) {
      const name = stripSlotChrome(cell.text);
      if (isFilledSlot(name)) variants.push({ cx: cell.cx, name });
      else skippedColumns++;
    }
    if (skippedColumns > 0) {
      warnings.push(
        `${skippedColumns} colonne(s) d'en-tête sans nom de modèle ignorée(s) : un nom de variante est obligatoire.`
      );
    }
  }

  // Bloc de suite SANS en-tête de variante (rupture de page, bandeau de section
  // répété) : on réemploie les colonnes déjà découvertes par le tableau précédent.
  // Sans ce repli, toutes les lignes de ce bloc étaient ignorées et les valeurs
  // de la page suivante disparaissaient de la fiche.
  if (variants.length === 0) {
    if (inheritedVariants?.length) {
      // Repli sur les colonnes du tableau précédent. `splitSpecTables` isole
      // aussi des blocs réduits au bandeau de section (« 04 | Tableau 2 »), que
      // `isGroupHeaderLine` reconnaît à tort comme un en-tête de groupe : on
      // exige donc au moins deux lignes de caractéristiques, soit une vraie
      // continuation de tableau.
      const rowIndexes = lines.flatMap((l, i) => {
        const label = cleanValue(joinItems(l.items.filter((it) => it.x < LABEL_ZONE_MAX_X)));
        return isFilledSlot(label) ? [i] : [];
      });
      if (rowIndexes.length < 2) return { groups, models, warnings, variants: [] };
      const firstGroup = lines.findIndex((l) => isGroupHeaderLine(l));
      variants.push(...inheritedVariants.map((v) => ({ ...v })));
      cursor = firstGroup === -1 ? rowIndexes[0] : firstGroup;
      warnings.push(
        'Tableau de suite sans en-tête de variante : colonnes reprises du tableau précédent.'
      );
    } else if (headerItems.length === 0) {
      warnings.push('Aucun en-tête de colonne détecté dans la matrice des caractéristiques.');
      return { groups, models, warnings, variants: [] };
    } else {
      warnings.push(
        "Aucun nom de variante exploitable : la matrice ne contient que des placeholders du gabarit."
      );
      return { groups, models, warnings, variants: [] };
    }
  }
  for (const v of variants) models.push({ name: v.name, specs: {} });
  const centers = variants.map((v) => v.cx);
  const halfPitch = halfPitchOf(centers);

  // 3. Lignes : en-tête de groupe, ou ligne de caractéristique.
  let currentGroup: (typeof groups)[number] | null = null;
  const usedKeys = new Map<string, number>();

  for (const line of lines.slice(cursor)) {
    if (isGroupHeaderLine(line)) {
      const label = cleanValue(line.text);
      const known = SPEC_GROUP_IDS.find((g) => g.match === groupTail(label));
      if (!known) {
        warnings.push(`Groupe de specs non standard conservé tel quel : « ${label} ».`);
      }
      const id = known?.id ?? `group-${groups.length + 1}`;
      currentGroup = groups.find((g) => g.id === id) ?? { id, label, rows: [] };
      if (!groups.includes(currentGroup)) groups.push(currentGroup);
      continue;
    }

    const label = cleanValue(joinItems(line.items.filter((i) => i.x < LABEL_ZONE_MAX_X)));
    if (!isFilledSlot(label) || isStaticText(label)) continue;
    if (!currentGroup) {
      currentGroup = { id: 'general', label: 'GENERAL', rows: [] };
      warnings.push(`Ligne de caractéristique hors groupe : « ${label} » rattachée à un groupe implicite.`);
      groups.push(currentGroup);
    }

    // Clé canonique si le libellé est connu, clé dynamique sinon (donnée
    // conservée + avertissement) : jamais de libellé écrasé par un autre.
    const normalized = normLabel(label);
    const known = SPEC_LABEL_KEYS[normalized];
    if (!known) {
      warnings.push(`Libellé technique non standard conservé tel quel : « ${label} ».`);
    }
    let key = known ?? normalized.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (usedKeys.has(key)) {
      // Deux lignes homonymes : la seconde est conservée sous une clé distincte
      // pour ne perdre aucune donnée.
      const count = (usedKeys.get(key) ?? 1) + 1;
      usedKeys.set(key, count);
      key = `${key}${count}`;
      warnings.push(`Libellé en double dans la matrice, conservé sous la clé « ${key} » : « ${label} ».`);
    } else {
      usedKeys.set(key, 1);
    }

    // Valeurs : cellules regroupées par centre, puis affectées par proximité.
    const valueCells = clusterByCenter(line.items.filter((i) => i.cx >= LABEL_ZONE_MAX_X));
    const filled: { target: number; value: string }[] = [];
    for (const cell of valueCells) {
      const value = stripSlotChrome(cleanValue(cell.text));
      if (!isFilledSlot(value)) continue; // cellule vide ⇒ rien (aucune invention)
      const target = nearestColumn(centers, cell.cx, halfPitch);
      if (target === -1) {
        warnings.push(`Valeur « ${value} » ignorée : hors colonne de variante (ligne « ${label} »).`);
        continue;
      }
      filled.push({ target, value });
    }

    // Une ligne du gabarit laissée vide ne produit AUCUNE ligne de specs.
    // Sans cette règle, un PDF vierge publiait un tableau de 20 libellés
    // (« Pixel pitch », « Poids cabinet »…) sans la moindre valeur : de
    // l'apparence de donnée, sans aucune donnée.
    if (filled.length === 0) continue;
    currentGroup.rows.push({ key, label: stripSlotChrome(label) });
    for (const { target, value } of filled) models[target].specs[key] = value;
  }

  const pruned = groups.filter((g) => g.rows.length > 0);
  if (variants.length === 1) {
    warnings.push('Matrice à une seule variante : une seule colonne générée.');
  }

  // Une variante peut légitimement n'avoir filled aucune valeur (cellule laissée
  // vide sur une ligne du gabarit) : on ne la retire pas, sinon les colonnes se
  // décalent d'un cran et chaque valeur atterrit sur la mauvaise variante. On
  // abandonne la matrice entière seulement si AUCUNE colonne n'a de valeur —
  // c'est le cas d'un gabarit vierge.
  if (models.every((m) => Object.keys(m.specs).length === 0)) {
    warnings.push('Matrice des caractéristiques sans aucune valeur renseignée.');
    return { groups: [], models: [], warnings, variants: [] };
  }
  return { groups: pruned, models, warnings, variants };
}

/** Détecte un marqueur textuel marquant un nouveau tableau ou une suite. */
function isTableMarkerLine(line: PdfLine): boolean {
  const norm = normLabel(line.text);
  if (/(?:^|\b)(TABLEAU|TABLE)\s*\d+/i.test(norm)) return true;
  if (norm.includes('CARACTERISTIQUES TECHNIQUES') || norm.includes('SPECIFICATIONS')) return true;
  if (/^04(\b|$)/.test(norm)) return true;
  return false;
}

/**
 * Découpe les lignes de la section 04 en sous-tableaux indépendants.
 * Un nouveau tableau commence dès qu'un nouvel en-tête de colonnes
 * ou un marqueur de tableau apparaît APRÈS qu'on est entré dans la zone
 * de données d'un tableau précédent.
 */
function splitSpecTables(lines: PdfLine[]): PdfLine[][] {
  if (lines.length === 0) return [];
  const tables: PdfLine[][] = [];
  let currentTable: PdfLine[] = [];
  let inDataZone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeader = isHeaderZoneLine(line) || isSpecLabelLine(line) || isHeaderLine(line);
    const isMarker = isTableMarkerLine(line);

    if (inDataZone && (isHeader || isMarker)) {
      if (currentTable.length > 0) {
        tables.push(currentTable);
        currentTable = [];
        inDataZone = false;
      }
    }

    currentTable.push(line);

    if (!inDataZone) {
      const hasLabelOrGroup =
        isGroupHeaderLine(line) ||
        (line.items.some((item) => item.x < LABEL_ZONE_MAX_X) && !isSpecLabelLine(line));
      if (hasLabelOrGroup && !isHeader) {
        inDataZone = true;
      }
    }
  }

  if (currentTable.length > 0) {
    tables.push(currentTable);
  }

  return tables;
}

/**
 * Analyse la section 04 des spécifications en traitant un ou plusieurs tableaux
 * (variants 1..4, variants 5..8, etc.) sans limite arbitraire de colonnes,
 * et en fusionnant intelligemment les en-têtes répétés (GENERAL, PHYSIQUE...).
 */
function parseSpecMatrix(lines: PdfLine[]): {
  groups: NonNullable<ParsedFiche['specs']>['groups'];
  models: { name: string; specs: Record<string, string> }[];
  warnings: string[];
} {
  const tableBlocks = splitSpecTables(lines);
  if (tableBlocks.length === 0) {
    return {
      groups: [],
      models: [],
      warnings: ['Aucun en-tête de colonne détecté dans la matrice des caractéristiques.'],
    };
  }

  const allWarnings: string[] = [];
  const combinedGroups: NonNullable<ParsedFiche['specs']>['groups'] = [];
  const combinedModels: { name: string; specs: Record<string, string> }[] = [];
  // Colonnes du dernier tableau exploitable : servies aux blocs de suite qui ne
  // répètent pas l'en-tête de variante.
  let lastVariants: { cx: number; name: string }[] | undefined;

  for (const block of tableBlocks) {
    const tableRes = parseSingleSpecTable(block, lastVariants);
    allWarnings.push(...tableRes.warnings);
    if (tableRes.variants.length > 0) lastVariants = tableRes.variants;

    if (tableRes.models.length === 0) continue;

    // Fusionner les modèles (variantes)
    for (const model of tableRes.models) {
      const existing = combinedModels.find((m) => m.name.toLowerCase() === model.name.toLowerCase());
      if (existing) {
        // Même variante qui continue sur un tableau suivant (ex: suite des
        // caractéristiques). Une cellule déjà renseignée n'est JAMAIS écrasée :
        // Object.assign faisait disparaître silencieusement une valeur réelle si
        // le tableau suivant réimprimait la ligne avec une cellule vide ou
        // redondante.
        for (const [key, value] of Object.entries(model.specs)) {
          if (existing.specs[key] === undefined || existing.specs[key] === '') {
            existing.specs[key] = value;
          } else if (existing.specs[key] !== value) {
            allWarnings.push(
              `Valeur en conflit pour « ${model.name} » : « ${key} » conserve « ${existing.specs[key]} » et ignore « ${value} ».`
            );
          }
        }
      } else {
        // Nouvelle variante (ex: Tableau 2 avec variantes 5 à 8)
        combinedModels.push({
          name: model.name,
          specs: { ...model.specs },
        });
      }
    }

    // Fusionner les groupes et leurs lignes (ex: GENERAL, PHYSIQUE répétés dans chaque tableau)
    for (const group of tableRes.groups) {
      const existingGroup = combinedGroups.find(
        (g) => g.id === group.id || normLabel(g.label) === normLabel(group.label)
      );
      if (existingGroup) {
        // Le groupe existe déjà : fusionner les lignes sans doublon
        for (const row of group.rows) {
          const rowExists = existingGroup.rows.some(
            (r) => r.key === row.key || normLabel(r.label) === normLabel(row.label)
          );
          if (!rowExists) {
            existingGroup.rows.push({ ...row });
          }
        }
      } else {
        // Nouveau groupe
        combinedGroups.push({
          id: group.id,
          label: group.label,
          rows: group.rows.map((r) => ({ ...r })),
        });
      }
    }
  }

  // Filtrer les groupes qui n'ont aucune ligne
  const pruned = combinedGroups.filter((g) => g.rows.length > 0);

  // Si aucun modèle n'a de valeur renseignée
  if (combinedModels.length === 0 || combinedModels.every((m) => Object.keys(m.specs).length === 0)) {
    allWarnings.push('Matrice des caractéristiques sans aucune valeur renseignée.');
    return { groups: [], models: [], warnings: allWarnings };
  }

  return { groups: pruned, models: combinedModels, warnings: allWarnings };
}

/** 05 · RÉFÉRENCES TERRAIN */
function parseFieldwork(lines: PdfLine[]): ParsedFiche['fieldwork'] {
  const out: NonNullable<ParsedFiche['fieldwork']> = {};
  const hook = parseHook(lines);
  if (hook) out.hook = hook;

  // Projets : ligne des noms (2+ colonnes, corps 9.2) puis ligne « Pays · Année ».
  // La zone d'emplacement du média (ligne de fichiers) précède la ligne de
  // noms dans le gabarit : on l'ignore explicitement, sinon le nom de projet
  // deviendrait « PROJET-1.JPG » et le pays prendrait le nom du chantier.
  for (let i = 0; i < lines.length; i++) {
    const names = lineColumns(lines[i].items);
    if (names.length < 2) continue;
    if (!names.every((c) => c.x > MARGIN_X + 10 && c.size >= 8.8)) continue;
    if (names.some((c) => looksLikeFilename(c.str))) continue;
    const places = lines[i + 1] ? lineColumns(lines[i + 1].items) : [];
    if (places.length !== names.length) continue;
    const projects: { name: string; country?: string; year?: string }[] = [];
    names.forEach((nameItem, idx) => {
      const name = cleanValue(nameItem.str);
      if (!isFilledSlot(name)) return;
      const place = cleanValue(places[idx]?.str ?? '');
      const parts = place.split(/\s*[\u00B7\u2022|]\s*/).filter((p) => isFilledSlot(p));
      projects.push({
        name,
        ...(parts[0] ? { country: parts[0] } : {}),
        ...(parts[1] ? { year: parts[1] } : {}),
      });
    });
    if (projects.length) {
      out.projects = projects;
      break;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Bloc final : accroche CTA, libellé de bouton et navigation de série.
 *
 * Détection GÉOMÉTRIQUE et non textuelle : une fois le PDF rempli, les
 * placeholders `[ Accroche finale / CTA ]` ont disparu — les rechercher par
 * leur texte rendrait l'extraction muette sur tout PDF réellement saisi. On
 * s'appuie donc sur la mise en page : accroche = item unique de la zone basse
 * en corps 13 ; bouton = item précédant une flèche en zone droite.
 */
function parseCta(lines: PdfLine[]): Pick<ParsedFiche, 'cta' | 'seriesNavigation'> {
  const out: Pick<ParsedFiche, 'cta' | 'seriesNavigation'> = {};
  for (const line of lines) {
    // Accroche CTA : texte de grand corps seul en zone gauche. On tolère la
    // fusion avec le bouton (baseline à 3.5 pt d'écart dans le gabarit), donc
    // on cherche l'item et non « la ligne à un item ». L'accroche de section
    // (`05 | …`, corps 22 + 14) est écartée par la présence de son partner
    // en zone d'accroche.
    const isSectionHook = line.items.some((i) => i.x >= 70 && i.x <= 112 && i.size >= 14);
    if (!isSectionHook) {
      const titleItem = line.items.find((i) => i.size >= 12 && i.x <= 60);
      const title = titleItem ? cleanValue(titleItem.str) : '';
      if (titleItem && isFilledSlot(title) && !isStaticText(title)) {
        out.cta = { ...(out.cta ?? {}), title };
      }
    }
    const arrow = line.items.findIndex((i) => /^[\u2192\u00BB]$/.test(cleanValue(i.str)));
    if (arrow > 0) {
      const label = cleanValue(line.items[arrow - 1].str);
      if (isFilledSlot(label)) out.cta = { ...(out.cta ?? {}), buttonLabel: label };
    }
    // Le libellé statique « Navigation série » subsite : seul son contenu compte.
    const text = cleanValue(line.text);
    if (/Navigation s[ée]rie/i.test(text)) {
      const nav = parseSeriesNavigation(text);
      if (Object.keys(nav).length) out.seriesNavigation = nav;
    }
  }
  return out;
}

/**
 * `Navigation serie : Precedent = PXT Pro | /web/… | Suivant = INK | /web/…`
 *
 * Le découpage se fait sur `|` en conservant l'ordre : un segment
 * `Libellé = nom` ouvre une cible, le segment suivant en est l'URL. Isoler
 * d'abord chaque paire nom/URL perdrait les URL, séparées du nom par `|`.
 */
function parseSeriesNavigation(text: string): NonNullable<ParsedFiche['seriesNavigation']> {
  const result: NonNullable<ParsedFiche['seriesNavigation']> = {};
  let open: 'previous' | 'next' | null = null;
  // Le chrome du gabarit (`[ nom | url ]`) est retiré AVANT le découpage : sans
  // cela, le placeholder lui-même devenait une navigation (« Precedent = [ nom
  // | url ] ») alors que rien n'est renseigné.
  const cleaned = text.replace(/\[[^\]]*\]/g, ' ');
  for (const part of cleaned.split(/\s*\|\s*/)) {
    const match = part.match(/(Pr[ée]c[ée]dent|Suivant)\s*=\s*(.*)$/i);
    if (match) {
      const target = /^Pr[ée]c[ée]dent/i.test(match[1]) ? 'previous' : 'next';
      const name = cleanValue(match[2]);
      if (isFilledSlot(name)) {
        result[target] = { ...(result[target] ?? {}), name };
        open = target;
      } else {
        open = null;
      }
      continue;
    }
    if (open) {
      const url = cleanValue(part);
      if (isFilledSlot(url)) result[open] = { ...(result[open] ?? {}), url };
      open = null;
    }
  }
  return result;
}

// ===========================================================================
// 8. ASSEMBLAGE
// ===========================================================================

/** Point d'entrée « layout » : pages nettoyées → fiche parsée. */
export function parseProductFichePages(pages: ParsedPage[]): ParsedFiche {
  const cleaned = cleanPages(pages);
  const segments = segmentBySections(cleaned);
  const warnings: string[] = [];
  const fiche: ParsedFiche = { warnings };

  const masthead = parseMasthead(segments.get('masthead') ?? []);
  if (masthead.company !== undefined) fiche.company = masthead.company;
  if (masthead.series !== undefined) fiche.series = masthead.series;
  if (masthead.productName !== undefined) fiche.productName = masthead.productName;
  if (masthead.subtitle !== undefined) fiche.subtitle = masthead.subtitle;
  if (masthead.markets !== undefined) fiche.markets = masthead.markets;
  if (masthead.badges !== undefined) fiche.badges = masthead.badges;

  const overview = parseOverview(segments.get('overview') ?? []);
  if (overview) fiche.overview = overview;

  const design = parseDesign(segments.get('design') ?? []);
  if (design) fiche.design = design;

  const features = parseFeatures(segments.get('features') ?? []);
  if (features) fiche.features = features;

  const specLines = segments.get('specs') ?? [];
  if (specLines.length) {
    const { groups, models, warnings: specWarnings } = parseSpecMatrix(specLines);
    warnings.push(...specWarnings);
    if (groups.length || models.length) fiche.specs = { groups, models };
  }

  const fieldwork = parseFieldwork(segments.get('fieldwork') ?? []);
  if (fieldwork) fiche.fieldwork = fieldwork;

  // Le CTA vit après la dernière section produit : recherche sur le document
  // linéaire nettoyé (la page de documentation a déjà été retirée).
  const cta = parseCta(cleaned.flatMap((p) => p.lines));
  if (cta.cta) fiche.cta = cta.cta;
  if (cta.seriesNavigation) fiche.seriesNavigation = cta.seriesNavigation;

  // Avertissements de complétude.
  if (!fiche.productName) warnings.push("Nom de produit introuvable dans le PDF.");
  if (!fiche.specs?.models.length) {
    warnings.push('Aucune variante détectée dans la matrice des caractéristiques.');
  } else {
    const pending = fiche.specs.models.reduce(
      (acc, m) => acc + Object.values(m.specs).filter((v) => /^pending$/i.test(v)).length,
      0
    );
    if (pending > 0) warnings.push(`${pending} valeur(s) PENDING conservée(s) telles quelles.`);
  }
  return fiche;
}

// ===========================================================================
// 9. EXTRACTION PDF
// ===========================================================================

/**
 * Normalise l'entrée en ArrayBuffer.
 * La copie pour `Uint8Array` est obligatoire : pdfjs-dist TRANSFÈRE le buffer
 * au worker, ce qui le détache — sans copie, les données de l'appelant sont
 * invalidées après `getDocument`.
 */
async function toArrayBuffer(data: File | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data;
  if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return copy.buffer;
  }
  return data.arrayBuffer(); // File, côté navigateur
}

/** Extrait la mise en page (items + positions) d'un PDF produit. */
export async function extractProductPdfLayout(
  data: File | ArrayBuffer | Uint8Array
): Promise<ParsedPage[]> {
  const pdfjsLib = (await import('pdfjs-dist')) as typeof import('pdfjs-dist');
  // En navigateur, le worker est un asset public ; sous Node (tests/scripts),
  // pdfjs-dist utilise son worker interne.
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  const buffer = await toArrayBuffer(data);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: ParsedPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = [];
    for (const it of content.items) {
      if (!('str' in it)) continue;
      const tr = it.transform;
      const w = it.width ?? 0;
      items.push({
        str: it.str,
        x: tr[4],
        y: tr[5],
        w,
        size: tr[0],
        font: it.fontName,
        cx: tr[4] + w / 2,
      });
    }
    pages.push({ lines: groupItemsIntoLines(items) });
  }
  return pages;
}

// ===========================================================================
// 10. MAPPING  →  Product
//
//   PDF                                        Product                  Composant
//   Masthead · nom produit                     name / slug              HeroSection
//   Masthead · série                           hero.breadcrumbCategory  HeroSection
//   Masthead · sous-titre                      hero.subtitle            HeroSection
//   Masthead · marchés (4)                     hero.tags                HeroSection
//   Masthead · 4 badges                        hero.specs               HeroSection
//   01 · accroche / description                overview.title/desc      OverviewSection
//   01 · média vidéo / photo                   overview.video/photo     OverviewSection
//   01 · 3 statistiques                       overview.stats           OverviewSection
//   01 · 2 technologies                       overview.technologies    OverviewSection
//   02 · accroche                              design.title             DesignSection
//   02 · module/cabinet/profondeur             design.specsList         DesignSection
//   02 · visuels techniques                    design.visuals           DesignSection
//   02 · configurations                        design.configs           DesignSection
//   03 · accroche / visuel / 7 features        features                 FeaturesSection
//   04 · en-tête de colonne                    specs.models[].name      SpecsSection
//   04 · groupe + libellé de ligne             specs.groups[].rows      SpecsSection
//   04 · valeur de cellule                     specs.models[].specs[k]  SpecsSection
//   05 · accroche / projets                    fieldwork                FieldworkSection
//   CTA · accroche / bouton                    next.headline/cta        NextSection
//   CTA · navigation série                     next.prev/next.next      NextSection
// ===========================================================================

/**
 * Convertit la fiche parsée en brouillon `Product`.
 * Rien n'est complété, réordonné ou emprunté : un champ absent reste absent.
 * `environment` et `sellingModes` ne sont jamais déduits : ils relèvent de la
 * taxonomie choisie par l'administrateur dans le CMS. Le `slug` n'est pas
 * produit ici : il appartient à l'admin, qui le dérive du nom et gère les
 * collisions.
 */
export function mapParsedToProduct(parsed: ParsedFiche, fallbackName?: string): Partial<Product> {
  const product: Partial<Product> = { status: 'draft' };
  if (parsed.warnings.length) product.importWarnings = [...parsed.warnings];

  // Masthead
  const name = cleanValue(parsed.productName ?? fallbackName ?? '');
  if (name) product.name = name;
  if (parsed.series) product.series = parsed.series;
  if (parsed.company) product.company = parsed.company;

  // hero
  if (name || parsed.subtitle || parsed.markets?.length || parsed.badges?.length || parsed.series) {
    product.hero = {
      title: name,
      ...(parsed.subtitle ? { subtitle: parsed.subtitle } : {}),
      ...(parsed.markets?.length ? { tags: parsed.markets } : {}),
      ...(parsed.badges?.length ? { specs: parsed.badges } : {}),
      ...(parsed.series
        ? { breadcrumbCategoryFr: parsed.series, breadcrumbCategoryEn: parsed.series }
        : {}),
    };
  }

  // 01 · overview
  const o = parsed.overview;
  if (o && (o.hook || o.description || o.stats?.length || o.technologies?.length || o.video || o.photo)) {
    product.overview = {
      ...(o.hook ? { title: o.hook } : {}),
      ...(o.description ? { description: o.description } : {}),
      ...(o.stats?.length ? { stats: o.stats } : {}),
      ...(o.technologies?.length ? { technologies: o.technologies } : {}),
      ...(o.video ? { video: o.video } : {}),
      ...(o.photo ? { photo: o.photo } : {}),
    };
  }

  // 02 · design
  const d = parsed.design;
  if (d && (d.hook || d.dimensions?.length || d.visuals?.length || d.configs?.length)) {
    const design: NonNullable<Product['design']> = {
      ...(d.hook ? { title: d.hook } : {}),
      ...(d.dimensions?.length ? { specsList: d.dimensions } : {}),
      ...(d.visuals?.length ? { visuals: d.visuals } : {}),
      ...(d.configs?.length ? { configs: d.configs } : {}),
    };
    // Rôles explicites du gabarit (MODULE / CABINET / PROFONDEUR).
    for (const dim of d.dimensions ?? []) {
      const n = normLabel(dim.label);
      if (n === 'MODULE') design.moduleDim = dim.value;
      else if (n === 'CABINET') design.cabinetDim = dim.value;
      else if (n === 'PROFONDEUR' || n === 'DEPTH') design.depth = dim.value;
    }
    product.design = design;
  }

  // 03 · features
  const f = parsed.features;
  if (f && (f.hook || f.visual || f.items?.length)) {
    product.features = {
      items: f.items ?? [],
      ...(f.hook ? { title: f.hook } : {}),
      ...(f.visual ? { visual: f.visual } : {}),
    };
  }

  // 04 · specs
  if (parsed.specs?.models.length) {
    product.specs = {
      groups: parsed.specs.groups.map((g) => ({
        id: g.id,
        label: g.label,
        rows: g.rows.map((r) => ({ key: r.key, label: r.label })),
      })),
      models: parsed.specs.models.map((m) => ({ name: m.name, specs: { ...m.specs } })),
    };
  }

  // 05 · fieldwork
  const fw = parsed.fieldwork;
  if (fw && (fw.hook || fw.projects?.length)) {
    product.fieldwork = {
      projects: (fw.projects ?? []).map((p) => ({
        title: p.name,
        ...(p.country ? { location: p.country } : {}),
        ...(p.year ? { year: p.year } : {}),
      })),
      ...(fw.hook ? { title: fw.hook } : {}),
    };
  }

  // CTA
  if (parsed.cta || parsed.seriesNavigation) {
    const next: NonNullable<Product['next']> = {};
    if (parsed.cta?.title) next.headline = parsed.cta.title;
    if (parsed.cta?.buttonLabel) next.cta = parsed.cta.buttonLabel;
    if (parsed.seriesNavigation?.previous) next.prev = parsed.seriesNavigation.previous;
    if (parsed.seriesNavigation?.next) next.next = parsed.seriesNavigation.next;
    if (Object.keys(next).length) product.next = next;
  }

  // Source unique pour la description longue et le SEO.
  if (o?.description) {
    product.description = { shortFr: o.description, detailedFr: o.description };
    product.seo = { ...(name ? { title: name } : {}), description: o.description };
  }

  return product;
}

/** Pipeline complet : PDF → layout → fiche parsée → brouillon `Product`. */
export async function parseProductPdf(
  data: File | ArrayBuffer | Uint8Array,
  fallbackName?: string
): Promise<Partial<Product> | null> {
  try {
    const pages = await extractProductPdfLayout(data);
    const parsed = parseProductFichePages(pages);
    const hasContent =
      !!parsed.productName ||
      !!parsed.overview?.description ||
      !!parsed.overview?.stats?.length ||
      !!parsed.design?.dimensions?.length ||
      !!parsed.features?.items?.length ||
      !!parsed.specs?.models.length ||
      !!parsed.fieldwork?.projects?.length;
    if (!hasContent) return null;
    return mapParsedToProduct(parsed, fallbackName);
  } catch (err) {
    console.warn('[product-pdf-parser] Échec de l’analyse du PDF :', err);
    return null;
  }
}
