import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpecsSection } from '@/web/components/SpecsSection';

const G: any = [{ label: 'ELECTRIQUE', rows: [{ key: 'maxPower', label: 'MAX POWER (W / PANEL)' }] },
                 { label: 'ENVIRONNEMENT', rows: [{ key: 'temp', label: 'OPERATING TEMPERATURE' }] }];
// Valeurs RÉELLEMENT stockées dans Firestore (lecture seule, pxt-seamless).
const M: any = [{ name: 'PXT-S1.2', specs: { maxPower: '—135 W', temp: '-20°C à +50°C—' } },
                { name: 'PXT-S1.5', specs: { maxPower: '135 W—', temp: '-20°C à +50°C—' } }];

const html = renderToStaticMarkup(React.createElement(SpecsSection as never, { specs: { groups: G, models: M }, lang: 'FR' }));
for (const m of html.matchAll(/class="spec-val"[^>]*>([\s\S]*?)<\/div>/g)) {
  console.log('cellule DOM =', JSON.stringify(m[1]));
}
