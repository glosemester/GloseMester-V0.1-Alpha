/**
 * Engangs-optimalisering av samlekort-bilder.
 * 1024px PNG-er (≈115 MB) → 320px WebP (vises maks ~160px). Kjøres manuelt:
 *   cd app-v3 && npm i -D sharp && node scripts/optimize-card-images.mjs
 * Oppdater deretter bygg() i kortData.ts til .webp (gjort).
 */
import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/home/user/GloseMester-V0.1-Alpha/images';
const KATEGORIER = ['biler', 'dinosaurer', 'dyr', 'guder'];
const MAKS = 320;
const KVALITET = 82;

let f0 = 0, f1 = 0, n = 0;
for (const kat of KATEGORIER) {
  const dir = join(ROOT, kat);
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
