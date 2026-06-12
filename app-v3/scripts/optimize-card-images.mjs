/**
 * Engangs-optimalisering av samlekort-bilder.
 * 1024px PNG-er (≈115 MB) → 320px WebP (vises maks ~160px). Kjøres manuelt:
 *   cd app-v3 && npm i -D sharp && node scripts/optimize-card-images.mjs
 * Oppdater deretter bygg() i kortData.ts til .webp (gjort).
 */
import sharp from 'sharp';
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'images');
// Kategorier kan angis som argumenter (f.eks. `node … romvesener`); uten
// argumenter tas alle. Mapper uten .png-filer hoppes uansett over.
const KATEGORIER = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['biler', 'dinosaurer', 'dyr', 'guder', 'romvesener', 'planeter', 'skapninger', 'landemerker'];
const MAKS = 320;
const KVALITET = 82;

let f0 = 0, f1 = 0, n = 0;
for (const kat of KATEGORIER) {
  const dir = join(ROOT, kat);
  if (!existsSync(dir)) continue;
  for (const fil of readdirSync(dir)) {
    if (!fil.endsWith('.png')) continue;
    const src = join(dir, fil);
    f0 += statSync(src).size;
    const ut = join(dir, fil.replace(/\.png$/, '.webp'));
    await sharp(src)
      .resize(MAKS, MAKS, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: KVALITET })
      .toFile(ut);
    f1 += statSync(ut).size;
    unlinkSync(src);
    n++;
  }
}
console.log(`Optimaliserte ${n} kortbilder: ${(f0 / 1048576).toFixed(1)} MB → ${(f1 / 1048576).toFixed(1)} MB`);
