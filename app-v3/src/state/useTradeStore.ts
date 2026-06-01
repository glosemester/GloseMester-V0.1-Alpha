/**
 * Bytte-store (Zustand) — binder sammen byttesjetonger, tradeData (Firestore)
 * og tradeReconcile. Holder sjetong-saldo + aktive bytter reaktivt, og eksponerer
 * handlinger som UI-en kaller. Refunderer sjetong (idempotent) ved avbrutt/utløpt
 * handel.
 */
import { create } from 'zustand';
import {
  sjetongFremgang, tilgjengeligeSjetonger, brukSjetong, refunderSjetong,
  type SjetongFremgang,
} from '../features/trade/byttesjetonger';
import { reconcileTrade } from '../features/trade/tradeReconcile';
import * as tradeData from '../features/trade/tradeData';
import type { KortSnapshot, TradeMedId } from '../features/trade/tradeTypes';
import { toast } from './useToastStore';

function refundertKey(tradeId: string, uid: string): string {
  return `mester_trade_refunded_${tradeId}_${uid}`;
}

/** Refunder sjetong nøyaktig én gang per handel (markør hindrer dobbel-refund). */
function refunderEnGang(tradeId: string, uid: string): boolean {
  const key = refundertKey(tradeId, uid);
  if (localStorage.getItem(key) !== null) return false;
  localStorage.setItem(key, '1');
  refunderSjetong();
  return true;
}

interface TradeState {
  fremgang: SjetongFremgang;
  myTrades: TradeMedId[];
  pendingTradeCode: string | null;
  laster: boolean;

  oppdaterSjetonger: () => void;
  settPendingKode: (kode: string | null) => void;
  refreshTrades: (uid: string) => Promise<void>;

  createTrade: (uid: string, navn: string, offered: KortSnapshot) => Promise<{ code: string; tradeId: string } | null>;
  acceptTrade: (uid: string, navn: string, tradeId: string, requested: KortSnapshot) => Promise<boolean>;
  cancelTrade: (uid: string, tradeId: string) => Promise<void>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  fremgang: sjetongFremgang(),
  myTrades: [],
  pendingTradeCode: null,
  laster: false,

  oppdaterSjetonger: () => set({ fremgang: sjetongFremgang() }),

  settPendingKode: (kode) => set({ pendingTradeCode: kode }),

  refreshTrades: async (uid) => {
    set({ laster: true });
    try {
      const trades = await tradeData.listMyTrades(uid);
      // Avstem alle (idempotent) — henter inn kort vunnet mens fanen var lukket.
      for (const { tradeId, trade } of trades) {
        const res = reconcileTrade(trade, tradeId, uid);
        if (res === 'avstemt') {
          const rolle = trade.initiatorUid === uid ? 'initiator' : 'responder';
          void tradeData.setSettled(tradeId, rolle).catch(() => {});
        }
        // Refunder sjetong for initiativtaker når en handel endte uten oppgjør.
        if (trade.initiatorUid === uid && (trade.status === 'cancelled' || trade.status === 'expired')) {
          if (refunderEnGang(tradeId, uid)) toast.info('Byttesjetong refundert.');
        }
      }
      set({ myTrades: trades, fremgang: sjetongFremgang(), laster: false });
    } catch {
      set({ laster: false });
    }
  },

  createTrade: async (uid, navn, offered) => {
    if (tilgjengeligeSjetonger() < 1) {
      toast.error('Du har ingen byttesjetonger — øv mer for å tjene en!');
      return null;
    }
    try {
      brukSjetong();
      set({ fremgang: sjetongFremgang() });
      const { tradeId, code } = await tradeData.createTrade({ initiatorUid: uid, initiatorName: navn, offeredKort: offered });
      await get().refreshTrades(uid);
      return { code, tradeId };
    } catch {
      // Skriving feilet → refunder sjetongen vi nettopp brukte.
      refunderSjetong();
      set({ fremgang: sjetongFremgang() });
      toast.error('Kunne ikke opprette bytte — sjekk nettilkoblingen.');
      return null;
    }
  },

  acceptTrade: async (uid, navn, tradeId, requested) => {
    const res = await tradeData.acceptTrade({ tradeId, responderUid: uid, responderName: navn, requestedKort: requested });
    if (!res.ok) {
      const m = res.feil === 'expired' ? 'Handelen er utløpt.' : res.feil === 'self' ? 'Du kan ikke svare på ditt eget bytte.' : 'Handelen er ikke lenger tilgjengelig.';
      toast.error(m);
      return false;
    }
    // Avstem lokalt umiddelbart (responder: mister requested, får offered).
    await get().refreshTrades(uid);
    toast.success('Bytte fullført!');
    return true;
  },

  cancelTrade: async (uid, tradeId) => {
    try {
      await tradeData.cancelTrade(tradeId, 'avbrutt av initiativtaker');
      refunderEnGang(tradeId, uid);
      await get().refreshTrades(uid);
      toast.info('Bytte avbrutt — sjetong refundert.');
    } catch {
      toast.error('Kunne ikke avbryte byttet.');
    }
  },
}));
