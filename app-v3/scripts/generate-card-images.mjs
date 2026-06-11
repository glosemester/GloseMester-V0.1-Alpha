/**
 * Genererer samlekort-bilder for en ny kategori med OpenAI gpt-image.
 * Erstatter den manuelle Midjourney-flyten (docs/arkiv/MIDJOURNEY_MATTEMESTER_KORT.md).
 *
 * Bruk:
 *   export OPENAI_API_KEY=sk-…           (aldri i repoet!)
 *   cd app-v3 && node scripts/generate-card-images.mjs <manifest.json> [--model gpt-image-1-mini] [--quality medium] [--kun 001,005]
 *
 * Manifest (JSON):
 *   {
 *     "mappe": "romvesener",            // → images/<mappe>/
 *     "kategoriStil": "…valgfri felles stil…",
 *     "variasjoner": ["…komposisjon 1…", "…2…"],   // valgfritt — fordeles rundgang på kortene for mangfold
 *     "kort": [ { "fil": "001-zorg.png", "navn": "Zorg", "prompt": "friendly green alien …", "stil": "…valgfri per kort…" }, … ]
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

// Master-stilen fra de eksisterende kortene (jf. det opprinnelige
// Midjourney-generator-dokumentet): [NAVN], [beskrivelse], [KATEGORI-STIL],
// [RARITY-BAKGRUNN], high detail, card game aesthetic. Kategoristilen kan
// overstyres per manifest med feltet "kategoriStil".
const STANDARD_KATEGORI_STIL =
  'digital trading card art style, detailed digital illustration, single centered subject, ' +
  'vibrant colors, kid-friendly';

// Bakgrunnen koder sjeldenheten — samme posisjonsformel som kortData.ts getRarity.
function rarityBakgrunn(nummer) {
  if (nummer >= 36) return 'golden glow to yellow gradient background, warm radiant lighting';   // legendary
  if (nummer >= 31) return 'purple to dark purple gradient background, mystical lighting';        // epic
  if (nummer >= 21) return 'light blue to blue gradient background, bright lighting';             // rare
  return 'soft white to light gray gradient background, bright airy lighting';                   // common
}

const STANDARD_MODELL = 'gpt-image-1-mini';
const STORRELSE = '1024x1024'; // 1:1 — samme kvadratiske format som eksisterende kort
// VIKTIG: uten eksplisitt quality velger API-et «auto» (i praksis high) — ~7× dyrere.
// Sluttbildene blir uansett 320px WebP, så medium holder i massevis.
// (mini, 1024×1024: low ≈ $0.005, medium ≈ $0.011–0.02, high ≈ $0.036 per bilde)
const STANDARD_KVALITET = 'medium';

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
  // --kun: PowerShell splitter ukvoterte kommalister til separate argumenter
  // og stripper ledende nuller (001,002 → 1 2) — samle alt frem til neste
  // flagg og normaliser til tresifret kortnummer.
  let kun;
  const kunIndex = args.indexOf('--kun');
  if (kunIndex >= 0) {
    kun = [];
    for (let j = kunIndex + 1; j < args.length && !args[j].startsWith('--'); j++) {
      kun.push(...args[j].split(','));
    }
    kun = kun
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n))
      .map((n) => String(n).padStart(3, '0'));
  }
  return {
    manifestSti,
    modell: flagg('--model') ?? STANDARD_MODELL,
    kvalitet: flagg('--quality') ?? STANDARD_KVALITET,
    kun,
  };
}

async function genererBilde(apiKey, modell, kvalitet, prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modell, prompt, size: STORRELSE, quality: kvalitet, n: 1 }),
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

const { manifestSti, modell, kvalitet, kun } = lesArgs();
const manifest = JSON.parse(readFileSync(manifestSti, 'utf8'));
if (!manifest.mappe || !Array.isArray(manifest.kort)) {
  console.error('Manifestet må ha "mappe" og "kort" (liste av {fil, navn, prompt}).');
  process.exit(1);
}

// Bildene ligger i <repo-rot>/images/<mappe>/ (jf. optimize-card-images.mjs).
const repoRot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const utMappe = join(repoRot, 'images', manifest.mappe);
mkdirSync(utMappe, { recursive: true });

const kategoriStil = manifest.kategoriStil ?? manifest.stilPrefix ?? STANDARD_KATEGORI_STIL;
// Valgfrie komposisjonsvariasjoner — fordeles fast (rundgang på kortnummer)
// så kortene i en kategori ikke blir for like, men re-kjøringer er stabile.
const variasjoner = Array.isArray(manifest.variasjoner) ? manifest.variasjoner : [];
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
  const nummer = parseInt(kort.fil.slice(0, 3), 10);
  const variasjon = variasjoner.length ? `, ${variasjoner[(nummer - 1) % variasjoner.length]}` : '';
  const prompt = `${kort.navn}, ${kort.prompt}, ${kort.stil ?? kategoriStil}${variasjon}, ${rarityBakgrunn(nummer)}, ` +
    'trading card game art, collector card illustration, high detail, dramatic dynamic lighting, vibrant saturated colors, ' +
    'full-bleed edge-to-edge artwork, no card frame, no border, no text or letters in the image';
  process.stdout.write(`Genererer ${kort.fil} (${modell}, ${kvalitet})… `);
  try {
    writeFileSync(pngSti, await genererBilde(apiKey, modell, kvalitet, prompt));
    generert++;
    console.log('ok');
  } catch (e) {
    console.log(`FEIL: ${e.message}`);
  }
}

console.log(`\nFerdig: ${generert} generert, ${hoppet} fantes fra før → ${utMappe}`);
console.log('Neste steg: node scripts/optimize-card-images.mjs (husk å legge mappen i KATEGORIER), så stage pakken i kortData.ts.');
