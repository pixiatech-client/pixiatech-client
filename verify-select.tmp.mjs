import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });

for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 768, hasTouch: w < 768 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:3000/test-select-sheet', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1500);
  const before = await page.locator('[data-testid="value"]').textContent();
  const triggerText = await page.locator('button[aria-label="Test select"]').textContent();
  await page.locator('button[aria-label="Test select"]').click();
  await page.waitForTimeout(600);
  const dialogCount = await page.locator('[role="dialog"]').count();
  const radixContent = await page.locator('[data-radix-popper-content-wrapper]').count();
  let picked = null;
  if (dialogCount) {
    await page.getByRole('option', { name: 'Option D' }).click();
    await page.waitForTimeout(1200);
    picked = {
      value: await page.locator('[data-testid="value"]').textContent(),
      triggerText: await page.locator('button[aria-label="Test select"]').textContent(),
      dialogs: await page.locator('[role="dialog"]').count(),
    };
  }
  console.log(JSON.stringify({ width: w, before, triggerText, dialogCount, radixContent, picked, errors }, null, 2));
  await ctx.close();
}
await browser.close();
