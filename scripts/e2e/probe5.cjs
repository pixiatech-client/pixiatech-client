const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const base = 'http://localhost:3000';
  let locBody = '';
  let delBody = '';

  page.on('response', async (res) => {
    try {
      if (res.request().method() === 'POST' && res.request().headers()['next-action']) {
        let body = '';
        try { body = await res.text(); } catch {}
        if (body.includes('"villes"')) locBody = body;
        if (body.includes('deliveryFeeRules') && body.includes('defaultFee')) delBody = body;
      }
    } catch (e) {}
  });

  // Load TWO rental products to be safe; the server actions are idempotent reads
  await page.goto(`${base}/boutique/louer/T4NIB1rydkfJQ9vNoUmE`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);

  console.log('=== FULL getLocations payload ===');
  console.log(locBody);
  console.log('=== FULL getDeliverySettings payload ===');
  console.log(delBody);
  await browser.close();
})();
