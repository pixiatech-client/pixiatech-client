import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });

async function inspect(url, label) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  const res = await page.evaluate(() => {
    const loaded = (f) => document.fonts.check(`11px "${f}"`);
    return {
      satoshiLoaded: loaded('Satoshi'),
      jetbrainsLoaded: loaded('JetBrains Mono'),
      anyInlineVar: [...document.querySelectorAll('*')].some((el) => getComputedStyle(el).fontFamily.includes('--font-mono')),
      monoLabels: [...document.querySelectorAll('.ct-label, .ct-chip')]
        .slice(0, 3)
        .map((el) => ({ t: (el.textContent || '').trim().slice(0, 26), f: getComputedStyle(el).fontFamily })),
      headings: [...document.querySelectorAll('h1, h2')]
        .slice(0, 2)
        .map((el) => ({ t: (el.textContent || '').trim().slice(0, 26), f: getComputedStyle(el).fontFamily, w: getComputedStyle(el).fontWeight })),
    };
  });

  console.log(`\n===== ${label} (${url}) =====`);
  console.log(`  Satoshi chargee ?        ${res.satoshiLoaded}`);
  console.log(`  JetBrains Mono chargee ? ${res.jetbrainsLoaded}`);
  console.log(`  element utilisant var(--font-mono) ? ${res.anyInlineVar}`);
  console.log('  Libelles mono :');
  for (const m of res.monoLabels) console.log(`    "${m.t}"  ->  ${m.f}`);
  console.log('  Titres :');
  for (const m of res.headings) console.log(`    "${m.t}"  ->  ${m.f}  (weight ${m.w})`);

  await page.screenshot({ path: `fontcheck-${label}.png` });
  await page.close();
}

await inspect('http://localhost:3000/web/contact', 'contact');
await inspect('http://localhost:3000/web', 'home');
await browser.close();
