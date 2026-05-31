/**
 * Idempotent oppgjørs-avstemming for byttehandler.
 *
 * Samlingen bor kun i localStorage per UID, så en motpart kan ikke skrive til
 * den andres samling. I stedet er trade-doc-en sannhetskilden, og hver klient
 * avstemmer SIN egen samling mot fullførte bytter den deltok i.
 *
 * Idempotens: en per-(trade,uid)-markør i localStorage skrives FØR samlingen
 * muteres (write-ahead). Kjøres avstemmingen på nytt (reload, oppstart, flere
 * faner), ser den markøren og hopper over — kortet kan aldri dobbelt-telles.
 */
import type { KortDef } from '../kort/kortData';
import { fjernKort, leggTilKort, antallAvKort } from '../kort/kortSamling';
import type { TradeDoc, KortSnapshot } from './tradeTypes';

/** Injiserbare avhengigheter (ekte impl i prod; fakes i test). */
export interface ReconcileDeps {
  harMarkoer: (key: string) => boolean;
  settMarkoer: (key: string) => void;
  fjernKort: (kortId: string, count: number) => number;
  leggTilKort: (kort: KortDef) => void;
  antallAvKort: (kortId: string) => number;
}

const defaultDeps: ReconcileDeps = {
  harMarkoer: (key) => localStorage.getItem(key) !== null,
  settMarkoer: (key) => localStorage.setItem(key, '1'),
  fjernKort,
  leggTilKort,
  antallAvKort,
};

function appliedKey(tradeId: string, uid: string): string {
  return `mester_trade_applied_${tradeId}_${uid}`;
}

/** Konverter snapshot til KortDef (samme felter; leggTilKort tar KortDef). */
function tilKortDef(s: KortSnapshot): KortDef {
  return { id: s.id, name: s.name, image: s.image, rarity: s.rarity, category: s.category, fag: s.fag };
}

export type ReconcileResultat =
  | 'allerede_avstemt'
  | 'ikke_klar'
  | 'ikke_deltaker'
  | 'mangler_kort'
  | 'avstemt';

/**
 * Bruk den lokale effekten av ÉN handel for gjeldende bruker. Idempotent.
 *  - Initiativtaker: mister offeredKort, får requestedKort.
 *  - Responder:      mister requestedKort, får offeredKort.
 * Returnerer utfallet (mest for logging/test).
 */
export function reconcileTrade(
  trade: TradeDoc,
  tradeId: string,
  myUid: string,
  deps: ReconcileDeps = defaultDeps,
): ReconcileResultat {
  const key = appliedKey(tradeId, myUid);
  if (deps.harMarkoer(key)) return 'allerede_avstemt';

  // Det er bare noe å avstemme når responder har valgt kort.
  if (
    (trade.status !== 'accepted' && trade.status !== 'completed') ||
    !trade.requestedKort ||
    !trade.requestedKortId
  ) {
    return 'ikke_klar';
  }

  let girId: string;
  let faar: KortSnapshot;
  if (myUid === trade.initiatorUid) {
    girId = trade.offeredKortId;
    faar = trade.requestedKort;
  } else if (myUid === trade.responderUid) {
    girId = trade.requestedKortId;
    faar = trade.offeredKort;
  } else {
    return 'ikke_deltaker';
  }

  // Eierskaps-sjekk: går aldri i minus om kortet allerede er borte.
  if (deps.antallAvKort(girId) < 1) {
    // Marker likevel som avstemt for å unngå evig retry på en umulig handel.
    deps.settMarkoer(key);
    return 'mangler_kort';
  }

  // Write-ahead: sett markør FØR mutasjon. Ved krasj etterpå hopper retry over
  // (taper i verste fall ett bytte; dupliserer aldri).
  deps.settMarkoer(key);
  deps.fjernKort(girId, 1); // fjern FØR vi legger til, så samme id ikke blåses opp
  deps.leggTilKort(tilKortDef(faar));
  return 'avstemt';
}
