/**
 * Datalag for `prover`-collection (lærerens prøver). Elev henter en prøve via
 * 6-tegns kode. Portet fra v2 quiz-engine hentProveMedKode.
 */
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export type Fag = 'gloser' | 'norsk' | 'matte';

/** Ett ord i en glose-/norskprøve. */
export interface ProveOrd {
  s: string;
  e: string;
}

/** Én matteoppgave. */
export interface ProveOppgave {
  sporsmal?: string;
  s?: string;
  svar?: string | number;
  e?: string;
  forklaring?: string | null;
}

export interface Prove {
  id: string;
  kode: string;
  tittel?: string;
  fag?: Fag;
  niva?: string | number;
  ordliste?: ProveOrd[];
  oppgaver?: ProveOppgave[];
  opprettet_av?: string | null;
}

/** Henter prøve via 6-tegns kode (normaliseres til store bokstaver). */
export async function hentProveMedKode(kode: string): Promise<Prove | null> {
  const normalKode = kode.trim().toUpperCase();
  const q = query(collection(db, 'prover'), where('kode', '==', normalKode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<Prove, 'id'>) };
}
