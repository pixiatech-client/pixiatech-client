import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'C:/Users/ProMédia/AppData/Local/Temp/opencode/ui-shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function checkPage(url, label, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width < 768,
    hasTouch: width < 768,
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: false });

  const meta = await page.evaluate(() => ({
    title: document.title,
    width: window.innerWidth,
    height: window.innerHeight,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--ui-accent').trim(),
    scrollW: document.documentElement.scrollWidth,
    bodyOverflow: document.body.style.overflow,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
  }));
  results.push({ label, url, ...meta, errors });

  if (label.includes('mobile') && url.includes('/web/products')) {
    const btn = page.getByRole('button', { name: /filtres/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(700);
      const sheet = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return null;
        const r = d.getBoundingClientRect();
        const cs = getComputedStyle(d);
        return {
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          bottomGap: Math.round(window.innerHeight - r.bottom),
          radius: cs.borderTopLeftRadius,
          maxHeight: cs.maxHeight,
          bodyOverflow: document.body.style.overflow,
          focusInside: d.contains(document.activeElement),
          title: d.querySelector('h2')?.textContent || null,
        };
      });
      await page.screenshot({ path: `${OUT}/${label}-sheet.png`, fullPage: false });
      results.push({ label: `${label}-sheet`, sheet });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => ({
        dialogs: document.querySelectorAll('[role="dialog"]').length,
        bodyOverflow: document.body.style.overflow,
        focused: document.activeElement?.textContent?.trim().slice(0, 40) || null,
      }));
      results.push({ label: `${label}-after-escape`, after });
    }
  }
  await context.close();
}

for (const [url, label, w, h] of [
  ['http://localhost:3000/web/products', 'products-desktop', 1440, 900],
  ['http://localhost:3000/web/products', 'products-mobile', 390, 844],
  ['http://localhost:3000/web/insights', 'insights-mobile', 390, 844],
  ['http://localhost:3000/web/pxt-fine', 'product-mobile', 390, 844],
]) {
  try { await checkPage(url, label, w, h); }
  catch (e) { results.push({ label, error: String(e) }); }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
