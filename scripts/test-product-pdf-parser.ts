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
  const rowsOut: PdfTextItem[][] = [
    [item(82.2, 796, 145.5, 10, 'CARACTERISTIQUES TECHNIQUES')],
    [
      item(48.5, 779.5, 24.5, 22, '04'),
      item(82.2, 779.5, 100.4, 14, '[ Titre section ]'),
    ],
    [item(82.2, 767.5, 258.1, 9, 'Renseigner 1 colonne par modele/variante (3 à 10 recommandé)')],
    // Le libellé « SPEC » est sur SA propre ligne (y=729), sous les en-têtes (y=733).
    [item(70.3, 729, 18.5, 6.8, 'SPEC')],
    [variantNames.map((name, i) => item(centers[i] - 20.5, 733, 41, 6.8, name))].flat(),
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

console.log(`\n${assertions - failures}/${assertions} assertions passées.`);
if (failures > 0) {
  console.error(`\n${failures} ÉCHEC(S).`);
  process.exit(1);
}
console.log('Parser de fiche technique : OK.');
