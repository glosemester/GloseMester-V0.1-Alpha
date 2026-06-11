/**
 * Belønningslogikk for øving OG prøve — XP og diamanter. Portet fra v2
 * (handleMultipleChoiceAnswer / awardDiamondBonus i glosemester.js):
 * hvert riktige svar gir +1 XP; hver 100. XP gir en bonus på 10 diamanter.
 * Øvemodus registrerer svar enkeltvis; prøvemodus i batch ved levering.
 */
import { getTotalCorrect, saveTotalCorrect, getCredits, saveCredits } from './storage';

/** Diamanter per 100-XP-bonus (DIAMANTER_PER_BONUS i v2). */
export const DIAMANTER_PER_BONUS = 10;

export interface RewardResult {
  nyXP: number;
  /** Antall diamanter tildelt dette svaret (0 eller DIAMANTER_PER_BONUS). */
  diamanterTildelt: number;
}

export interface BatchRewardResult extends RewardResult {
  /** XP før tildelingen — til nivå-opp-deteksjon (sjekkNivaOpp). */
  xpFoer: number;
}

const FAG = 'gloser';

/**
 * Registrerer flere riktige svar på én gang (prøve). Diamantbonus gis for
 * hvert 100-XP-merke som krysses i intervallet (xpFoer, nyXP].
 */
export function registrerRiktigeSvar(antall: number): BatchRewardResult {
  const xpFoer = getTotalCorrect(FAG);
  const trygt = Math.max(0, Math.floor(antall));
  const nyXP = xpFoer + trygt;
  if (trygt > 0) saveTotalCorrect(nyXP, FAG);

  const bonuser = Math.floor(nyXP / 100) - Math.floor(xpFoer / 100);
  const diamanterTildelt = bonuser > 0 ? bonuser * DIAMANTER_PER_BONUS : 0;
  if (diamanterTildelt > 0) saveCredits(getCredits(FAG) + diamanterTildelt, FAG);
  return { xpFoer, nyXP, diamanterTildelt };
}

/** Registrerer ett riktig svar (øvemodus). Returnerer ny XP og evt. diamantbonus. */
export function registrerRiktigSvar(): RewardResult {
  const { nyXP, diamanterTildelt } = registrerRiktigeSvar(1);
  return { nyXP, diamanterTildelt };
}
