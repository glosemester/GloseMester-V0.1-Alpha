/**
 * Genererer samlekort-bilder for en ny kategori med OpenAI gpt-image.
 * Erstatter den manuelle Midjourney-flyten (docs/arkiv/MIDJOURNEY_MATTEMESTER_KORT.md).
 *
 * Bruk:
 *   export OPENAI_API_KEY=sk-…           (aldri i repoet!)
 *   cd app-v3 && node scripts/generate-card-images.mjs <manifest.json> [--model gpt-image-1-mini] [--kun 001,005]
 *
 * Manifest (JSON):
 *   {
 *     "mappe": "romvesener",            // → images/<mappe>/
 *     "stilPrefix": "…valgfri overstyring…",
 *     "kort": [ { "fil": "001-zorg.png", "navn": "Zorg", "prompt": "friendly green alien …" }, … ]
 *   }
 *
 * Skriptet er idempotent: filer som allerede finnes (.png eller .webp) hoppes
 * over, så enkeltkort kan regenereres ved å slette filen og kjøre på nytt —
 * evt. med --model gpt-image-1.5 for høyere kvalitet på utvalgte kort.
 * Etterpå: node scripts/optimize-card-images.mjs (→ 320px WebP).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Felles stil for alle kort — samme retningslinjer som Midjourney-promptene
// (digital trading card, romtema, barnevennlig), uten Midjourney-flaggene.
const STANDARD_STIL =
  'Digital trading card art, vibrant colors, playful and educational, cartoon style, ' +
  'high quality illustration, clean composition, colorful gradient space background, ' +
  'kid-friendly design, sharp details, portrait trading card format, no text or letters in the image';

const STANDARD_MODELL = 'gpt-image-1-mini';
const STORRELSE = '1024x1536'; // 2:3 — trading card-formatet kortene bruker

function lesArgs() {
  const args = process.argv.slice(2);
  const manifestSti = args.find((a) => !a.startsWith('--'));
  if (!manifestSti) {
    console.error('Bruk: node scripts/generate-card-images.mjs <manifest.json> [--model …] [--kun 001,005]');
    process.exit(1);
  }
  const flagg = (navn) => {
    const i = args.indexOf(navn);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    manifestSti,
    modell: flagg('--model') ?? STANDARD_MODELL,
    kun: flagg('--kun')?.split(',').map((s) => s.trim()),
  };
}

async function genererBilde(apiKey, modell, prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modell, prompt, size: STORRELSE, n: 1 }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('Tomt svar fra OpenAI (mangler b64_json).');
  return Buffer.from(b64, 'base64');
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Sett OPENAI_API_KEY i miljøet først (aldri i koden/repoet).');
  process.exit(1);
}

const { manifestSti, modell, kun } = lesArgs();
const manifest = JSON.parse(readFileSync(manifestSti, 'utf8'));
if (!manifest.mappe || !Array.isArray(manifest.kort)) {
  console.error('Manifestet må ha "mappe" og "kort" (liste av {fil, navn, prompt}).');
  process.exit(1);
}

// Bildene ligger i <repo-rot>/images/<mappe>/ (jf. optimize-card-images.mjs).
const repoRot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const utMappe = join(repoRot, 'images', manifest.mappe);
mkdirSync(utMappe, { recursive: true });

const stil = manifest.stilPrefix ?? STANDARD_STIL;
let generert = 0;
let hoppet = 0;

for (const kort of manifest.kort) {
  if (kun && !kun.some((k) => kort.fil.startsWith(k))) continue;
  const pngSti = join(utMappe, kort.fil);
  const webpSti = pngSti.replace(/\.png$/, '.webp');
  if (existsSync(pngSti) || existsSync(webpSti)) {
    hoppet++;
    continue;
  }
  const prompt = `${kort.prompt}. Character name concept: "${kort.navn}". Style: ${stil}`;
  process.stdout.write(`Genererer ${kort.fil} (${modell})… `);
  try {
    writeFileSync(pngSti, await genererBilde(apiKey, modell, prompt));
    generert++;
    console.log('ok');
  } catch (e) {
    console.log(`FEIL: ${e.message}`);
  }
}

console.log(`\nFerdig: ${generert} generert, ${hoppet} fantes fra før → ${utMappe}`);
console.log('Neste steg: node scripts/optimize-card-images.mjs (husk å legge mappen i KATEGORIER), så stage pakken i kortData.ts.');
