import { describe, it, expect } from 'vitest';
import {
  normaliser,
  erSvarRiktig,
  lagFeilAlternativer,
  byggSporsmalsliste,
  beregnResultat,
} from './quizEngine';
import type { Prove } from '../../lib/data/prover';

describe('normaliser', () => {
  it('trimmer og gjør om til små bokstaver', () => {
    expect(normaliser('  Hello ')).toBe('hello');
  });
  it('erstatter æ/ø/å (jf. v2 normaliser)', () => {
    expect(normaliser('Blåbær')).toBe('blaabaer');
    expect(normaliser('SØT')).toBe('sot');
  });
});

describe('erSvarRiktig', () => {
  it('godtar ulik casing og whitespace', () => {
    expect(erSvarRiktig(' HELLO ', 'hello')).toBe(true);
  });
  it('godtar ae/o/aa for æ/ø/å', () => {
    expect(erSvarRiktig('blaabaer', 'blåbær')).toBe(true);
    expect(erSvarRiktig('sot', 'søt')).toBe(true);
  });
  it('avviser feil svar', () => {
    expect(erSvarRiktig('hund', 'katt')).toBe(false);
    expect(erSvarRiktig('', 'katt')).toBe(false);
  });
});

describe('lagFeilAlternativer', () => {
  const pool = ['cat', 'dog', 'bird', 'fish', 'horse'];
  it('ekskluderer riktig svar (normalisert)', () => {
    for (let i = 0; i < 20; i++) {
      expect(lagFeilAlternativer('CAT', pool)).not.toContain('cat');
    }
  });
  it('gir maks 3 alternativer', () => {
    expect(lagFeilAlternativer('cat', pool).length).toBe(3);
  });
  it('gir færre når poolen er liten', () => {
    expect(lagFeilAlternativer('cat', ['cat', 'dog']).length).toBe(1);
  });
});

const ordliste = [
  { s: 'hund', e: 'dog' },
  { s: 'katt', e: 'cat' },
  { s: 'fugl', e: 'bird' },
  { s: 'fisk', e: 'fish' },
  { s: 'hest', e: 'horse' },
];

function gloseprove(overrides: Partial<Prove> = {}): Prove {
  return { id: 'p1', kode: 'ABC123', fag: 'gloser', ordliste, ...overrides };
}

describe('byggSporsmalsliste', () => {
  it('gloser: viser norsk, fasit er engelsk', () => {
    const spm = byggSporsmalsliste(gloseprove({ bland: false }));
    expect(spm.map((s) => s.sporsmal)).toEqual(ordliste.map((o) => o.s));
    expect(spm.map((s) => s.riktigSvar)).toEqual(ordliste.map((o) => o.e));
  });

  it('norsk: viser engelsk, fasit er norsk', () => {
    const spm = byggSporsmalsliste(gloseprove({ fag: 'norsk', bland: false }));
    expect(spm.map((s) => s.sporsmal)).toEqual(ordliste.map((o) => o.e));
    expect(spm.map((s) => s.riktigSvar)).toEqual(ordliste.map((o) => o.s));
  });

  it('bland: false beholder ordlistens rekkefølge', () => {
    for (let i = 0; i < 10; i++) {
      const spm = byggSporsmalsliste(gloseprove({ bland: false }));
      expect(spm.map((s) => s.sporsmal)).toEqual(ordliste.map((o) => o.s));
    }
  });

  it('bland på/utelatt gir samme spørsmålssett (uavhengig av rekkefølge)', () => {
    for (const bland of [true, undefined]) {
      const spm = byggSporsmalsliste(gloseprove({ bland }));
      expect(spm.map((s) => s.sporsmal).sort()).toEqual(ordliste.map((o) => o.s).sort());
    }
  });

  it('flervalg har maks 4 unike alternativer inkludert fasit', () => {
    const spm = byggSporsmalsliste(gloseprove());
    for (const s of spm) {
      expect(s.type).toBe('flervalg');
      expect(s.alternativer).toBeDefined();
      expect(s.alternativer!.length).toBeLessThanOrEqual(4);
      expect(new Set(s.alternativer).size).toBe(s.alternativer!.length);
      expect(s.alternativer).toContain(s.riktigSvar);
    }
  });

  it('matte: tekstsvar i oppgavenes rekkefølge, forklaring følger med', () => {
    const spm = byggSporsmalsliste({
      id: 'p2', kode: 'XYZ789', fag: 'matte',
      oppgaver: [
        { sporsmal: '2+2', svar: 4, forklaring: 'fire' },
        { s: '3*3', e: '9' },
      ],
    });
    expect(spm).toEqual([
      { type: 'tekst', sporsmal: '2+2', riktigSvar: '4', forklaring: 'fire' },
      { type: 'tekst', sporsmal: '3*3', riktigSvar: '9', forklaring: null },
    ]);
  });
});

describe('beregnResultat', () => {
  it('runder prosent', () => {
    expect(beregnResultat(2, 3)).toEqual({ riktige: 2, totalt: 3, prosent: 67 });
  });
  it('alle riktige gir 100', () => {
    expect(beregnResultat(5, 5).prosent).toBe(100);
  });
  it('0 spørsmål gir 0 % (ikke NaN)', () => {
    expect(beregnResultat(0, 0).prosent).toBe(0);
  });
});
