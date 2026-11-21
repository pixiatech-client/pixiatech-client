import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/web/pxt-fine', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
console.log(JSON.stringify(await page.evaluate(() => ({
  path: location.pathname,
  hashLinks: [...document.querySelectorAll('a[href^="#"]')].slice(0, 40).map(a => {
    const r = a.getBoundingClientRect();
    return { text: (a.textContent||'').trim().slice(0,40), href: a.getAttribute('href'), y: Math.round(r.y), x: Math.round(r.x) };
  }),
  sections: [...document.querySelectorAll('section[id]')].map(s => s.id),
})), null, 2));
await browser.close();
