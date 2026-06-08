/**
 * Leitner spaced-repetition — NY funksjon i v3 (fantes ikke i den kjørende v2;
 * gammel V1-variant ble slettet som død kode i Del A).
 *
 * Hvert ord ligger i en boks (1..5). Riktig svar flytter ordet opp én boks,
 * feil svar sender det tilbake til boks 1. Lavere boks = repeteres oftere.
 * Når et ord skal vises, vektes valget mot lave bokser, slik at ord man strever
 * med kommer oftere igjen — uten å bli helt forutsigbart.
 *
 * Tilstanden persisteres per bruker (UID-nøklet) og per nivå via storage-laget,
 * så den følger samme isolasjons- og migreringsregler som resten av v3.
 */
import type { LevelId, Word } from './vocabulary';

export const MIN_BOX = 1;
export const MAX_BOX = 5;

/** Boks per ord, nøklet på ordets engelske felt (unikt innen et nivå). */
export type LeitnerState = Record<string, number>;

/** Nøkkel for et ord i state (engelsk er unik innen nivået). */
export function wordKey(word: Word): string {
  return word.e;
}

export function getBox(state: LeitnerState, word: Word): number {
  return state[wordKey(word)] ?? MIN_BOX;
}

/** Returnerer ny state etter et svar (muterer ikke input). */
export function recordAnswer(
  state: LeitnerState,
  word: Word,
  correct: boolean,
): LeitnerState {
  const key = wordKey(word);
  const current = state[key] ?? MIN_BOX;
  const next = correct ? Math.min(current + 1, MAX_BOX) : MIN_BOX;
  return { ...state, [key]: next };
}

/**
 * Vekt for et ord: lavere boks gir høyere vekt (repeteres oftere).
 * Boks 1 → vekt 5, boks 5 → vekt 1.
 */
export function weightForWord(state: LeitnerState, word: Word): number {
  return MAX_BOX - getBox(state, word) + 1;
}

/**
 * Velger neste ord vektet mot lave bokser. `exclude` (forrige ord) unngås når
 * mulig, så samme ord ikke kommer to ganger på rad. `rng` er injiserbar for test.
 */
export function pickNextWord(
  words: readonly Word[],
  state: LeitnerState,
  exclude?: Word,
  rng: () => number = Math.random,
): Word | null {
  if (words.length === 0) return null;
  const kandidater =
    exclude && words.length > 1
      ? words.filter((w) => wordKey(w) !== wordKey(exclude))
      : [...words];

  const vekter = kandidater.map((w) => weightForWord(state, w));
  const sum = vekter.reduce((a, b) => a + b, 0);
  let terskel = rng() * sum;
  for (let i = 0; i < kandidater.length; i++) {
    terskel -= vekter[i];
    if (terskel < 0) return kandidater[i];
  }
  return kandidater[kandidater.length - 1];
}

/** Antall ord som er «mestret» (i øverste boks) — for fremdriftsvisning. */
export function masteredCount(state: LeitnerState, words: readonly Word[]): number {
  return words.filter((w) => getBox(state, w) >= MAX_BOX).length;
}

/**
 * Glidende nivå-fremgang i prosent (0–100), basert på hvor langt hvert ord har
 * klatret i Leitner-boksene. Gir et motiverende tall som vokser fra første
 * riktige svar — i motsetning til masteredCount, som først teller når et ord
 * når øverste boks.
 */
export function nivaProsent(state: LeitnerState, words: readonly Word[]): number {
  if (words.length === 0) return 0;
  const sum = words.reduce((acc, w) => acc + (getBox(state, w) - MIN_BOX), 0);
  const maks = words.length * (MAX_BOX - MIN_BOX);
  return maks > 0 ? Math.round((sum / maks) * 100) : 0;
}

// ---- Persistering (UID-nøklet via storage-mønsteret) ----

import { getUserToken } from '../../lib/storage';

function storageKey(level: LevelId): string {
  return `mester_leitner_${level}_${getUserToken()}`;
}

export function loadLeitnerState(level: LevelId): LeitnerState {
  try {
    const raw = localStorage.getItem(storageKey(level));
    return raw ? (JSON.parse(raw) as LeitnerState) : {};
  } catch {
    return {};
  }
}

export function saveLeitnerState(level: LevelId, state: LeitnerState): void {
  localStorage.setItem(storageKey(level), JSON.stringify(state));
}
