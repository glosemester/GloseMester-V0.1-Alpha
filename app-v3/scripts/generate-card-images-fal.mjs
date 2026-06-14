/**
 * Genererer samlekort-bilder for en kategori med Fal AI (fal.run).
 *
 * Forutsetninger (sett opp i miljøet — ALDRI i repoet):
 *   export FAL_KEY=…                         (fra fal.ai/dashboard/keys)
 *   Nettverk: fal.run, *.fal.ai, *.fal.media må være tillatt (Custom/Full).
 *   cd app-v3 && npm i -D sharp               (allerede i devDependencies)
 *
 * Bruk:
 *   cd app-v3
 *   node scripts/generate-card-images-fal.mjs kort-manifest-landemerker.json [opsjoner]
 *
 * Opsjoner:
 *   --model <id>     Fal-modell (standard: fal-ai/flux/dev). Bruk --model
 *                    fal-ai/nano-banana for Gemini-stil; da sendes aspect_ratio.
 *   --size 1024x1536 Overstyr størrelse (ellers manifest.storrelse).
 *   --kun 001,005    Bare disse kortnumrene.
 *   --force          Overskriv eksisterende .webp (for «generer alle på nytt»).
 *
 * Skriver ferdig 320px WebP rett til app-v3/public/images/<mappe>/NNN-navn.webp.
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STANDARD_MODELL = 'fal-ai/flux/dev';
const STANDARD_STORRELSE = '1024x1536';
const MAKS = 320; // visningsstørrelse — samme som optimize-card-images.mjs
const KVALITET = 82;

// Bakgrunnen koder sjeldenheten — samme posisjonsformel som kortData.ts getRarity.
function rarityBakgrunn(nummer) {
  if (nummer >= 36) return 'golden glow to yellow gradient background, warm radiant lighting';
  if (nummer >= 31) return 'purple to dark purple gradient background, mystical lighting';
  if (nummer >= 21) return 'light blue to blue gradient background, bright lighting';
  return 'soft white to light gray gradient background, bright airy lighting';
}

function lesArgs() {
  const args = process.argv.slice(2);
  const manifestSti = args.find((a) => !a.startsWith('--'));
  if (!manifestSti) {
    console.error('Bruk: node scripts/generate-card-images-fal.mjs <manifest.json> [--model …] [--size 1024x1536] [--kun 001,005] [--force]');
    process.exit(1);
  }
  const flagg = (navn) => {
    const i = args.indexOf(navn);
    return i >= 0 ? args[i + 1] : undefined;
  };
  let kun;
  const kunIndex = args.indexOf('--kun');
  if (kunIndex >= 0) {
    kun = [];
    for (let j = kunIndex + 1; j < args.length && !args[j].startsWith('--'); j++) {
      kun.push(...args[j].split(','));
    }
    kun = kun.map((v) => parseInt(v.trim(), 10)).filter((n) => Number.isFinite(n)).map((n) => String(n).padStart(3, '0'));
  }
  return {
    manifestSti,
    modell: flagg('--model') ?? STANDARD_MODELL,
    storrelse: flagg('--size') ?? null,
    kun,
    force: args.includes('--force'),
  };
}

// Fal sync-endepunkt: returnerer resultatet direkte. images[0].url peker til bildet.
async function genererBilde(apiKey, modell, bredde, hoyde, prompt) {
  const erFlux = modell.includes('flux');
  const body = erFlux
    ? { prompt, image_size: { width: bredde, height: hoyde }, num_images: 1 }
    : { prompt, aspect_ratio: `${bredde}:${hoyde}`, num_images: 1 };
  const res = await fetch(`https://fal.run/${modell}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const url = data.images?.[0]?.url ?? data.image?.url;
  if (!url) throw new Error(`Tomt svar fra Fal: ${JSON.stringify(data).slice(0, 200)}`);
  const bilde = await fetch(url);
  if (!bilde.ok) throw new Error(`Nedlasting feilet ${bilde.status} (${url})`);
  return Buffer.from(await bilde.arrayBuffer());
}

const apiKey = process.env.FAL_KEY;
if (!apiKey) {
  console.error('Sett FAL_KEY i miljøet først (aldri i koden/repoet).');
  process.exit(1);
}

const { manifestSti, modell, storrelse: storrelseArg, kun, force } = lesArgs();
const manifest = JSON.parse(readFileSync(manifestSti, 'utf8'));
if (!manifest.mappe || !Array.isArray(manifest.kort)) {
  console.error('Manifestet må ha "mappe" og "kort" (liste av {fil, navn, prompt}).');
  process.exit(1);
}

const repoRot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const utMappe = join(repoRot, 'app-v3', 'public', 'images', manifest.mappe);
mkdirSync(utMappe, { recursive: true });

const storrelse = storrelseArg ?? manifest.storrelse ?? STANDARD_STORRELSE;
const [bredde, hoyde] = storrelse.split('x').map((n) => parseInt(n, 10));
const kategoriStil = manifest.kategoriStil ?? '';
const variasjoner = Array.isArray(manifest.variasjoner) ? manifest.variasjoner : [];

console.log(`Modell: ${modell} | Størrelse: ${storrelse} | Mappe: ${manifest.mappe} | force: ${force}`);
let generert = 0, hoppet = 0, feilet = 0;

for (const kort of manifest.kort) {
  if (kun && !kun.some((k) => kort.fil.startsWith(k))) continue;
  const webpSti = join(utMappe, kort.fil.replace(/\.png$/, '.webp'));
  if (!force && existsSync(webpSti)) { hoppet++; continue; }

  const nummer = parseInt(kort.fil.slice(0, 3), 10);
  const variasjon = variasjoner.length ? `, ${variasjoner[(nummer - 1) % variasjoner.length]}` : '';
  const prompt =
    `${kort.navn} — ${kort.prompt}. ` +
    `${kort.stil ?? kategoriStil}${variasjon}. ` +
    `Background: ${rarityBakgrunn(nummer)}. ` +
    'No card frame, no border, no text or letters, no watermark, no logo.';

  process.stdout.write(`Genererer ${kort.fil}… `);
  try {
    const raa = await genererBilde(apiKey, modell, bredde, hoyde, prompt);
    await sharp(raa).resize(MAKS, MAKS, { fit: 'inside', withoutEnlargement: true }).webp({ quality: KVALITET }).toFile(webpSti);
    generert++;
    console.log('ok');
  } catch (e) {
    feilet++;
    console.log(`FEIL: ${e.message}`);
  }
}

console.log(`\nFerdig: ${generert} generert, ${hoppet} fantes fra før, ${feilet} feilet → ${utMappe}`);
