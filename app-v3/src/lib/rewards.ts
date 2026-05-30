/**
 * Belønningslogikk for øvemodus — XP og diamanter. Portet fra v2
 * (handleMultipleChoiceAnswer / awardDiamondBonus i glosemester.js):
 * hvert riktige svar gir +1 XP; hver 100. XP gir en bonus på 10 diamanter.
 */
import { getTotalCorrect, saveTotalCorrect, getCredits, saveCredits } from './storage';

/** Diamanter per 100-XP-bonus (DIAMANTER_PER_BONUS i v2). */
export const DIAMANTER_PER_BONUS = 10;

export interface RewardResult {
  nyXP: number;
  /** Antall diamanter tildelt dette svaret (0 eller DIAMANTER_PER_BONUS). */
  diamanterTildelt: number;
}

const FAG = 'gloser';

/** Registrerer ett riktig svar. Returnerer ny XP og evt. diamantbonus. */
export function registrerRiktigSvar(): RewardResult {
  const nyXP = getTotalCorrect(FAG) + 1;
  saveTotalCorrect(nyXP, FAG);

  let diamanterTildelt = 0;
  if (nyXP > 0 && nyXP % 100 === 0) {
    saveCredits(getCredits(FAG) + DIAMANTER_PER_BONUS, FAG);
    diamanterTildelt = DIAMANTER_PER_BONUS;
  }
  return { nyXP, diamanterTildelt };
}
