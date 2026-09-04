const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const base = 'http://localhost:3000';

  const actionBodies = [];
  // Intercept all POST responses (server actions)
  page.on('response', async (res) => {
    try {
      if (res.request().method() === 'POST') {
        const url = res.url();
        // server actions POST to the route with Next-Action header
        const req = res.request();
        const isAction = req.headers()['next-action'] !== undefined ||
                         (url === base + '/' || url === base);
        if (isAction || url.includes('boutique/louer')) {
          const headers = req.headers();
          const na = headers['next-action'];
          if (na) {
            let body = '';
            try { body = (await res.text()).slice(0, 2000); } catch {}
            actionBodies.push({ action: na, url, body });
          }
        }
      }
    } catch (e) {}
  });

  const id = 'T4NIB1rydkfJQ9vNoUmE';
  await page.goto(`${base}/boutique/louer/${id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  // Dump all inputs/labels to understand
  console.log('=== INPUTS ON PAGE ===');
  const inputs = await page.locator('input').evaluateAll(els => els.map(el => ({
    ph: el.placeholder, type: el.type, value: el.value, name: el.name, disabled: el.disabled
  })));
  console.log(JSON.stringify(inputs, null, 1));

  console.log('=== SERVER ACTION RESPONSES ===');
  actionBodies.forEach(a => {
    console.log('--- action', a.action, 'url', a.url);
    console.log(a.body.slice(0, 1500));
  });

  await browser.close();
})();
