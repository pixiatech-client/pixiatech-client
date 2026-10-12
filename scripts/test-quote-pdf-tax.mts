/**
 * Tests de la correction TVA du PDF de devis (QuotePDF).
 *
 * Contexte : la page de résultat affichait des montants TTC tandis que le PDF
 * mélangeait lignes HT et total TTC (sous étiquette HT). Cette correction
 * centralise la base fiscale dans `applyTaxMode` (pricing-engine) et
 * `computeQuotePdfAmounts` (lib/quote-pdf-amounts), partagés avec le PDF.
 *
 * Exécution : npm run test:quote-pdf-tax
 *             (ou) tsx scripts/test-quote-pdf-tax.mts
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuotePDF } from '@/app/admin/quote-pdf';
import {
  applyTaxMode,
  isTaxDisplayInclusive,
  taxDisplayMultiplier,
  type TaxDisplayConfig,
} from '@/lib/pricing-engine';
import { computeQuotePdfAmounts } from '@/lib/quote-pdf-amounts';

let failures = 0;
let assertions = 0;

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  assertions++;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS | ${label}`);
  } else {
    failures++;
    console.log(`  FAIL | ${label} => attendu ${e}, obtenu ${a}`);
  }
}

function assertTrue(ok: boolean, label: string): void {
  assertEqual(ok, true, label);
}

function section(title: string): void {
  console.log(`\n── ${title}`);
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €';

// ---------------------------------------------------------------------------
// Fixtures — cas de référence de l'audit (taux 20 %)
// ---------------------------------------------------------------------------
const HT_PRODUCTS = 4950;
const HT_DELIVERY = 99.99;
const HT_INSTALLATION = 320;
const HT_SUBTOTAL = 5369.99;
const TTC_PRODUCTS = 5940;
const TTC_DELIVERY = 119.99;
const TTC_INSTALLATION = 384;
const TTC_TOTAL = 6443.99;

function snapshotFixture(tax: { enabled: boolean; rate: number; mode: 'ht' | 'ttc' }, total: number) {
  return {
    version: 1,
    engineVersion: '1.0.0',
    calculatedAt: new Date(0).toISOString(),
    currency: 'EUR',
    transactionType: 'sale',
    destination: null,
    productsSubtotal: HT_PRODUCTS,
    delivery: { included: true, cost: HT_DELIVERY, reason: 'rule' },
    installation: { included: true, cost: HT_INSTALLATION, techniciansRequired: 1 },
    tax,
    subtotal: HT_SUBTOTAL,
    total,
    deposit: 0,
    paymentSchedule: [],
  } as any;
}

function requestFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'EST-TEST01',
    createdAt: new Date(0),
    status: 'pending',
    isRead: false,
    emailVerified: true,
    client: { companyName: 'Test Client', email: 'a@b.c', phone: '0', address: 'X', notes: '' },
    products: [
      { id: 'p1', productId: 'prod', productName: 'Écran LED', quantity: 1, width: 2, height: 1, lineTotal: HT_PRODUCTS, transactionType: 'sale' },
    ],
    installationCost: HT_INSTALLATION,
    deliveryCost: HT_DELIVERY,
    totalQuote: HT_SUBTOTAL,
    transactionType: 'sale',
    lang: 'fr',
    width: 2,
    height: 1,
    productName: 'Écran LED',
    includeInstallation: true,
    includeDelivery: true,
    techniciansRequired: 1,
    ...overrides,
  } as any;
}

const PDF_SETTINGS = {
  themeId: 'indigo',
  companyName: 'PIXIATECH',
  address: '1 rue Test',
  phone: '0102030405',
  email: 'contact@pixiatech.com',
  quoteTitle: 'DEV',
  quoteNumberPrefix: 'EST-',
} as any;

function renderPdf(request: any): string {
  return renderToStaticMarkup(
    React.createElement(QuotePDF as never, {
      id: 'test',
      request,
      settings: PDF_SETTINGS,
      selectedCity: null,
      globalSettings: {} as any,
      allProducts: [],
      specs: {},
    } as any),
  );
}

// ---------------------------------------------------------------------------
// 1. Helper partagé applyTaxMode (source de vérité unique)
// ---------------------------------------------------------------------------
section('1. applyTaxMode — conversion HT → base d\'affichage');
assertEqual(taxDisplayMultiplier({ enabled: true, rate: 20, mode: 'ttc' }), 1.2, 'multiplicateur TTC 20 % = 1,2');
assertEqual(taxDisplayMultiplier({ enabled: true, rate: 20, mode: 'ht' }), 1, 'mode HT → multiplicateur 1');
assertEqual(taxDisplayMultiplier({ enabled: false, rate: 20, mode: 'ttc' }), 1, 'TVA désactivée → multiplicateur 1');
assertEqual(applyTaxMode(HT_PRODUCTS, { enabled: true, rate: 20, mode: 'ttc' }), TTC_PRODUCTS, '4950 HT → 5940 TTC');
assertEqual(applyTaxMode(HT_DELIVERY, { enabled: true, rate: 20, mode: 'ttc' }), TTC_DELIVERY, '99,99 HT → 119,99 TTC (arrondi)');
assertEqual(applyTaxMode(HT_INSTALLATION, { enabled: true, rate: 20, mode: 'ttc' }), TTC_INSTALLATION, '320 HT → 384 TTC');
assertEqual(applyTaxMode(HT_SUBTOTAL, { enabled: true, rate: 20, mode: 'ttc' }), TTC_TOTAL, '5369,99 HT → 6443,99 TTC (arrondi)');
assertEqual(applyTaxMode(HT_PRODUCTS, { enabled: true, rate: 19, mode: 'ttc' }), 5890.5, 'autre taux 19 % appliqué');
assertEqual(applyTaxMode(HT_PRODUCTS, { enabled: false, rate: 20, mode: 'ttc' }), HT_PRODUCTS, 'TVA désactivée → HT inchangé');
assertEqual(isTaxDisplayInclusive({ enabled: true, rate: 20, mode: 'ttc' }), true, 'TTC inclusif détecté');
assertEqual(isTaxDisplayInclusive({ enabled: true, rate: 20, mode: 'ht' }), false, 'mode HT → non inclusif');

// ---------------------------------------------------------------------------
// 2. computeQuotePdfAmounts — chemin SNAPSHOT
// ---------------------------------------------------------------------------
section('2. computeQuotePdfAmounts — snapshot TVA activée, mode TTC 20 %');
{
  const a = computeQuotePdfAmounts(requestFixture({ priceSnapshot: snapshotFixture({ enabled: true, rate: 20, mode: 'ttc' }, TTC_TOTAL) }));
  assertEqual(a.isTtc, true, 'isTtc = true');
  assertEqual(a.subtotal, TTC_PRODUCTS, 'sous-total produits TTC');
  assertEqual(a.delivery, TTC_DELIVERY, 'livraison TTC');
  assertEqual(a.installation, TTC_INSTALLATION, 'installation TTC');
  assertEqual(a.total, TTC_TOTAL, 'total canonique TTC = 6443,99');
}

section('2b. applyTaxMode ne double jamais la TVA (entrée TTC interdite)');
{
  const cfg: TaxDisplayConfig = { enabled: true, rate: 20, mode: 'ttc' };
  assertEqual(applyTaxMode(TTC_PRODUCTS, cfg), 7128, '5940 déjà TTC × 1,2 = 7128 (preuve du risque de double TVA)');
  const amounts = computeQuotePdfAmounts(requestFixture({ priceSnapshot: snapshotFixture(cfg as any, TTC_TOTAL) }));
  assertEqual(amounts.subtotal, TTC_PRODUCTS, 'le PDF part du HT 4950 → 5940 (jamais 7128)');
}

section('2c. snapshot mode HT');
{
  const amounts = computeQuotePdfAmounts(
    requestFixture({ priceSnapshot: snapshotFixture({ enabled: true, rate: 20, mode: 'ht' }, HT_SUBTOTAL) }),
  );
  assertEqual(amounts.isTtc, false, 'mode HT → isTtc false');
  assertEqual(amounts.subtotal, HT_PRODUCTS, 'sous-total HT = 4950');
  assertEqual(amounts.total, HT_SUBTOTAL, 'total HT = 5369,99');
}

section('2d. snapshot TVA désactivée (mode ttc mais enabled false)');
{
  const amounts = computeQuotePdfAmounts(
    requestFixture({ priceSnapshot: snapshotFixture({ enabled: false, rate: 20, mode: 'ttc' }, HT_SUBTOTAL) }),
  );
  assertEqual(amounts.isTtc, false, 'TVA désactivée → isTtc false');
  assertEqual(amounts.subtotal, HT_PRODUCTS, 'aucune TVA appliquée');
  assertEqual(amounts.total, HT_SUBTOTAL, 'total = HT');
}

section('2e. snapshot — livraison / installation nulles');
{
  const snap = snapshotFixture({ enabled: true, rate: 20, mode: 'ttc' }, TTC_PRODUCTS);
  snap.delivery.cost = 0;
  snap.installation.cost = 0;
  const amounts = computeQuotePdfAmounts(requestFixture({ priceSnapshot: snap }));
  assertEqual(amounts.delivery, 0, 'livraison nulle → 0');
  assertEqual(amounts.installation, 0, 'installation nulle → 0');
  assertEqual(amounts.subtotal, TTC_PRODUCTS, 'produits restent TTC 5940');
}

section('2f. snapshot — plusieurs lignes produits (sous-total HT = 4950)');
{
  const amounts = computeQuotePdfAmounts(
    requestFixture({
      priceSnapshot: snapshotFixture({ enabled: true, rate: 20, mode: 'ttc' }, TTC_TOTAL),
      products: [
        { id: 'p1', productName: 'A', quantity: 1, width: 2, height: 1, lineTotal: 3000 },
        { id: 'p2', productName: 'B', quantity: 1, width: 1, height: 1, lineTotal: 1950 },
      ],
    }),
  );
  assertEqual(amounts.subtotal, TTC_PRODUCTS, 'sous-total produits TTC = 5940 pour 2 lignes');
}

// ---------------------------------------------------------------------------
// 3. Chemin legacy SANS snapshot (admin)
// ---------------------------------------------------------------------------
section('3. fallback SANS snapshot — mode TTC déclaré (admin details/App)');
{
  const amounts = computeQuotePdfAmounts(requestFixture({ taxRate: 20, taxMode: 'ttc' }));
  assertEqual(amounts.isTtc, true, 'isTtc true');
  assertEqual(amounts.subtotal, TTC_PRODUCTS, 'sous-total produits 5940 (jamais totalQuote TTC comme sous-total HT)');
  assertEqual(amounts.delivery, TTC_DELIVERY, 'livraison 119,99');
  assertEqual(amounts.installation, TTC_INSTALLATION, 'installation 384');
  assertEqual(amounts.total, TTC_TOTAL, 'total reconstruit 6443,99 (pas de double comptage)');
}

section('3b. fallback SANS snapshot — mode HT (défaut legacy)');
{
  const amounts = computeQuotePdfAmounts(requestFixture({ taxRate: 20 }));
  assertEqual(amounts.isTtc, false, 'isTtc false (pas de mode TTC)');
  assertEqual(amounts.subtotal, HT_PRODUCTS, 'sous-total = somme des lignes HT = 4950');
  assertEqual(amounts.total, HT_SUBTOTAL, 'total HT = 5369,99 (plus de double comptage delivery/install)');
}

section('3c. fallback SANS snapshot — TVA désactivée');
{
  const amounts = computeQuotePdfAmounts(requestFixture({}));
  assertEqual(amounts.isTtc, false, 'isTtc false');
  assertEqual(amounts.subtotal, HT_PRODUCTS, 'aucune TVA');
}

// ---------------------------------------------------------------------------
// 4. Test d'intégration : rendu réel de QuotePDF
// ---------------------------------------------------------------------------
section('4. Rendu QuotePDF — snapshot TTC 20 % (cas de référence)');
{
  const html = renderPdf(requestFixture({ priceSnapshot: snapshotFixture({ enabled: true, rate: 20, mode: 'ttc' }, TTC_TOTAL) }));
  assertTrue(html.includes('Sous-total TTC'), 'libellé « Sous-total TTC »');
  assertTrue(!html.includes('Sous-total HT'), 'plus de libellé « Sous-total HT »');
  assertTrue(html.includes(fmt(TTC_PRODUCTS)), `sous-total produits affiché ${fmt(TTC_PRODUCTS)}`);
  assertTrue(html.includes(fmt(TTC_INSTALLATION)), `installation affichée ${fmt(TTC_INSTALLATION)}`);
  assertTrue(html.includes(fmt(TTC_DELIVERY)), `livraison affichée ${fmt(TTC_DELIVERY)}`);
  assertTrue(html.includes(fmt(TTC_TOTAL)), `total affiché ${fmt(TTC_TOTAL)}`);
  assertTrue(html.includes('>TTC<'), 'total étiqueté TTC');
}

section('4b. Rendu QuotePDF — snapshot HT');
{
  const html = renderPdf(requestFixture({ priceSnapshot: snapshotFixture({ enabled: true, rate: 20, mode: 'ht' }, HT_SUBTOTAL) }));
  assertTrue(html.includes('Sous-total HT'), 'libellé « Sous-total HT »');
  assertTrue(!html.includes('Sous-total TTC'), 'pas de libellé TTC');
  assertTrue(html.includes(fmt(HT_PRODUCTS)), `sous-total HT affiché ${fmt(HT_PRODUCTS)}`);
  assertTrue(html.includes(fmt(HT_SUBTOTAL)), `total HT affiché ${fmt(HT_SUBTOTAL)}`);
}

section('4c. Rendu QuotePDF — fallback SANS snapshot, mode TTC (admin)');
{
  const html = renderPdf(requestFixture({ taxRate: 20, taxMode: 'ttc' }));
  assertTrue(html.includes('Sous-total TTC'), 'libellé TTC');
  assertTrue(html.includes(fmt(TTC_PRODUCTS)), 'sous-total 5940');
  assertTrue(html.includes(fmt(TTC_TOTAL)), 'total 6443,99');
  assertTrue(html.includes(fmt(TTC_INSTALLATION)), 'installation 384');
  assertTrue(html.includes(fmt(TTC_DELIVERY)), 'livraison 119,99');
}

// ---------------------------------------------------------------------------
// Résultat
// ---------------------------------------------------------------------------
console.log(`\n${failures === 0 ? 'OK' : 'ECHEC'} — ${assertions - failures}/${assertions} assertions réussies`);
if (failures > 0) process.exit(1);
