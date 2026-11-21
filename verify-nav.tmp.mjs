import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 768 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/web/pxt-fine', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => {
    const items = [];
    for (const a of document.querySelectorAll('a[href^="#"]')) {
      const label = (a.textContent || '').trim().toUpperCase();
      if (!/^(APERÇU|OVERVIEW|DESIGN|FEATURES|POINTS CLÉS|SPECIFICATIONS|SPÉCIFICATIONS|PROJECTS|PROJETS)$/.test(label)) continue;
      const r = a.getBoundingClientRect();
      items.push({ label, href: a.getAttribute('href'), x: Math.round(r.x), y: Math.round(r.y), visible: r.width > 0 && r.height > 0 });
    }
    return { viewport: { w: window.innerWidth, h: window.innerHeight }, items };
  });
  console.log(JSON.stringify({ width: w, ...data }, null, 2));
  await ctx.close();
}
await browser.close();
