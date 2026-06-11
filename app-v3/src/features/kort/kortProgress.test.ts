import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { KORT_PER_RIKTIGE, lesKortProgresjon, registrerRiktigeMotKort } from './kortProgress';

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

// Fast rng så kortuttrekk er deterministisk (vi bryr oss kun om antall/rest her).
const rng = () => 0.5;

describe('kortProgress — felles teller for øving + prøve', () => {
  beforeEach(() => localStorage.clear());

  it('starter på 0', () => {
    expect(lesKortProgresjon()).toBe(0);
  });

  it('akkumulerer riktige svar uten å gi kort før 10', () => {
    const { kort, rest } = registrerRiktigeMotKort(4, null, rng);
    expect(kort).toHaveLength(0);
    expect(rest).toBe(4);
    expect(lesKortProgresjon()).toBe(4);
  });

  it('gir kort når telleren krysser 10 — på tvers av kall (øving + prøve)', () => {
    registrerRiktigeMotKort(6, null, rng); // øving: 6
    const { kort, rest } = registrerRiktigeMotKort(4, null, rng); // prøve: +4 = 10
    expect(kort).toHaveLength(1);
    expect(rest).toBe(0);
    expect(lesKortProgresjon()).toBe(0);
  });

  it('gir flere kort når ett kall krysser flere tiere, og beholder resten', () => {
    const { kort, rest } = registrerRiktigeMotKort(25, null, rng);
    expect(kort).toHaveLength(2);
    expect(rest).toBe(5);
    expect(lesKortProgresjon()).toBe(5);
  });

  it('ignorerer negative/ugyldige antall', () => {
    registrerRiktigeMotKort(3, null, rng);
    const { kort, rest } = registrerRiktigeMotKort(-5, null, rng);
    expect(kort).toHaveLength(0);
    expect(rest).toBe(3);
  });

  it('KORT_PER_RIKTIGE er 10', () => {
    expect(KORT_PER_RIKTIGE).toBe(10);
  });

  it('elevnivå tres gjennom til korttrekket (episk på nivå 1 → gratis-pakke)', async () => {
    const { ALLE_KORTPAKKER, GRATIS_KORTPAKKER } = await import('../../lib/tilgang');
    // rng 0.9: calculateRarity(100) gir episk; samme rng styrer pool-indeksen.
    const { kort } = registrerRiktigeMotKort(10, null, () => 0.9, ALLE_KORTPAKKER, 1);
    expect(kort).toHaveLength(1);
    expect(kort[0].rarity).toBe('epic');
    expect(GRATIS_KORTPAKKER as readonly string[]).toContain(kort[0].category);
  });
});
