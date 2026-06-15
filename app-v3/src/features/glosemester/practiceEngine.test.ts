import { describe, it, expect } from 'vitest';
import {
  shuffle,
  answerFor,
  promptFor,
  shouldBeMultipleChoice,
  buildAlternatives,
  isAnswerCorrect,
  createSession,
  currentQuestion,
  isSessionComplete,
  lagHint,
  maksHint,
} from './practiceEngine';
import { getWordsForLevel, type Word } from './vocabulary';

const ord: Word = { s: 'Hund', e: 'Dog', k: 'dyr' };

describe('answerFor / promptFor', () => {
  it('en: spør på norsk, svar på engelsk', () => {
    expect(promptFor(ord, 'en')).toBe('Hund');
    expect(answerFor(ord, 'en')).toBe('Dog');
  });
  it('no: motsatt', () => {
    expect(promptFor(ord, 'no')).toBe('Dog');
    expect(answerFor(ord, 'no')).toBe('Hund');
  });
});

describe('isAnswerCorrect', () => {
  it('er trimmet og case-insensitiv', () => {
    expect(isAnswerCorrect('  dog ', ord, 'en')).toBe(true);
    expect(isAnswerCorrect('DOG', ord, 'en')).toBe(true);
    expect(isAnswerCorrect('cat', ord, 'en')).toBe(false);
  });
});

describe('lagHint', () => {
  it('tomt svar gir tom streng', () => {
    expect(lagHint('', 1)).toBe('');
  });
  it('null avslørte bokstaver maskerer alt', () => {
    expect(lagHint('Dog', 0)).toBe('_ _ _');
  });
  it('avslører de første bokstavene gradvis', () => {
    expect(lagHint('Dog', 1)).toBe('D _ _');
    expect(lagHint('Horse', 2)).toBe('H o _ _ _');
  });
  it('bevarer mellomrom i flerords-svar', () => {
    expect(lagHint('Big dog', 2)).toBe('B i _   _ _ _');
  });
  it('avslører aldri mer enn halvparten av bokstavene', () => {
    // «Horse» har 5 bokstaver → maks 3 avsløres, selv om vi ber om flere.
    expect(maksHint('Horse')).toBe(3);
    expect(lagHint('Horse', 99)).toBe('H o r _ _');
  });
});

describe('shouldBeMultipleChoice', () => {
  it('niva1/niva2 er alltid flervalg', () => {
    expect(shouldBeMultipleChoice('niva1')).toBe(true);
    expect(shouldBeMultipleChoice('niva2')).toBe(true);
  });
});

describe('shuffle', () => {
  it('bevarer alle elementer', () => {
    const inn = [1, 2, 3, 4, 5];
    const ut = shuffle(inn);
    expect(ut).toHaveLength(5);
    expect([...ut].sort()).toEqual(inn);
    expect(inn).toEqual([1, 2, 3, 4, 5]); // muterer ikke input
  });
});

describe('buildAlternatives', () => {
  const ordliste: Word[] = [
    { s: 'Hund', e: 'Dog', k: 'dyr' },
    { s: 'Katt', e: 'Cat', k: 'dyr' },
    { s: 'Hest', e: 'Horse', k: 'dyr' },
    { s: 'Rød', e: 'Red', k: 'farge' },
    { s: 'Blå', e: 'Blue', k: 'farge' },
  ];
  it('gir inntil 4 unike alternativer inkl. riktig', () => {
    const alts = buildAlternatives(ordliste[0], ordliste, 'en');
    expect(alts).toHaveLength(4);
    expect(alts).toContainEqual(ordliste[0]);
    const tekster = alts.map((a) => a.e);
    expect(new Set(tekster).size).toBe(tekster.length); // ingen duplikater
  });
});

describe('session-flyt', () => {
  it('createSession stokker og nullstiller', () => {
    const s = createSession('niva2', 'en');
    expect(s.words.length).toBe(getWordsForLevel('niva2').length);
    expect(s.index).toBe(0);
    expect(s.correctAnswers).toBe(0);
    expect(isSessionComplete(s)).toBe(false);
  });
  it('currentQuestion gir null når ferdig', () => {
    const s = createSession('niva1');
    expect(currentQuestion({ ...s, index: s.words.length })).toBeNull();
    expect(isSessionComplete({ ...s, index: s.words.length })).toBe(true);
  });
  it('niva1-spørsmål er flervalg med alternativer', () => {
    const s = createSession('niva1');
    const q = currentQuestion(s);
    expect(q?.mode).toBe('mc');
    expect(q?.alternatives?.length).toBeGreaterThan(1);
  });
});
