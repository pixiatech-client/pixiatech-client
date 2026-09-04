const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
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
      await page.goto(`${base}/boutique/produit/${id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(4000);
      const body = await page.locator('body').innerText();
      const hasSociete = body.includes('Société *') || body.includes('Soci') && body.includes('Contact *');
      const hasDetailPrix = body.includes('Détail du prix') || body.includes('Total location');
      const hasRentalTab = body.includes('Location');
      const companyInput = await page.getByPlaceholder('Nom de votre société').count().catch(()=>0);
      console.log(`${id} | societeField=${companyInput} | detailPrix=${hasDetailPrix} | cgl=${body.includes('Conditions Générales de Location') || body.includes('Location')}`);
    } catch (e) {
      console.log(`${id} | ERROR ${String(e).slice(0,60)}`);
    }
  }
  await browser.close();
})();
