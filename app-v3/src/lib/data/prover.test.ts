import { describe, it, expect } from 'vitest';
import { genererProvekode, erProveUtloept } from './prover';

describe('genererProvekode', () => {
  it('gir 6 tegn', () => {
    expect(genererProvekode()).toHaveLength(6);
  });
  it('bruker kun A–Z og 0–9', () => {
    for (let i = 0; i < 50; i++) {
      expect(genererProvekode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });
  it('er deterministisk med fast rng', () => {
    expect(genererProvekode(() => 0)).toBe('AAAAAA');
  });
});

describe('erProveUtloept', () => {
  it('ikke utløpt før utloperDato', () => {
    expect(erProveUtloept({ utloperDato: 2000 }, 1000)).toBe(false);
  });
  it('utløpt på/etter utloperDato', () => {
    expect(erProveUtloept({ utloperDato: 1000 }, 1000)).toBe(true);
    expect(erProveUtloept({ utloperDato: 1000 }, 5000)).toBe(true);
  });
  it('0 eller undefined = aldri utløpt (eldre prøver uten felt)', () => {
    expect(erProveUtloept({ utloperDato: 0 }, 9e12)).toBe(false);
    expect(erProveUtloept({}, 9e12)).toBe(false);
  });
});
