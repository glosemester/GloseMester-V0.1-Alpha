/**
 * Kort-belønning — ren logikk portet fra v2 (kort-reward.js).
 * Avgjør om/hvilket kort en elev vinner etter en prøve, og håndterer panting
 * av dubletter. rng er injiserbar for deterministisk testing.
 */
import { kortData, type Category, type KortDef, type Rarity } from './kortData';

type Rng = () => number;

/** Sjeldenhet ut fra prosentscore (jf. v2 calculateRarity). */
export function calculateRarity(percentage: number, rng: Rng = Math.random): Rarity {
  const rand = rng() * 100;
  if (percentage === 100) {
    if (rand > 95) return 'legendary';
    if (rand > 80) return 'epic';
    if (rand > 50) return 'rare';
    return 'common';
  }
  if (percentage >= 90) {
    if (rand > 97) return 'legendary';
    if (rand > 87) return 'epic';
    if (rand > 65) return 'rare';
    return 'common';
  }
  if (rand > 99) return 'legendary';
  if (rand > 96) return 'epic';
  if (rand > 85) return 'rare';
  return 'common';
}

/** Kategorier tilgjengelig for et nivå — guder kun på nivå 3–4 (jf. v2). */
export function getCategoriesForLevel(niva: number | string): Category[] {
  const level = typeof niva === 'string' ? parseInt(niva.replace('niva', ''), 10) : niva;
  const alle: Category[] = ['biler', 'dinosaurer', 'dyr', 'guder'];
  if (level === 1 || level === 2) return alle.filter((c) => c !== 'guder');
  return alle;
}

/** Trekker et tilfeldig kort av ønsket sjeldenhet, evt. nivåfiltrert. */
export function getRandomKort(
  rarity: Rarity,
  niva: number | string | null = null,
  rng: Rng = Math.random,
): KortDef {
  let pool = kortData.filter((k) => k.fag === 'gloser');
  if (niva) {
    const kategorier = getCategoriesForLevel(niva);
    pool = pool.filter((k) => kategorier.includes(k.category));
  }
  let mulige = pool.filter((k) => k.rarity === rarity);
  if (mulige.length === 0) mulige = pool;
  return mulige[Math.floor(rng() * mulige.length)];
}

/**
 * Vinnersjekk etter prøve: 80%+ gir et kort, ellers null (jf. v2).
 */
export function checkWinCondition(
  correctCount: number,
  totalQuestions: number,
  niva: number | string | null = null,
  rng: Rng = Math.random,
): KortDef | null {
  if (totalQuestions <= 0) return null;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  if (percentage < 80) return null;
  return getRandomKort(calculateRarity(percentage, rng), niva, rng);
}
