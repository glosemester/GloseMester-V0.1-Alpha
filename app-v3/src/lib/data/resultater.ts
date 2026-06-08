/**
 * Datalag for `resultater`-collection. Elevens prøveresultat sendes (anonymt
 * eller med navn/uid) til lærer. Portet fra v2 quiz-engine lagreResultat.
 */
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
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

/** Prøve-IDer eleven har gjennomført (for «Mine prøver»-statusen). */
export async function hentGjennomforteProveIder(elevUid: string): Promise<Set<string>> {
  const snap = await getDocs(query(collection(db, 'resultater'), where('elev_id', '==', elevUid)));
  return new Set(snap.docs.map((d) => String(d.data().prove_id)));
}

export interface ProveResultat {
  prove_id: string;
  elevNavn: string;
  prosent: number;
  poengsum: number;
  maksPoeng: number;
  tidspunkt: string | null;
}

/**
 * Henter resultater for en liste prøve-ID-er. Firestore 'in' tar maks 30 verdier,
 * så vi deler opp i chunks (jf. v2 _loadResults).
 */
export async function hentResultaterForProver(proveIds: string[]): Promise<ProveResultat[]> {
  const resultater: ProveResultat[] = [];
  for (let i = 0; i < proveIds.length; i += 30) {
    const chunk = proveIds.slice(i, i + 30);
    if (chunk.length === 0) continue;
    try {
      const snap = await getDocs(query(collection(db, 'resultater'), where('prove_id', 'in', chunk)));
      snap.docs.forEach((d) => {
        const r = d.data();
        resultater.push({
          prove_id: r.prove_id,
          elevNavn: r.elevNavn || 'Anonym',
          prosent: r.prosent ?? 0,
          poengsum: r.poengsum ?? 0,
          maksPoeng: r.maksPoeng ?? 0,
          tidspunkt: r.tidspunkt?.toDate?.()?.toISOString() ?? null,
        });
      });
    } catch (e) {
      console.warn('hentResultaterForProver chunk feil:', e);
    }
  }
  return resultater;
}
