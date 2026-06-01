/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// GloseMester v3 — Vite-konfig.
// Bygges til ../dist (vil bli Capacitor webDir i fase B4).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GloseMester',
        short_name: 'GloseMester',
        theme_color: '#FF6B47',
        background_color: '#FAFAF8',
        display: 'standalone',
        start_url: '/',
      },
      workbox: {
        navigateFallback: '/index.html',
        // Unnta frittstående HTML-sider (skoleavtale, vilkår, personvern,
        // databehandleravtale) fra SPA-fallbacken. Uten dette fanger
        // navigasjonsruten alle /*.html og serverer index.html → React Router
        // gir 404 når PWA-en er installert.
        navigateFallbackDenylist: [/\.html$/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  // Vitest (enhetstester). e2e/ kjøres av Playwright, ikke Vitest — ekskluderes
  // så Vitest ikke prøver å laste @playwright/test.
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
});
