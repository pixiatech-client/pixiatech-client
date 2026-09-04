const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const ids = [
  'q4PUq90FHG8PiwDF8mIY',
  'T4NIB1rydkfJQ9vNoUmE',
  'SgZ71I51Yk2UlNl64DOm',
  'xuOhoR2PbabQFVkPqK5s',
  'LeNjErElZjPaPO4EfLoM',
  'rb5Xez6qhuTqqgNCUe7A',
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const log = (l, s) => console.log(`\n===== ${l} =====\n${s}\n`);

  // Find the first product with a "Location" (rental) button
  let rentalId = null;
  for (const id of ids) {
    await page.goto(`${BASE}/boutique/produit/${id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3500);
    const btn = await page.getByRole('button', { name: /location/i }).count().catch(() => 0);
    const locTab = await page.locator('button:has-text("Location")').count().catch(() => 0);
    const canRentLocator = page.locator('button', { hasText: 'Location' });
    const n = await canRentLocator.count();
    if (n > 0) {
      // Confirm it's the calendar-days rent button, not just text
      const calIcon = await page.locator('button svg.lucide-calendar-days').count().catch(() => 0);
      console.log(`  [probe] ${id}: Location buttons=${n} calIconSvgs=${calIcon}`);
      if (calIcon > 0) { rentalId = id; break; }
    } else {
      console.log(`  [probe] ${id}: no Location button`);
    }
  }

  if (!rentalId) {
    // fallback: pick any with Location button
    for (const id of ids) {
      await page.goto(`${BASE}/boutique/produit/${id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
      const n = await page.locator('button', { hasText: 'Location' }).count();
      if (n > 0) { rentalId = id; break; }
    }
  }
  console.log(`\n  >>> RENTAL PRODUCT ID = ${rentalId}`);
  if (!rentalId) { await browser.close(); return; }

  const productId = rentalId;
  await page.goto(`${BASE}/boutique/produit/${productId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  // Capture error listeners
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 200)));

  // Open rental flow (click the VISIBLE "Location" button)
  const locBtns = page.locator('button', { hasText: 'Location' });
  const count = await locBtns.count();
  for (let i = 0; i < count; i++) {
    if (await locBtns.nth(i).isVisible()) { await locBtns.nth(i).click(); break; }
  }
  await page.waitForTimeout(3000);

  // Capture form placeholders
  const inputs = await page.locator('input').evaluateAll(els => els.map(el => ({ ph: el.placeholder, type: el.type, id: el.id })));
  log('PRODUCT PAGE INPUTS (rental flow)', JSON.stringify(inputs, null, 1));

  await browser.close();
})();
