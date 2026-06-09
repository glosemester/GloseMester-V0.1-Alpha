/**
 * Kortsamling — bygger på det UID-nøklede storage-laget (lib/storage), så kort
 * isoleres per bruker som XP/diamanter. Hydrerer lagrede kort mot kortData for
 * å plukke opp korrigerte bildestier/navn (jf. v2 getUserCollection).
 *
 * Panting: 2 dubletter → 1 nytt tilfeldig kort. Krever minst 3 kopier (beholder
 * 1), jf. v2 panteKort.
 */
import { getSamling, setSamling, lagreBrukerKort, type Kort } from '../../lib/storage';
import { getKortById, kortData, type KortDef, type Rarity, type Category } from './kortData';
import { calculateRarity } from './kortReward';
import { flushSync } from '../../lib/progressSync';

export interface SamlingStats {
  total: number;
  unike: number;
  byRarity: Partial<Record<Rarity, number>>;
  byCategory: Partial<Record<Category, number>>;
}

/** Henter samlingen, hydrert mot gjeldende kortData. */
export function hentSamling(): Kort[] {
  return getSamling('gloser').map((lagret) => {
    const gjeldende = getKortById(String(lagret.id));
    return gjeldende
      ? { ...lagret, image: gjeldende.image, name: gjeldende.name, category: gjeldende.category }
      : lagret;
  });
}

/** Legger til et vunnet kort i samlingen og synkroniserer umiddelbart til Firestore. */
export function leggTilKort(kort: KortDef): void {
  lagreBrukerKort({ ...kort }, 'gloser');
  flushSync().catch(() => {});
}

export function antallAvKort(kortId: string): number {
  return hentSamling().filter((k) => k.id === kortId).length;
}

/** Statistikk for samlingen (jf. v2 getCollectionStats). */
export function samlingStats(): SamlingStats {
  const samling = hentSamling();
  const stats: SamlingStats = { total: samling.length, unike: new Set(samling.map((k) => k.id)).size, byRarity: {}, byCategory: {} };
  for (const kort of samling) {
    const def = getKortById(String(kort.id));
    if (!def) continue;
    stats.byRarity[def.rarity] = (stats.byRarity[def.rarity] ?? 0) + 1;
    stats.byCategory[def.category] = (stats.byCategory[def.category] ?? 0) + 1;
  }
  return stats;
}

/** Fjerner inntil `count` kopier av et kort. Returnerer antall faktisk fjernet. */
export function fjernKort(kortId: string, count = 1): number {
  const samling = getSamling('gloser');
  let fjernet = 0;
  const ny = samling.filter((k) => {
    if (k.id === kortId && fjernet < count) {
      fjernet++;
      return false;
    }
    return true;
  });
  setSamling(ny, 'gloser');
  return fjernet;
}

/**
 * Panter 2 dubletter av kortId → trekker 1 nytt tilfeldig kort (ekskl. samme).
 * Returnerer det nye kortet, eller null hvis < 3 kopier.
 */
export function panteKort(kortId: string, rng: () => number = Math.random): KortDef | null {
  if (antallAvKort(kortId) < 3) return null;
  fjernKort(kortId, 2);

  const pool = kortData.filter((k) => k.id !== kortId);
  const rarity = calculateRarity(85, rng);
  let rarityPool = pool.filter((k) => k.rarity === rarity);
  if (rarityPool.length === 0) rarityPool = pool;

  const nytt = rarityPool[Math.floor(rng() * rarityPool.length)];
  lagreBrukerKort({ ...nytt }, 'gloser');
  flushSync().catch(() => {});
  return nytt;
}
