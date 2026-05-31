/**
 * Datalag for `trades`-collection. Eneste modul som snakker direkte med
 * Firestore for bytter (jf. lib/data/users.ts). Holdes bak dette grensesnittet
 * så logikk/UI kan testes uten Firestore-emulator.
 */
import {
  collection, doc, addDoc, getDocs, getDoc, updateDoc, query, where,
  runTransaction, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { TradeDoc, TradeMedId, KortSnapshot } from './tradeTypes';

const COLL = 'trades';
const KODE_TEGN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // utelater 0/O/I/1/L (v2)
const UTLOEP_MS = 15 * 60 * 1000; // 15 min (v2)

/** 6-tegns byttekode. */
export function lagByttekode(rng: () => number = Math.random): string {
  let kode = '';
  for (let i = 0; i < 6; i++) kode += KODE_TEGN[Math.floor(rng() * KODE_TEGN.length)];
  return kode;
}

/** Oppretter en ny byttehandel (status pending). Returnerer id + kode. */
export async function createTrade(input: {
  initiatorUid: string;
  initiatorName: string;
  offeredKort: KortSnapshot;
}): Promise<{ tradeId: string; code: string }> {
  const code = lagByttekode();
  const nyDoc = {
    code,
    status: 'pending' as const,
    initiatorUid: input.initiatorUid,
    initiatorName: input.initiatorName,
    offeredKortId: input.offeredKort.id,
    offeredKort: input.offeredKort,
    responderUid: null,
    responderName: null,
    requestedKortId: null,
    requestedKort: null,
    expiresAt: Date.now() + UTLOEP_MS,
    createdAt: serverTimestamp(),
    cancelReason: null,
    initiatorSettled: false,
    responderSettled: false,
  };
  const ref = await addDoc(collection(db, COLL), nyDoc);
  return { tradeId: ref.id, code };
}

export type LookupResultat =
  | { ok: true; tradeId: string; trade: TradeDoc }
  | { ok: false; feil: 'not_found' | 'expired' | 'self' | 'taken' };

/** Slår opp en pending handel via kode. Sjekker utløp og selv-bytte. */
export async function lookupTrade(code: string, myUid: string): Promise<LookupResultat> {
  const q = query(collection(db, COLL), where('code', '==', code.toUpperCase()), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  if (snap.empty) return { ok: false, feil: 'not_found' };
  const d = snap.docs[0];
  const trade = d.data() as TradeDoc;
  if (Date.now() >= trade.expiresAt) return { ok: false, feil: 'expired' };
  if (trade.initiatorUid === myUid) return { ok: false, feil: 'self' };
  return { ok: true, tradeId: d.id, trade };
}

/**
 * Responder godtar: transaksjon som re-leser doc-en, sikrer at den fortsatt er
 * pending og ikke utløpt (hindrer dobbel-aksept), og setter accepted.
 */
export async function acceptTrade(args: {
  tradeId: string;
  responderUid: string;
  responderName: string;
  requestedKort: KortSnapshot;
}): Promise<{ ok: true } | { ok: false; feil: 'taken' | 'expired' | 'self' }> {
  const ref = doc(db, COLL, args.tradeId);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return { ok: false as const, feil: 'taken' as const };
      const t = snap.data() as TradeDoc;
      if (t.initiatorUid === args.responderUid) return { ok: false as const, feil: 'self' as const };
      if (t.status !== 'pending') return { ok: false as const, feil: 'taken' as const };
      if (Date.now() >= t.expiresAt) return { ok: false as const, feil: 'expired' as const };
      tx.update(ref, {
        status: 'accepted',
        responderUid: args.responderUid,
        responderName: args.responderName,
        requestedKortId: args.requestedKort.id,
        requestedKort: args.requestedKort,
      });
      return { ok: true as const };
    });
  } catch {
    return { ok: false, feil: 'taken' };
  }
}

/** Henter alle bytter brukeren deltar i (initiativtaker eller responder). */
export async function listMyTrades(uid: string): Promise<TradeMedId[]> {
  const [somA, somB] = await Promise.all([
    getDocs(query(collection(db, COLL), where('initiatorUid', '==', uid))),
    getDocs(query(collection(db, COLL), where('responderUid', '==', uid))),
  ]);
  const map = new Map<string, TradeMedId>();
  for (const d of [...somA.docs, ...somB.docs]) {
    map.set(d.id, { tradeId: d.id, trade: d.data() as TradeDoc });
  }
  // Nyeste først (epoch expiresAt er proxy for opprettelsestid).
  return [...map.values()].sort((a, b) => b.trade.expiresAt - a.trade.expiresAt);
}

export async function cancelTrade(tradeId: string, reason: string): Promise<void> {
  await updateDoc(doc(db, COLL, tradeId), { status: 'cancelled', cancelReason: reason });
}

export async function markExpired(tradeId: string): Promise<void> {
  await updateDoc(doc(db, COLL, tradeId), { status: 'expired' });
}

/** Flipper settled-flagg for en rolle; setter completed når begge er satt. */
export async function setSettled(tradeId: string, rolle: 'initiator' | 'responder'): Promise<void> {
  const ref = doc(db, COLL, tradeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const t = snap.data() as TradeDoc;
  const oppdatering: Record<string, unknown> =
    rolle === 'initiator' ? { initiatorSettled: true } : { responderSettled: true };
  const begge = rolle === 'initiator' ? t.responderSettled : t.initiatorSettled;
  if (begge) oppdatering.status = 'completed';
  await updateDoc(ref, oppdatering);
}

/** Sanntidslytter på én handel (erstatter v2-polling). Returnerer unsubscribe. */
export function watchTrade(tradeId: string, cb: (t: TradeDoc | null) => void): () => void {
  return onSnapshot(doc(db, COLL, tradeId), (snap) => {
    cb(snap.exists() ? (snap.data() as TradeDoc) : null);
  });
}
