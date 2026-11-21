import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
for (const u of ['http://localhost:3000/web/product/pxt-fine', 'http://localhost:3000/web/product/xr-fine']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(u, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const d = await page.evaluate(() => ({
    title: document.title,
    hash: [...document.querySelectorAll('a[href^="#"]')].slice(0, 25).map(a => ({
      t: (a.textContent || '').trim().slice(0, 30),
      h: a.getAttribute('href'),
      y: Math.round(a.getBoundingClientRect().y),
    })),
    sections: [...document.querySelectorAll('section[id]')].map(s => s.id),
  }));
  console.log(u, JSON.stringify(d, null, 2));
  await page.close();
}
await browser.close();
