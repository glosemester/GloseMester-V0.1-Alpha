import { describe, it, expect } from 'vitest';
import {
  MAKS_NIVA,
  NIVA_TERSKLER,
  NIVA_TITLER,
  OPPLASNINGER,
  beregnElevNiva,
  erKortLaast,
  nesteOpplasning,
  nivaProgresjon,
  nivaTittel,
  opplasningerVedNiva,
  opplastVedNiva,
  sjekkNivaOpp,
} from './nivaSystem';
import type { Category } from '../kort/kortData';
import { GRATIS_KORTPAKKER } from '../../lib/tilgang';

/** De 7 Feide-pakkene som skal være nivålåst på episk + legendarisk. */
const FEIDE_PAKKER: Category[] = ['dyr', 'guder', 'romvesener', 'planeter', 'skapninger', 'landemerker', 'kart'];

describe('nivaTittel', () => {
  it('har ett rangnavn per nivå (15)', () => {
    expect(NIVA_TITLER).toHaveLength(MAKS_NIVA);
    expect(MAKS_NIVA).toBe(15);
  });

  it('NIVA_TERSKLER har én terskel per nivå', () => {
    expect(NIVA_TERSKLER).toHaveLength(MAKS_NIVA);
  });

  it('gir riktig navn for nivå 1, 3 og maksnivå', () => {
    expect(nivaTittel(1)).toBe('Nybegynner');
    expect(nivaTittel(3)).toBe('Ordsamler');
    expect(nivaTittel(MAKS_NIVA)).toBe('Glosemester');
  });

  it('klamrer utenfor 1–15', () => {
    expect(nivaTittel(0)).toBe(NIVA_TITLER[0]);
    expect(nivaTittel(99)).toBe(NIVA_TITLER[MAKS_NIVA - 1]);
  });
});

describe('beregnElevNiva', () => {
  it('grensetilfeller rundt tersklene', () => {
    expect(beregnElevNiva(0)).toBe(1);
    expect(beregnElevNiva(39)).toBe(1);
    expect(beregnElevNiva(40)).toBe(2);
    expect(beregnElevNiva(3099)).toBe(14);
    expect(beregnElevNiva(3100)).toBe(15);
    expect(beregnElevNiva(99999)).toBe(15);
  });

  it('tåler ugyldig XP', () => {
    expect(beregnElevNiva(-5)).toBe(1);
    expect(beregnElevNiva(NaN)).toBe(1);
  });

  it('er monotont stigende over tersklene', () => {
    let forrige = 0;
    for (const terskel of NIVA_TERSKLER) {
      const niva = beregnElevNiva(terskel);
      expect(niva).toBeGreaterThan(forrige);
      forrige = niva;
    }
    expect(forrige).toBe(MAKS_NIVA);
  });
});

describe('nivaProgresjon', () => {
  it('midt i et nivå', () => {
    // Nivå 2 går fra 40 til 100; 70 XP = 30 av 60.
    const p = nivaProgresjon(70);
    expect(p.niva).toBe(2);
    expect(p.xpIDetteNiva).toBe(30);
    expect(p.xpTilNeste).toBe(30);
    expect(p.prosent).toBe(50);
    expect(p.erMaks).toBe(false);
  });

  it('maksnivå', () => {
    const p = nivaProgresjon(3500);
    expect(p.niva).toBe(15);
    expect(p.xpTilNeste).toBe(0);
    expect(p.prosent).toBe(100);
    expect(p.erMaks).toBe(true);
  });

  it('prosent holder seg innenfor 0–100', () => {
    for (const xp of [0, 1, 39, 40, 99, 100, 3099, 3100, 9000]) {
      const p = nivaProgresjon(xp);
      expect(p.prosent).toBeGreaterThanOrEqual(0);
      expect(p.prosent).toBeLessThanOrEqual(100);
    }
  });
});

describe('erKortLaast', () => {
  it('gratis-pakker er aldri låst — uansett sjeldenhet og nivå', () => {
    for (const category of GRATIS_KORTPAKKER) {
      expect(erKortLaast({ category, rarity: 'epic' }, 1)).toBe(false);
      expect(erKortLaast({ category, rarity: 'legendary' }, 1)).toBe(false);
      expect(erKortLaast({ category, rarity: 'legendary' }, null)).toBe(false);
    }
  });

  it('vanlige og sjeldne kort er aldri låst', () => {
    expect(erKortLaast({ category: 'dyr', rarity: 'common' }, 1)).toBe(false);
    expect(erKortLaast({ category: 'guder', rarity: 'rare' }, 1)).toBe(false);
  });

  it('episke dyrekort låses opp på nivå 2', () => {
    expect(erKortLaast({ category: 'dyr', rarity: 'epic' }, 1)).toBe(true);
    expect(erKortLaast({ category: 'dyr', rarity: 'epic' }, 2)).toBe(false);
  });

  it('legendariske gudekort låses opp på nivå 14', () => {
    expect(erKortLaast({ category: 'guder', rarity: 'legendary' }, 13)).toBe(true);
    expect(erKortLaast({ category: 'guder', rarity: 'legendary' }, 14)).toBe(false);
  });

  it('nye pakker (skapninger, landemerker) er nå nivålåst', () => {
    expect(erKortLaast({ category: 'skapninger', rarity: 'epic' }, 6)).toBe(true);
    expect(erKortLaast({ category: 'skapninger', rarity: 'epic' }, 7)).toBe(false);
    expect(erKortLaast({ category: 'landemerker', rarity: 'legendary' }, 12)).toBe(true);
    expect(erKortLaast({ category: 'landemerker', rarity: 'legendary' }, 13)).toBe(false);
  });

  it('gjest (null) er aldri låst', () => {
    expect(erKortLaast({ category: 'guder', rarity: 'legendary' }, null)).toBe(false);
  });
});

describe('opplåsingstabellen', () => {
  it('dekker alle 7 Feide-pakker med både episk og legendarisk', () => {
    expect(OPPLASNINGER).toHaveLength(14);
    for (const cat of FEIDE_PAKKER) {
      expect(OPPLASNINGER.some((o) => o.category === cat && o.rarity === 'epic')).toBe(true);
      expect(OPPLASNINGER.some((o) => o.category === cat && o.rarity === 'legendary')).toBe(true);
    }
  });

  it('én opplåsing per nivå 2–15', () => {
    const nivaer = OPPLASNINGER.map((o) => o.niva).sort((a, b) => a - b);
    expect(nivaer).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it('opplasningerVedNiva(5) gir dyr-legendarisk', () => {
    const rader = opplasningerVedNiva(5);
    expect(rader).toHaveLength(1);
    expect(rader[0]).toMatchObject({ category: 'dyr', rarity: 'legendary' });
  });

  it('opplastVedNiva: gratis-kort er null, dyr-legendarisk er 5', () => {
    expect(opplastVedNiva({ category: 'biler', rarity: 'legendary' })).toBeNull();
    expect(opplastVedNiva({ category: 'dyr', rarity: 'legendary' })).toBe(5);
  });

  it('nesteOpplasning peker på første rad over nivået', () => {
    expect(nesteOpplasning(1)?.niva).toBe(2);
    expect(nesteOpplasning(14)?.niva).toBe(15);
    expect(nesteOpplasning(15)).toBeNull();
  });

  it('konsistensvakt: kun ikke-gratis kategorier, kun episk/legendarisk, nivå 2–15', () => {
    for (const o of OPPLASNINGER) {
      expect(GRATIS_KORTPAKKER as readonly string[]).not.toContain(o.category);
      expect(['epic', 'legendary']).toContain(o.rarity);
      expect(o.niva).toBeGreaterThanOrEqual(2);
      expect(o.niva).toBeLessThanOrEqual(MAKS_NIVA);
    }
  });
});

describe('sjekkNivaOpp', () => {
  it('kryssing av én terskel gir nytt nivå', () => {
    expect(sjekkNivaOpp(39, 40)).toMatchObject({ nyttNiva: 2 });
  });

  it('ingen kryssing gir null', () => {
    expect(sjekkNivaOpp(30, 39)).toBeNull();
    expect(sjekkNivaOpp(40, 40)).toBeNull();
  });

  it('kryssing av flere nivåer gir høyeste nivå og union av opplåsinger', () => {
    // 39 XP = nivå 1 → 110 XP = nivå 3: krysser nivå 2 og 3.
    const res = sjekkNivaOpp(39, 110);
    expect(res?.nyttNiva).toBe(3);
    expect(res?.opplasninger.map((o) => o.niva)).toEqual([2, 3]);
  });

  it('over maksnivå gir null', () => {
    expect(sjekkNivaOpp(3100, 3200)).toBeNull();
  });
});
