import { describe, it, expect } from 'vitest';
import { genererProvekode, erProveUtloept, kanOppretteProve, GRATIS_MAKS_PROVER } from './prover';

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

describe('kanOppretteProve', () => {
  it('gratis: tillatt under grensen', () => {
    expect(kanOppretteProve('free', 0)).toBe(true);
    expect(kanOppretteProve('free', GRATIS_MAKS_PROVER - 1)).toBe(true);
  });
  it('gratis: blokkert på/over grensen', () => {
    expect(kanOppretteProve('free', GRATIS_MAKS_PROVER)).toBe(false);
    expect(kanOppretteProve('free', GRATIS_MAKS_PROVER + 5)).toBe(false);
  });
  it('manglende abonnement behandles som gratis', () => {
    expect(kanOppretteProve(undefined, GRATIS_MAKS_PROVER)).toBe(false);
    expect(kanOppretteProve(undefined, 0)).toBe(true);
  });
  it('betalte abonnement er ubegrenset', () => {
    expect(kanOppretteProve('premium', 999)).toBe(true);
    expect(kanOppretteProve('skolepakke', 999)).toBe(true);
  });
});
