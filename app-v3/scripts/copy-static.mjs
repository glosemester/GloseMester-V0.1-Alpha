/**
 * Kopierer statiske rot-assets som v3 refererer, men som ikke er en del av
 * Vite-bygget, inn i dist/ etter bygg. Kjøres som postbuild (se package.json).
 *
 * Kortbilder ligger nå i app-v3/public/images/ og kopieres automatisk til dist/
 * av Vite (public/ er Vites statiske mappe) — de håndteres IKKE her lenger.
 * Tidligere kopierte denne rot-images/ oppå, noe som overskrev public/ og ga
 * duplisering + dev/prod-sprik. Rot-images/ er fjernet; public/ er eneste kilde.
 *
 * Denne kopierer kun rot-HTML og PWA-ikon som v3 lenker til:
 *  - personvern.html, vilkar.html, databehandleravtale.html, skoleavtale.html
 *  - icon.png (apple-touch-icon / PWA)
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

const filer = ['personvern.html', 'vilkar.html', 'databehandleravtale.html', 'skoleavtale.html', 'icon.png'];

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
