import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const DATA_FILE = 'data/pixel-tech-web-pages.json';
class FakeTimeoutError extends Error {}

let failures = 0;
const check = (name, cond, extra) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ` :: ${extra}` : ''}`);
  if (!cond) failures++;
};

const backup = fs.readFileSync(DATA_FILE, 'utf8');

function seedShowreel(styles) {
  const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  db.pages.home.sections = db.pages.home.sections || {};
  if (styles) {
    db.pages.home.sections.showreel = { name: 'showreel', ...styles };
  } else {
    delete db.pages.home.sections.showreel;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

async function openBase() {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
}
async function openWeb() {
  await page.goto(BASE + '/web', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
}
async function showreelComputed() {
  return page.evaluate(() => {
    const el = document.getElementById('showreel');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const canvas = el.querySelector('canvas');
    return {
      backgroundColor: cs.backgroundColor,
      backgroundImage: cs.backgroundImage,
      canvasPresent: !!canvas,
      canvasW: canvas ? canvas.width : 0,
      canvasH: canvas ? canvas.height : 0,
      overlay: (() => {
        const ov = el.querySelector('[data-cms-bg-overlay]');
        if (!ov) return null;
        const ocs = getComputedStyle(ov);
        return { backgroundColor: ocs.backgroundColor, pointerEvents: ocs.pointerEvents };
      })(),
    };
  });
}

try {
  // ── T0 / contrôle : aucune valeur CMS → garde le fond par défaut #050505
  seedShowreel(null);
  await openBase();
  await openWeb();
  let r = await showreelComputed();
  check('T0 défaut sans style CMS → #050505', r && r.backgroundColor === 'rgb(5, 5, 5)', JSON.stringify(r && r.backgroundColor));
  check('T0 canvas 3D toujours monté', r && r.canvasPresent && r.canvasW > 0 && r.canvasH > 0,
    `canvas ${r && r.canvasW}x${r && r.canvasH}`);
  check('T0 aucun voile sans style', r && r.overlay === null);

  // ── TEST A : bgColor → sauvegarde → refresh → identique
  seedShowreel({ bgColor: '#123456' });
  await openWeb();
  r = await showreelComputed();
  check('A1 bgColor appliqué (rgb(18,52,86))', r && r.backgroundColor === 'rgb(18, 52, 86)', JSON.stringify(r && r.backgroundColor));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  r = await showreelComputed();
  check('A2 après refresh → couleur identique', r && r.backgroundColor === 'rgb(18, 52, 86)', JSON.stringify(r && r.backgroundColor));

  // ── TEST B : bgImage → sauvegarde → refresh → identique
  seedShowreel({ bgColor: '#123456', bgImage: '/uploads/site/hero-1.jpg' });
  await openWeb();
  r = await showreelComputed();
  check('B1 bgImage appliquée (url hero-1.jpg)', r && (r.backgroundImage || '').includes('hero-1.jpg'), JSON.stringify(r && r.backgroundImage));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  r = await showreelComputed();
  check('B2 après refresh → image identique', r && (r.backgroundImage || '').includes('hero-1.jpg'), JSON.stringify(r && r.backgroundImage));

  // ── TEST C : overlay (bgImage + overlayOpacity + overlayColor) → refresh → identique
  seedShowreel({ bgImage: '/uploads/site/hero-1.jpg', overlayOpacity: 50, overlayColor: '#000000' });
  await openWeb();
  r = await showreelComputed();
  check('C1 voile présent', r && r.overlay !== null);
  check('C2 voile rgba(0,0,0,0.5)', r && r.overlay && r.overlay.backgroundColor === 'rgba(0, 0, 0, 0.5)', JSON.stringify(r && r.overlay && r.overlay.backgroundColor));
  check('C3 voile pointer-events none (canvas intact)', r && r.overlay && r.overlay.pointerEvents === 'none');
  check('C1b canvas toujours monté avec voile', r && r.canvasPresent && r.canvasW > 0);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  r = await showreelComputed();
  check('C4 après refresh → voile identique', r && r.overlay && r.overlay.backgroundColor === 'rgba(0, 0, 0, 0.5)', JSON.stringify(r && r.overlay && r.overlay.backgroundColor));
} catch (e) {
  if (!(e instanceof FakeTimeoutError)) {
    console.log('FATAL - ' + e.message);
    failures++;
  }
} finally {
  fs.writeFileSync(DATA_FILE, backup);
  const after = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const section = after.pages?.home?.sections?.showreel;
  if (section && (section.bgColor || section.bgImage)) {
    console.log('FAIL - données non restaurées');
    failures++;
  } else {
    console.log('OK  - fichier de données restauré (pas de showreel style)');
  }
}

console.log('CONSOLE_ERRORS ' + JSON.stringify(errors.filter((e) => !e.includes('favicon'))));
console.log(failures === 0 ? 'SHOWREEL-SUITE-PASS' : `SHOWREEL-SUITE-FAIL (${failures})`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);