/**
 * Vedvarende «streak»-teller (riktige svar på rad). Tidligere levde streaken
 * kun i øve-øktens React-state og forsvant så snart eleven forlot øvemodus —
 * jf. bug 6: flammen var usynlig på hjem/nivåvelger og mistet motivasjonskraft.
 *
 * Vi lagrer den derfor i localStorage slik at 🔥 N kan vises konsistent på
 * tvers av sidene. Streaken nullstilles ved feil svar (samme regel som i øving).
 */
const NOKKEL = 'gm_streak';

/** Leser lagret streak (0 hvis ingen / ugyldig). */
export function lesStreak(): number {
  if (typeof localStorage === 'undefined') return 0;
  const n = Number(localStorage.getItem(NOKKEL) ?? '0');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Lagrer ny streak-verdi. */
export function settStreak(verdi: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NOKKEL, String(Math.max(0, Math.floor(verdi))));
}
