const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const PRODUCT_ID = 'T4NIB1rydkfJQ9vNoUmE';
// Real Firestore values (observed from running app):
// Paris 9e 75009 -> cityId 16YeAYXViO6GceokFAs2 -> zone aHXf7vh9eLwnwMJN1Jpe -> rule_1788111699062 -> 79.99
const EXPECTED_FEE = 79.99;
const CITY_NAME = 'Paris 9e';
const POSTCODE = '75009';

const L = (label, s) => console.log(`\n===== ${label} =====\n${s}\n`);

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 300)));

  let otpCode = null;
  let pendingId = null;
  // Capture the sendBoutiqueOtp server action response (contains otpCode)
  page.on('response', async (res) => {
    try {
      if (res.request().method() === 'POST' && res.request().headers()['next-action']) {
        const body = await res.text().catch(() => '');
        const m = body.match(/"otpCode":"(\d{6})"/);
        if (m) otpCode = m[1];
        const pm = body.match(/"pendingId":"([^"]+)"/);
        if (pm) pendingId = pm[1];
      }
    } catch (e) {}
  });

  // 1. Load product page
  L('STEP 1: PRODUCT ' + PRODUCT_ID, 'loading ' + BASE + '/boutique/produit/' + PRODUCT_ID);
  await page.goto(`${BASE}/boutique/produit/${PRODUCT_ID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4500);
  const pTitle = await page.locator('h1').first().innerText().catch(() => '');
  L('Product title', pTitle);

  // 2. Open rental flow
  const locBtns = page.locator('button', { hasText: 'Location' });
  const lc = await locBtns.count();
  for (let i = 0; i < lc; i++) {
    if (await locBtns.nth(i).isVisible()) { await locBtns.nth(i).click(); break; }
  }
  await page.waitForTimeout(2500);

  // 3. Fill customer form
  await page.getByPlaceholder('Nom de votre société').fill('PIXIATECH TEST');
  await page.getByPlaceholder('Nom du contact').fill('Jean Test');
  await page.getByPlaceholder('email@societe.com').fill('test.pixiatech.rental@example.com');
  await page.getByPlaceholder('+33 6 12 34 56 78').fill('+33 6 12 34 56 78');

  // 4. City via CityInput
  await page.getByPlaceholder('Rechercher une ville').fill('Paris 9e');
  await page.waitForTimeout(1200);
  const cityOption = page.locator('button', { hasText: new RegExp(CITY_NAME) }).filter({ visible: true }).first();
  const optText = await cityOption.innerText().catch(() => '');
  L('STEP 4: CITY OPTION', 'option text = "' + optText + '"');
  await cityOption.click();
  await page.waitForTimeout(800);

  // 5. Address
  await page.getByPlaceholder('Adresse de livraison').fill('5 Rue Test');

  // 6. Dates
  await page.locator('button', { hasText: /Période|Date/i }).first().click();
  await page.waitForTimeout(600);
  await page.locator('div.grid button:has-text("15")').first().click();
  await page.waitForTimeout(300);
  await page.locator('div.grid button:has-text("18")').first().click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Valider' }).first().click();
  await page.waitForTimeout(1000);

  // 7. Read green box (Détail du prix)
  const greenBox = await page.locator('div.bg-emerald-50, div:has-text("Total location")').first().innerText().catch(() => 'NO GREEN BOX');
  L('STEP 7: RENTAL PAGE GREEN BOX', greenBox);

  // Also capture the exact Livraison value via a targeted read
  const deliverLine = await page.locator('div.bg-emerald-50').innerText().catch(() => '');
  L('GREEN BOX (emerald container)', deliverLine);

  // 8. Continue to step 2 (Contrat)
  await page.locator('button', { hasText: 'Continuer' }).first().click();
  await page.waitForTimeout(2000);
  L('STEP 8: STEP 2 visible', 'contract step = ' + (await page.getByText('Signature *').count()));

  // 9. Accept CGL + draw signature
  await page.locator('input[type="checkbox"]').first().check();
  const canvas = page.locator('#signature-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + box.height / 2 - 20, { steps: 8 });
    await page.mouse.move(box.x + 200, box.y + box.height / 2 + 10, { steps: 8 });
    await page.mouse.move(box.x + 300, box.y + box.height / 2 - 15, { steps: 8 });
    await page.mouse.up();
  }
  await page.waitForTimeout(400);
  await page.locator('#btn-validate-sig').click();
  await page.waitForTimeout(800);

  // 10. Continue to step 3 (OTP)
  await page.locator('button', { hasText: 'Continuer' }).last().click();
  await page.waitForTimeout(4000);
  L('STEP 10: OTP STEP', 'otp step present = ' + (await page.getByText('Vérification email').count()));
  L('CAPTURED OTP', 'otpCode=' + otpCode + ' pendingId=' + pendingId);

  // 11. Enter OTP
  if (otpCode) {
    const hidden = page.locator('input[maxlength="100"]').first();
    await hidden.fill(otpCode);
    await page.waitForTimeout(5000);
  }
  L('STEP 11: After OTP - step 4 present', 'Prêt pour la location = ' + (await page.getByText('Prêt pour la location').count()));

  // 12. Go to cart
  await page.locator('button', { hasText: 'Voir le panier' }).first().click();
  await page.waitForTimeout(4000);
  L('STEP 12: CART URL', page.url());
  const cartBody = await page.locator('body').innerText();
  L('STEP 12: CART - banner gone check', 'banner "Livraison non incluse" present = ' + cartBody.includes('Livraison non incluse'));
  L('STEP 12: CART - rental item present', 'VENTILATEUR present = ' + cartBody.includes('VENTILATEUR'));

  // Grab per-item delivery + summary + total from the cart
  const cartText = await page.locator('body').innerText();
  // Try to find delivery-related lines
  const matcher = /Livraison\s*\n?([^€]*?)\s*([\d ]+[.,]\d{2})\s*€/g;
  // Instead dump the relevant summary region
  L('STEP 12: CART FULL TEXT (first 3000)', cartText.slice(0, 3000));

  await browser.close();
  console.log('\nPAGE ERRORS:', JSON.stringify(errs, null, 1));
})();
