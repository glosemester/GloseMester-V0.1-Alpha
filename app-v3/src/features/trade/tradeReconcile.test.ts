import { describe, it, expect } from 'vitest';
import { reconcileTrade, type ReconcileDeps } from './tradeReconcile';
import type { TradeDoc, KortSnapshot } from './tradeTypes';

const eple: KortSnapshot = { id: 'dyr_001', name: 'Hamster', image: 'a.png', rarity: 'common', category: 'dyr', fag: 'gloser' };
const bil: KortSnapshot = { id: 'bil_021', name: 'Porsche 911', image: 'b.png', rarity: 'rare', category: 'biler', fag: 'gloser' };

/** Fake-samling + markører i et vanlig objekt — ingen DOM. */
function lagFakes(eide: string[]) {
  const samling = [...eide];
  const markoerer = new Set<string>();
  const deps: ReconcileDeps = {
    harMarkoer: (k) => markoerer.has(k),
    settMarkoer: (k) => void markoerer.add(k),
    antallAvKort: (id) => samling.filter((x) => x === id).length,
    fjernKort: (id, n) => {
      let fjernet = 0;
      for (let i = samling.length - 1; i >= 0 && fjernet < n; i--) {
        if (samling[i] === id) { samling.splice(i, 1); fjernet++; }
      }
      return fjernet;
    },
    leggTilKort: (k) => void samling.push(k.id),
  };
  return { samling, deps, markoerer };
}

function tradeDoc(over: Partial<TradeDoc> = {}): TradeDoc {
  return {
    code: 'ABC234', status: 'accepted',
    initiatorUid: 'A', initiatorName: 'Ada',
    offeredKortId: eple.id, offeredKort: eple,
    responderUid: 'B', responderName: 'Bo',
    requestedKortId: bil.id, requestedKort: bil,
    expiresAt: Date.now() + 60000, createdAt: null, cancelReason: null,
    initiatorSettled: false, responderSettled: false,
    ...over,
  };
}

describe('reconcileTrade', () => {
  it('initiativtaker mister tilbudt kort og får ønsket kort', () => {
    const { samling, deps } = lagFakes([eple.id]);
    const res = reconcileTrade(tradeDoc(), 't1', 'A', deps);
    expect(res).toBe('avstemt');
    expect(samling).toEqual([bil.id]); // mistet eple, fikk bil
  });

  it('responder mister ønsket kort og får tilbudt kort', () => {
    const { samling, deps } = lagFakes([bil.id]);
    const res = reconcileTrade(tradeDoc(), 't1', 'B', deps);
    expect(res).toBe('avstemt');
    expect(samling).toEqual([eple.id]); // mistet bil, fikk eple
  });

  it('er idempotent: andre kjøring gjør ingenting', () => {
    const { samling, deps } = lagFakes([eple.id]);
    reconcileTrade(tradeDoc(), 't1', 'A', deps);
    const res2 = reconcileTrade(tradeDoc(), 't1', 'A', deps);
    expect(res2).toBe('allerede_avstemt');
    expect(samling).toEqual([bil.id]); // uendret etter andre kjøring
  });

  it('avstemmer ikke pending (responder har ikke valgt)', () => {
    const { samling, deps } = lagFakes([eple.id]);
    const res = reconcileTrade(tradeDoc({ status: 'pending', requestedKort: null, requestedKortId: null }), 't1', 'A', deps);
    expect(res).toBe('ikke_klar');
    expect(samling).toEqual([eple.id]);
  });

  it('ikke-deltaker avvises', () => {
    const { samling, deps } = lagFakes([eple.id]);
    const res = reconcileTrade(tradeDoc(), 't1', 'C', deps);
    expect(res).toBe('ikke_deltaker');
    expect(samling).toEqual([eple.id]);
  });

  it('manglende kort: markeres avstemt, ingen mutasjon', () => {
    const { samling, deps } = lagFakes([]); // eier ikke eple
    const res = reconcileTrade(tradeDoc(), 't1', 'A', deps);
    expect(res).toBe('mangler_kort');
    expect(samling).toEqual([]);
    // markert → retry hopper over
    expect(reconcileTrade(tradeDoc(), 't1', 'A', deps)).toBe('allerede_avstemt');
  });

  it('duplikat beholdes: gir bort 1 av 2 eple, får bil', () => {
    const { samling, deps } = lagFakes([eple.id, eple.id]);
    reconcileTrade(tradeDoc(), 't1', 'A', deps);
    expect(samling.filter((x) => x === eple.id)).toHaveLength(1);
    expect(samling).toContain(bil.id);
  });
});
