/**
 * Byttesjetonger — retten til å bytte kort fortjenes via øving (XP).
 *
 * Antall TJENTE sjetonger utledes rent fra total XP (riktige svar), med v2 sin
 * kumulative terskelformel: sjetong 1 ved 35 XP, 2 ved 75, 3 ved 120, deretter
 * +50 per sjetong (170, 220, …). Antall BRUKTE sjetonger persisteres separat
 * (storage), så `tilgjengelig = tjent − brukt`. Å utlede «tjent» fra XP gjør
 * XP-milepælen til eneste sannhetskilde og hindrer drift.
 *
 * Port av v2 _calcTradeThreshold / _sjekkTradeToken (glosemester.js).
 */
import { getTotalCorrect, getSpentTokens, saveSpentTokens } from '../../lib/storage';

/** XP-intervaller for de første sjetongene; deretter STANDARD_INTERVALL for alltid. */
const INTERVALLER = [35, 40, 45];
const STANDARD_INTERVALL = 50;

/** Kumulativ XP-grense for å ha tjent nøyaktig `n` sjetonger (n ≥ 0). */
export function terskelForSjetong(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i < INTERVALLER.length ? INTERVALLER[i] : STANDARD_INTERVALL;
  }
  return total;
}

/** Hvor mange sjetonger den gitte XP-en har låst opp. */
export function tjenteSjetonger(totalXP: number): number {
  let n = 0;
  while (totalXP >= terskelForSjetong(n + 1)) n++;
  return n;
}

export interface SjetongFremgang {
  tjent: number;
  brukt: number;
  tilgjengelig: number;
  /** XP samlet inn mot neste sjetong. */
  xpSidenForrige: number;
  /** XP-intervall for neste sjetong. */
  nesteIntervall: number;
  /** XP som mangler for neste sjetong. */
  manglerXP: number;
  /** Fremgang mot neste sjetong, 0–1. */
  pct: number;
}

/** Full fremgangsstatus for sjetonger (til UI/indikator). */
export function sjetongFremgang(
  totalXP = getTotalCorrect('gloser'),
  brukt = getSpentTokens(),
): SjetongFremgang {
  const tjent = tjenteSjetonger(totalXP);
  const tilgjengelig = Math.max(0, tjent - brukt);
  const gulv = terskelForSjetong(tjent); // XP da forrige sjetong ble tjent
  const tak = terskelForSjetong(tjent + 1); // XP for neste
  const nesteIntervall = tak - gulv;
  const xpSidenForrige = totalXP - gulv;
  const manglerXP = Math.max(0, tak - totalXP);
  return {
    tjent,
    brukt,
    tilgjengelig,
    xpSidenForrige,
    nesteIntervall,
    manglerXP,
    pct: nesteIntervall > 0 ? Math.min(1, xpSidenForrige / nesteIntervall) : 0,
  };
}

/** Antall sjetonger tilgjengelig akkurat nå. */
export function tilgjengeligeSjetonger(): number {
  return sjetongFremgang().tilgjengelig;
}

/**
 * Bruk én sjetong. Kalleren MÅ sjekke tilgjengeligeSjetonger() ≥ 1 først.
 * Returnerer nytt antall tilgjengelige.
 */
export function brukSjetong(): number {
  saveSpentTokens(getSpentTokens() + 1);
  return tilgjengeligeSjetonger();
}

/**
 * Refunder én sjetong (f.eks. når et bytte utløper/avbrytes uten oppgjør).
 * Idempotens sikres av kalleren via en per-trade refundert-markør.
 */
export function refunderSjetong(): number {
  saveSpentTokens(Math.max(0, getSpentTokens() - 1));
  return tilgjengeligeSjetonger();
}
