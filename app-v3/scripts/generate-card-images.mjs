/**
 * Genererer samlekort-bilder for en ny kategori med OpenAI gpt-image.
 * Erstatter den manuelle Midjourney-flyten (docs/arkiv/MIDJOURNEY_MATTEMESTER_KORT.md).
 *
 * Bruk:
 *   export OPENAI_API_KEY=sk-…           (aldri i repoet!)
 *   cd app-v3 && node scripts/generate-card-images.mjs <manifest.json> [--model gpt-image-2] [--quality low] [--size 1024x1536] [--kun 001,005]
 *
 * Manifest (JSON):
 *   {
 *     "mappe": "romvesener",            // → images/<mappe>/
 *     "storrelse": "1024x1536",         // valgfritt — overstyrer --size / STANDARD_STORRELSE
 *     "kategoriStil": "…valgfri felles stil…",
 *     "variasjoner": ["…komposisjon 1…", "…2…"],   // fordeles rundgang på kortene for mangfold
 *     "kort": [ { "fil": "001-zorg.png", "navn": "Zorg", "prompt": "friendly green alien …", "stil": "…valgfri per kort…" }, … ]
 *   }
 *
 * Skriptet er idempotent: filer som allerede finnes (.png eller .webp) hoppes
 * over, så enkeltkort kan regenereres ved å slette filen og kjøre på nytt.
 * Etterpå: node scripts/optimize-card-images.mjs (→ 320px WebP).
 *
 * Modeller og kostnader (1024×1536, juni 2026):
 *   gpt-image-2,      low    ≈ $0.005/bilde  ← rask prototype
 *   gpt-image-2,      medium ≈ $0.041/bilde  ← god balanse (anbefalt)
 *   gpt-image-2,      high   ≈ $0.165/bilde  ← topp til legendariske kort
 *   gpt-image-1-mini, low    ≈ $0.006/bilde  ← fallback til eldre kategorier
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STANDARD_KATEGORI_STIL =
  'collector card game illustration, Pokémon card art style, fantasy TCG card art, ' +
  'vibrant digital painting, detailed, single centered subject, kid-friendly';

// Bakgrunnen koder sjeldenheten — samme posisjonsformel som kortData.ts getRarity.
function rarityBakgrunn(nummer) {
  if (nummer >= 36) return 'golden glow to yellow gradient background, warm radiant lighting';
  if (nummer >= 31) return 'purple to dark purple gradient background, mystical lighting';
  if (nummer >= 21) return 'light blue to blue gradient background, bright lighting';
  return 'soft white to light gray gradient background, bright airy lighting';
}

// gpt-image-2 er nyeste og beste modell per juni 2026.
// Bruk gpt-image-1-mini kun for bakoverkompatibilitet med eldre kategorier.
const STANDARD_MODELL = 'gpt-image-2';
// Portrait-format = naturlig kortformat (2:3) og gir plass til hele figurer uten avkutting.
// Kvadratisk 1024x1024 kan brukes for ikke-menneskefigurer (landemerker, kjøretøy).
const STANDARD_STORRELSE = '1024x1536';
// VIKTIG: uten eksplisitt quality velger API-et «auto» (i praksis high) — mye dyrere.
// gpt-image-2, 1024×1536: low ≈ $0.005, medium ≈ $0.041, high ≈ $0.165 per bilde.
const STANDARD_KVALITET = 'medium';

function lesArgs() {
  const args = process.argv.slice(2);
  const manifestSti = args.find((a) => !a.startsWith('--'));
  if (!manifestSti) {
    console.error('Bruk: node scripts/generate-card-images.mjs <manifest.json> [--model gpt-image-2] [--quality medium] [--size 1024x1536] [--kun 001,005]');
    process.exit(1);
  }
  const flagg = (navn) => {
    const i = args.indexOf(navn);
    return i >= 0 ? args[i + 1] : undefined;
  };
  // --kun: PowerShell splitter ukvoterte kommalister og stripper ledende nuller.
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
    storrelse: flagg('--size') ?? null, // manifest.storrelse eller STANDARD_STORRELSE tar over
    kun,
  };
}

async function genererBilde(apiKey, modell, kvalitet, storrelse, prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modell, prompt, size: storrelse, quality: kvalitet, n: 1 }),
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

const { manifestSti, modell, kvalitet, storrelse: storrelseArg, kun } = lesArgs();
const manifest = JSON.parse(readFileSync(manifestSti, 'utf8'));
if (!manifest.mappe || !Array.isArray(manifest.kort)) {
  console.error('Manifestet må ha "mappe" og "kort" (liste av {fil, navn, prompt}).');
  process.exit(1);
}

// Bildene ligger i <repo-rot>/images/<mappe>/
const repoRot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const utMappe = join(repoRot, 'images', manifest.mappe);
mkdirSync(utMappe, { recursive: true });

// Størrelse: --size flagg → manifest.storrelse → STANDARD_STORRELSE
const storrelse = storrelseArg ?? manifest.storrelse ?? STANDARD_STORRELSE;
const kategoriStil = manifest.kategoriStil ?? manifest.stilPrefix ?? STANDARD_KATEGORI_STIL;
const variasjoner = Array.isArray(manifest.variasjoner) ? manifest.variasjoner : [];

console.log(`Modell: ${modell} | Kvalitet: ${kvalitet} | Størrelse: ${storrelse} | Mappe: ${manifest.mappe}`);
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
  // VIKTIG: GPT Image vekter starten av prompten tyngst og har en sterk
  // malerisk-realisme-bias. Stilen MÅ derfor komme først og aggressivt, med
  // eksplisitt negativ styring, ellers maler modellen motivet realistisk.
  const prompt =
    'Flat 2D cartoon trading card game illustration in the style of Pokémon TCG artwork. ' +
    'Cel-shaded digital art with bold clean black outlines, bright vibrant saturated colors, ' +
    'simple stylized cartoon shapes, smooth flat color fills. ' +
    'NOT photorealistic, NOT a painting, NOT painterly, NOT a pencil sketch, NOT realistic, no fine soft shading. ' +
    `Subject: ${kort.navn} — ${kort.prompt}. ` +
    `${kort.stil ?? kategoriStil}${variasjon}. ` +
    `Background: ${rarityBakgrunn(nummer)}. ` +
    'The whole character is centered with breathing room around it, no card frame, no border, no text or letters.';
  process.stdout.write(`Genererer ${kort.fil}… `);
  try {
    writeFileSync(pngSti, await genererBilde(apiKey, modell, kvalitet, storrelse, prompt));
    generert++;
    console.log('ok');
  } catch (e) {
    console.log(`FEIL: ${e.message}`);
  }
}

console.log(`\nFerdig: ${generert} generert, ${hoppet} fantes fra før → ${utMappe}`);
console.log('Neste steg: node scripts/optimize-card-images.mjs, så stage pakken i kortData.ts.');
