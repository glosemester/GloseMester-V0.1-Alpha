import { describe, it, expect } from 'vitest';
import { genererProvekode } from './prover';

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
