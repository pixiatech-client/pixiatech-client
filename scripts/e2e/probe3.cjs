const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const base = 'http://localhost:3000';
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('[pageerror] ' + String(e).slice(0, 200)));

  // 1) Cart page - does it throw the provider error?
  try {
    await page.goto(`${base}/boutique/panier`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasError = bodyText.includes('useCart must be used within CartProvider') || bodyText.includes('Runtime Error');
    const h1 = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log('PANIER PAGE | errorShown=', hasError, '| h1=', (h1||'').trim().slice(0,60));
  } catch (e) {
    console.log('PANIER PAGE | threw:', e.message.slice(0,120));
  }

  console.log('--- ERRORS (one page) ---');
  errors.slice(0, 10).forEach(e => console.log(e));
  await browser.close();
})();
