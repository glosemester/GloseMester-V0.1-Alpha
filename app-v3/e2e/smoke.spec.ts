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

test('FAQ-siden bruker ryddet språk (ingen «Leitner»)', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: /ofte stilte spørsmål/i })).toBeVisible();
  await expect(page.getByText(/leitner/i)).toHaveCount(0);
});
