/**
 * Øve-motor — ren logikk (ingen DOM/React), portet fra v2-flyten i
 * src/features/glosemester/glosemester.js. Gjør den enkel å enhetsteste.
 *
 * Retning: 'en' = vis norsk, svar på engelsk (default i v2). 'no' = motsatt.
 * Modus per nivå (fra v2 shouldBeMultipleChoice):
 *   niva1/niva2 → alltid flervalg · niva4 → 20% flervalg · niva3 → 50/50.
 */
import {
  getWordsForLevel,
  type LevelId,
  type Word,
} from './vocabulary';

export type Direction = 'en' | 'no';
export type QuestionMode = 'mc' | 'typing';

/** Fisher-Yates (v2.3.0-fiks for ekte tilfeldig rekkefølge). */
export function shuffle<T>(array: readonly T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Riktig svartekst for et ord gitt retning. */
export function answerFor(word: Word, direction: Direction): string {
  return direction === 'en' ? word.e : word.s;
}

/** Spørsmålsteksten som vises (motsatt av svaret). */
export function promptFor(word: Word, direction: Direction): string {
  return direction === 'en' ? word.s : word.e;
}

/** Avgjør om et spørsmål skal være flervalg, basert på nivå (jf. v2). */
export function shouldBeMultipleChoice(level: LevelId): boolean {
  if (level === 'niva1' || level === 'niva2') return true;
  if (level === 'niva4') return Math.random() < 0.2;
  return Math.random() < 0.5; // niva3
}

/**
 * Lager opptil 4 flervalg-alternativer inkl. riktig ord. Foretrekker
 * distraktorer i samme kategori (k-feltet på niva1), jf. v2 renderMultipleChoice.
 */
export function buildAlternatives(
  correct: Word,
  allWords: readonly Word[],
  direction: Direction,
): Word[] {
  const key: keyof Word = direction === 'en' ? 'e' : 's';
  const sameCategory = correct.k
    ? allWords.filter((w) => w.k === correct.k && w[key] !== correct[key])
    : [];
  const otherWords = allWords.filter(
    (w) => w[key] !== correct[key] && !sameCategory.includes(w),
  );

  const pool = [...shuffle(sameCategory), ...shuffle(otherWords)];
  const alternatives: Word[] = [correct];
  for (const candidate of pool) {
    if (alternatives.length >= 4) break;
    if (!alternatives.some((alt) => alt[key] === candidate[key])) {
      alternatives.push(candidate);
    }
  }
  return shuffle(alternatives);
}

/** Sammenligner svar (trimmet, case-insensitivt), jf. v2 checkAnswer. */
export function isAnswerCorrect(
  userAnswer: string,
  word: Word,
  direction: Direction,
): boolean {
  return userAnswer.trim().toLowerCase() === answerFor(word, direction).toLowerCase();
}

export interface Question {
  word: Word;
  mode: QuestionMode;
  /** Kun satt når mode === 'mc'. */
  alternatives?: Word[];
}

export interface PracticeSession {
  level: LevelId;
  direction: Direction;
  words: Word[];
  index: number;
  correctAnswers: number;
  totalQuestions: number;
}

/** Oppretter en ny økt med stokket ordliste (jf. v2 startPractice). */
export function createSession(level: LevelId, direction: Direction = 'en'): PracticeSession {
  return {
    level,
    direction,
    words: shuffle(getWordsForLevel(level)),
    index: 0,
    correctAnswers: 0,
    totalQuestions: 0,
  };
}

/** Bygger spørsmålet for gjeldende index, eller null hvis økten er ferdig. */
export function currentQuestion(session: PracticeSession): Question | null {
  if (session.index >= session.words.length) return null;
  const word = session.words[session.index];
  const mode: QuestionMode = shouldBeMultipleChoice(session.level) ? 'mc' : 'typing';
  return {
    word,
    mode,
    alternatives: mode === 'mc' ? buildAlternatives(word, session.words, session.direction) : undefined,
  };
}

export const isSessionComplete = (s: PracticeSession): boolean => s.index >= s.words.length;
