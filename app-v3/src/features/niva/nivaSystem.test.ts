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
import { GRATIS_KORTPAKKER } from '../../lib/tilgang';

describe('nivaTittel', () => {
  it('har ett rangnavn per nivå', () => {
    expect(NIVA_TITLER).toHaveLength(MAKS_NIVA);
  });

  it('gir riktig navn for nivå 1, 3 og maksnivå', () => {
    expect(nivaTittel(1)).toBe('Nybegynner');
    expect(nivaTittel(3)).toBe('Ordsamler');
    expect(nivaTittel(MAKS_NIVA)).toBe('Glosemester');
  });

  it('klamrer utenfor 1–10', () => {
    expect(nivaTittel(0)).toBe(NIVA_TITLER[0]);
    expect(nivaTittel(99)).toBe(NIVA_TITLER[MAKS_NIVA - 1]);
  });
});

describe('beregnElevNiva', () => {
  it('grensetilfeller rundt tersklene', () => {
    expect(beregnElevNiva(0)).toBe(1);
    expect(beregnElevNiva(49)).toBe(1);
    expect(beregnElevNiva(50)).toBe(2);
    expect(beregnElevNiva(1599)).toBe(9);
    expect(beregnElevNiva(1600)).toBe(10);
    expect(beregnElevNiva(99999)).toBe(10);
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
    // Nivå 2 går fra 50 til 125; 80 XP = 30 av 75.
    const p = nivaProgresjon(80);
    expect(p.niva).toBe(2);
    expect(p.xpIDetteNiva).toBe(30);
    expect(p.xpTilNeste).toBe(45);
    expect(p.prosent).toBe(40);
    expect(p.erMaks).toBe(false);
  });

  it('maksnivå', () => {
    const p = nivaProgresjon(2000);
    expect(p.niva).toBe(10);
    expect(p.xpTilNeste).toBe(0);
    expect(p.prosent).toBe(100);
    expect(p.erMaks).toBe(true);
  });

  it('prosent holder seg innenfor 0–100', () => {
    for (const xp of [0, 1, 49, 50, 124, 125, 1599, 1600, 5000]) {
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

  it('episke dyrekort låses opp på nivå 3', () => {
    expect(erKortLaast({ category: 'dyr', rarity: 'epic' }, 2)).toBe(true);
    expect(erKortLaast({ category: 'dyr', rarity: 'epic' }, 3)).toBe(false);
  });

  it('legendariske gudekort låses opp på nivå 8', () => {
    expect(erKortLaast({ category: 'guder', rarity: 'legendary' }, 7)).toBe(true);
    expect(erKortLaast({ category: 'guder', rarity: 'legendary' }, 8)).toBe(false);
  });

  it('gjest (null) er aldri låst', () => {
    expect(erKortLaast({ category: 'guder', rarity: 'legendary' }, null)).toBe(false);
  });

  it('ukjent kombinasjon er åpen (nye pakker hard-låses ikke)', () => {
    expect(erKortLaast({ category: 'skapninger', rarity: 'epic' }, 1)).toBe(false);
  });
});

describe('opplåsingstabellen', () => {
  it('opplasningerVedNiva(6) gir nøyaktig nivå-6-radene', () => {
    const rader = opplasningerVedNiva(6);
    expect(rader).toHaveLength(1);
    expect(rader[0]).toMatchObject({ category: 'dyr', rarity: 'legendary' });
  });

  it('opplastVedNiva: gratis-kort er null, dyr-legendarisk er 6', () => {
    expect(opplastVedNiva({ category: 'biler', rarity: 'legendary' })).toBeNull();
    expect(opplastVedNiva({ category: 'dyr', rarity: 'legendary' })).toBe(6);
  });

  it('nesteOpplasning peker på første rad over nivået', () => {
    expect(nesteOpplasning(1)?.niva).toBe(3);
    expect(nesteOpplasning(9)?.niva).toBe(10);
    expect(nesteOpplasning(10)).toBeNull();
  });

  it('konsistensvakt: kun ikke-gratis kategorier, kun episk/legendarisk, nivå 2–10', () => {
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
    expect(sjekkNivaOpp(49, 50)).toMatchObject({ nyttNiva: 2 });
  });

  it('ingen kryssing gir null', () => {
    expect(sjekkNivaOpp(40, 49)).toBeNull();
    expect(sjekkNivaOpp(50, 50)).toBeNull();
  });

  it('kryssing av flere nivåer gir høyeste nivå og union av opplåsinger', () => {
    // 49 XP = nivå 1 → 130 XP = nivå 3: krysser nivå 2 og 3.
    const res = sjekkNivaOpp(49, 130);
    expect(res?.nyttNiva).toBe(3);
    expect(res?.opplasninger.map((o) => o.niva)).toEqual([3]);
  });

  it('over maksnivå gir null', () => {
    expect(sjekkNivaOpp(1600, 1700)).toBeNull();
  });
});
