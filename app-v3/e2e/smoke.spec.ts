import { test, expect } from '@playwright/test';

/**
 * Røyktester for v3 — verifiserer at de offentlige (gjest-tilgjengelige) sidene
 * laster og at øvemodusen faktisk reagerer på svar. Innloggede sider (hjem,
 * lærer, min side) krever Firebase-auth og dekkes ikke her.
 */

test('landingssiden laster med innloggingsfri øving', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /innloggingsfri øving/i })).toBeVisible();
});

test('øvemodus: nivå 1 viser ord og svaralternativer', async ({ page }) => {
  await page.goto('/ov?niva=niva1');
  // Progresjonsteller 1/40 og minst ett svaralternativ skal vises.
  await expect(page.getByText('1/40')).toBeVisible();
  await expect(page.getByTestId('svar-alternativ').first()).toBeVisible();
});

test('øvemodus: et svar gir fargefeedback (grønn/rød)', async ({ page }) => {
  await page.goto('/ov?niva=niva1');
  await expect(page.getByText('1/40')).toBeVisible();
  // Klikk første ekte svaralternativ; etterpå skal feedback-tekst vises.
  await page.getByTestId('svar-alternativ').first().click();
  // Enten «Riktig!» (evt. streak) eller «Riktig svar:» ved feil.
  await expect(page.getByText(/riktig/i).first()).toBeVisible({ timeout: 3000 });
});

test('øvemodus: 10. riktige svar gir et kort (jf. v2)', async ({ page }) => {
  // Seed kortProgress=9 så neste riktige svar blir det 10. og utløser kort.
  await page.addInitScript(() => localStorage.setItem('kortProgress', '9'));
  await page.goto('/ov?niva=niva1');
  await expect(page.getByText('1/40')).toBeVisible();

  // Svar til vi treffer riktig (det blir nr. 10) — maks noen runder.
  for (let runde = 0; runde < 6; runde++) {
    if (await page.getByText('🎁 Nytt kort!').isVisible().catch(() => false)) break;
    const alts = page.getByTestId('svar-alternativ');
    if ((await alts.count()) === 0) break;
    await alts.first().click();
    await page.waitForTimeout(1100);
    const neste = page.getByRole('button', { name: /Neste/ });
    if (await neste.isVisible().catch(() => false)) { await neste.click(); await page.waitForTimeout(400); }
  }
  await expect(page.getByText('🎁 Nytt kort!')).toBeVisible();
});

test('bunnmeny: øve-flyten har Øv/Galleri/Hjem-faner', async ({ page }) => {
  // Bunnmenyen skal være tilgjengelig både på nivåvelger og i øvemodus.
  await page.goto('/gloser');
  await expect(page.getByTestId('tab-ov')).toBeVisible();
  await expect(page.getByTestId('tab-galleri')).toBeVisible();
  await expect(page.getByTestId('tab-hjem')).toBeVisible();

  await page.goto('/ov?niva=niva1');
  await expect(page.getByText('1/40')).toBeVisible();
  await expect(page.getByTestId('tab-galleri')).toBeVisible();

  // Galleri-fanen skal føre gjesten til galleriet (åpent uten innlogging).
  await page.getByTestId('tab-galleri').click();
  await expect(page).toHaveURL(/\/galleri$/);
});

test('FAQ-siden bruker ryddet språk (ingen «Leitner»)', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: /ofte stilte spørsmål/i })).toBeVisible();
  await expect(page.getByText(/leitner/i)).toHaveCount(0);
});
