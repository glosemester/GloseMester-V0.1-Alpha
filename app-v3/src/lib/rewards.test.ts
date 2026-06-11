import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DIAMANTER_PER_BONUS, registrerRiktigSvar, registrerRiktigeSvar } from './rewards';
import { getCredits, getTotalCorrect, saveTotalCorrect } from './storage';

// Enkel in-memory localStorage (testmiljøet er node, uten DOM).
beforeAll(() => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  } as Storage;
});

describe('rewards — XP og diamantbonus', () => {
  beforeEach(() => localStorage.clear());

  it('registrerRiktigSvar gir fortsatt +1 XP', () => {
    const { nyXP, diamanterTildelt } = registrerRiktigSvar();
    expect(nyXP).toBe(1);
    expect(diamanterTildelt).toBe(0);
    expect(getTotalCorrect('gloser')).toBe(1);
  });

  it('batch returnerer XP før og etter', () => {
    saveTotalCorrect(40, 'gloser');
    const res = registrerRiktigeSvar(7);
    expect(res.xpFoer).toBe(40);
    expect(res.nyXP).toBe(47);
    expect(getTotalCorrect('gloser')).toBe(47);
  });

  it('batch som krysser ett 100-merke gir én diamantbonus', () => {
    saveTotalCorrect(95, 'gloser');
    const res = registrerRiktigeSvar(7); // 95 → 102, krysser 100
    expect(res.diamanterTildelt).toBe(DIAMANTER_PER_BONUS);
    expect(getCredits('gloser')).toBe(DIAMANTER_PER_BONUS);
  });

  it('batch som krysser to 100-merker gir dobbel bonus', () => {
    saveTotalCorrect(50, 'gloser');
    const res = registrerRiktigeSvar(250); // 50 → 300, krysser 100 og 200 og 300
    expect(res.diamanterTildelt).toBe(3 * DIAMANTER_PER_BONUS);
  });

  it('enkeltsvar på et 100-merke gir bonus (som før)', () => {
    saveTotalCorrect(99, 'gloser');
    const { diamanterTildelt } = registrerRiktigSvar();
    expect(diamanterTildelt).toBe(DIAMANTER_PER_BONUS);
  });

  it('ignorerer negative/ugyldige antall', () => {
    saveTotalCorrect(10, 'gloser');
    const res = registrerRiktigeSvar(-3);
    expect(res.nyXP).toBe(10);
    expect(res.diamanterTildelt).toBe(0);
  });
});
