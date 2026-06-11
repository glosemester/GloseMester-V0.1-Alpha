/**
 * Skriver ut ferdige Midjourney-prompts for en kortkategori — én linje per kort,
 * nummerert, klare til å lime inn i Midjourney. Tar med felles stil og
 * raritetsbakgrunn (samme posisjonsformel som kortData.ts) + «--ar 2:3».
 *
 * Bruk:
 *   cd app-v3
 *   node scripts/midjourney-prompts.mjs kort-manifest-<kategori>.json
 *   node scripts/midjourney-prompts.mjs kort-manifest-<kategori>.json > prompts.txt
 */
import { readFileSync } from 'node:fs';

function rarityBakgrunn(nummer) {
  if (nummer >= 36) return 'golden glow to yellow gradient background, warm radiant lighting';
  if (nummer >= 31) return 'purple to dark purple gradient background, mystical lighting';
  if (nummer >= 21) return 'light blue to blue gradient background, bright lighting';
  return 'soft white to light gray gradient background, bright airy lighting';
}

const manifestSti = process.argv[2];
if (!manifestSti) {
  console.error('Bruk: node scripts/midjourney-prompts.mjs <manifest.json>');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestSti, 'utf8'));
const kategoriStil = manifest.kategoriStil ?? '';
const variasjoner = Array.isArray(manifest.variasjoner) ? manifest.variasjoner : [];

for (const kort of manifest.kort) {
  const nummer = parseInt(kort.fil.slice(0, 3), 10);
  const variasjon = variasjoner.length ? `, ${variasjoner[(nummer - 1) % variasjoner.length]}` : '';
  // Innramming styres av hver kategoris kategoriStil/variasjoner (figurer vil
  // ha «full body», kart vil fylle rammen, osv.) — ikke tvunget her.
  const prompt =
    `${kort.navn}, ${kort.prompt}, ${kort.stil ?? kategoriStil}${variasjon}, ` +
    `${rarityBakgrunn(nummer)}, no text or letters in the image --ar 2:3`;
  console.log(`${String(nummer).padStart(2, '0')}. ${prompt}\n`);
}
