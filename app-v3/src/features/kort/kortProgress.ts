/**
 * Felles kort-teller for øving OG prøve.
 *
 * Tidligere hadde øvemodus sin egen «hvert 10. riktige svar = kort»-teller,
 * mens prøvemodus ga et engangskort ved 80 %+. Nå deler de ÉN teller: hvert
 * riktige svar — uansett om det er i øving eller i en prøve — teller mot samme
 * «X av 10»-bar, og for hver fulle 10 trekkes ett kort. Gjelder også uten
 * Feide-innlogging (telleren er UID-/gjest-nøklet via storage-laget).
 */
import { getKortProgresjon, saveKortProgresjon } from '../../lib/storage';
import { calculateRarity, getRandomKort } from './kortReward';
import type { KortDef } from './kortData';

type Rng = () => number;

/** Antall riktige svar som kreves per kort. */
export const KORT_PER_RIKTIGE = 10;

/** Gjeldende reststand mot neste kort (0–9). */
export function lesKortProgresjon(): number {
  return getKortProgresjon('gloser') % KORT_PER_RIKTIGE;
}

/**
 * Legger `antallRiktige` til den felles telleren. For hver fulle 10 trekkes ett
 * kort (nivåfiltrert som før). Returnerer kortene som ble tjent og den nye
 * reststanden (0–9). Kortene legges IKKE automatisk i samlingen — kalleren
 * bestemmer (øvemodus bekrefter via popup; prøvemodus legger til direkte).
 */
export function registrerRiktigeMotKort(
  antallRiktige: number,
  niva: number | string | null = null,
  rng: Rng = Math.random,
): { kort: KortDef[]; rest: number } {
  let total = lesKortProgresjon() + Math.max(0, Math.floor(antallRiktige));
  const kort: KortDef[] = [];
  while (total >= KORT_PER_RIKTIGE) {
    total -= KORT_PER_RIKTIGE;
    // calculateRarity(100) gir samme sjeldenhetsodds som da et fullt øve-sett ga kort.
    kort.push(getRandomKort(calculateRarity(100, rng), niva, rng));
  }
  saveKortProgresjon(total, 'gloser');
  return { kort, rest: total };
}
