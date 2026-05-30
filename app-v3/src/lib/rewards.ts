/**
 * Belønningslogikk for øvemodus — XP og diamanter. Portet fra v2
 * (handleMultipleChoiceAnswer / awardDiamondBonus i glosemester.js):
 * hvert riktige svar gir +1 XP; hver 100. XP gir +1 diamant.
 */
import { getTotalCorrect, saveTotalCorrect, getCredits, saveCredits } from './storage';

export interface RewardResult {
  nyXP: number;
  diamantTildelt: boolean;
}

const FAG = 'gloser';

/** Registrerer ett riktig svar. Returnerer ny XP og om en diamant ble tildelt. */
export function registrerRiktigSvar(): RewardResult {
  const nyXP = getTotalCorrect(FAG) + 1;
  saveTotalCorrect(nyXP, FAG);

  let diamantTildelt = false;
  if (nyXP > 0 && nyXP % 100 === 0) {
    saveCredits(getCredits(FAG) + 1, FAG);
    diamantTildelt = true;
  }
  return { nyXP, diamantTildelt };
}
