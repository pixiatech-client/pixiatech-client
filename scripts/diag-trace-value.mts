/**
 * DIAGNOSTIC DE TRACAGE — aucun correctif, aucune écriture Firestore, aucun commit.
 *
 * Trace une valeur de caractéristique à CHAQUE étape du pipeline :
 *   1. texte BRUT extrait du PDF (pdfjs, items positioningnés)
 *   2. parser (parseProductFichePages)
 *   3. mapParsedToProduct
 *   4. buildProductFromMasterTemplate
 *   5. valeur actuellement dans Firestore (lecture seule)
 *   6. valeur affichée par SpecsSection
 *
 * L'objectif est de nommer LA PREMIÈRE ÉTAPE où un placeholder apparaît.
 *
 * Usage (le PDF n'est pas dans le dépôt) :
 *   set PXT_PDF=...            puis  npx tsx scripts/diag-trace-value.mts
 *   npx tsx scripts/diag-trace-value.mts "C:\chemin\vers\la\fiche.pdf"
 */
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpecsSection } from '@/web/components/SpecsSection';
import { extractProductPdfLayout, parseProductFichePages, mapParsedToProduct } from '@/lib/products/product-pdf-parser';
import { buildProductFromMasterTemplate } from '@/lib/products/product-from-template';

const PDF = process.argv[2] ?? process.env.PXT_PDF;
if (!PDF) {
  console.error(
    'PDF manquant. Renseignez la fiche source :\n' +
      '  set PXT_PDF="C:\\chemin\\vers\\PXT_Seamless_FICHE_TECHNIQUE.pdf"\n' +
      '  npx tsx scripts/diag-trace-value.mts "C:\\chemin\\vers\\fiche.pdf"'
  );
  process.exit(2);
}
const WATCH = ['maxPower', 'avgPower', 'powerSource', 'signal', 'temp', 'ip', 'pitch'];

const bytes = readFileSync(PDF);
const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

// ---------------------------------------------------------------------------
// 1. TEXTE BRUT DU PDF — items positioningnés, sur la page des specs
// ---------------------------------------------------------------------------
console.log('=== 1. PDF BRUT (items pdfjs, page contenant la matrice) ===');
const pdfjsLib = (await import('pdfjs-dist')) as typeof import('pdfjs-dist');
const doc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
let rawDump = '';
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  const items = content.items.filter((i) => 'str' in i);
  const hasSpecs = items.some((i) => /MAX\s*POWER|CONSUMPTION/i.test((i as { str: string }).str));
  if (!hasSpecs) continue;
  console.log(`--- page ${p} : items bruts contenant un tiret ou une valeur cible`);
  for (const it of items) {
    const s = (it as { str: string }).str;
    if (!s.trim()) continue;
    const tr = (it as { transform: number[] }).transform;
    const x = tr[4].toFixed(1);
    const y = tr[5].toFixed(1);
    const dash = /[\u2010-\u2015\u2212-]/.test(s);
    const target = /W\b|Hz|V\b|HDMI|IP\d|nits|°C|P1\./i.test(s);
    if (dash || target) {
      const line = `x=${x.padStart(6)} y=${y.padStart(6)} w=${((it as {width:number}).width ?? 0).toFixed(1)} ${JSON.stringify(s)}`;
      rawDump += line + '\n';
      console.log(line);
    }
  }
}
console.log(`\n--- PDF contient-il un item composé UNIQUEMENT d'un tiret ?`);
{
  let only = 0;
  let glued = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    for (const it of content.items) {
      const s = (it as { str: string }).str.trim();
      if (!s) continue;
      if (/^[\u2010-\u2015\u2212-]+$/.test(s)) only += 1;
      else if (/[\u2010-\u2015\u2212]/.test(s)) glued += 1;
    }
  }
  console.log(`   items « tiret seul »            : ${only}`);
  console.log(`   items « tiret COLLÉ à du texte »: ${glued}`);
}

// ---------------------------------------------------------------------------
// 2 + 3. PARSER
// ---------------------------------------------------------------------------
const pages = await extractProductPdfLayout(buf.slice(0));
const parsed = parseProductFichePages(pages);
const mapped = mapParsedToProduct(parsed, 'PXT Seamless');

const dumpSpecs = (label: string, models: any) => {
  console.log(`\n=== ${label} ===`);
  for (const m of models ?? []) {
    for (const k of WATCH) {
      if (m.specs?.[k] !== undefined) console.log(`  ${m.name} | ${k} = ${JSON.stringify(m.specs[k])}`);
    }
  }
};

dumpSpecs('2. PARSER (parseProductFichePages)', parsed.specs?.models);
dumpSpecs('3. MAPPING (mapParsedToProduct)', (mapped as any)?.specs?.models);

// ---------------------------------------------------------------------------
// 4. BUILD DEPUIS LE TEMPLATE MAÎTRE
// ---------------------------------------------------------------------------
console.log('\n=== 4. buildProductFromMasterTemplate ===');
{
  const master: any = {
    name: 'template',
    slug: 'template-maitre',
    status: 'draft',
    specs: { groups: parsed.specs?.groups ?? [], models: [] },
  };
  const built: any = await buildProductFromMasterTemplate(mapped as any, async () => master);
  for (const m of built?.specs?.models ?? []) {
    for (const k of WATCH) {
      if (m.specs?.[k] !== undefined) console.log(`  ${m.name} | ${k} = ${JSON.stringify(m.specs[k])}`);
    }
  }
  // Payload qui serait écrit.
  const payload = JSON.parse(JSON.stringify(built.specs));
  console.log(`\n--- 4b. PAYLOAD JUSTE AVANT ÉCRITURE (specs.models[0]) ---`);
  console.log(JSON.stringify(payload.models?.[0], null, 2));

  // -------------------------------------------------------------------------
  // 6. RENDU (avec ce payload)
  // -------------------------------------------------------------------------
  const html = renderToStaticMarkup(
    React.createElement(SpecsSection as never, { specs: payload, lang: 'FR' })
  );
  console.log('\n=== 6. RENDU SpecsSection (cellules) ===');
  for (const m of html.matchAll(/class="spec-val"[^>]*>([\s\S]*?)<\/div>/g)) {
    console.log(`  ${JSON.stringify(m[1])}`);
  }
}
