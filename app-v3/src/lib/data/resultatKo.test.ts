import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { leggIResultatKo, hentResultatKo, provSendResultatKo } from './resultatKo';
import { byggResultatDokument, type ResultatDokument } from './resultater';
import type { Prove } from './prover';

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

const prove: Prove = { id: 'p1', kode: 'ABC123', tittel: 'Ukas gloser', fag: 'gloser', opprettet_av: 'laerer1' };

function dok(): ResultatDokument {
  return byggResultatDokument({
    prove, riktige: 3, totalt: 4, prosent: 75, tidSekunder: 90,
    svar: [{ sporsmal: 'hund', brukersvar: 'dog', fasit: 'dog', riktig: true }],
    elevNavn: 'Ola', elevUid: null,
  });
}

describe('byggResultatDokument', () => {
  it('gjest får tilfeldig elev_id, gjest-flagg og klient_id', () => {
    const d = dok();
    expect(d.gjest).toBe(true);
    expect(d.elev_id).toMatch(/-/);
    expect(d.klient_id).toBeTruthy();
    expect(d.prove_eier).toBe('laerer1');
  });
  it('innlogget elev beholder uid og er ikke gjest', () => {
    const d = byggResultatDokument({ prove, riktige: 1, totalt: 1, prosent: 100, svar: [], tidSekunder: 5, elevUid: 'feide123' });
    expect(d.elev_id).toBe('feide123');
    expect(d.gjest).toBe(false);
  });
});

describe('resultatKo', () => {
  beforeEach(() => localStorage.clear());

  it('køet element ligger i køen med dokumentet intakt', async () => {
    const d = dok();
    await leggIResultatKo(d);
    const ko = await hentResultatKo();
    expect(ko).toHaveLength(1);
    expect(ko[0].dok).toEqual(d);
    expect(ko[0].koId).toBe(d.klient_id);
  });

  it('vellykket sending tømmer køen i rekkefølge', async () => {
    await leggIResultatKo(dok());
    await leggIResultatKo(dok());
    const sendte: ResultatDokument[] = [];
    const res = await provSendResultatKo(async (d) => void sendte.push(d));
    expect(res).toEqual({ sendt: 2, gjenstaar: 0 });
    expect(sendte).toHaveLength(2);
    expect(await hentResultatKo()).toHaveLength(0);
  });

  it('stopper på første feil og beholder resten', async () => {
    await leggIResultatKo(dok());
    await leggIResultatKo(dok());
    let kall = 0;
    const res = await provSendResultatKo(async () => {
      kall += 1;
      if (kall === 2) throw new Error('offline');
    });
    expect(res).toEqual({ sendt: 1, gjenstaar: 1 });
    expect(await hentResultatKo()).toHaveLength(1);
  });

  it('retry sender samme dokument (samme klient_id) — idempotent', async () => {
    const d = dok();
    await leggIResultatKo(d);
    await provSendResultatKo(async () => { throw new Error('offline'); });
    const sendte: ResultatDokument[] = [];
    await provSendResultatKo(async (x) => void sendte.push(x));
    expect(sendte[0].klient_id).toBe(d.klient_id);
    expect(sendte[0].elev_id).toBe(d.elev_id);
  });

  it('parallelle triggere sender ikke dobbelt (pågår-flagg)', async () => {
    await leggIResultatKo(dok());
    const sendte: ResultatDokument[] = [];
    const treg = async (d: ResultatDokument) => {
      await new Promise((r) => setTimeout(r, 20));
      sendte.push(d);
    };
    const [a, b] = await Promise.all([provSendResultatKo(treg), provSendResultatKo(treg)]);
    expect(sendte).toHaveLength(1);
    expect(a.sendt + b.sendt).toBe(1);
  });
});
