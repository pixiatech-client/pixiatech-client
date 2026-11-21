import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const GREENS = [
  'rgb(195, 249, 16)', 'rgb(212, 255, 46)', 'rgb(176, 226, 14)',
  'rgb(56, 224, 68)', 'rgb(47, 203, 60)', 'rgb(46, 194, 53)',
  'rgb(74, 242, 87)', 'rgb(143, 232, 58)', 'rgb(74, 224, 122)',
];
const props = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'outlineColor', 'boxShadow', 'fill', 'stroke'];

async function scan(url, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const hits = await page.evaluate(({ GREENS, props }) => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      for (const p of props) {
        const v = cs[p];
        if (!v) continue;
        if (GREENS.some(g => v.includes(g))) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (typeof el.className === 'string' ? el.className : '').slice(0, 110),
            prop: p,
            value: v.slice(0, 90),
            text: (el.textContent || '').trim().slice(0, 40),
          });
        }
      }
    }
    return out;
  }, { GREENS, props });
  await ctx.close();
  return hits;
}

for (const [url, w, h] of [
  ['http://localhost:3000/web/products', 1440, 900],
  ['http://localhost:3000/web/products', 390, 844],
  ['http://localhost:3000/web/insights', 390, 844],
  ['http://localhost:3000/web/pxt-fine', 390, 844],
  ['http://localhost:3000/admin/login', 390, 844],
]) {
  const hits = await scan(url, w, h);
  console.log(`\n=== ${url} @${w} — ${hits.length} green hits`);
  console.log(JSON.stringify(hits.slice(0, 40), null, 2));
}
await browser.close();
