const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const base = 'http://localhost:3000';
  const ids = [
    'q4PUq90FHG8PiwDF8mIY',
    'T4NIB1rydkfJQ9vNoUmE',
    'SgZ71I51Yk2UlNl64DOm',
    'xuOhoR2PbabQFVkPqK5s',
    'LeNjErElZjPaPO4EfLoM',
    'rb5Xez6qhuTqqgNCUe7A',
  ];

  for (const id of ids) {
    try {
      await page.goto(`${base}/boutique/louer/${id}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500);
      const url = page.url();
      const isRentalPage = url.includes('/boutique/louer/');
      // Try the product page too
      await page.goto(`${base}/boutique/produit/${id}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500);
      const prodHasRental = await page.locator('text=/louer|Location|jour/i').count();
      const title = await page.locator('h1, h2').first().textContent().catch(() => '');
      console.log(`${id} | rentalPage=${isRentalPage} | h1=${(title||'').trim().slice(0,50)} | rentalHints=${prodHasRental}`);
    } catch (e) {
      console.log(`${id} | ERROR ${e.message.slice(0,60)}`);
    }
  }
  await browser.close();
})();
