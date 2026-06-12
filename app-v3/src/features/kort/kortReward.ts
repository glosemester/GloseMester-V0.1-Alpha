/**
 * Kort-belønning — ren logikk portet fra v2 (kort-reward.js).
 * Avgjør om/hvilket kort en elev vinner etter en prøve, og håndterer panting
 * av dubletter. rng er injiserbar for deterministisk testing.
 */
import { kortData, type Category, type KortDef, type Rarity } from './kortData';
import { erKortLaast } from '../niva/nivaSystem';

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

/** Kategorier tilgjengelig for et nivå + tilgangsnivå. */
export function getCategoriesForLevel(
  niva: number | string,
  tilgjengeligeKategorier?: readonly Category[],
): Category[] {
  const level = typeof niva === 'string' ? parseInt(niva.replace('niva', ''), 10) : niva;
  const base: Category[] = ['biler', 'dinosaurer', 'dyr', 'guder', 'romvesener', 'planeter', 'kart', 'glosehelter'];
  // Filter by Feide access first, then apply level rules (guder only niva 3–4).
  const allowed = tilgjengeligeKategorier ? base.filter((c) => tilgjengeligeKategorier.includes(c)) : base;
  if (level === 1 || level === 2) return allowed.filter((c) => c !== 'guder');
  return allowed;
}

/**
 * Trekker et tilfeldig kort av ønsket sjeldenhet, evt. nivå- og tilgangsfiltrert.
 * `elevNiva` (1–10, null = gjest) filtrerer bort nivålåste kort FØR
 * sjeldenhetssplitten — gratis-pakkene er aldri låst, så poolen tømmes aldri
 * og en rullet episk/legendarisk på lavt nivå lander i en gratis-pakke.
 */
export function getRandomKort(
  rarity: Rarity,
  niva: number | string | null = null,
  rng: Rng = Math.random,
  tilgjengeligeKategorier?: readonly Category[],
  elevNiva: number | null = null,
): KortDef {
  let pool = kortData.filter((k) => k.fag === 'gloser');
  if (niva) {
    const kategorier = getCategoriesForLevel(niva, tilgjengeligeKategorier);
    pool = pool.filter((k) => kategorier.includes(k.category));
  } else if (tilgjengeligeKategorier) {
    pool = pool.filter((k) => tilgjengeligeKategorier.includes(k.category));
  }
  if (elevNiva !== null) pool = pool.filter((k) => !erKortLaast(k, elevNiva));
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
  tilgjengeligeKategorier?: readonly Category[],
  elevNiva: number | null = null,
): KortDef | null {
  if (totalQuestions <= 0) return null;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  if (percentage < 80) return null;
  return getRandomKort(calculateRarity(percentage, rng), niva, rng, tilgjengeligeKategorier, elevNiva);
}
