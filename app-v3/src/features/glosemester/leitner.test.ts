import { describe, it, expect } from 'vitest';
import {
  MIN_BOX,
  MAX_BOX,
  getBox,
  recordAnswer,
  weightForWord,
  pickNextWord,
  masteredCount,
} from './leitner';
import type { Word } from './vocabulary';

const a: Word = { s: 'Hund', e: 'Dog' };
const b: Word = { s: 'Katt', e: 'Cat' };

describe('getBox', () => {
  it('nye ord starter i boks 1', () => {
    expect(getBox({}, a)).toBe(MIN_BOX);
  });
});

describe('recordAnswer', () => {
  it('riktig flytter opp én boks, feil tilbake til 1', () => {
    let s = recordAnswer({}, a, true);
    expect(getBox(s, a)).toBe(2);
    s = recordAnswer(s, a, true);
    expect(getBox(s, a)).toBe(3);
    s = recordAnswer(s, a, false);
    expect(getBox(s, a)).toBe(MIN_BOX);
  });
  it('stopper på MAX_BOX', () => {
    let s: Record<string, number> = {};
    for (let i = 0; i < 10; i++) s = recordAnswer(s, a, true);
    expect(getBox(s, a)).toBe(MAX_BOX);
  });
  it('muterer ikke input', () => {
    const s0 = {};
    recordAnswer(s0, a, true);
    expect(s0).toEqual({});
  });
});

describe('weightForWord', () => {
  it('lav boks gir høyere vekt', () => {
    const s = recordAnswer(recordAnswer({}, a, true), a, true); // a i boks 3
    expect(weightForWord({}, b)).toBeGreaterThan(weightForWord(s, a));
  });
});

describe('pickNextWord', () => {
  it('returnerer null for tom liste', () => {
    expect(pickNextWord([], {})).toBeNull();
  });
  it('unngår exclude når mulig', () => {
    const valgt = pickNextWord([a, b], {}, a);
    expect(valgt).toEqual(b);
  });
  it('velger eneste ord selv om det er exclude', () => {
    expect(pickNextWord([a], {}, a)).toEqual(a);
  });
  it('vekter mot lave bokser (deterministisk rng)', () => {
    // a i toppboks (lav vekt), b ny (høy vekt). rng=0 → første som passerer terskel.
    let s: Record<string, number> = {};
    for (let i = 0; i < 5; i++) s = recordAnswer(s, a, true);
    // Med rng nær 0 skal det vektede valget lande på ordet med høyest vekt (b).
    const valgt = pickNextWord([a, b], s, undefined, () => 0.99);
    expect(valgt).toEqual(b);
  });
});

describe('masteredCount', () => {
  it('teller ord i øverste boks', () => {
    let s: Record<string, number> = {};
    for (let i = 0; i < 5; i++) s = recordAnswer(s, a, true);
    expect(masteredCount(s, [a, b])).toBe(1);
  });
});
