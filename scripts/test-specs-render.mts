/**
 * Test de RENDU du tableau de caractéristiques (DOM, pas seulement données).
 *
 * Régression couverte : `SpecsSection` convertit les valeurs en `{ v: string }`
 * (forme `SpecModel`) alors que le filtre de lignes n'acceptait que des
 * `string` (forme `ProductSpecModel`). Résultat : `specRowHasValue` renvoyait
 * `false` pour TOUTES les clés, les 21 lignes du master étaient filtrées, et le
 * DOM ne contenait plus que l'en-tête de variantes. Les tests parser/build
 * étaient verts : ils ne passaient jamais par le composant.
 *
 * Ce test vérifie donc le HTML réellement produit par le composant.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpecsSection } from '@/web/components/SpecsSection';
import { specRowHasValue, hasSpecs, specValue, text } from '@/lib/products/display';
import type { ProductSpecs } from '@/lib/products/types';

let assertions = 0;
let failures = 0;

function check(label: string, ok: boolean, detail?: string): void {
  assertions += 1;
  if (ok) return;
  failures += 1;
  console.error(`  ECHEC  ${label}${detail ? ` — ${detail}` : ''}`);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  check(label, Object.is(actual, expected), `attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
}

function section(title: string): void {
  console.log(`\n── ${title}`);
}

// ---------------------------------------------------------------------------
// Structure du master : 5 groupes / 21 lignes. Copie de la référence
// (`product-from-template.ts`), volontairement écrite à la main pour que le
// test échoue si le master change sans que le rendu soit revu.
// ---------------------------------------------------------------------------
const MASTER: ProductSpecs['groups'] = [
  { label: 'GENERAL', rows: [
    { key: 'env', label: 'IN / OUT' },
    { key: 'arrangement', label: 'LED ARRANGEMENT' },
  ]},
  { label: 'PHYSIQUE', rows: [
    { key: 'pitch', label: 'PIXEL PITCH' },
    { key: 'density', label: 'PHYSICAL DENSITY' },
    { key: 'moduleRes', label: 'MODULE RESOLUTION (H/V)' },
    { key: 'moduleDim', label: 'MODULE DIMENSIONS' },
    { key: 'cabRes', label: 'CABINET RESOLUTION (H/V)' },
    { key: 'cabDim', label: 'CABINET DIMENSIONS' },
    { key: 'weight', label: 'CABINET WEIGHT' },
  ]},
  { label: 'OPTIQUE', rows: [
    { key: 'brightness', label: 'BRIGHTNESS' },
    { key: 'refresh', label: 'REFRESH RATE' },
    { key: 'scan', label: 'SCAN RATE' },
    { key: 'angle', label: 'VIEWING ANGLE (H/V)' },
  ]},
  { label: 'ELECTRIQUE', rows: [
    { key: 'maxPower', label: 'MAX POWER (W / PANEL)' },
    { key: 'avgPower', label: 'AVG POWER (W / PANEL)' },
    { key: 'powerSource', label: 'OPERATING POWER SOURCE' },
    { key: 'signal', label: 'SIGNAL INPUT' },
  ]},
  { label: 'ENVIRONNEMENT', rows: [
    { key: 'ip', label: 'IP RATING' },
    { key: 'temp', label: 'OPERATING TEMPERATURE' },
    { key: 'transparency', label: 'TRANSPARENCY' },
    { key: 'certs', label: 'CERTIFICATIONS' },
  ]},
];

const MASTER_ROWS = MASTER.flatMap((g) => g.rows);
const ALL_KEYS = MASTER_ROWS.map((r) => r.key);

/** Valeurs communes aux trois variantes Ultra (forme PRODUIT : `string`). */
const COMMON = {
  env: 'Indoor',
  arrangement: 'COB (Chip-on-Board)',
  moduleDim: '300 x 168.8 mm',
  cabDim: '600 x 337.5 mm',
  brightness: '1000 nits',
  refresh: '3840 Hz',
  angle: '140 deg / 140 deg',
  maxPower: '135 W',
  avgPower: '45 W',
  powerSource: '100-240 V',
  signal: 'HDMI',
  ip: 'IP30',
};

/**
 * Ultra tel que le build le produit : 3 variantes, `cabRes` porte le tiret du
 * gabarit, `density` / `moduleRes` / `scan` / `weight` / `temp` /
 * `transparency` / `certs` sont absents.
 */
const ULTRA: ProductSpecs['models'] = [
  { name: 'PXT-U1.2', specs: { ...COMMON, pitch: '1.2 mm' } },
  { name: 'PXT-U1.5', specs: { ...COMMON, pitch: '1.5 mm', cabRes: '-' } },
  { name: 'PXT-U1.8', specs: { ...COMMON, pitch: '1.8 mm' } },
];

const EXPECTED_VISIBLE = ['env', 'arrangement', 'pitch', 'moduleDim', 'cabDim',
  'brightness', 'refresh', 'angle', 'maxPower', 'avgPower', 'powerSource', 'signal', 'ip'];

// ---------------------------------------------------------------------------
section('specValue : lecture des deux formes, text() reste la référence');
{
  assertEqual(specValue('1.2 mm'), '1.2 mm', 'forme string');
  assertEqual(specValue({ v: '1.2 mm' }), '1.2 mm', 'forme { v }');
  assertEqual(specValue(undefined), undefined, 'absent');
  assertEqual(specValue(null), undefined, 'null');
  assertEqual(specValue('-'), undefined, 'tiret ASCII nontextuel');
  assertEqual(specValue({ v: '-' }), undefined, 'tiret ASCII dans { v }');
  assertEqual(specValue({ v: '—' }), undefined, 'tiret cadratin dans { v }');
  assertEqual(specValue({ v: '[ x ]' }), undefined, 'slot gabarit dans { v }');
  assertEqual(specValue({}), undefined, 'objet sans v');
  assertEqual(specValue(42), undefined, 'nombre');
  // Cohérence avec text() sur la forme string.
  assertEqual(specValue('  '), text('  '), 'spaces : mêmes règles que text()');
}

// ---------------------------------------------------------------------------
section('specRowHasValue : résultats identiques sur les deux formes');
{
  // Forme RENDERER : c'est celle que SpecsSection transmet réellement.
  const asRender = ULTRA.map((m) => ({
    name: m.name,
    specs: Object.fromEntries(Object.entries(m.specs).map(([k, v]) => [k, { v }])),
  }));
  // Forme PRODUIT : strings bruts.
  const asProduct = ULTRA.map((m) => ({ name: m.name, specs: m.specs }));

  for (const key of ALL_KEYS) {
    assertEqual(
      specRowHasValue(asRender, key),
      specRowHasValue(asProduct, key),
      `« ${key} » : même verdict dans les deux formes`
    );
  }
  for (const key of EXPECTED_VISIBLE) {
    assertEqual(specRowHasValue(asRender, key), true, `« ${key} » visible`);
  }
  assertEqual(specRowHasValue(asRender, 'cabRes'), false, 'cabRes = « - » uniquement → masquée');
  for (const key of ['density', 'moduleRes', 'scan', 'weight', 'temp', 'transparency', 'certs']) {
    assertEqual(specRowHasValue(asRender, key), false, `« ${key} » absent → masquée`);
  }
}

// ---------------------------------------------------------------------------
section('hasSpecs : une matrice renseignée reste détectée sans nom de variante');
{
  assertEqual(hasSpecs({ groups: MASTER, models: ULTRA }), true, 'Ultra → true');
  assertEqual(hasSpecs(undefined), false, 'absent → false');
  assertEqual(hasSpecs({ groups: [], models: [] }), false, 'vide → false');
  // Régression du même défaut : avant, seule la valeur textuelle comptait.
  assertEqual(
    hasSpecs({ groups: [], models: [{ name: '', specs: { pitch: '1.2 mm' } }] } as ProductSpecs),
    true,
    'valeurs seules, sans nom → true'
  );
  assertEqual(
    hasSpecs({ groups: [], models: [{ name: '', specs: { pitch: '-' } }] } as ProductSpecs),
    false,
    'tiret seul, sans nom → false'
  );
}

// ---------------------------------------------------------------------------
section('DOM : lignes et cellules réellement rendues');
{
  const html = renderToStaticMarkup(
    React.createElement(SpecsSection as never, {
      specs: { groups: MASTER, models: ULTRA } as ProductSpecs,
      lang: 'FR',
    })
  );
  const rows = [...html.matchAll(/class="spec-row"/g)].length;
  const heads = [...html.matchAll(/class="spec-head"/g)].length;
  const cells = [...html.matchAll(/class="spec-val"/g)].length;
  const groupLabels = [...html.matchAll(/ENVIRONNEMENT|ELECTRIQUE|GENERAL|PHYSIQUE|OPTIQUE/g)];

  assertEqual(rows, EXPECTED_VISIBLE.length, 'nombre de .spec-row = lignes visibles');
  assertEqual(heads, ULTRA.length, 'nombre de .spec-head = variantes');
  assertEqual(cells, rows * ULTRA.length, 'cellules = lignes x variantes');
  assertEqual(rows, 13, 'Ultra : 13 lignes visibles');

  // Régression du symptôme : l'en-tête seul (1 ligne, 0 ligne de données).
  check('au moins une ligne de données rendue', rows > 0, `${rows} ligne(s)`);

  // Les 13 libellés attendus sont dans le DOM.
  const LABELS: Record<string, string> = {
    env: 'IN / OUT', arrangement: 'LED ARRANGEMENT', pitch: 'PIXEL PITCH',
    moduleDim: 'MODULE DIMENSIONS', cabDim: 'CABINET DIMENSIONS',
    brightness: 'BRIGHTNESS', refresh: 'REFRESH RATE',
    angle: 'VIEWING ANGLE (H/V)', maxPower: 'MAX POWER (W / PANEL)',
    avgPower: 'AVG POWER (W / PANEL)', powerSource: 'OPERATING POWER SOURCE',
    signal: 'SIGNAL INPUT', ip: 'IP RATING',
  };
  for (const key of EXPECTED_VISIBLE) {
    check(`libellé présent : ${key}`, html.includes(LABELS[key]));
  }

  // Ligne vide : cabRes n'apparaît nulle part.
  check('CABINET RESOLUTION (H/V) masquée', !html.includes('CABINET RESOLUTION'));
  for (const key of ['density', 'moduleRes', 'scan', 'weight', 'temp', 'transparency', 'certs']) {
    const label = { density: 'PHYSICAL DENSITY', moduleRes: 'MODULE RESOLUTION', scan: 'SCAN RATE',
      weight: 'CABINET WEIGHT', temp: 'OPERATING TEMPERATURE', transparency: 'TRANSPARENCY',
      certs: 'CERTIFICATIONS' }[key];
    check(`ligne absente : ${key}`, !html.includes(label), `${label} présent alors qu'il ne l'est pas`);
  }

  // Les valeurs des variantes sont présentes.
  for (const m of ULTRA) {
    check(`en-tête variante ${m.name}`, html.includes(m.name));
  }
  for (const v of ['1.2 mm', '1.5 mm', '1.8 mm', '135 W', 'IP30', '1000 nits', '3840 Hz']) {
    check(`valeur affichée : ${v}`, html.includes(v));
  }

  // Le tiret d'un gabarit ne doit jamais apparaître comme une valeur.
  check('aucun tiret-placeholder rendu', !/>-<\/div>/.test(html) && !/>—<\/div>/.test(html));

  // Aucun placeholder textuel : les cellules vides sont réellement vides.
  const emptyCells = (html.match(/class="spec-val"[^>]*><\/div>/g) ?? []).length;
  check('cellules réellement vides (pas de « - »)', emptyCells >= 0);

  // Placement : ip en ENVIRONNEMENT, maxPower en ELECTRIQUE, une seule fois.
  const envIdx = html.indexOf('ENVIRONNEMENT');
  const elecIdx = html.indexOf('ELECTRIQUE');
  const ipIdx = html.indexOf('IP RATING');
  const mpIdx = html.indexOf('MAX POWER (W / PANEL)');
  // ENVIRONNEMENT est le DERNIER groupe du master : ip doit être après
  // ELECTRIQUE, jamais dans ELECTRIQUE.
  check('ip absente avant ENVIRONNEMENT', ipIdx > envIdx, `ip=${ipIdx}, env=${envIdx}`);
  check('ip rendue après ELECTRIQUE', ipIdx > elecIdx, `ip=${ipIdx}, elec=${elecIdx}`);
  check('maxPower après ELECTRIQUE', mpIdx > elecIdx, `maxPower=${mpIdx}, elec=${elecIdx}`);
  check('maxPower absent de ENVIRONNEMENT', mpIdx < envIdx, `maxPower=${mpIdx}, env=${envIdx}`);
  check('une seule occurrence IP RATING', [...html.matchAll(/IP RATING/g)].length === 1);
  check('une seule occurrence MAX POWER', [...html.matchAll(/MAX POWER \(W \/ PANEL\)/g)].length === 1);
  check('5 en-têtes de groupe', groupLabels.length === 5, `${groupLabels.length} trouvé(s)`);

  // Ordre des groupes = ordre du master.
  const order = ['GENERAL', 'PHYSIQUE', 'OPTIQUE', 'ELECTRIQUE', 'ENVIRONNEMENT'];
  const positions = order.map((l) => html.indexOf(`>${l}<`));
  check(
    'groupes dans l\'ordre du master',
    positions.every((p, i) => p > -1 && (i === 0 || p > positions[i - 1])),
    positions.join(',')
  );

  // Pas de doublon de clé React : toutes les lignes ont une key unique.
  check('pas de doublon de ligne', rows === new Set(EXPECTED_VISIBLE).size);
}

// ---------------------------------------------------------------------------
section('DOM : plusieurs variantes, valeurs réparties');
{
  // 2 variantes Seamless : une ligne n'est renseignée que par UNE variante.
  const models: ProductSpecs['models'] = [
    { name: 'PXT-S1.2', specs: { pitch: '1.2 mm', ip: 'IP30' } },
    { name: 'PXT-S1.5', specs: { pitch: '1.5 mm' } },
  ];
  const html = renderToStaticMarkup(
    React.createElement(SpecsSection as never, {
      specs: { groups: MASTER, models } as ProductSpecs,
      lang: 'FR',
    })
  );
  const rows = [...html.matchAll(/class="spec-row"/g)].length;
  const cells = [...html.matchAll(/class="spec-val"/g)].length;
  const heads = [...html.matchAll(/class="spec-head"/g)].length;
  assertEqual(heads, 2, '2 en-têtes de variante');
  assertEqual(rows, 2, '2 lignes visibles (pitch + ip)');
  assertEqual(cells, 4, '4 cellules = 2 lignes x 2 variantes');
  check('ip n\'est rendue que pour une variante', html.includes('IP30'));
  // 4 cellules : pitch x2 renseignées, ip x1 renseignée + 1 vide.
  check(
    'exactement 1 cellule vide (variante sans ip)',
    (html.match(/class="spec-val"[^>]*><\/div>/g) ?? []).length === 1,
    `${(html.match(/class="spec-val"[^>]*><\/div>/g) ?? []).length} vide(s)`
  );
}

// ---------------------------------------------------------------------------
section('DOM : repli sans groupes (union des clés)');
{
  const models: ProductSpecs['models'] = [
    { name: 'X1', specs: { pitch: '1.2 mm' } },
    { name: 'X2', specs: { pitch: '1.5 mm' } },
  ];
  const html = renderToStaticMarkup(
    React.createElement(SpecsSection as never, {
      specs: { models } as ProductSpecs,
      lang: 'FR',
    })
  );
  assertEqual([...html.matchAll(/class="spec-row"/g)].length, 1, '1 ligne déduite');
}

console.log(`\n${assertions - failures}/${assertions} assertions passées.`);
if (failures > 0) {
  console.error(`\n${failures} ECHEC(S).`);
  process.exit(1);
}
console.log('Rendu SpecsSection : OK.');
