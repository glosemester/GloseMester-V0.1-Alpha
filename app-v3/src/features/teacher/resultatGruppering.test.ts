import { describe, it, expect } from 'vitest';
import {
  grupperResultaterPerElev,
  beregnSnitt,
  beregnOrdStatistikk,
} from './resultatGruppering';
import type { ProveResultat, SvarRad } from '../../lib/data/resultater';

let teller = 0;
function resultat(overrides: Partial<ProveResultat> = {}): ProveResultat {
  teller += 1;
  return {
    prove_id: 'p1',
    elev_id: 'feideElev1',
    elevNavn: 'Ola',
    gjest: false,
    prosent: 50,
    poengsum: 2,
    maksPoeng: 4,
    svar: [],
    tidSekunder: 60,
    klient_id: `k${teller}`,
    tidspunkt: `2026-06-0${(teller % 9) + 1}T10:00:00.000Z`,
    ...overrides,
  };
}

describe('grupperResultaterPerElev', () => {
  it('samler flere forsøk fra samme elev i én gruppe, nyeste først', () => {
    const grupper = grupperResultaterPerElev([
      resultat({ prosent: 50, tidspunkt: '2026-06-01T10:00:00.000Z' }),
      resultat({ prosent: 75, tidspunkt: '2026-06-02T10:00:00.000Z' }),
    ]);
    expect(grupper).toHaveLength(1);
    expect(grupper[0].antallForsok).toBe(2);
    expect(grupper[0].forsok[0].prosent).toBe(75);
    expect(grupper[0].beste.prosent).toBe(75);
  });

  it('beste forsøk: tie-break på nyeste tidspunkt', () => {
    const [g] = grupperResultaterPerElev([
      resultat({ prosent: 75, tidSekunder: 99, tidspunkt: '2026-06-01T10:00:00.000Z' }),
      resultat({ prosent: 75, tidSekunder: 42, tidspunkt: '2026-06-05T10:00:00.000Z' }),
    ]);
    expect(g.beste.tidSekunder).toBe(42);
  });

  it('gjester grupperes aldri — én rad per innlevering, sortert sist', () => {
    const grupper = grupperResultaterPerElev([
      resultat({ elev_id: 'feideElev1', prosent: 40 }),
      resultat({ elev_id: crypto.randomUUID(), elevNavn: 'Gjest-Kari', gjest: true, prosent: 90 }),
      resultat({ elev_id: crypto.randomUUID(), elevNavn: 'Gjest-Kari', gjest: true, prosent: 80 }),
    ]);
    expect(grupper).toHaveLength(3);
    expect(grupper[0].erGjest).toBe(false);
    expect(grupper.filter((g) => g.erGjest)).toHaveLength(2);
  });

  it('gjenkjenner legacy-gjester på UUID-bindestreker uten gjest-flagg', () => {
    const [g] = grupperResultaterPerElev([
      resultat({ elev_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', gjest: false }),
    ]);
    expect(g.erGjest).toBe(true);
  });

  it('deduper identisk klient_id (historiske doble lagringer)', () => {
    const grupper = grupperResultaterPerElev([
      resultat({ klient_id: 'dup', prosent: 60 }),
      resultat({ klient_id: 'dup', prosent: 60 }),
    ]);
    expect(grupper[0].antallForsok).toBe(1);
  });

  it('sorterer innloggede elever etter beste prosent synkende', () => {
    const grupper = grupperResultaterPerElev([
      resultat({ elev_id: 'a', prosent: 30 }),
      resultat({ elev_id: 'b', prosent: 90 }),
    ]);
    expect(grupper.map((g) => g.elevId)).toEqual(['b', 'a']);
  });
});

describe('beregnSnitt', () => {
  it('bruker beste forsøk per elev — ikke alle innleveringer', () => {
    const resultater = [
      resultat({ elev_id: 'a', prosent: 100 }),
      resultat({ elev_id: 'a', prosent: 0 }), // omtak skal ikke trekke ned
      resultat({ elev_id: 'b', prosent: 50 }),
    ];
    const grupper = grupperResultaterPerElev(resultater);
    // Naivt snitt over innleveringer ville gitt 50; per elev (100+50)/2 = 75.
    expect(beregnSnitt(grupper)).toBe(75);
  });

  it('0 uten resultater', () => {
    expect(beregnSnitt([])).toBe(0);
  });
});

describe('beregnOrdStatistikk', () => {
  const svarRader = (riktigHund: boolean, feilsvar = 'cat'): SvarRad[] => [
    { sporsmal: 'hund', brukersvar: riktigHund ? 'dog' : feilsvar, fasit: 'dog', riktig: riktigHund },
    { sporsmal: 'katt', brukersvar: 'cat', fasit: 'cat', riktig: true },
  ];

  it('aggregerer kun beste forsøk, sortert på feilprosent', () => {
    const grupper = grupperResultaterPerElev([
      resultat({ elev_id: 'a', prosent: 50, svar: svarRader(false) }),
      resultat({ elev_id: 'a', prosent: 100, svar: svarRader(true), tidspunkt: '2026-06-09T10:00:00.000Z' }),
      resultat({ elev_id: 'b', prosent: 50, svar: svarRader(false, 'fish') }),
    ]);
    const stats = beregnOrdStatistikk(grupper);
    expect(stats[0]).toMatchObject({ sporsmal: 'hund', fasit: 'dog', antallSvar: 2, antallFeil: 1, feilProsent: 50 });
    expect(stats[0].vanligeFeilsvar).toEqual(['fish']);
    expect(stats[1]).toMatchObject({ sporsmal: 'katt', antallFeil: 0, feilProsent: 0 });
  });

  it('teller vanligste feilsvar (maks 3)', () => {
    const grupper = grupperResultaterPerElev(
      ['cat', 'cat', 'fish', 'bird', 'horse'].map((feil, i) =>
        resultat({ elev_id: `e${i}`, svar: [{ sporsmal: 'hund', brukersvar: feil, fasit: 'dog', riktig: false }] }),
      ),
    );
    const [stat] = beregnOrdStatistikk(grupper);
    expect(stat.vanligeFeilsvar).toHaveLength(3);
    expect(stat.vanligeFeilsvar[0]).toBe('cat');
  });

  it('fasit-fallback fra ordlisten for eldre resultater uten fasit-felt', () => {
    const grupper = grupperResultaterPerElev([
      resultat({ svar: [{ sporsmal: 'hund', brukersvar: 'cat', riktig: false }] }),
    ]);
    const stats = beregnOrdStatistikk(grupper, { fag: 'gloser', ordliste: [{ s: 'hund', e: 'dog' }] });
    expect(stats[0].fasit).toBe('dog');
  });

  it('tom input gir tom liste', () => {
    expect(beregnOrdStatistikk([])).toEqual([]);
  });
});
