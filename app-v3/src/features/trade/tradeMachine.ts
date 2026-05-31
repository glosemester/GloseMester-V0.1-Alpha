/**
 * Tilstandsmaskin for byttehandler — ren logikk, speiler reglene i
 * firestore.rules. Brukes klientside for å validere overganger før skriving og
 * for å gi tydelige feilmeldinger. Sannheten håndheves også server-side.
 *
 * Lovlige overganger:
 *   pending   → accepted   (responder svarer)
 *   pending   → cancelled  (initiativtaker avbryter)
 *   pending   → expired    (utløpt)
 *   accepted  → completed  (begge har avstemt)
 *   accepted  → expired    (utløpt mens responder svarte)
 */
import type { TradeStatus } from './tradeTypes';

export type TradeRole = 'initiator' | 'responder';

const LOVLIGE: Record<TradeStatus, TradeStatus[]> = {
  pending: ['accepted', 'cancelled', 'expired'],
  accepted: ['completed', 'expired'],
  completed: [],
  cancelled: [],
  expired: [],
};

/** Er overgangen fra → til lovlig (uavhengig av hvem)? */
export function kanOvergaa(fra: TradeStatus, til: TradeStatus): boolean {
  return LOVLIGE[fra]?.includes(til) ?? false;
}

/**
 * Kan en gitt rolle utføre overgangen? Forretningsregler utover ren graf:
 *  - Kun responder kan akseptere (pending→accepted).
 *  - Kun initiativtaker kan avbryte (pending→cancelled).
 *  - Begge kan bidra til completed (accepted→completed).
 *  - expired er systemstyrt (begge kan markere).
 */
export function kanRolleOvergaa(fra: TradeStatus, til: TradeStatus, rolle: TradeRole): boolean {
  if (!kanOvergaa(fra, til)) return false;
  if (til === 'accepted') return rolle === 'responder';
  if (til === 'cancelled') return rolle === 'initiator';
  return true; // completed | expired
}

/** Er handelen i en avsluttet (uforanderlig) tilstand? */
export function erAvsluttet(status: TradeStatus): boolean {
  return status === 'completed' || status === 'cancelled' || status === 'expired';
}

/** Skal denne handelen behandles som utløpt nå? */
export function erUtloept(expiresAt: number, naa = Date.now()): boolean {
  return naa >= expiresAt;
}
