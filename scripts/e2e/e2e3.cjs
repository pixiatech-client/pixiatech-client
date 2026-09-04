const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const L = (label, s) => console.log(`\n===== ${label} =====\n${s}\n`);

// CartItem location correspondant exactement à la sortie réelle du wizard (parité produit->panier prouvée):
// 5 jours x 299 € = 1495 HT ; Livraison 79,99 (Paris 9e -> zone aHXf7...) ; TVA 20% ; Total 1873,99
const RENTAL_ITEM = {
  productId: 'T4NIB1rydkfJQ9vNoUmE',
  name: 'VENTILATEUR HOLOGRAPHIQUE 3D F56',
  price: 1495,
  image: null,
  quantity: 1,
  category: 'Intérieur',
  type: 'rental',
  rentalStartDate: '2026-09-19',
  rentalEndDate: '2026-09-23',
  rentalStartTime: '09:00',
  rentalEndTime: '18:00',
  renterDetails: {
    company: 'PIXIATECH TEST',
    representative: 'Jean Test',
    email: 'test.rental.e2e@example.com',
    phone: '+33 6 45 67 89 01',
    address: '5 Rue Test',
    city: 'Paris 9e',
    postcode: '75009',
  },
  additionalNotes: '',
  contractSignedAt: new Date().toISOString(),
  rentalFlowCompleted: true,
  stock: 5,
  deliveryCost: 79.99,
  deliveryReason: 'Zone livraison',
  zoneId: 'aHXf7vh9eLwnwMJN1Jpe',
  cityId: '16YeAYXViO6GceokFAs2',
  deliveryLabel: 'Paris 9e 75009',
};

const grab = (txt, from, to) => {
  const i = txt.indexOf(from);
  const j = to ? txt.indexOf(to, i > 0 ? i : 0) : txt.length;
  return txt.slice(i > 0 ? i : 0, (j > 0 ? j : txt.length)).trim();
};

async function runScenario(browser, profileType) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/boutique/panier`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(({ item, profile }) => {
    localStorage.setItem('boutique-cart', JSON.stringify([item]));
    localStorage.setItem('pixia_profile_type', profile);
  }, { item: RENTAL_ITEM, profile: profileType });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const cartText = await page.locator('body').innerText();
  const hasItem = cartText.includes('VENTILATEUR');
  L(`CART[${profileType}] HAS RENTAL`, String(hasItem));
  L(`CART[${profileType}] RECAP`, grab(cartText, 'Récapitulatif', 'Ajouter un code'));
  const cartDelivery = [];
  const re = /Livraison[^\n]*\n?[^\n]*€/g;
  let m;
  while ((m = re.exec(cartText))) cartDelivery.push(m[0].trim());
  L(`CART[${profileType}] DELIVERY LINES`, JSON.stringify(cartDelivery, null, 1));

  await page.locator('button:has-text("Passer à la caisse")').first().click();
  await page.waitForURL('**/boutique/paiement*', { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(4500);
  L(`CHECKOUT[${profileType}] URL`, page.url());

  const chk = await page.locator('body').innerText();
  L(`CHECKOUT[${profileType}] SUMMARY`, grab(chk, 'Sous-total'));
  const chkDelivery = [];
  while ((m = re.exec(chk))) chkDelivery.push(m[0].trim());
  L(`CHECKOUT[${profileType}] DELIVERY LINES`, JSON.stringify(chkDelivery, null, 1));

  await context.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const profile of ['particulier', 'entreprise']) {
    await runScenario(browser, profile);
  }
  await browser.close();
  console.log('\n===== E2E3 DONE =====');
})();
