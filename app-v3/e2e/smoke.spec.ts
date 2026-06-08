import { test, expect } from '@playwright/test';

/**
 * Røyktester for v3 — verifiserer at de offentlige (gjest-tilgjengelige) sidene
 * laster og at øvemodusen faktisk reagerer på svar. Innloggede sider (hjem,
 * lærer, min side) krever Firebase-auth og dekkes ikke her.
 */

test('landingssiden har elev- og lærer-innlogging', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /logg inn med feide/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /øv uten innlogging/i })).toBeVisible();
  await expect(page.getByText('For elever')).toBeVisible();
});

test('øvemodus: nivå 1 viser ord og svaralternativer', async ({ page }) => {
  await page.goto('/ov?niva=niva1');
  // Progresjonsteller (1/N) og minst ett svaralternativ skal vises.
  await expect(page.getByText(/^1\/\d+$/)).toBeVisible();
  await expect(page.getByTestId('svar-alternativ').first()).toBeVisible();
});

test('øvemodus: et svar gir fargefeedback (grønn/rød)', async ({ page }) => {
  await page.goto('/ov?niva=niva1');
  await expect(page.getByText(/^1\/\d+$/)).toBeVisible();
  // Klikk første ekte svaralternativ; etterpå skal feedback-tekst vises.
  await page.getByTestId('svar-alternativ').first().click();
  // Enten «Riktig!» (evt. streak) eller «Riktig svar:» ved feil.
  await expect(page.getByText(/riktig/i).first()).toBeVisible({ timeout: 3000 });
});

test('øvemodus: 10. riktige svar gir et kort (jf. v2)', async ({ page }) => {
  // Seed den felles kort-telleren (gjest) til 9 så neste riktige svar utløser kort.
  await page.addInitScript(() => localStorage.setItem('mester_kortprogresjon_gloser_gjest', '9'));
  await page.goto('/ov?niva=niva1');
  await expect(page.getByText(/^1\/\d+$/)).toBeVisible();

  // Svar til vi treffer riktig (det blir nr. 10) — maks noen runder.
  for (let runde = 0; runde < 6; runde++) {
    if (await page.getByText('Du vant et kort!').isVisible().catch(() => false)) break;
    const alts = page.getByTestId('svar-alternativ');
    if ((await alts.count()) === 0) break;
    await alts.first().click();
    await page.waitForTimeout(1100);
    const neste = page.getByRole('button', { name: /Neste/ });
    if (await neste.isVisible().catch(() => false)) { await neste.click(); await page.waitForTimeout(400); }
  }
  // Popup vises med «Legg til i min samling»-knapp; kortet legges til ved klikk.
  await expect(page.getByText('Du vant et kort!')).toBeVisible();
  await page.getByRole('button', { name: /Legg til i min samling/ }).click();
  await expect(page.getByText('Du vant et kort!')).toHaveCount(0);
});

test('bunnmeny: synlig på nivåvelger, skjult under aktivt spørsmål', async ({ page }) => {
  // På nivåvelgeren skal hele bunnmenyen være tilgjengelig.
  await page.goto('/gloser');
  await expect(page.getByTestId('tab-ov')).toBeVisible();
  await expect(page.getByTestId('tab-mine')).toBeVisible();
  await expect(page.getByTestId('tab-bytte')).toBeVisible();
  await expect(page.getByTestId('tab-galleri')).toBeVisible();

  // Galleri-fanen fører gjesten til galleriet (åpent uten innlogging).
  await page.getByTestId('tab-galleri').click();
  await expect(page).toHaveURL(/\/galleri$/);

  // Bug 3: under et aktivt spørsmål skjules bunnmenyen, så den ikke dekker
  // det 4. svaralternativet.
  await page.goto('/ov?niva=niva1');
  await expect(page.getByText(/^1\/\d+$/)).toBeVisible();
  await expect(page.getByTestId('tab-galleri')).toHaveCount(0);
});

test('bytte krever innlogging: gjest sendes til landing', async ({ page }) => {
  // /bytte er beskyttet — uinnlogget gjest skal ikke nå byttesiden.
  await page.goto('/bytte');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: /logg inn med feide/i })).toBeVisible();
});

test('galleri: alle 152 kort vises, ikke-samlede grået ut', async ({ page }) => {
  await page.goto('/galleri');
  await expect(page.getByText(/av 152 samlet/)).toBeVisible();
  // Uten samlede kort skal låste «???»-kort vises.
  await expect(page.getByText('???').first()).toBeVisible();
});

test('kvitteringsside vises etter kjøp (/oppgrader/takk)', async ({ page }) => {
  await page.goto('/oppgrader/takk?status=success&orderId=test123');
  await expect(page.getByRole('heading', { name: /takk for kjøpet/i })).toBeVisible();
  await expect(page.getByText(/Ordre-ID: test123/)).toBeVisible();
});

test('desktop: innholdstunge sider kan scrolles', async ({ page }) => {
  // Liten viewport-høyde + mye innhold (galleriet) → siden må kunne scrolles.
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/galleri');
  await expect(page.getByText(/av 152 samlet/)).toBeVisible();
  const kanScrolle = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return el.scrollHeight > el.clientHeight + 50;
  });
  expect(kanScrolle).toBe(true);
  // Faktisk hjul-scroll skal flytte posisjonen (poll bort timing-flakiness).
  await page.mouse.move(640, 300);
  await page.mouse.wheel(0, 1000);
  await expect
    .poll(() => page.evaluate(() => (document.scrollingElement || document.documentElement).scrollTop))
    .toBeGreaterThan(0);
});

test('FAQ-siden bruker ryddet språk (ingen «Leitner»)', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: /ofte stilte spørsmål/i })).toBeVisible();
  await expect(page.getByText(/leitner/i)).toHaveCount(0);
});

test('frittstående HTML-sider serveres (ikke React-404) selv med aktiv service worker', async ({ page }) => {
  // Last appen og la service-workeren registrere seg (PWA), så last på nytt så
  // den er aktiv. Naviger deretter til en .html-side: den skal serveres som ekte
  // fil, ikke fanges av SPA-fallbacken (navigateFallbackDenylist).
  await page.goto('/');
  await page.waitForTimeout(800);
  await page.reload();
  await page.waitForTimeout(400);

  await page.goto('/skoleavtale.html');
  await expect(page.getByRole('heading', { name: /skoleavtale/i })).toBeVisible();
  await expect(page.getByText('Unexpected Application Error')).toHaveCount(0);

  await page.goto('/vilkar.html');
  await expect(page.getByRole('heading', { name: /kjøpsvilkår/i })).toBeVisible();
});
