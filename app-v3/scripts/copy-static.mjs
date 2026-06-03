/**
 * Kopierer statiske rot-assets som v3 refererer, men som ikke er en del av
 * Vite-bygget, inn i dist/ etter bygg. Kjøres som postbuild (se package.json).
 *
 * v3 bruker:
 *  - images/  (alle 152 samlekort + vokabularbilder)  → images/{biler,...}/*
 *  - personvern.html, vilkar.html (lenket fra Min side / marketing-footer)
 *  - icon.png (apple-touch-icon / PWA)
 *
 * sounds/ brukes ikke av v3 og kopieres ikke.
 */
import { existsSync, cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..'); // app-v3/scripts → repo-rot
const dist = join(repoRoot, 'dist');

if (!existsSync(dist)) {
  console.error('[feil] dist/ finnes ikke — kjør "vite build" først.');
  process.exit(1);
}

const mapper = ['images'];
const filer = ['personvern.html', 'vilkar.html', 'databehandleravtale.html', 'skoleavtale.html', 'icon.png'];

for (const m of mapper) {
  const kilde = join(repoRoot, m);
  if (existsSync(kilde)) {
    cpSync(kilde, join(dist, m), { recursive: true });
    console.log(`Kopierte ${m}/ → dist/${m}/`);
  } else {
    console.warn(`[advarsel] Mangler ${m}/ i rot — hopper over.`);
  }
}

for (const f of filer) {
  const kilde = join(repoRoot, f);
  if (existsSync(kilde)) {
    mkdirSync(dist, { recursive: true });
    cpSync(kilde, join(dist, f));
    console.log(`Kopierte ${f} → dist/${f}`);
  } else {
    console.warn(`[advarsel] Mangler ${f} i rot — hopper over.`);
  }
}

console.log('[ok] Statiske rot-assets kopiert til dist/.');
