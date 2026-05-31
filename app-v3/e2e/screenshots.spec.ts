import { test } from '@playwright/test';

/**
 * Hjelpe-«test» for å fange skjermbilder under utvikling (ikke en assertion).
 * Kjør: npm run e2e -- screenshots
 */
test('skjermbilde: øvemodus før og etter svar', async ({ page }) => {
  await page.goto('/ov?niva=niva1');
  await page.getByText('1/40').waitFor();
  await page.screenshot({ path: 'test-results/ove-foer.png' });

  await page.getByTestId('svar-alternativ').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/ove-etter.png' });
});
