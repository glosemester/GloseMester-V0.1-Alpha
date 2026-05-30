/**
 * Datalag for `resultater`-collection. Elevens prøveresultat sendes (anonymt
 * eller med navn/uid) til lærer. Portet fra v2 quiz-engine lagreResultat.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Prove } from './prover';

export interface SvarRad {
  sporsmal: string;
  brukersvar: string;
  riktig: boolean;
}

export interface ResultatInput {
  prove: Prove;
  riktige: number;
  totalt: number;
  prosent: number;
  svar: SvarRad[];
  tidSekunder: number;
  /** Elevnavn (valgfritt; gjest skriver inn, innlogget bruker displayName). */
  elevNavn?: string | null;
  /** Firebase UID hvis innlogget, ellers null (da genereres en tilfeldig id). */
  elevUid?: string | null;
}

/** Lagrer prøveresultat til Firestore. */
export async function lagreResultat(input: ResultatInput): Promise<void> {
  const { prove, riktige, totalt, prosent, svar, tidSekunder, elevNavn = null, elevUid = null } = input;
  await addDoc(collection(db, 'resultater'), {
    prove_id: prove.id,
    kode: prove.kode,
    tittel: prove.tittel ?? '',
    fag: prove.fag ?? 'ukjent',
    elev_id: elevUid ?? crypto.randomUUID(),
    elevNavn,
    prove_eier: prove.opprettet_av ?? null,
    poengsum: riktige,
    maksPoeng: totalt,
    prosent,
    svar,
    tidSekunder,
    tidspunkt: serverTimestamp(),
  });
}
