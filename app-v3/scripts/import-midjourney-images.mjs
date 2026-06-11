/**
 * Importerer ferdige Midjourney-bilder til en kortkategori.
 *
 * Denne flyten gir Midjourneys stiliserte kunst (som GPT Image ikke klarer),
 * og automatiserer det kjedelige: omdøping til navnekonvensjonen + 320px WebP.
 *
 * ARBEIDSFLYT
 *   1. Generer 38 bilder i Midjourney. Bruk «--ar 2:3» for kortformat.
 *      (Prompt-tekstene ligger i kort-manifest-<kategori>.json, ett per kort.)
 *   2. Last ned hvert valgte bilde (det oppskalerte enkeltbildet, ikke 2x2-rutenettet)
 *      og gi det KORTNUMMERET som filnavn:
 *         1.png, 2.png, … 38.png
 *      Ledende nuller er valgfritt (01, 001 funker). PNG/JPG/JPEG/WebP godtas.
 *      Alt etter tallet ignoreres, så «7-fjelltroll.png» tolkes også som nr. 7.
 *   3. Legg alle bildene i:  midjourney-innboks/<mappe>/   (i repo-roten)
 *   4. Kjør:
 *         cd app-v3
 *         node scripts/import-midjourney-images.mjs kort-manifest-<kategori>.json
 *
 * Skriptet leser manifestet for å vite hvilket navn hvert nummer skal ha
 * (1 → 001-nisse.webp), skalerer til 320px WebP og skriver til images/<mappe>/.
 * Til slutt rapporteres hvilke kortnumre som mangler, så du ser hva som gjenstår.
 *
 * Overstyr innboksmappen med  --fra <sti>  ved behov.
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAKS = 320; // samme som optimize-card-images.mjs — kortene vises maks ~160px
const KVALITET = 82;
const GODTATTE = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function lesArgs() {
  const args = process.argv.slice(2);
  const manifestSti = args.find((a) => !a.startsWith('--'));
  if (!manifestSti) {
    console.error('Bruk: node scripts/import-midjourney-images.mjs <manifest.json> [--fra <innboksmappe>]');
    process.exit(1);
  }
  const i = args.indexOf('--fra');
  return { manifestSti, fra: i >= 0 ? args[i + 1] : null };
}

const { manifestSti, fra } = lesArgs();
const manifest = JSON.parse(readFileSync(manifestSti, 'utf8'));
if (!manifest.mappe || !Array.isArray(manifest.kort)) {
  console.error('Manifestet må ha "mappe" og "kort" (liste av {fil, navn}).');
  process.exit(1);
}

const repoRot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const innboks = fra ? resolve(fra) : join(repoRot, 'midjourney-innboks', manifest.mappe);
const utMappe = join(repoRot, 'images', manifest.mappe);
mkdirSync(utMappe, { recursive: true });

if (!existsSync(innboks)) {
  console.error(`Fant ikke innboksmappen: ${innboks}`);
  console.error('Lag den og legg de nedlastede Midjourney-bildene der (navngitt 1, 2, … 38), eller bruk --fra <sti>.');
  process.exit(1);
}

// Kortnummer → basenavn uten endelse (1 → "001-nisse").
const nummerTilBase = new Map();
for (const kort of manifest.kort) {
  const nummer = parseInt(kort.fil.slice(0, 3), 10);
  if (Number.isFinite(nummer)) nummerTilBase.set(nummer, kort.fil.replace(/\.[^.]+$/, ''));
}

// Innboks → kortnummer (ledende siffer i filnavnet). Siste fil vinner ved duplikat.
const nummerTilKilde = new Map();
for (const fil of readdirSync(innboks)) {
  if (!GODTATTE.has(extname(fil).toLowerCase())) continue;
  const treff = fil.match(/^0*(\d+)/);
  if (!treff) continue;
  const nummer = parseInt(treff[1], 10);
  if (nummerTilKilde.has(nummer)) {
    console.warn(`  Advarsel: flere filer for nr. ${nummer} — bruker «${fil}».`);
  }
  nummerTilKilde.set(nummer, join(innboks, fil));
}

console.log(`Innboks: ${innboks}`);
console.log(`Fant ${nummerTilKilde.size} bilder → images/${manifest.mappe}/\n`);

let importert = 0;
for (const [nummer, base] of [...nummerTilBase.entries()].sort((a, b) => a[0] - b[0])) {
  const kilde = nummerTilKilde.get(nummer);
  if (!kilde) continue;
  const ut = join(utMappe, `${base}.webp`);
  const fantes = existsSync(ut);
  await sharp(kilde)
    .resize(MAKS, MAKS, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: KVALITET })
    .toFile(ut);
  console.log(`  ${fantes ? 'oppdaterte' : 'la til'}  ${base}.webp`);
  importert++;
}

// Numre i innboksen som ikke finnes i manifestet (skrivefeil i filnavn).
const ukjente = [...nummerTilKilde.keys()].filter((n) => !nummerTilBase.has(n)).sort((a, b) => a - b);
if (ukjente.length) console.warn(`\nAdvarsel: ignorerte filer med ukjent kortnummer: ${ukjente.join(', ')}`);

// Kort som fortsatt mangler bilde.
const mangler = [...nummerTilBase.keys()].filter((n) => !nummerTilKilde.has(n)).sort((a, b) => a - b);
console.log(`\nFerdig: ${importert} importert. ${mangler.length ? `Mangler ennå: ${mangler.join(', ')}` : 'Alle 38 kort på plass!'}`);
if (!mangler.length) {
  console.log('Neste steg: git add images/' + manifest.mappe + ' → commit → push → si fra, så aktiverer Claude pakken.');
}
