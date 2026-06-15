/**
 * Legger til «G GloseMester»-logo i nedre høyre hjørne på kortbilder.
 * Brukes for pakker generert med Fal/Higgsfield (ikke Midjourney-import).
 *
 * Bruk:
 *   cd app-v3
 *   node scripts/legg-til-logo.mjs romvesener landemerker skapninger
 */
import sharp from 'sharp';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KATEGORIER = process.argv.slice(2);
if (!KATEGORIER.length) {
  console.error('Bruk: node scripts/legg-til-logo.mjs <kategori> [kategori2 ...]');
  process.exit(1);
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

function lagLogoSvg(bredde, hoyde) {
  // Logo skaleres relativt til bildestørrelsen (ca. 28% av bredden, 10% av høyden)
  const logoH = Math.round(hoyde * 0.10);
  const logoW = Math.round(bredde * 0.50);
  const margin = Math.round(bredde * 0.03);
  const x = bredde - logoW - margin;
  const y = hoyde - logoH - margin;

  const gSize = Math.round(logoH * 0.80);
  const fontSize = Math.round(logoH * 0.38);
  const gX = x + Math.round(gSize * 0.1);
  const gY = y + Math.round((logoH - gSize) / 2);
  const tekstX = gX + gSize + 4;
  const tekstY = y + Math.round(logoH * 0.62);

  return Buffer.from(
    `<svg width="${bredde}" height="${hoyde}" xmlns="http://www.w3.org/2000/svg">` +
    // Halv-transparent hvit bakgrunn bak logoen
    `<rect x="${x - 4}" y="${y - 2}" width="${logoW + 8}" height="${logoH + 4}" rx="4" fill="white" fill-opacity="0.55"/>` +
    // Oransje "G" bokstav
    `<text x="${gX}" y="${gY + gSize * 0.78}" ` +
    `font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${gSize}" ` +
    `fill="#E87B1E">${'G'}</text>` +
    // "GloseMester" tekst
    `<text x="${tekstX}" y="${tekstY}" ` +
    `font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${fontSize}" ` +
    `fill="#555555" letter-spacing="0.3">GloseMester</text>` +
    `</svg>`,
  );
}

let totalt = 0;
for (const kat of KATEGORIER) {
  const dir = join(ROOT, kat);
  if (!existsSync(dir)) { console.warn(`Hopper over ukjent mappe: ${dir}`); continue; }
  const filer = readdirSync(dir).filter(f => f.endsWith('.webp'));
  console.log(`\n${kat}: behandler ${filer.length} bilder...`);
  for (const fil of filer) {
    const sti = join(dir, fil);
    const { width, height } = await sharp(sti).metadata();
    const logo = lagLogoSvg(width, height);
    const tmp = sti + '.tmp.webp';
    await sharp(sti)
      .composite([{ input: logo, top: 0, left: 0 }])
      .webp({ quality: 82 })
      .toFile(tmp);
    // Overskriv originalen
    await sharp(tmp).toFile(sti);
    const { unlinkSync } = await import('node:fs');
    unlinkSync(tmp);
    process.stdout.write('.');
    totalt++;
  }
  console.log(` ✓`);
}
console.log(`\nFerdig: logo lagt til på ${totalt} bilder.`);
