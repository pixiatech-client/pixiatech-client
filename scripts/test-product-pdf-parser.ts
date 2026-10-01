// Tests du parser de fiche technique produit (gabarit officiel).
// Exécution : node --experimental-strip-types scripts/test-product-pdf-parser.ts
//
// Les fixtures reprennent la GÉOMÉTRIE EXACTE du gabarit
// (docs/product-system/fiche-technique-modele.pdf), relevée item par item dans
// scratch/pdfaudit/reference-dump.txt : mêmes abscisses, mêmes corps de police,
// même pas de colonne (48.45 pt). Seul le TEXTE change : on teste donc le
// parsing sur des documents remplis, que le gabarit vierge ne peut pas fournir.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  extractProductPdfLayout,
  groupItemsIntoLines,
  isFilledSlot,
  mapParsedToProduct,
  normLabel,
  parseProductFichePages,
  parseProductPdf,
  resolveCanonicalSpecKey,
  type PdfTextItem,
} from '../src/lib/products/product-pdf-parser.ts';
import {
  dimensionForArt,
  dimensionOnly,
  hasDesign,
  hasFeatures,
  hasFieldwork,
  hasNext,
  hasOverview,
  hasSpecs,
  specRowHasValue,
  text,
  texts,
} from '../src/lib/products/display.ts';

let failures = 0;
let assertions = 0;

function assertEqual(actual: unknown, expected: unknown, label: string) {
  assertions++;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS | ${label}`);
  } else {
    failures++;
    console.log(`  FAIL | ${label}\n         attendu ${e}\n         obtenu  ${a}`);
  }
}

function assertTrue(value: boolean, label: string) {
  assertions++;
  if (value) console.log(`  PASS | ${label}`);
  else {
    failures++;
    console.log(`  FAIL | ${label}`);
  }
}

function section(title: string) {
  console.log(`\n--- ${title} ---`);
}

// ===========================================================================
// FIXTURES — géométrie du gabarit au point près
// ===========================================================================

/** Item PDF synthétiques : la largeur est fournie (jamais estimée). */
function item(x: number, y: number, w: number, size: number, str: string): PdfTextItem {
  return { str, x, y, w, size, font: 'g', cx: x + w / 2 };
}

/** Page = lignes d'items. */
function page(rows: PdfTextItem[][]) {
  return { lines: groupItemsIntoLines(rows.flat()) };
}

/** Page 1 : masthead + 01 APERCU + début de 02 CONCEPTION. */
function page1(over: {
  company?: string;
  series?: string;
  name?: string;
  subtitle?: string;
  markets?: string[];
  badgeValues?: string[];
  badgeLabels?: string[];
  hook?: string;
  hookDesign?: string;
  description?: string[];
  techs?: [string, string][];
  dims?: [string, string, string];
} = {}): PdfTextItem[][] {
  // Le gabarit dessine TOUJOURS ses 4 emplacements de marché et de badge :
  // une saisie partielle laisse des placeholders, elle ne réduit pas la grille.
  // Les libellés de badges sont du CHROME du gabarit (textes figés, 4 corps
  // différents de la grille de marchés) : ils sont reproduits tels quels.
  const GABARIT_BADGE_LABELS = ['PIXEL PITCH', 'BRIGHTNESS', 'CABINET', 'ENVIRONMENT'];
  const pad = (values: string[] | undefined, filler: (i: number) => string): string[] => {
    const list = values ?? [];
    return Array.from({ length: 4 }, (_, i) => list[i] ?? filler(i));
  };
  const markets = pad(over.markets, (i) => `[ Marche ${i + 1} ]`);
  const badgeValues = pad(over.badgeValues, () => '[ valeur ]');
  const badgeLabels = pad(over.badgeLabels, (i) => GABARIT_BADGE_LABELS[i]);
  const description = over.description ?? ['[ Description produit — 3 à 4 lignes ]'];
  const techs = over.techs ?? [
    ['[ Nom technologie ] — [ description en 1 phrase ]', '1'],
    ['[ Nom technologie ] — [ description en 1 phrase ]', '2'],
  ];
  const dims = over.dims ?? ['[ L×l mm ]', '[ L×l mm ]', '[ mm ]'];

  return [
    [
      item(46.5, 797, 105, 9, over.company ?? '[ LOGO / NOM ENTREPRISE ]'),
      item(303.6, 797, 154.6, 9, 'FICHE TECHNIQUE PRODUIT — ECRAN LED'),
    ],
    [item(60.5, 751, 120.4, 8.5, over.series ?? '[ Serie / categorie du produit ]')],
    [item(60.5, 721.5, 241.3, 24, over.name ?? '[ NOM DU PRODUIT ]')],
    [item(60.5, 705.5, 87.3, 10, over.subtitle ?? '[ Sous-titre produit ]')],
    [
      item(60.5, 664.5, 41.7, 7.5, markets[0]),
      item(188.1, 664.5, 41.7, 7.5, markets[1]),
      item(315.6, 664.5, 41.7, 7.5, markets[2]),
      item(443.2, 664.5, 41.7, 7.5, markets[3]),
    ],
    [
      item(86, 623.5, 44.1, 11.5, badgeValues[0]),
      item(213.6, 623.5, 44.1, 11.5, badgeValues[1]),
      item(341.1, 623.5, 44.1, 11.5, badgeValues[2]),
      item(468.7, 623.5, 44.1, 11.5, badgeValues[3]),
    ],
    [
      item(87.9, 609.5, 40.3, 6.6, badgeLabels[0]),
      item(214.2, 609.5, 42.9, 6.6, badgeLabels[1]),
      item(348.9, 609.5, 28.6, 6.6, badgeLabels[2]),
      item(466.3, 609.5, 48.8, 6.6, badgeLabels[3]),
    ],
    [item(82.2, 559, 76.5, 10, 'APERCU PRODUIT')],
    [
      item(48.5, 542.5, 24.5, 22, '01'),
      item(82.2, 542.5, 220.2, 14, over.hook ?? '[ Accroche editoriale du produit ]'),
    ],
    [item(82.2, 530.5, 189.1, 9, 'Positionnement, technologie phare, usage cible')],
    ...description.map((text, i) => [item(48.5, 496.5 - i * 12, 400, 9.2, text)]),
    [item(48.5, 469, 205.3, 9, 'MEDIAS DE PRESENTATION (1 video + 1 photo)')],
    [item(124.4, 419.5, 118.2, 9, '[ EMPLACEMENT MEDIA ]'), item(371, 419.5, 118.2, 9, '[ EMPLACEMENT MEDIA ]')],
    [
      item(63, 370, 53.2, 9.2, '[ Titre video ]'),
      item(309.6, 370, 54.2, 9.2, '[ Titre photo ]'),
    ],
    [
      item(63, 357.5, 70.2, 9.2, '[ Description video ]'),
      item(309.6, 357.5, 71.1, 9.2, '[ Description photo ]'),
    ],
    [
      item(102, 307.5, 57.5, 15, '[ valeur ]'),
      item(272, 307.5, 57.5, 15, '[ valeur ]'),
      item(442.1, 307.5, 57.5, 15, '[ valeur ]'),
    ],
    [
      item(107.8, 297, 45.9, 7.5, '[ Label stat 1 ]'),
      item(277.9, 297, 45.9, 7.5, '[ Label stat 2 ]'),
      item(448, 297, 45.9, 7.5, '[ Label stat 3 ]'),
    ],
    [item(48.5, 260, 152.5, 9, 'TECHNOLOGIES EMBARQUEES (2)')],
    ...techs.map(([text, num], i) => [
      item(62.7, 238 - i * 22.5, 12.2, 9, `0${num}`),
      item(91, 240 - i * 22.5, 199.4, 9.2, text),
    ]),
    [item(82.2, 176, 103.9, 10, 'CONCEPTION & FORMAT')],
    [
      item(48.5, 159.5, 24.5, 22, '02'),
      item(82.2, 159.5, 203, 14, over.hookDesign ?? '[ Accroche design du produit ]'),
    ],
    [item(82.2, 147.5, 173.1, 9, 'Dimensions, encombrement, configurations')],
    [
      item(48.5, 107.5, 39, 9, 'MODULE'),
      item(218.6, 107.5, 40, 9, 'CABINET'),
      item(388.7, 107.5, 64, 9, 'PROFONDEUR'),
    ],
    [
      item(48.5, 83.5, 40.6, 9.2, dims[0]),
      item(218.6, 83.5, 40.6, 9.2, dims[1]),
      item(388.7, 83.5, 25.6, 9.2, dims[2]),
    ],
    [item(48.5, 50.5, 155.3, 9, 'VISUELS TECHNIQUES (cote + face)')],
  ];
}

/** Page 2 : fin de 02 (visuels + configurations) + 03 POINTS FORTS. */
function page2(over: {
  visuals?: [string, string][];
  configs?: { name: string; description: string; digits: [string, string] }[];
  hookFeatures?: string;
  features?: { num: string; title: string; description: string }[];
} = {}): PdfTextItem[][] {
  const visuals = over.visuals ?? [
    ['[ Titre visuel 1 ]', '[ Description ]'],
    ['[ Titre visuel 2 ]', '[ Description ]'],
  ];
  const configs =
    over.configs ??
    [
      { name: '[ Nom config ]', description: '[ Description en 1 à 2 phrases ]', digits: ['0', '1'] },
      { name: '[ Nom config ]', description: '[ Description en 1 à 2 phrases ]', digits: ['0', '2'] },
    ];
  const features =
    over.features ??
    [
      { num: '01', title: '[ Titre feature ]', description: '[ description en 1 phrase ]' },
      { num: '02', title: '[ Titre feature ]', description: '[ description en 1 phrase ]' },
    ];

  return [
    [item(124.4, 760.5, 118.2, 9, '[ EMPLACEMENT MEDIA ]'), item(371, 760.5, 118.2, 9, '[ EMPLACEMENT MEDIA ]')],
    [
      item(63, 711, 62.4, 9.2, visuals[0][0]),
      item(309.6, 711, 62.4, 9.2, visuals[1][0]),
    ],
    [
      item(63, 698, 48.9, 9.2, visuals[0][1]),
      item(309.6, 698, 48.9, 9.2, visuals[1][1]),
    ],
    [item(48.5, 668, 187.7, 9, "CONFIGURATIONS D'INSTALLATION (1 à 3)")],
    ...configs.map((c, i) => [
      // Le gabarit coupe le numéro chiffre par chiffre, 13.5 pt d'écart.
      item(62.7, 646 - i * 35, 6.1, 9, c.digits[0]),
      item(62.7, 632.5 - i * 35, 6.1, 9, c.digits[1]),
      item(85.4, 647.5 - i * 35, 57.4, 9.3, c.name),
      item(204.4, 647.5 - i * 35, 127.3, 9.2, c.description),
    ]),
    [item(82.2, 523.5, 120.9, 10, 'POINTS FORTS TECHNIQUES')],
    [
      item(48.5, 507, 24.5, 22, '03'),
      item(82.2, 507, 139.3, 14, over.hookFeatures ?? '[ Accroche features ]'),
    ],
    [item(82.2, 495, 139.1, 9, 'Exactement 7 caracteristiques cles')],
    [item(48.5, 461, 75.5, 9, 'VISUEL PRODUIT')],
    [item(244.5, 414.5, 118.2, 9, '[ EMPLACEMENT MEDIA ]')],
    [item(183.2, 365, 54.2, 9.2, '[ Titre photo ]')],
    [item(183.2, 352, 48.9, 9.2, '[ Description ]')],
    ...features.flatMap((f, i) => [
      [item(60.7, 318 - i * 23.5, 12.2, 9, f.num), item(89, 320 - i * 23.5, 59.8, 9.2, f.title)],
      [item(259.1, 320 - i * 23.5, 105.9, 9.2, f.description)],
    ]),
  ];
}

/** Une ligne de la matrice : libellé + N cellules alignées sur des centres. */
function specRow(y: number, label: string, cells: string[], centers: number[]): PdfTextItem[] {
  const items: PdfTextItem[] = [item(58.2, y, 42.7, 6.8, label)];
  cells.forEach((text, i) => {
    const w = Math.max(text.length * 3.4, 6.8);
    items.push(item(centers[i] - w / 2, y, w, 6.8, text));
  });
  return items;
}

/** Fragment d'en-tête de variante, centré sur sa colonne (y=733 ou y=729). */
function specHeaderCell(text: string, cx: number, y: number): PdfTextItem {
  const w = Math.max(text.length * 3.4, 6.8);
  return item(cx - w / 2, y, w, 6.8, text);
}

/** Page 3 : 04 CARACTERISTIQUES + 05 REFERENCES + CTA. */
function page3(over: {
  variantNames: string[];
  centers: number[];
  rows?: { y: number; group?: string; label: string; cells: string[] }[];
  projects?: { name: string; place: string }[];
  extraRows?: PdfTextItem[][];
  cta?: string;
  button?: string;
  nav?: string;
} ): PdfTextItem[][] {
  const { variantNames, centers } = over;
  const rows = over.rows ?? [];
  // En-tête de la matrice : le gabarit écrit le nom de variante sur DEUX lignes
  // (y=733 puis y=729) et le libellé « SPEC » (x=70.3) PARTAGE la ligne y=729
  // avec les seconds fragments : `[ Modele` | « SPEC » `1 ]` `2 ]` …
  // (référence exacte : scratch/pdfaudit/reference-dump.txt, y=733 et y=729).
  // `|` marque le retour à la ligne dans le nom saisi, comme le gabarit coupe
  // `[ Modele` / `1 ]`. Un nom sans `|` tient sur une ligne et laisse donc
  // « SPEC » seul, ce qui est aussi un état réel après saisie courte.
  const splitNames = variantNames.map((n) => n.split('|'));
  const headTop = splitNames.map((parts, i) =>
    specHeaderCell((parts[0] ?? '').trim(), centers[i], 733)
  );
  const headBottom = splitNames.map((parts, i) =>
    parts.length > 1 ? specHeaderCell(parts.slice(1).join(' ').trim(), centers[i], 729) : null
  );
  const bottomItems = headBottom.filter((it): it is PdfTextItem => it !== null);
  const specLabel = item(70.3, 729, 18.5, 6.8, 'SPEC');
  const rowsOut: PdfTextItem[][] = [
    [item(82.2, 796, 145.5, 10, 'CARACTERISTIQUES TECHNIQUES')],
    [
      item(48.5, 779.5, 24.5, 22, '04'),
      item(82.2, 779.5, 100.4, 14, '[ Titre section ]'),
    ],
    [item(82.2, 767.5, 258.1, 9, 'Renseigner 1 colonne par modele/variante (3 à 10 recommandé)')],
    headTop,
    bottomItems.length > 0 ? [specLabel, ...bottomItems] : [specLabel],
  ];
  for (const row of rows) {
    if (row.group) {
      // Y réel de l'en-tête de groupe dans le gabarit (707.5, 661.5, …).
      rowsOut.push([item(48.7, row.y, 60, 10, row.group)]);
      continue;
    }
    // Y réel de la ligne de caractéristique : on ne décale PAS, sinon la
    // ligne se retrouverait à 3 pt de l'en-tête de groupe suivant et fusionnerait.
    rowsOut.push(specRow(row.y, row.label, row.cells, centers));
  }
  // Lignes supplémentaires de la matrice (cellule multi-items, libellés larges…).
  if (over.extraRows) rowsOut.push(...over.extraRows);
  rowsOut.push([
    item(
      48.5,
      334.5,
      299.7,
      7.6,
      "Ecrire PENDING dans une cellule si la valeur n'est pas encore confirmee par le fabricant."
    ),
  ]);

  const projects = over.projects ?? [];
  // Le gabarit dessine toujours 2 emplacements de projet.
  const projectSlots: { name: string; place: string }[] = Array.from({ length: 2 }, (_, i) => ({
    name: projects[i]?.name ?? '[ Nom du projet / client ]',
    place: projects[i]?.place ?? '[ Pays · Année ]',
  }));
  return [
    ...rowsOut,
    [item(82.2, 297.5, 98.2, 10, 'REFERENCES TERRAIN')],
    [
      item(48.5, 281, 24.5, 22, '05'),
      item(82.2, 281, 184.4, 14, '[ Accroche section projets ]'),
    ],
    [item(82.2, 269, 188.6, 9, '2 à 3 realisations (optionnel), 1 photo par projet')],
    [item(124.4, 202.5, 118.2, 9, '[ EMPLACEMENT MEDIA ]'), item(371, 202.5, 118.2, 9, '[ EMPLACEMENT MEDIA ]')],
    projectSlots.map((p, i) => item(63 + i * 246.6, 153, 97.2, 9.2, p.name)),
    projectSlots.map((p, i) => item(63 + i * 246.6, 140.5, 56.5, 8, p.place)),
    [item(50.5, 87.5, 140.2, 13, over.cta ?? '[ Accroche finale / CTA ]')],
    [item(430.5, 91, 76.5, 9.5, over.button ?? '[ Libelle bouton ]'), item(509.7, 91, 9.4, 9.5, '→')],
    [
      item(
        48.5,
        62.5,
        260,
        7.6,
        over.nav ?? 'Navigation serie : Precedent = [ nom | url ] | Suivant = [ nom | url ]'
      ),
    ],
    [item(42.5, 17, 167.6, 7, 'GABARIT VIERGE — FICHE TECHNIQUE PRODUIT'), item(527.5, 17, 25.3, 7, 'PAGE 3')],
  ];
}

/** Page 4 : documentation interne du gabarit (doit être ignorée). */
function page4(): PdfTextItem[][] {
  return [
    [item(48.5, 780, 200, 10, 'STRUCTURE DE REFERENCE')],
    [item(48.5, 760, 216.7, 7.6, '1. Masthead — nom produit, tags marches, 4 badges specs cles')],
    [item(48.5, 740, 300, 7.6, 'Donnee inexistante qui ne doit jamais etre importee dans un produit.')],
  ];
}

// 4 variantes, centres alignés comme le gabarit (pas de 48.45, centre 1 à 140.6).
const CENTERS4 = [140.6, 189.05, 237.5, 285.95];

// ===========================================================================
// 1. GABARIT VIERGE — aucune donnée ne doit être inventée
// ===========================================================================

section('Gabarit vierge (le PDF officiel) : zéro donnée inventée');
{
  const parsed = parseProductFichePages([
    page(page1()),
    page(page2()),
    page(
      page3({
        variantNames: ['[ Modele 1 ]', '[ Modele 2 ]', '[ Modele 3 ]', '[ Modele 4 ]'],
        centers: CENTERS4,
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 679, label: 'LED arrangement', cells: ['—', '—', '—', '—'] },
        ],
      })
    ),
    page(page4()),
  ]);

  assertEqual(parsed.productName, undefined, 'nom de produit absent (placeholder)');
  assertEqual(parsed.specs?.models.length ?? 0, 0, 'aucune variante créée depuis des en-têtes placeholder');
  assertEqual(
    parsed.markets,
    undefined,
    'les libellés de badges (chrome du gabarit) ne deviennent pas des marchés'
  );
  assertEqual(parsed.overview?.video, undefined, 'le libellé MEDIAS ne devient pas un titre de vidéo');
  assertEqual(parsed.overview?.photo, undefined, 'le libellé MEDIAS ne devient pas un titre de photo');
  assertEqual(parsed.hero, undefined, 'aucun hero inventé');
  assertEqual(parsed.overview?.stats, undefined, 'aucune stat inventée');
  assertEqual(parsed.overview?.technologies, undefined, 'aucune technologie inventée');
  assertEqual(parsed.design?.dimensions, undefined, 'aucune dimension inventée');
  assertEqual(parsed.features?.items, undefined, 'aucune feature inventée');
  assertEqual(parsed.fieldwork?.projects, undefined, 'aucun projet inventé');
  assertEqual(parsed.cta, undefined, 'aucun CTA inventé');
  assertTrue(
    parsed.warnings.some((w) => w.includes('placeholders')),
    `avertissement explicite sur les en-têtes placeholder (reçu : ${JSON.stringify(parsed.warnings)})`
  );

  const product = mapParsedToProduct(parsed);
  assertEqual(product.name, undefined, 'aucun nom dans le brouillon produit');
  assertEqual(product.specs, undefined, 'aucune matrice dans le brouillon produit');
}

// ===========================================================================
// 2. MASTHEAD
// ===========================================================================

section('Masthead : nom, série, sous-titre, marchés, badges');
{
  const parsed = parseProductFichePages([
    page(
      page1({
        company: 'PIXIATECH',
        series: 'INK Series',
        name: 'PXT Fine',
        subtitle: 'Écran LED indoor ultra haute définition',
        markets: ['FRANCE', 'ESPAGNE', 'ITALIE', 'BELGIQUE'],
        badgeValues: ['1.25 mm', '800 nits', '500×1000 mm', 'Indoor'],
        badgeLabels: ['Pixel pitch', 'Brightness', 'Cabinet', 'Environment'],
      })
    ),
  ]);
  assertEqual(parsed.company, 'PIXIATECH', 'entreprise');
  assertEqual(parsed.series, 'INK Series', 'série');
  assertEqual(parsed.productName, 'PXT Fine', 'nom du produit');
  assertEqual(parsed.subtitle, 'Écran LED indoor ultra haute définition', 'sous-titre');
  assertEqual(parsed.markets, ['FRANCE', 'ESPAGNE', 'ITALIE', 'BELGIQUE'], 'marchés');
  assertEqual(parsed.badges, [
    { label: 'PIXEL PITCH', value: '1.25 mm' },
    { label: 'BRIGHTNESS', value: '800 nits' },
    { label: 'CABINET', value: '500×1000 mm' },
    { label: 'ENVIRONMENT', value: 'Indoor' },
  ], 'badges (valeur + libellé appariés par colonne)');
}

// ===========================================================================
// 3. SECTION 01
// ===========================================================================

section('01 APERCU : accroche, description multi-lignes, médias, stats, technologies');
{
  const parsed = parseProductFichePages([
    page(
      page1({
        name: 'PXT Fine',
        hook: 'La référence indoor pour les studios broadcast',
        description: [
          'Le PXT Fine est un écran LED indoor conceived pour les studios de production.',
          'Sa densité de 800 nits garantit un rendu précis même en pleine lumière.',
          'Montage rapide et maintenance frontale sans outil spécifique.',
        ],
        techs: [
          ['LED COB — Technologie sans visière pour un rendu homogène', '1'],
          ['Calibration usine — Chaque unité est étalonnée avant expédition', '2'],
        ],
      })
    ),
  ]);
  assertEqual(parsed.overview?.hook, 'La référence indoor pour les studios broadcast', 'accroche');
  assertEqual(
    parsed.overview?.description,
    'Le PXT Fine est un écran LED indoor conceived pour les studios de production. Sa densité de 800 nits garantit un rendu précis même en pleine lumière. Montage rapide et maintenance frontale sans outil spécifique.',
    'description : les 3 lignes sont conservées dans l\'ordre'
  );
  assertEqual(parsed.overview?.technologies?.[0], {
    num: '01',
    title: 'LED COB',
    description: 'Technologie sans visière pour un rendu homogène',
  }, 'technologie 1 : numéro + nom + description séparés au premier tiret');
  assertEqual(parsed.overview?.technologies?.[1]?.num, '02', 'technologie 2 : numéro');
}

// ===========================================================================
// 4. SECTION 02
// ===========================================================================

section('02 CONCEPTION : dimensions, visuels, configurations');
{
  const parsed = parseProductFichePages([
    page(page1({ hookDesign: 'Un châssis pensé pour le studio', dims: ['500×500 mm', '500×1000 mm', '90 mm'] })),
    page(
      page2({
        visuals: [
          ['Vue côté', 'Châssis aluminium anodisé'],
          ['Vue face', 'Surface sans visière'],
        ],
        configs: [
          { name: 'Poste de contrôle', description: ' montage mural en applique', digits: ['0', '1'] },
          { name: 'Rack 19 pouces', description: 'intégration en baie', digits: ['0', '2'] },
        ],
      })
    ),
  ]);
  assertEqual(parsed.design?.hook, 'Un châssis pensé pour le studio', 'accroche design');
  assertEqual(parsed.design?.dimensions, [
    { label: 'MODULE', value: '500×500 mm' },
    { label: 'CABINET', value: '500×1000 mm' },
    { label: 'PROFONDEUR', value: '90 mm' },
  ], 'dimensions (unités conservées)');
  assertEqual(parsed.design?.visuals, [
    { title: 'Vue côté', description: 'Châssis aluminium anodisé' },
    { title: 'Vue face', description: 'Surface sans visière' },
  ], 'visuels techniques');
  assertEqual(parsed.design?.configs?.[0], {
    num: '01',
    title: 'Poste de contrôle',
    description: 'montage mural en applique',
  }, 'configuration 1 : numéro reconstruit depuis les chiffres coupés');
  assertEqual(parsed.design?.configs?.[1]?.num, '02', 'configuration 2 : numéro reconstruit');
}

// ===========================================================================
// 5. SECTION 03
// ===========================================================================

section('03 POINTS FORTS : visuel + features');
{
  const parsed = parseProductFichePages([
    page(page2({
      hookFeatures: 'Sept raisons de choisir le PXT Fine',
      features: [
        { num: '01', title: 'Densité 800 nits', description: 'visible en studio éclairé' },
        { num: '02', title: 'Maintenance frontale', description: 'sans démontage du mur' },
      ],
    })),
  ]);
  assertEqual(parsed.features?.hook, 'Sept raisons de choisir le PXT Fine', 'accroche features');
  assertEqual(parsed.features?.items, [
    { num: '01', title: 'Densité 800 nits', description: 'visible en studio éclairé' },
    { num: '02', title: 'Maintenance frontale', description: 'sans démontage du mur' },
  ], 'features : numéro isolé du titre');
}

// ===========================================================================
// 6. SECTION 04 — le cœur : la matrice comparative
// ===========================================================================

section('04 MATRICE : association valeur ↔ variante par centre de colonne');
{
  const parsed = parseProductFichePages([
    page(
      page3({
        variantNames: ['PXT-1', 'PXT-2', 'PXT-3', 'PXT-4'],
        centers: CENTERS4,
        rows: [
          { y: 707.5, group: 'GENERAL' },
          // La colonne 2 est VIDE : les colonnes suivantes ne doivent pas décaler.
          { y: 693, label: 'Usage (in/out)', cells: ['Indoor', '—', 'Indoor', 'Indoor'] },
          { y: 679, label: 'LED arrangement', cells: ['COB', '—', 'SMD', 'COB'] },
          { y: 661.5, group: 'PHYSIQUE' },
          { y: 647, label: 'Pixel pitch', cells: ['1.25 mm', '—', '1.9 mm', '2.6 mm'] },
          { y: 633, label: 'Density (px/m²)', cells: ['800', '—', '528', '385'] },
          { y: 619, label: 'Module res.', cells: ['400×400', '—', 'PENDING', 'PENDING'] },
        ],
      })
    ),
  ]);

  const models = parsed.specs?.models ?? [];
  assertEqual(models.length, 4, 'exactement 4 variantes (nombre réel, jamais complété)');
  assertEqual(models.map((m) => m.name), ['PXT-1', 'PXT-2', 'PXT-3', 'PXT-4'], 'noms de variantes');
  assertEqual(models[0].specs.pitch, '1.25 mm', 'PXT-1 · pixel pitch (unité conservée)');
  assertEqual(models[1].specs.pitch, undefined, 'PXT-2 · cellule vide → AUCUNE valeur (pas de décalage)');
  assertEqual(models[2].specs.pitch, '1.9 mm', 'PXT-3 · pixel pitch malgré la cellule vide en colonne 2');
  assertEqual(models[3].specs.pitch, '2.6 mm', 'PXT-4 · pixel pitch');
  assertEqual(models[2].specs.moduleRes, 'PENDING', 'PENDING conservé tel quel');
  assertEqual(models[0].specs.env, 'Indoor', 'libellé "Usage (in/out)" → clé env');

  const groups = parsed.specs?.groups ?? [];
  assertEqual(groups.map((g) => g.id), ['general', 'physical'], 'groupes recognized');
  assertEqual(
    groups.map((g) => g.rows.map((r) => r.key)),
    [['env', 'arrangement'], ['pitch', 'density', 'moduleRes']],
    'ordre des lignes préservé dans chaque groupe'
  );
}

section('04 MATRICE : multi-tableaux dynamiques (concaténation de 8 variantes et fusion des catégories)');
{
  const parsed = parseProductFichePages([
    // Page avec Tableau 1 (variantes PXT-1 à PXT-4)
    page(
      page3({
        variantNames: ['PXT-1', 'PXT-2', 'PXT-3', 'PXT-4'],
        centers: CENTERS4,
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Usage (in/out)', cells: ['Indoor', 'Indoor', 'Indoor', 'Indoor'] },
          { y: 661.5, group: 'PHYSIQUE' },
          { y: 647, label: 'Pixel pitch', cells: ['1.25 mm', '1.56 mm', '1.9 mm', '2.5 mm'] },
        ],
      })
    ),
    // Page avec Tableau 2 (variantes PXT-5 à PXT-8, catégories répétées GENERAL et PHYSIQUE)
    page([
      [item(82.2, 796, 145.5, 10, 'CARACTERISTIQUES TECHNIQUES')],
      [item(48.5, 779.5, 24.5, 22, '04'), item(82.2, 779.5, 100.4, 14, 'Tableau 2')],
      [item(70.3, 729, 18.5, 6.8, 'SPEC')],
      ['PXT-5', 'PXT-6', 'PXT-7', 'PXT-8'].map((name, i) => item(CENTERS4[i] - 20.5, 733, 41, 6.8, name)),
      [item(48.7, 707.5, 60, 10, 'GENERAL')],
      specRow(693, 'Usage (in/out)', ['Outdoor', 'Outdoor', 'Outdoor', 'Outdoor'], CENTERS4),
      [item(48.7, 661.5, 60, 10, 'PHYSIQUE')],
      specRow(647, 'Pixel pitch', ['3.0 mm', '4.0 mm', '5.0 mm', '6.0 mm'], CENTERS4),
    ]),
  ]);

  const models = parsed.specs?.models ?? [];
  assertEqual(models.length, 8, 'exactement 8 variantes concaténées depuis les 2 tableaux');
  assertEqual(
    models.map((m) => m.name),
    ['PXT-1', 'PXT-2', 'PXT-3', 'PXT-4', 'PXT-5', 'PXT-6', 'PXT-7', 'PXT-8'],
    'noms des 8 variantes dans l ordre'
  );
  assertEqual(models[0].specs.pitch, '1.25 mm', 'PXT-1 · pixel pitch');
  assertEqual(models[4].specs.pitch, '3.0 mm', 'PXT-5 · pixel pitch du second tableau');
  assertEqual(models[7].specs.pitch, '6.0 mm', 'PXT-8 · pixel pitch du second tableau');
  assertEqual(models[4].specs.env, 'Outdoor', 'PXT-5 · usage du second tableau');

  const groups = parsed.specs?.groups ?? [];
  assertEqual(groups.map((g) => g.id), ['general', 'physical'], 'les groupes répétés sont unifiés sans doublon');
  assertEqual(groups[0].rows.map((r) => r.key), ['env'], 'ligne env unique dans general');
  assertEqual(groups[1].rows.map((r) => r.key), ['pitch'], 'ligne pitch unique dans physical');

  // Suite d'un tableau sur les mêmes variantes avec d'autres caractéristiques
  const parsedContinuation = parseProductFichePages([
    page(
      page3({
        variantNames: ['PXT-A', 'PXT-B'],
        centers: [140.6, 189.05],
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Usage (in/out)', cells: ['Indoor', 'Outdoor'] },
        ],
      })
    ),
    page([
      [item(82.2, 796, 145.5, 10, 'CARACTERISTIQUES TECHNIQUES')],
      [item(48.5, 779.5, 24.5, 22, '04'), item(82.2, 779.5, 100.4, 14, 'Tableau 2')],
      [item(70.3, 729, 18.5, 6.8, 'SPEC')],
      ['PXT-A', 'PXT-B'].map((name, i) => item([140.6, 189.05][i] - 20.5, 733, 41, 6.8, name)),
      [item(48.7, 661.5, 60, 10, 'OPTIQUE')],
      specRow(647, 'Luminosite', ['800 nits', '1500 nits'], [140.6, 189.05]),
    ]),
  ]);
  const contModels = parsedContinuation.specs?.models ?? [];
  assertEqual(contModels.length, 2, '2 variantes maintenues lors d une suite de tableau');
  assertEqual(contModels[0].specs.env, 'Indoor', 'PXT-A · usage conservé');
  assertEqual(contModels[0].specs.brightness, '800 nits', 'PXT-A · luminosité ajoutée depuis le tableau 2');
  assertEqual(contModels[1].specs.brightness, '1500 nits', 'PXT-B · luminosité ajoutée depuis le tableau 2');
}

section('04 MATRICE : cellule multi-items (valeur + unité)');
{
  const parsed = parseProductFichePages([
    page(
      page3({
        variantNames: ['A', 'B'],
        centers: [140.6, 189.05],
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Usage (in/out)', cells: ['Indoor', 'Outdoor'] },
        ],
        // Cellule composée de deux items collés (« 1.25 » + « mm ») : le
        // regroupement se fait par CENTRE, pas par item.
        extraRows: [
          [
            item(58.2, 679, 42.7, 6.8, 'Pixel pitch'),
            item(135, 679, 9, 6.8, '1.25'),
            item(145, 679, 6, 6.8, 'mm'),
            item(183.5, 679, 9, 6.8, '2.6'),
            item(193.5, 679, 6, 6.8, 'mm'),
          ],
        ],
      })
    ),
  ]);
  const models = parsed.specs?.models ?? [];
  assertEqual(models.length, 2, '2 variantes');
  assertEqual(models[0].specs.pitch, '1.25 mm', 'cellule 1 fusionnée en « 1.25 mm »');
  assertEqual(models[1].specs.pitch, '2.6 mm', 'cellule 2 fusionnée en « 2.6 mm »');
}

section('04 MATRICE : label inconnu conservé (aucune donnée perdue)');
{
  const parsed = parseProductFichePages([
    page(
      page3({
        variantNames: ['A'],
        centers: [140.6],
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Consommation idle', cells: ['120 W/m²'] },
        ],
      })
    ),
  ]);
  assertEqual(parsed.specs?.models[0].specs.consommationidle, '120 W/m²', 'label inconnu conservé');
  assertEqual(parsed.specs?.groups[0].rows[0].label, 'Consommation idle', 'libellé original conservé');
  assertTrue(
    parsed.warnings.some((w) => w.includes('Consommation idle')),
    'avertissement émis pour le label non standard'
  );
}

section('04 MATRICE : deux libellés homonymes dans deux groupes');
{
  const parsed = parseProductFichePages([
    page(
      page3({
        variantNames: ['A'],
        centers: [140.6],
        rows: [
          { y: 707.5, group: 'OPTIQUE' },
          { y: 693, label: 'Temperature', cells: ['0 à 40 °C'] },
          { y: 661.5, group: 'ENVIRONNEMENT' },
          { y: 647, label: 'Temperature', cells: ['-20 à 60 °C'] },
        ],
      })
    ),
  ]);
  const models = parsed.specs?.models ?? [];
  assertEqual(Object.keys(models[0].specs).length, 2, 'les DEUX valeurs sont conservées');
  assertEqual(models[0].specs.temp, '0 à 40 °C', 'première occurrence');
  assertEqual(models[0].specs.temp2, '-20 à 60 °C', 'seconde occurrence sous une clé distincte');
}

section('04 MATRICE : groupe inconnu conservé');
{
  const parsed = parseProductFichePages([
    page(
      page3({
        variantNames: ['A'],
        centers: [140.6],
        rows: [
          { y: 707.5, group: 'SECURITE' },
          { y: 693, label: 'Brightness', cells: ['800 nits'] },
        ],
      })
    ),
  ]);
  assertEqual(parsed.specs?.groups[0].label, 'SECURITE', 'libellé de groupe conservé');
  assertTrue(parsed.warnings.some((w) => w.includes('SECURITE')), 'avertissement émis pour le groupe');
}

section('04 MATRICE : consigne PENDING du gabarit jamais importée comme donnée');
{
  const parsed = parseProductFichePages([
    page(
      page3({
        variantNames: ['A'],
        centers: [140.6],
        rows: [{ y: 707.5, group: 'GENERAL' }, { y: 693, label: 'Brightness', cells: ['800 nits'] }],
      })
    ),
  ]);
  const labels = (parsed.specs?.groups ?? []).flatMap((g) => g.rows.map((r) => r.label));
  assertEqual(labels, ['Brightness'], 'la consigne « Ecrire PENDING… » ne devient pas une ligne');
}

// ===========================================================================
// 7. SECTION 05 + CTA
// ===========================================================================

section('05 REFERENCES + CTA + navigation série');
{
  const parsed = parseProductFichePages([
    page(
      page3({
        variantNames: ['A'],
        centers: [140.6],
        rows: [],
        projects: [
          { name: 'Studio France 2', place: 'France · 2024' },
          { name: 'Arena Milano', place: 'Italie · 2023' },
        ],
        cta: 'Un projet de LED ? Parlons-en.',
        button: 'Demander un devis',
        nav: 'Navigation serie : Precedent = PXT Pro | /web/product/pxt-pro | Suivant = INK | /web/product/ink',
      })
    ),
  ]);
  assertEqual(parsed.fieldwork?.projects, [
    { name: 'Studio France 2', country: 'France', year: '2024' },
    { name: 'Arena Milano', country: 'Italie', year: '2023' },
  ], 'projets (nom + pays + année)');
  assertEqual(parsed.cta, { title: 'Un projet de LED ? Parlons-en.', buttonLabel: 'Demander un devis' }, 'CTA');
  assertEqual(parsed.seriesNavigation, {
    previous: { name: 'PXT Pro', url: '/web/product/pxt-pro' },
    next: { name: 'INK', url: '/web/product/ink' },
  }, 'navigation série');
}

// ===========================================================================
// 8. MAPPING → Product
// ===========================================================================

section('Mapping vers Product');
{
  const parsed = parseProductFichePages([
    page(
      page1({
        series: 'INK Series',
        name: 'PXT Fine',
        subtitle: 'Écran LED indoor',
        markets: ['FRANCE'],
        badgeValues: ['1.25 mm'],
        badgeLabels: ['Pixel pitch'],
        hook: 'La référence indoor',
        description: ['Un écran LED indoor conceived pour les studios.'],
      })
    ),
    page(page2()),
    page(
      page3({
        variantNames: ['PXT-1', 'PXT-2'],
        centers: [140.6, 189.05],
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Pixel pitch', cells: ['1.25 mm', 'PENDING'] },
        ],
        projects: [{ name: 'Studio', place: 'France · 2024' }],
        cta: 'Parlons-en.',
        button: 'Devis',
      })
    ),
    page(page4()),
  ]);

  const product = mapParsedToProduct(parsed);
  assertEqual(product.name, 'PXT Fine', 'nom');
  assertEqual(product.series, 'INK Series', 'série');
  assertEqual(product.status, 'draft', 'statut draft');
  assertEqual(product.hero?.tags, ['FRANCE'], 'hero.tags depuis les marchés');
  assertEqual(product.hero?.breadcrumbCategoryFr, 'INK Series', 'fil d\'Ariane');
  assertEqual(product.overview?.title, 'La référence indoor', 'overview.title depuis l\'accroche');
  assertEqual(product.description?.shortFr, 'Un écran LED indoor conceived pour les studios.', 'description courte');
  assertEqual(product.seo?.description, 'Un écran LED indoor conceived pour les studios.', 'SEO');
  assertEqual(product.specs?.models.length, 2, 'specs.models');
  assertEqual(product.specs?.models[1].specs.pitch, 'PENDING', 'PENDING conservée dans le produit');
  assertEqual(product.fieldwork?.projects, [{ title: 'Studio', location: 'France', year: '2024' }], 'projets');
  assertEqual(product.next, { headline: 'Parlons-en.', cta: 'Devis' }, 'CTA → next');
  assertEqual(product.environment, undefined, 'jamais d\'environnement déduit du PDF (taxonomie admin)');
  assertEqual(product.sellingModes, undefined, 'jamais de mode de vente déduit du PDF');
  assertEqual(product.variants, undefined, 'ancien tableau variants non alimenté (pas d\'équivalent PDF)');
  assertTrue((product.importWarnings?.length ?? 0) >= 0, 'avertissements toujours présents (tableau)');
}

// ===========================================================================
// 9. UTILITAIRES
// ===========================================================================

section('Utilitaires');
assertEqual(normLabel('Density (px/m²)'), 'DENSITY PX M', 'normLabel : accents et symboles normalisés');
assertEqual(isFilledSlot('—'), false, 'isFilledSlot : tiret = slot vide');
assertEqual(isFilledSlot('[ Modele'), false, 'isFilledSlot : placeholder = slot vide');
assertEqual(isFilledSlot('PENDING'), true, 'isFilledSlot : PENDING = valeur valide');
assertEqual(isFilledSlot('1.25 mm'), true, 'isFilledSlot : valeur avec unité');

// ===========================================================================
// 9 bis. RÉGRESSIONS — le gabarit dessine ses slots ENTRE CROCHETS
//
// Un PDF rempli par une personne réelle garde les crochets du gabarit quand
// elle édite le texte à l'intérieur («[ PXT-FINE-500 ]»). Rejeter toute
// valeur contenant un crochet — l'ancien comportement — perdait alors la
// totalité des caractéristiques techniques. Réciproquement, assouplir le contrôle ne
// doit JAMAIS laisser passer un placeholder du gabarit non renseigné.
// ===========================================================================

section('Gabarit entre crochets : donnée réelle vs placeholder');
assertEqual(isFilledSlot('[ PXT-FINE-500 ]'), true, 'valeur réelle saisie dans le crochet');
assertEqual(isFilledSlot('[ 500x500 mm ]'), true, 'cote réelle saisie dans le crochet');
assertEqual(isFilledSlot('[ Marche 1 ]'), false, 'placeholder de marché toujours rejeté');
assertEqual(isFilledSlot('[ Titre feature ]'), false, 'placeholder de feature toujours rejeté');
assertEqual(isFilledSlot('[ Description produit — 3 à 4 lignes ]'), false, 'placeholder de description rejeté');
assertEqual(isFilledSlot('[ Valeur ]'), false, 'placeholder de valeur rejeté');
assertEqual(isFilledSlot('Modele1'), false, 'placeholder de variante recollé sans espace rejeté');
assertEqual(isFilledSlot('[ Modele 1 ]'), false, 'placeholder de variante avec espace rejeté');
assertEqual(isFilledSlot('[ Nom du projet / client ]'), false, 'placeholder de projet rejeté');

// ===========================================================================
// 9 ter. RÉGRESSIONS — le gabarit et les données réelles sont SUPERPOSÉS
//
// Le PDF de production n'est pas un gabarit vierge : il porte une couche de
// gabarit (bandeaux de section en corps 8, placeholders en tiret) et une couche
// de saisie posée PAR-DESSUS. Deux items voisins se retrouvent alors à moins de
// 3 pt — la tolérance de regroupement en ligne — et sont lus comme une seule
// ligne : « Refresh rateBrightness », « Module dim.Module res. », ou un nom de
// variante_AVEC la consigne du gabarit devant (« 1 colonne par/variante -
// 3 variantes confirmeesPXT-U1.2 »).
//
// Conséquence observée avant correction : autant de clés dynamiques
// (`optiquebrightness`, `moduledimmoduleres`…), `ip` et `maxPower` rattachés au
// mauvais groupe, et le premier nom de variante illisible. Le PDF ne doit
// JAMAIS créer un champ : il fournit des valeurs, le template maître fournit la
// structure. `resolveCanonicalSpecKey` garantit qu'un libellé soudé retrouve
// TOUJOURS le champ canonique existant.
// ===========================================================================

section('Superposition gabarit/données : libellé soudé -> champ canonique');
// Exact, sans soudure : le chemin nominal.
assertEqual(resolveCanonicalSpecKey('Pixel pitch'), 'pitch', 'libellé exact -> clé canonique');
assertEqual(resolveCanonicalSpecKey('IP rating'), 'ip', 'IP rating -> ip');
assertEqual(resolveCanonicalSpecKey('Density (px/m²)'), 'density', 'libellé officiel avec unité');
// Soudés par la superposition — le plus long préfixe/suffixe l'emporte.
assertEqual(
  resolveCanonicalSpecKey('Refresh rateBrightness'),
  'refresh',
  'suffixe soudé -> refresh (pas brightness)'
);
assertEqual(
  resolveCanonicalSpecKey('Scan rateRefresh rate'),
  'scan',
  'suffixe soudé -> scan (pas refresh)'
);
assertEqual(
  resolveCanonicalSpecKey('Viewing angleScan rate'),
  'angle',
  'suffixe soudé -> angle'
);
assertEqual(
  resolveCanonicalSpecKey('Module dim.Module res.'),
  'moduleDim',
  'préfixe soudé -> moduleDim (le plus long gagne)'
);
assertEqual(resolveCanonicalSpecKey('Cabinet dim.Module dim.'), 'cabDim', 'préfixe soudé -> cabDim');
assertEqual(resolveCanonicalSpecKey('Poids cabinetCabinet dim.'), 'weight', 'préfixe soudé -> weight');
// Soudure SANS séparateur, résolue par la segmentation de casse.
assertEqual(resolveCanonicalSpecKey('OPTIQUEBrightness'), 'brightness', 'acronyme soudé -> brightness');
assertEqual(
  resolveCanonicalSpecKey('Density (px/m2)Pixel pitch'),
  'density',
  'unité soudée -> density'
);
// Alias métier explicites.
assertEqual(resolveCanonicalSpecKey('Wide angle'), 'angle', 'alias « Wide angle » -> angle');
assertEqual(resolveCanonicalSpecKey('INDICE IP'), 'ip', 'alias français -> ip');
// Un intitulé réellement inconnu reste inconnu : AUCUNE clé inventée.
assertEqual(resolveCanonicalSpecKey('Rapport de contraste'), null, 'inconnu -> null, pas de clé inventée');
// Un mot-valise est un mot qui ne se découpe pas : il ne correspond à rien, et
// ne doit surtout pas être amputé pour « retrouver » un champ.
assertEqual(
  resolveCanonicalSpecKey('TempératuredePont'),
  null,
  'mot-valise inconnu -> null'
);

section('Superposition gabarit/données : le tiret ASCII est un placeholder');
// Le gabarit vide ses cellules avec un tiret ASCII « - », que DASH_ONLY
// (qui ne couvre que les tirets typographiques) ne rejettait pas : une valeur
// comme « 300 x 168.8 mm- » passait pour renseignée. Attention : un tiret en
// BORD suivi d'un chiffre est un signe moins légitime (« -20 degC »), pas un
// placeholder.
assertEqual(isFilledSlot('-'), false, 'trait d’union isolé = placeholder');
assertEqual(isFilledSlot('—'), false, 'tiret cadratin = placeholder');
assertEqual(isFilledSlot('-20 degC a +50 degC'), true, 'signe moins légitime conservé');
assertEqual(isFilledSlot('100-240 V'), true, 'plage de tension = donnée');

section('Regression : variantes saisies entre crochets');
{
  // Le gabarit ecrit le nom de variante sur DEUX lignes : `[ Modele` puis
  // `1 ]`. Une fois rempli, les crochets subsistent - c'est exactement ce que
  // produit un PDF saisi par une personne, et c'est ce qui faisait perdre
  // toute la matrice des caracteristiques techniques.
  const parsed = parseProductFichePages([
    page(page1({ name: 'PXT FINE' })),
    page(page2()),
    page(
      page3({
        variantNames: ['[ PXT-1 ]', '[ PXT-2 ]', 'PXT-3', '[ PXT-4 ]'],
        centers: CENTERS4,
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Usage (in/out)', cells: ['Indoor', 'Indoor', 'Indoor', 'Indoor'] },
        ],
      })
    ),
    page(page4()),
  ]);
  const names = parsed.specs?.models.map((m) => m.name) ?? [];
  assertEqual(
    names,
    ['PXT-1', 'PXT-2', 'PXT-3', 'PXT-4'],
    'crochets du gabarit retires des noms de variante, ordre preserve'
  );
  assertEqual(
    parsed.specs?.models[0].specs.env,
    'Indoor',
    'valeur de la matrice affectee a la bonne variante'
  );
}

section('Regression : reference complete repartie sur les deux lignes du gabarit');
{
  // CAS REEL, geometrie du gabarit officiel. Le gabarit reserve DEUX lignes par
  // nom de variante (y=733 puis y=729) et pose « SPEC » a GAUCHE de la ligne
  // basse : cette ligne contient donc le libelle ET les fragments de nom.
  // Une reference qui deborde, comme « PXT-P1.25 », se retrouve coupee
  // « [ PXT-P1 » (y=733) / « .25 ] » (y=729).
  // Si la ligne basse est traitee comme une ligne de libelle, la reference est
  // tronquee et un fragment devient une variante fantome : c'est le symptome
  // « PXT-P1.25 transforme en 1.25 ».
  const parsed = parseProductFichePages([
    page(page1({ name: 'PXT FINE' })),
    page(page2()),
    page(
      page3({
        variantNames: [
          '[ PXT-P1 | .25 ]',
          '[ PXT-P2 | .60 ]',
          '[ PXT-P3 | .90 ]',
          '[ PXT-P4 | .50 ]',
        ],
        centers: CENTERS4,
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Usage (in/out)', cells: ['Indoor', 'Indoor', 'Outdoor', 'Outdoor'] },
          { y: 647, label: 'Pixel pitch', cells: ['1.25 mm', '1.9 mm', '2.6 mm', '3.9 mm'] },
        ],
      })
    ),
    page(page4()),
  ]);
  const names = parsed.specs?.models.map((m) => m.name) ?? [];
  assertEqual(
    names,
    ['PXT-P1.25', 'PXT-P2.60', 'PXT-P3.90', 'PXT-P4.50'],
    'reference recomposee sur deux lignes : complete, sans variante fantome'
  );
  assertEqual(
    parsed.specs?.models.map((m) => m.specs.pitch ?? null),
    ['1.25 mm', '1.9 mm', '2.6 mm', '3.9 mm'],
    'valeurs affectees a la bonne variante apres recomposition des en-tetes'
  );
  assertEqual(
    parsed.specs?.models.map((m) => m.specs.env ?? null),
    ['Indoor', 'Indoor', 'Outdoor', 'Outdoor'],
    'colonnes alignees sur les references recomposees'
  );
}

section('Regression : suite de tableau SANS en-tete repete');
{
  // Cas reel : la matrice deborde sur la page suivante et y rejoue des lignes de
  // caracteristiques sans repeter l'en-tete de variante. Ce bloc est alors
  // rejete comme « aucun en-tete de colonne detecte » et toutes ses valeurs
  // sont perdues : la page suivante n'apportait aucune donnee.
  const parsed = parseProductFichePages([
    page(page1({ name: 'PXT FINE' })),
    page(page2()),
    page(
      page3({
        variantNames: ['PXT-1', 'PXT-2', 'PXT-3', 'PXT-4'],
        centers: CENTERS4,
        rows: [
          { y: 707.5, group: 'GENERAL' },
          { y: 693, label: 'Usage (in/out)', cells: ['Indoor', 'Indoor', 'Indoor', 'Indoor'] },
          { y: 661.5, group: 'PHYSIQUE' },
          { y: 647, label: 'Pixel pitch', cells: ['1.25 mm', '1.56 mm', '1.9 mm', '2.5 mm'] },
        ],
      })
    ),
    // Page suivante : bandeau de section + lignes de caractéristiques, SANS la
    // ligne d'en-tête de variante du gabarit.
    page([
      [item(82.2, 700, 145.5, 10, 'CARACTERISTIQUES TECHNIQUES')],
      [item(48.7, 620, 60, 10, 'OPTIQUE')],
      specRow(606, 'Brightness', ['800 nits', '900 nits', '1000 nits', '1200 nits'], CENTERS4),
      specRow(592, 'Refresh rate', ['60 Hz', '60 Hz', '120 Hz', '120 Hz'], CENTERS4),
    ]),
    page(page4()),
  ]);
  const models = parsed.specs?.models ?? [];
  assertEqual(models.length, 4, 'les 4 variantes de la premiere page sont conservees');
  assertEqual(
    models.map((m) => m.specs.brightness ?? null),
    ['800 nits', '900 nits', '1000 nits', '1200 nits'],
    'page de suite sans en-tête : valeurs affectées aux bonnes variantes'
  );
  assertEqual(
    models.map((m) => m.specs.refresh ?? null),
    ['60 Hz', '60 Hz', '120 Hz', '120 Hz'],
    'page de suite : seconde ligne également lue'
  );
  assertEqual(
    (parsed.specs?.groups ?? []).map((g) => g.id),
    ['general', 'physical', 'optical'],
    'le groupe de la page de suite est conservé'
  );
}

section('Régression : un nom de fichier n\'est jamais un titre');
{
  // Un fichier tapé dans la zone « EMPLACEMENT MEDIA » ne doit pas devenir
  // le titre du média, ni le nom d'un projet terrain.
  const parsed = parseProductFichePages([
    page(page1({ name: 'PXT FINE', hook: 'Un Mur LED', techs: [['ColdLED', 'Technologie LED']] })),
    page(page2()),
    page(page3({ variantNames: ['PXT-1'], centers: [140.6], rows: [] })),
    page(page4()),
  ]);
  const videoTitle = parsed.overview?.video?.title;
  assertTrue(
    videoTitle === undefined || !/\.(jpe?g|png|mp4)$/i.test(videoTitle),
    `aucun nom de fichier comme titre de média (obtenu : ${videoTitle})`
  );
  for (const project of parsed.fieldwork?.projects ?? []) {
    assertTrue(
      !/\.(jpe?g|png|mp4)$/i.test(project.name),
      `aucun nom de fichier comme nom de projet (obtenu : ${project.name})`
    );
  }
}

section('Régression : le placeholder de navigation n\'est pas une navigation');
{
  const parsed = parseProductFichePages([
    page(page1({ name: 'PXT FINE' })),
    page(page2()),
    page(page3({ variantNames: ['PXT-1'], centers: [140.6], rows: [] })),
    page(page4()),
  ]);
  assertEqual(
    parsed.seriesNavigation,
    undefined,
    '[ nom | url ] du gabarit ne devient pas une navigation série'
  );
}

// ===========================================================================
// 10. PDF RÉEL — le gabarit vierge ne doit produire AUCUNE donnée
// ===========================================================================

section('PDF officiel réel (gabarit vierge) : extraction + zéro donnée');
{
  const pdfPath = resolve(process.cwd(), 'docs/product-system/fiche-technique-modele.pdf');
  const bytes = new Uint8Array(readFileSync(pdfPath));
  const layout = await extractProductPdfLayout(bytes);
  assertEqual(layout.length, 4, 'les 4 pages du PDF sont extraites');

  const fiche = parseProductFichePages(layout);
  const dataKeys = Object.keys(fiche).filter((k) => k !== 'warnings');
  assertEqual(dataKeys, [], 'aucune donnée produite depuis le gabarit vierge');
  assertEqual(fiche.markets, undefined, 'aucun marché inventé');
  assertEqual(fiche.overview, undefined, 'aucun aperçu inventé');
  assertEqual(fiche.specs, undefined, 'aucune matrice inventée');
  assertEqual(
    fiche.warnings.some((w) => w.includes('Nom de produit')),
    true,
    'avertissement « nom de produit introuvable » émis'
  );
  // La matrice du gabarit vide dessine 9 colonnes placeholder : elles doivent
  // être détectées PUIS rejetées, jamais converties en 9 variantes.
  assertEqual(
    fiche.warnings.some((w) => w.includes('9 colonne')),
    true,
    'les 9 colonnes placeholder du gabarit sont comptées puis ignorées'
  );

  const product = await parseProductPdf(bytes);
  assertEqual(product, null, 'parseProductPdf() retourne null sur le gabarit vierge');
}

// ===========================================================================
// Règles d'affichage : ce que la page publique a le droit de montrer.
// Une section sans donnée doit disparaître, jamais être remplie par le texte
// d'un autre produit. Ces règles sont testées comme le parser, parce qu'elles
// sont la frontière entre « donnée absente » et « donnée affichée ».
// ===========================================================================
section('Affichage : une section vide est masquée, jamais complétée');
assertEqual(hasOverview(undefined), false, 'aperçu absent → masqué');
assertEqual(hasOverview({}), false, 'aperçu vide → masqué');
assertEqual(hasOverview({ eyebrow: '01 / APERÇU' }), false, 'eyebrow seul ne suffit pas');
assertEqual(
  hasOverview({ description: 'Texte réel.' }),
  true,
  'description présente → section rendue'
);
assertEqual(hasOverview({ stats: [{ value: '50%', label: 'x' }] }), true, 'stat présente');
assertEqual(hasDesign({}), false, 'conception vide → masquée');
assertEqual(hasDesign({ depth: '90 mm' }), true, 'profondeur présente');
assertEqual(hasFeatures({ items: [] }), false, 'points forts sans item → masqués');
assertEqual(
  hasFeatures({ items: [{ title: 'Points forts' }] }),
  true,
  'un point fort suffit'
);
assertEqual(hasSpecs({ groups: [], models: [] }), false, 'matrice vide → masquée');
assertEqual(
  hasSpecs({ groups: [], models: [{ name: 'A', specs: {} }] }),
  true,
  'une variante suffit à rendre la matrice'
);
assertEqual(hasFieldwork({ projects: [] }), false, 'aucun projet → masqué');
assertEqual(hasFieldwork({ projects: [{ title: 'Paris' }] }), true, 'un projet');
assertEqual(hasNext({}), false, 'CTA vide → masqué');
assertEqual(hasNext({ next: { name: 'XR Series' } }), true, 'série suivante nommée');

section('Affichage : un média sans titre compte quand il a un fichier');
assertEqual(
  hasOverview({ video: { url: '/uploads/demo.mp4' } }),
  true,
  'vidéo avec URL seule → section rendue'
);
assertEqual(
  hasOverview({ photo: { url: '/uploads/photo.jpg' } }),
  true,
  'photo avec URL seule → section rendue'
);
assertEqual(
  hasOverview({ video: { sources: [{ src: '/uploads/a.webm' }] } }),
  true,
  'sources vidéo seules → section rendue'
);
assertEqual(hasOverview({ video: { title: '—', url: '' } }), false, 'média vide → masqué');
assertEqual(hasFeatures({ items: [], visual: { url: '/uploads/v.jpg' } }), true, 'visuel avec URL');
assertEqual(
  hasFeatures({ items: [], visual: { title: 'Visuel produit' } }),
  true,
  'visuel décrit sans fichier → signalé, section rendue'
);
assertEqual(
  hasNext({ next: { url: '/web/product/xr-series' } }),
  true,
  'série suivante navigable sans nom → section rendue'
);

section('Affichage : un tiret de gabarit ne suffit pas à rendre une section');
assertEqual(hasOverview({ title: '—' }), false, 'titre « — » seul → masqué');
assertEqual(hasOverview({ stats: [{ value: '—', label: '—' }] }), false, 'stat vide → masquée');
assertEqual(hasDesign({ moduleDim: '—', cabinetDim: '—', depth: '—' }), false, 'cotes vides');
assertEqual(hasDesign({ title: '[ TITRE ]' }), false, 'slot de gabarit → masqué');
assertEqual(hasFeatures({ title: '—', items: [] }), false, 'features vides → masquées');
assertEqual(
  hasSpecs({ groups: [], models: [{ name: '', specs: { a: '—' } }] }),
  false,
  'variante sans nom ni valeur → matrice masquée'
);
assertEqual(
  hasSpecs({ groups: [], models: [{ name: '', specs: { a: 'PENDING' } }] }),
  true,
  'PENDING est une valeur affichable'
);
assertEqual(
  hasFieldwork({ title: '—', projects: [{ title: '—' }] }),
  false,
  'projet vide → masqué'
);
assertEqual(hasNext({ headline: '—', cta: '—' }), false, 'CTA en tirets → masqué');

section('Affichage : un tiret de gabarit n’est pas une valeur');
assertEqual(text('PXT Fine'), 'PXT Fine', 'texte normal conservé');
assertEqual(text('  600×337.5 mm  '), '600×337.5 mm', 'espaces normalisés');
assertEqual(text('—'), undefined, 'tiret cadratin = pas de valeur');
assertEqual(text('–'), undefined, 'tiret demi-cadratin = pas de valeur');
assertEqual(text('-'), undefined, 'trait d’union isolé = pas de valeur');
assertEqual(text('[ À COMPLÉTER ]'), undefined, 'slot de gabarit = pas de valeur');
assertEqual(text('PENDING'), 'PENDING', 'PENDING est une valeur affichable');
assertEqual(text(''), undefined, 'chaîne vide');
assertEqual(text(undefined), undefined, 'valeur absente');
assertEqual(text(null), undefined, 'null toléré');
assertEqual(
  texts(['a', '—', undefined, '  ', 'b']),
  ['a', 'b'],
  'texts() ne conserve que les valeurs réelles'
);

section('Affichage : cotes du plan issues du produit');
assertEqual(dimensionOnly('600×337.5 mm'), '600×337.5', 'unité retirée pour le schéma');
assertEqual(dimensionOnly('90'), '90', 'cote sans unité conservée');
assertEqual(dimensionOnly('—'), undefined, 'cote absente → pas d’annotation');
assertEqual(dimensionForArt('29.5 mm'), '29.5', 'profondeur en art');
assertEqual(dimensionForArt('1.2–3.1 mm'), '1.2–3.1', 'plage de pitch en art');
assertEqual(dimensionForArt(undefined), undefined, 'cote absente → schéma sans cote');

// ===========================================================================
// 9 quater. VISIBILITÉ D'UNE LIGNE — le template définit la structure, le PDF
// les valeurs. Une ligne dont AUCUNE variante ne porte de valeur n'a rien à
// dire : l'afficher donnait un tableau de libellés suivis de tirets, soit
// l'illusion d'une caractéristique relevée alors qu'aucune valeur n'existe.
// C'est aussi ce que produit `cabRes` sur les fiches où le relevé de
// résolution de armoire n'a pas été fait : la ligne doit disparaître, pas
// mentir.
// ===========================================================================

section('Visibilité des lignes : au moins une valeur réelle, sinon rien');
{
  const variants = [
    { name: 'PXT-U1.2', specs: { pitch: '1.2 mm', brightness: '1 000 nits' } },
    { name: 'PXT-U1.5', specs: { pitch: '1.5 mm' } },
  ];
  assertEqual(specRowHasValue(variants, 'pitch'), true, 'ligne renseignée partout → visible');
  assertEqual(specRowHasValue(variants, 'brightness'), true, 'ligne renseignée par UNE variante → visible');
  assertEqual(specRowHasValue(variants, 'cabRes'), false, 'aucune variante → ligne masquée');
  assertEqual(specRowHasValue(variants, 'ip'), false, 'clé absente → ligne masquée');
  // Un tiret seul, quel que soit son glyphe, n'est pas une valeur : c'est le
  // placeholder du gabarit. Sans ce filtre, une ligne « relevée puis vide »
  // resterait affichée.
  assertEqual(specRowHasValue([{ specs: { weight: '—' } }], 'weight'), false, 'tiret cadratin → ligne masquée');
  assertEqual(specRowHasValue([{ specs: { weight: '-' } }], 'weight'), false, 'tiret ASCII → ligne masquée');
  assertEqual(specRowHasValue([{ specs: { weight: '   ' } }], 'weight'), false, 'espaces seules → ligne masquée');
  assertEqual(
    specRowHasValue([{ specs: { weight: '-' } }, { specs: { weight: '28 kg' } }], 'weight'),
    true,
    'une seule variante renseignée suffit → ligne visible'
  );
  // PENDING est une donnée, pas une absence.
  assertEqual(specRowHasValue([{ specs: { scan: 'PENDING' } }], 'scan'), true, 'PENDING → ligne visible');
  // Garde-fous de signature.
  assertEqual(specRowHasValue(undefined, 'pitch'), false, 'aucun modèle → ligne masquée');
  assertEqual(specRowHasValue([], 'pitch'), false, 'liste vide → ligne masquée');
  assertEqual(specRowHasValue([{ specs: { pitch: 42 as never } }], 'pitch'), false, 'valeur non textuelle → masquée');
}

console.log(`\n${assertions - failures}/${assertions} assertions passées.`);
if (failures > 0) {
  console.error(`\n${failures} ÉCHEC(S).`);
  process.exit(1);
}
console.log('Parser de fiche technique : OK.');
