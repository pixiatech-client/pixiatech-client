/**
 * Deterministic PDF product parser.
 * Extracts structured product data from PIXIATECH product sheets.
 * NO AI / LLM / API calls — pure regex and string parsing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedVariant {
  name: string;
  description: string;
  reference: string;
}

export interface ParsedProductData {
  productName: string;
  saleMode: 'vente' | 'location' | 'sur-commande' | null;
  badge: 'populaire' | 'nouveaute' | 'promotion' | null;
  environment: ('interieur' | 'exterieur' | 'semi-exterieur')[];
  technicalSpecifications: Record<string, string>;
  customButtons: { label: string; value: string }[];
  variants: ParsedVariant[];
  shortDescription: string;
  detailedDescription: string;
  keywords: string[];
}

// ---------------------------------------------------------------------------
// Known option mappings (must match admin form options exactly)
// ---------------------------------------------------------------------------

const SALE_MODE_MAP: Record<string, 'vente' | 'location' | 'sur-commande'> = {
  'vente': 'vente',
  'location': 'location',
  'sur commande': 'sur-commande',
  'sur-commande': 'sur-commande',
};

const BADGE_MAP: Record<string, 'populaire' | 'nouveaute' | 'promotion'> = {
  'nouveau': 'nouveaute',
  'nouveauté': 'nouveaute',
  'populaire': 'populaire',
  'promotion': 'promotion',
  'promo': 'promotion',
};

const ENVIRONMENT_MAP: Record<string, 'interieur' | 'exterieur' | 'semi-exterieur'> = {
  'intérieur': 'interieur',
  'interieur': 'interieur',
  'indoor': 'interieur',
  'extérieur': 'exterieur',
  'exterieur': 'exterieur',
  'outdoor': 'exterieur',
  'semi-extérieur': 'semi-exterieur',
  'semi-exterieur': 'semi-exterieur',
  'semi-outdoor': 'semi-exterieur',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeLine(line: string): string {
  return line.replace(/\u00A0/g, ' ').replace(/\r/g, '').trim();
}

function findSectionValue(lines: string[], sectionPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i++) {
    if (sectionPattern.test(lines[i])) {
      // Value is on the same line after the pattern, or on the next non-empty line
      const match = lines[i].match(sectionPattern);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
      // Check next lines
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const next = lines[j].trim();
        if (next && !/^[\d]+\.\s/.test(next)) {
          return next;
        }
      }
    }
  }
  return null;
}

function findSectionRange(
  lines: string[],
  startPattern: RegExp,
  endPattern?: RegExp,
): { start: number; end: number } | null {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (startPattern.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  let end = lines.length;
  if (endPattern) {
    for (let i = start + 1; i < lines.length; i++) {
      if (endPattern.test(lines[i])) {
        end = i;
        break;
      }
    }
  }
  return { start, end };
}

// ---------------------------------------------------------------------------
// PDF text extraction (client-side using pdfjs-dist)
// ---------------------------------------------------------------------------

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Configure worker — served locally from /public
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as any[];

    // Group items by Y coordinate (same line)
    // Use tolerance of 3px — some adjacent lines differ by only 1-2px in PDF coords
    const yTolerance = 3;
    const rawYGroups: { y: number; items: { str: string; x: number }[] }[] = [];
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      // Find existing group within tolerance
      const existing = rawYGroups.find(g => Math.abs(g.y - y) <= yTolerance);
      if (existing) {
        existing.items.push({ str: item.str, x });
      } else {
        rawYGroups.push({ y, items: [{ str: item.str, x }] });
      }
    }

    // Sort Y groups top-to-bottom (higher Y = higher on page in PDF coords)
    rawYGroups.sort((a, b) => b.y - a.y);

    for (const group of rawYGroups) {
      const itemsSorted = group.items;
      itemsSorted.sort((a, b) => a.x - b.x);

      // Filter out standalone whitespace and empty items
      const contentItems = itemsSorted.filter(g => g.str.trim().length > 0);

      if (contentItems.length === 0) continue;

      // Skip footer/header lines (PIXIATECH • FICHE PRODUIT / Page N)
      const lineText = contentItems.map(g => g.str).join(' ').trim();
      if (/PIXIATECH\s*[•·]\s*FICHE\s*PRODUIT/i.test(lineText)) continue;

      // Build line: detect X gaps between items to separate columns
      let line = contentItems[0].str;
      for (let j = 1; j < contentItems.length; j++) {
        const prev = contentItems[j - 1];
        const curr = contentItems[j];
        const gap = curr.x - prev.x;
        // If gap is > 30px, it's a column break
        if (gap > 30) {
          line += ' | ';
        } else {
          line += ' ';
        }
        line += curr.str;
      }

      allLines.push(line.trim());
    }

    // Page separator
    if (i < pdf.numPages) {
      allLines.push('');
    }
  }

  return allLines.join('\n');
}

// ---------------------------------------------------------------------------
// Section parsers (operate on raw text)
// ---------------------------------------------------------------------------

function parseProductName(lines: string[]): string | null {
  // Pattern: "1. Nom du Produit" followed by value on next line
  const val = findSectionValue(lines, /^\s*1\.\s*Nom\s+du\s+(?:Produit|produit)\s*:?\s*(.*)$/i);
  if (val) return val;

  // Fallback: line after "Nom du Produit" header
  for (let i = 0; i < lines.length; i++) {
    if (/nom\s+du\s+produit/i.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const next = lines[j].trim();
        if (next && !/^\d+\.\s/.test(next)) return next;
      }
    }
  }
  return null;
}

function parseSaleMode(lines: string[]): 'vente' | 'location' | 'sur-commande' | null {
  const val = findSectionValue(lines, /^\s*2\.\s*Mode\s+de\s+vente\s*:?\s*(.*)$/i);
  if (!val) return null;
  const normalized = val.toLowerCase().trim();
  return SALE_MODE_MAP[normalized] || null;
}

function parseBadge(lines: string[]): 'populaire' | 'nouveaute' | 'promotion' | null {
  const val = findSectionValue(lines, /^\s*3\.\s*Badge\s*:?\s*(.*)$/i);
  if (!val) return null;
  const normalized = val.toLowerCase().trim();
  return BADGE_MAP[normalized] || null;
}

function parseEnvironment(lines: string[]): ('interieur' | 'exterieur' | 'semi-exterieur')[] {
  const val = findSectionValue(lines, /^\s*4\.\s*Environnement\s*:?\s*(.*)$/i);
  if (!val) return [];
  const normalized = val.toLowerCase().trim();
  const env = ENVIRONMENT_MAP[normalized];
  return env ? [env] : [];
}

function parseTechnicalSpecifications(lines: string[]): Record<string, string> {
  const specs: Record<string, string> = {};

  // Find "Caractéristiques / Spécifications techniques" section
  const range = findSectionRange(
    lines,
    /(?:Caract[ée]ristiques|Sp[ée]cifications?\s+techniques)/i,
    /^\s*\d+\.\s|Boutons?\s+personnalis[ée]s|Variantes|Description|Mots-cl[ée]s/i,
  );

  if (!range) return specs;

  // Look for table rows
  for (let i = range.start; i < range.end; i++) {
    const line = lines[i].trim();
    // Skip headers
    if (/^CARACT[ÉE]RISTIQUE/i.test(line)) continue;
    // Skip empty lines
    if (!line) continue;

    // Try pipe-separated first: "Key | Value"
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        specs[parts[0]] = parts[1];
        continue;
      }
    }
  }

  return specs;
}

function parseCustomButtons(lines: string[]): { label: string; value: string }[] {
  const buttons: { label: string; value: string }[] = [];

  const range = findSectionRange(
    lines,
    /Boutons?\s+personnalis[ée]s/i,
    /^\s*\d+\.\s|Variantes|Description|Mots-cl[ée]s/i,
  );

  if (!range) return buttons;

  for (let i = range.start; i < range.end; i++) {
    const line = lines[i].trim();
    // Try pipe-separated first: "Bouton 1 | En savoir plus"
    const pipeMatch = line.match(/Bouton\s+\d+\s*\|\s*(.+)/i);
    if (pipeMatch) {
      buttons.push({ label: pipeMatch[1].trim(), value: '' });
      continue;
    }
    // Space-separated: "Bouton 1 En savoir plus"
    const spaceMatch = line.match(/Bouton\s+\d+\s+(.+)/i);
    if (spaceMatch) {
      buttons.push({ label: spaceMatch[1].trim(), value: '' });
    }
  }

  return buttons;
}

function parseVariants(lines: string[]): ParsedVariant[] {
  const variants: ParsedVariant[] = [];

  // Find "Variantes" section
  const range = findSectionRange(
    lines,
    /^\s*\d+\.\s*Variantes?\s*:?\s*$/i,
    /^\s*\d+\.\s|Description|Mots-cl[ée]s/i,
  );

  if (!range) return variants;

  // Skip header lines: "NOM DU BOUTON | VALEUR | RÉFÉRENCE" or "NOM DU BOUTON  VALEUR  RÉFÉRENCE" and "---"
  let dataStart = range.start + 1;
  for (let i = range.start + 1; i < range.end; i++) {
    const line = lines[i].trim();
    if (/^---+$/i.test(line) || /NOM\s+DU\s+BOUTON/i.test(line)) {
      dataStart = i + 1;
      break;
    }
    // Stop at next section
    if (/^\s*\d+\.\s/.test(line) || /Description|Mots-cl[ée]s/i.test(line)) {
      break;
    }
  }

  // Parse variant rows
  for (let i = dataStart; i < range.end; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^\s*\d+\.\s/.test(line) || /Description|Mots-cl[ée]s/i.test(line)) break;
    // Skip repeated header lines (e.g. page 2 repeats the column header)
    if (/NOM\s+DU\s+BOUTON/i.test(line) || /^---+$/i.test(line)) continue;

    // Try pipe-separated first
    const pipeParts = line.split('|').map(p => p.trim());
    if (pipeParts.length >= 3 && pipeParts[0] && pipeParts[1] && pipeParts[2]) {
      variants.push({
        name: pipeParts[0],
        description: pipeParts[1],
        reference: pipeParts[2],
      });
      continue;
    }

    // Try space-separated (detected via X gaps): "Name | Value | Ref"
    if (pipeParts.length === 1) {
      // The line itself contains " | " from the extraction's gap detection
      // Re-split to be safe
      continue;
    }

    // Handle incomplete variant lines (continuation from previous line)
    // If we have a reference that starts with PXT but no name, try to merge with previous
    if (variants.length > 0 && pipeParts.length >= 2) {
      const lastVariant = variants[variants.length - 1];
      if (!lastVariant.reference && pipeParts[pipeParts.length - 1].startsWith('PXT-')) {
        lastVariant.description = pipeParts[0];
        lastVariant.reference = pipeParts[pipeParts.length - 1];
        continue;
      }
    }
  }

  return variants;
}

function parseShortDescription(lines: string[]): string {
  const range = findSectionRange(
    lines,
    /Petite\s+description/i,
    /Description\s+d[ée]taill[ée]e|Mots-cl[ée]s/i,
  );

  if (!range) return '';

  const parts: string[] = [];
  for (let i = range.start + 1; i < range.end; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/Description\s+d[ée]taill[ée]e|Mots-cl[ée]s/i.test(line)) break;
    parts.push(line);
  }

  return parts.join(' ').trim();
}

function parseDetailedDescription(lines: string[]): string {
  const range = findSectionRange(
    lines,
    /Description\s+d[ée]taill[ée]e/i,
    /Mots-cl[ée]s/i,
  );

  if (!range) return '';

  const parts: string[] = [];
  for (let i = range.start + 1; i < range.end; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/Mots-cl[ée]s/i.test(line)) break;
    parts.push(line);
  }

  return parts.join(' ').trim();
}

function parseKeywords(lines: string[]): string[] {
  const range = findSectionRange(
    lines,
    /Mots-cl[ée]s/i,
    /^---+$|\Z/,
  );

  if (!range) return [];

  // Collect all text in the keywords section (may span multiple lines)
  const rawParts: string[] = [];
  for (let i = range.start; i < range.end; i++) {
    const line = lines[i].trim();
    if (!line || /^---+$/.test(line)) continue;
    rawParts.push(line);
  }

  if (rawParts.length === 0) return [];

  // Join all text, then split by "•" separator
  const fullText = rawParts.join(' ');
  const keywords = fullText
    .split('•')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  return keywords;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseProductText(text: string): ParsedProductData {
  const lines = text.split('\n').map(normalizeLine);

  return {
    productName: parseProductName(lines) || '',
    saleMode: parseSaleMode(lines),
    badge: parseBadge(lines),
    environment: parseEnvironment(lines),
    technicalSpecifications: parseTechnicalSpecifications(lines),
    customButtons: parseCustomButtons(lines),
    variants: parseVariants(lines),
    shortDescription: parseShortDescription(lines),
    detailedDescription: parseDetailedDescription(lines),
    keywords: parseKeywords(lines),
  };
}

/**
 * Full pipeline: File → text → parsed data.
 */
export async function parseProductPdf(file: File): Promise<ParsedProductData> {
  const text = await extractTextFromPdf(file);
  return parseProductText(text);
}

// ---------------------------------------------------------------------------
// Unit test helper — parses the reference text directly (no PDF needed)
// ---------------------------------------------------------------------------

export function parseProductTextFromReference(): ParsedProductData {
  const referenceText = `PIXIATECH • FICHE PRODUIT

Caisson lumineux SEG dynamique RGB

Fiche Vente

1. Nom du produit

Caisson lumineux SEG dynamique RGB

2. Mode de vente

Vente

3. Badge

Nouveau

4. Environnement

Intérieur

5. Caractéristiques / Spécifications techniques

CARACTÉRISTIQUE | VALEUR

Technologie | Caisson lumineux SEG dynamique
Système lumineux | RGB
Tension système | DC 12 V
Alimentation indiquée | AC 110–220 V
Puissance | 200 W à 1800 W selon configuration
Fonctionnement | Utilisation indépendante ou synchronisée avec plusieurs unités
Conception | Modulaire
Garantie | 2 ans

6. Boutons personnalisés

Bouton 1 | En savoir plus
Bouton 2 | Regarder la vidéo

7. Variantes

NOM DU BOUTON | VALEUR | RÉFÉRENCE

1000 × 2000 mm | Puissance : 200 W | PXT-RGB-K1-80-1000X2000
1500 × 2000 mm | Puissance : 300 W | PXT-RGB-K1-80-1500X2000
2000 × 2000 mm | Puissance : 400 W | PXT-RGB-K1-80-2000X2000
2950 × 2000 mm | Puissance : 600 W | PXT-RGB-K1-80-2950X2000
5850 × 2000 mm | Puissance : 1200 W | PXT-RGB-K1-80-5850X2000
1000 × 2500 mm | Puissance : 300 W | PXT-RGB-K1-80-1000X2500
1500 × 2500 mm | Puissance : 400 W | PXT-RGB-K1-80-1500X2500
2000 × 2500 mm | Puissance : 600 W | PXT-RGB-K1-80-2000X2500
2950 × 2500 mm | Puissance : 900 W | PXT-RGB-K1-80-2950X2500
5850 × 2500 mm | Puissance : 1800 W | PXT-RGB-K1-80-5850X2500

8. Description

Petite description :

Caisson lumineux SEG dynamique RGB conçu pour créer un affichage lumineux spectaculaire et modulable. Idéal pour les stands d'exposition, événements, scénographies, espaces commerciaux et opérations promotionnelles.

Description détaillée :

Le caisson lumineux SEG dynamique RGB est conçu pour donner une forte présence visuelle à un espace tout en offrant une grande liberté de configuration. Sa conception modulaire permet de composer différentes dimensions selon la surface disponible et l'effet recherché. Il peut être utilisé seul ou synchronisé avec plusieurs unités pour créer une installation lumineuse homogène et particulièrement visible. La technologie RGB permet de faire évoluer l'ambiance lumineuse en fonction de l'identité d'une marque, d'un événement, d'une campagne ou d'une scénographie. Cette solution convient aussi bien à une installation permanente qu'à des projets événementiels et de location nécessitant une présentation professionnelle et attractive. Les différentes puissances et configurations permettent de choisir une solution adaptée à l'ampleur du projet. Il constitue ainsi un choix pertinent pour les exposants, agences événementielles, entreprises de location, magasins, marques et professionnels de la communication visuelle qui souhaitent attirer le regard et valoriser leur espace avec un affichage lumineux distinctif.

Mots-clés :

caisson lumineux RGB
caisson lumineux SEG
light box LED
caisson lumineux événementiel
mur lumineux RGB
stand lumineux
stand exposition
affichage lumineux
PLV lumineuse
éclairage événementiel
location caisson lumineux
light box événementielle`;

  return parseProductText(referenceText);
}
