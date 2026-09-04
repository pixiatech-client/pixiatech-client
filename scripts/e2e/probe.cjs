const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const base = 'http://localhost:3000';

  try {
    await page.goto(`${base}/boutique`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    const title = await page.title();
    console.log('SHOP TITLE:', title);

    // Colect product links
    const links = await page.$$eval('a[href*="/boutique/produit/"]', els =>
      els.map(e => e.getAttribute('href')).filter(Boolean)
    );
    const uniq = [...new Set(links)];
    console.log('PRODUCTS:', uniq.slice(0, 20).join(', '));
    console.log('TOTAL UNIQUE:', uniq.length);
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
