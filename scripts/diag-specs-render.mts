/**
 * DIAGNOSTIC — NE PAS COMMITTER.
 *
 * Reproduit le chemin de rendu de `SpecsSection` hors navigateur et compte les
 * lignes à chaque étape :
 *   PDF -> parser/build (Record<string,string>) -> toSpecModel (SpecValue)
 *   -> specRowHasValue -> groups -> DOM.
 *
 * Aucune écriture : ce script n'import aucun client Firestore.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpecsSection } from '@/web/components/SpecsSection';
import { specRowHasValue, hasSpecs, text } from '@/lib/products/display';

// Structure du master — 5 groupes / 21 lignes (product-from-template.ts:151).
const MASTER = [
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

// Charge utile Ultra-shaped : ce que le parser et le build produisent réellement,
// c'est-à-dire des STRING brutes dans `specs.models[].specs`.
const MODELS = [
  { name: 'PXT-U1.2', tag: 'DATASHEET', specs: {
    env: 'Indoor', arrangement: 'COB (Chip-on-Board)', pitch: '1.2 mm',
    moduleDim: '300 x 168.8 mm', cabDim: '600 x 337.5 mm',
    brightness: '1000 nits', refresh: '3840 Hz', angle: '140 deg / 140 deg',
    maxPower: '135 W', avgPower: '45 W', powerSource: '100-240 V',
    signal: 'HDMI', ip: 'IP30',
  }},
  { name: 'PXT-U1.5', tag: 'DATASHEET', specs: {
    env: 'Indoor', arrangement: 'COB (Chip-on-Board)', pitch: '1.5 mm',
    cabRes: '-', cabDim: '600 x 337.5 mm', moduleDim: '300 x 168.8 mm',
    brightness: '1000 nits', refresh: '3840 Hz', angle: '140 deg / 140 deg',
    maxPower: '135 W', avgPower: '45 W', powerSource: '100-240 V',
    signal: 'HDMI', ip: 'IP30',
  }},
  { name: 'PXT-U1.8', tag: 'DATASHEET', specs: {
    env: 'Indoor', arrangement: 'COB (Chip-on-Board)', pitch: '1.8 mm',
    moduleDim: '300 x 168.8 mm', cabDim: '600 x 337.5 mm',
    brightness: '1000 nits', refresh: '3840 Hz', angle: '140 deg / 140 deg',
    maxPower: '135 W', avgPower: '45 W', powerSource: '100-240 V',
    signal: 'HDMI', ip: 'IP30',
  }},
];

const specs: any = { groups: MASTER, models: MODELS };
const rows = MASTER.flatMap((g) => g.rows);

// --- A. Vérité terrain, calculée sur les STRING brutes -----------------------
const truthKeys = rows.filter((r) => MODELS.some((m) => Boolean(text(m.specs[r.key])))).map((r) => r.key);

// --- B. Ce que le composant calcule réellement ------------------------------
// Copie exacte de SpecsSection.tsx:33-39.
function toSpecModel(model: any) {
  const s: any = {};
  for (const [key, value] of Object.entries(model.specs || {})) {
    s[key] = typeof value === 'string' ? { v: value } : value;
  }
  return { name: model.name, tag: model.tag || 'DATASHEET', specs: s };
}
const converted: any[] = MODELS.map(toSpecModel);
const keptKeys = rows.filter((r) => specRowHasValue(converted, r.key)).map((r) => r.key);

// --- C. Contrôle : le même helper appelé sur les modèles BRUTS --------------
const keptIfRaw = rows.filter((r) => specRowHasValue(MODELS as any, r.key)).map((r) => r.key);

// --- D. DOM réellement produit par le composant ------------------------------
const html = renderToStaticMarkup(React.createElement(SpecsSection as any, { specs, lang: 'FR' }));
const count = (cls: string) => (html.match(new RegExp(`class="${cls}"`, 'g')) ?? []).length;

console.log('=== DIAGNOSTIC SpecsSection ===');
console.log('A. lignes du master                 :', rows.length);
console.log('A. lignes avec >=1 valeur reelle    :', truthKeys.length);
console.log('B. lignes retenues par le composant :', keptKeys.length);
console.log('C. lignes si helper sur modeles bruts:', keptIfRaw.length);
console.log('   (C liste = verite terrain ?        ', JSON.stringify(keptIfRaw) === JSON.stringify(truthKeys), ')');
console.log('D. DOM .spec-row  (lignes reelles)   :', count('spec-row'));
console.log('D. DOM .spec-head (entetes variantes):', count('spec-head'));
console.log('D. DOM .spec-val  (cellules)         :', count('spec-val'));
console.log('hasSpecs(specs)                       :', hasSpecs(specs));
console.log('exemple valeur convertie PXT-U1.2.pitch:', JSON.stringify(converted[0].specs.pitch));
console.log('valeurs A:', truthKeys.join(', '));
console.log('valeurs B:', keptKeys.length ? keptKeys.join(', ') : '(aucune)');
