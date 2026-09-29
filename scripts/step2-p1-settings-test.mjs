import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const KEY = 'pixiatech_site_web_settings_v3';
let failures = 0;
const check = (name, cond, extra) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ` :: ${extra}` : ''}`);
  if (!cond) failures++;
};

let expected;
try {
  const r = await fetch(BASE + '/api/site-web/pages');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  expected = j.settings;
} catch (e) {
  console.log('FATAL - server not reachable: ' + e.message);
  process.exit(2);
}
const hasSettingsOnServer = expected && typeof expected === 'object';
console.log('SERVER /api/site-web/pages settings: ' + (hasSettingsOnServer ? Object.keys(expected).join(',') : 'ABSENT'));
if (!hasSettingsOnServer) { console.log('FATAL - server does not expose settings'); process.exit(2); }
console.log('SERVER companyName=' + expected.companyName + ' accentColor=' + expected.accentColor);

const browser = await chromium.launch();
const page = await browser.newPage();

// ── Etape D: localStorage vide au depart ──
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate((k) => localStorage.setItem(k, 'null'), KEY);
console.log('Seeded local settings = null (cache vide)');

// ── Etape E/F: refresh complet → les settings serveur doivent revenir ──
await page.goto(BASE + '/web', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
const localAfterEmpty = await page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, KEY);
check('P1-E/F empty cache → server settings restored (companyName)', localAfterEmpty !== null && localAfterEmpty.companyName === expected.companyName,
  'local=' + (localAfterEmpty && localAfterEmpty.companyName));
check('P1-E/F empty cache → server settings restored (accentColor)', localAfterEmpty !== null && localAfterEmpty.accentColor === expected.accentColor,
  'local=' + (localAfterEmpty && localAfterEmpty.accentColor));

// ── Conflit: localStorage FAKE ne doit jamais écraser les settings serveur ──
await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [KEY, { companyName: 'FAKE-COMPANY', tagline: 'fake-cache' }]);
console.log('Seeded local settings companyName=FAKE-COMPANY (cache perime)');
await page.goto(BASE + '/web', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
const localAfterFake = await page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, KEY);
check('P1 cached FAKE overwritten by server settings', localAfterFake !== null && localAfterFake.companyName === expected.companyName,
  'local=' + (localAfterFake && localAfterFake.companyName));

// ── Etape G/H: second refresh → identique ──
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
const localAfter2 = await page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, KEY);
check('P1-G/H second refresh keeps identical settings', localAfter2 !== null && localAfter2.companyName === expected.companyName && localAfter2.accentColor === expected.accentColor,
  'companyName=' + (localAfter2 && localAfter2.companyName) + ' accentColor=' + (localAfter2 && localAfter2.accentColor));

// Sanity: server value differs from the FAKE seed (le test est significatif)
check('sanity: server settings differ from FAKE seed', expected.companyName !== 'FAKE-COMPANY');

await browser.close();
console.log(failures === 0 ? 'P1-SUITE-PASS' : `P1-SUITE-FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);