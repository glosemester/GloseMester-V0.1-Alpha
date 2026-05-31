/**
 * Delte typer for byttesystemet. Holdes adskilt fra datalaget (tradeData.ts)
 * så ren logikk (tradeMachine, tradeReconcile) og tester slipper å importere
 * Firebase.
 */
import type { Rarity, Category } from '../kort/kortData';

export type TradeStatus = 'pending' | 'accepted' | 'completed' | 'cancelled' | 'expired';

/** Selvstendig kort-snapshot i en byttehandel (slipper kortData-oppslag). */
export interface KortSnapshot {
  id: string;
  name: string;
  image: string;
  rarity: Rarity;
  category: Category;
  fag: 'gloser';
}

export interface TradeDoc {
  code: string;
  status: TradeStatus;
  initiatorUid: string;
  initiatorName: string;
  offeredKortId: string;
  offeredKort: KortSnapshot;
  responderUid: string | null;
  responderName: string | null;
  requestedKortId: string | null;
  requestedKort: KortSnapshot | null;
  /** Klient-epoch (ms) for når handelen utløper (15 min etter opprettelse). */
  expiresAt: number;
  /** ISO-streng satt ved opprettelse (createdAt; serverTimestamp i datalaget). */
  createdAt: string | null;
  cancelReason: string | null;
  /** Koordineringsflagg: hver part flipper sitt når de har avstemt lokalt. */
  initiatorSettled: boolean;
  responderSettled: boolean;
}

/** TradeDoc med id (slik datalaget returnerer det). */
export interface TradeMedId {
  tradeId: string;
  trade: TradeDoc;
}
