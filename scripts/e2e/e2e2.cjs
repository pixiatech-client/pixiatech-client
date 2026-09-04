const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const PRODUCT_ID = 'T4NIB1rydkfJQ9vNoUmE';
const EXPECTED_FEE_TEXT = '79,99';

const L = (label, s) => console.log(`\n===== ${label} =====\n${s}\n`);

async function waitFor(page, locator, ms = 20000) {
  await locator.first().waitFor({ state: 'visible', timeout: ms }).catch(() => false);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => { errs.push('pageerror: ' + String(e).slice(0, 300)); console.log('[JS-ERR]', String(e).slice(0, 300)); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[CONSOLE ' + m.type() + ']', m.text().slice(0, 200)); });

  let otpCode = null, pendingId = null;
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

  await page.goto(`${BASE}/boutique/produit/${PRODUCT_ID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4500);

  // Open rental flow via visible Location button (scroll into view + retry)
  const companyField = page.getByPlaceholder('Nom de votre société');
  let opened = false;
  for (let attempt = 0; attempt < 4 && !opened; attempt++) {
    const loc = page.locator('button', { hasText: 'Location' });
    const n = await loc.count();
    for (let i = 0; i < n; i++) {
      if (await loc.nth(i).isVisible()) {
        await loc.nth(i).scrollIntoViewIfNeeded().catch(() => {});
        await loc.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(2500);
    if (await companyField.count()) opened = true;
  }
  L('RENTAL FLOW OPENED', String(opened));
  if (!opened) { console.log('FATAL: rental form never appeared'); await browser.close(); return; }

  // ---- STEP 1 form ----
  await page.getByPlaceholder('Nom de votre société').fill('PIXIATECH TEST');
  await page.getByPlaceholder('Nom du contact').fill('Jean Test');
  await page.getByPlaceholder('email@societe.com').fill('test.rental.e2e@example.com');
  const phoneField = page.getByPlaceholder('+33 6 12 34 56 78');
  await phoneField.click();
  await phoneField.pressSequentially('+33 6 45 67 89 01', { delay: 30 });
  L('PHONE FIELD VALUE', '"' + (await phoneField.inputValue()) + '"');
  await page.getByPlaceholder('Rechercher une ville').fill('Paris 9e');
  await page.waitForTimeout(1500);
  const opt = page.locator('button', { hasText: 'Paris 9e' }).filter({ visible: true }).first();
  L('CITY option', await opt.innerText().catch(()=>'NONE'));
  await opt.click();
  await page.waitForTimeout(800);
  await page.getByPlaceholder('Adresse de livraison').fill('5 Rue Test');

  // DateRangePicker: click toggle then days 20 & 24
  await page.locator('button', { hasText: /Période/ }).first().click();
  await page.waitForTimeout(700);
  // Day buttons are inside the calendar grid; pick by exact text, scoped to the emerald-free dark panel
  const cal = page.locator('div.bg-gray-900');
  const dayBtns = (num) => cal.locator('button[type="button"]').filter({ hasText: new RegExp('^' + num + '$') }).first();
  await dayBtns(20).click();
  await page.waitForTimeout(300);
  await dayBtns(24).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Valider' }).first().click();
  await page.waitForTimeout(1200);

  // Fill rental start/end times (required by isStep1Valid)
  const times = page.locator('input[type="time"]');
  await times.nth(0).fill('09:00');
  await times.nth(1).fill('18:00');
  await page.waitForTimeout(400);

  const green = await page.locator('div.bg-emerald-50').innerText().catch(()=>'NO GREEN');
  L('RENTAL GREEN BOX', green);
  const okGreen = green.includes(EXPECTED_FEE_TEXT);
  console.log('GREEN-BOX DELIVERY MATCH 79,99:', okGreen);

  // Read postcode + date/time values (diagnostics)
  const postVal = await page.locator('input[readonly]').first().inputValue().catch(()=>'?');
  const timeVals = [];
  for (let i=0;i<await page.locator('input[type="time"]').count();i++) timeVals.push(await page.locator('input[type="time"]').nth(i).inputValue().catch(()=>''));
  L('DIAG FIELDS', 'postcode="' + postVal + '" times=' + JSON.stringify(timeVals));

  // ---- Advance to step 2 (Contrat) ----
  // Click the visible "Continuer" button (arrow-right submit), not "Continuer mes achats"
  const contBtns = page.locator('button:has-text("Continuer")').filter({ hasNotText: 'mes achats' }).filter({ visible: true });
  L('Continuer buttons count', String(await contBtns.count()));
  L('BUTTON HTML', (await contBtns.first().evaluate(el => el.outerHTML)).slice(0, 600));
  await contBtns.first().click();
  await page.waitForTimeout(1500);
  // Count "Requised" (▲ Requis) markers to see which fields are invalid
  const requis = await page.locator('text=▲ Requis').count();
  L('REQUIS MARKERS', 'count=' + requis);
  const errCount = {};
  for (const t of ['Requis', 'Numéro invalide', 'Email invalide', 'requis']) {
    errCount[t] = await page.getByText(t).count();
  }
  L('VALIDATION ERRORS', JSON.stringify(errCount));
  const reqTexts = [];
  for (let i=0;i<requis;i++) reqTexts.push(await page.locator('text=▲ Requis').nth(i).innerText().catch(()=>''));
  L('REQUIS EXPAND', JSON.stringify(reqTexts));
  await page.waitForTimeout(1200);
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({ name: i.getAttribute('name')||'', ph: i.getAttribute('placeholder')||'', type: i.type, val: i.value }));
  });
  L('ALL INPUTS AFTER CLICK', JSON.stringify(inputs, null, 1));
  L('BODY ALL (1600)', (await page.locator('body').innerText()).slice(0, 1600));

  // Check whether we reached step 2
  const cgl = await page.locator('input[type="checkbox"]').count();
  const sigLabel = await page.locator('text=SIGNATURE').count();
  L('STEP 2 CHECK', 'cglCheckbox=' + cgl + ' signatureLabel=' + sigLabel);

  // ---- STEP 2: CGL + signature ----
  const cglBox = page.locator('input[type="checkbox"]');
  if ((await cglBox.count()) > 0) {
    await cglBox.first().check().catch(()=>{});
    await page.waitForTimeout(300);
    const canvas = page.locator('#signature-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + box.height / 2 - 20, { steps: 8 });
      await page.mouse.move(box.x + 220, box.y + box.height / 2 + 10, { steps: 8 });
      await page.mouse.move(box.x + 320, box.y + box.height / 2 - 15, { steps: 8 });
      await page.mouse.up();
    }
    await page.waitForTimeout(400);
    await page.locator('#btn-validate-sig').click().catch(()=>{});
    await page.waitForTimeout(800);
  }
  L('AFTER STEP2 ACTIONS', 'step2 handled');

  // Advance to step 3 (OTP)
  await page.locator('button:has-text("Continuer")').filter({ hasNotText: 'mes achats' }).filter({ visible: true }).last().click();
  await page.waitForTimeout(4000);
  L('STEP 3 OTP', 'otpStep=' + (await page.getByText('Vérification email').count()) + ' otpCode=' + otpCode + ' pendingId=' + pendingId);

  // Enter OTP
  if (otpCode) {
    await page.locator('input[maxlength="100"]').first().fill(otpCode);
    await page.waitForTimeout(5000);
  }
  L('STEP 4 READY', 'ready=' + (await page.getByText('Prêt pour la location').count()));

  // Go to cart
  await page.locator('button:has-text("Voir le panier")').first().click();
  await page.waitForTimeout(4000);
  L('CART URL', page.url());
  const cartText = await page.locator('body').innerText();
  L('CART BODY (4000)', cartText.slice(0, 4000));

  await browser.close();
  console.log('\nPAGE ERRORS', JSON.stringify(errs));
})();
