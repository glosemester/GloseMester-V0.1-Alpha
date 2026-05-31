import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright-konfig for v3. Bygger og serverer appen via Vite preview, og
 * kjører tester mot den. Browser lastes fra PLAYWRIGHT_BROWSERS_PATH (satt i
 * miljøet) eller Playwright sin standard nedlasting lokalt/i CI.
 *
 * Kjør: npm run e2e   (headless)
 *       npm run e2e:ui (interaktiv, lokalt)
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Bygg + serve appen før testene. Gjenbruker server lokalt.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
