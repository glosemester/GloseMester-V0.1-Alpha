/**
 * Datalag for `prover`-collection (lærerens prøver). Elev henter en prøve via
 * 6-tegns kode; lærer oppretter/redigerer/sletter. Portet fra v2 quiz-engine
 * (hentProveMedKode) og teacher-module (loadTests/handleCreate/Edit/Delete).
 */
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const KODE_TEGN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Genererer en 6-tegns prøvekode (jf. v2 _generateCode). rng injiserbar for test. */
export function genererProvekode(rng: () => number = Math.random): string {
  return Array.from({ length: 6 }, () => KODE_TEGN[Math.floor(rng() * KODE_TEGN.length)]).join('');
}

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
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Prove, 'id'>) };
}

/** Henter alle prøver opprettet av en lærer (jf. v2 loadTests). */
export async function hentLaererProver(uid: string): Promise<Prove[]> {
  const q = query(collection(db, 'prover'), where('opprettet_av', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Prove, 'id'>) }));
}

export interface NyProve {
  tittel: string;
  ordliste: ProveOrd[];
  bland?: boolean;
  fag?: Fag;
}

/** Oppretter en ny prøve. Returnerer id + generert kode. */
export async function opprettProve(
  data: NyProve,
  laerer: { uid: string; navn: string },
): Promise<{ id: string; kode: string }> {
  const kode = genererProvekode();
  const ref = await addDoc(collection(db, 'prover'), {
    kode,
    fag: data.fag ?? 'gloser',
    tittel: data.tittel,
    ordliste: data.ordliste,
    antallSporsmal: data.ordliste.length,
    tidsbegrensning: 0,
    bland: data.bland ?? true,
    opprettet_av: laerer.uid,
    opprettetAvNavn: laerer.navn,
    opprettetDato: serverTimestamp(),
  });
  return { id: ref.id, kode };
}

/** Oppdaterer tittel/ordliste/bland for en eksisterende prøve. */
export async function oppdaterProve(id: string, data: NyProve): Promise<void> {
  await updateDoc(doc(db, 'prover', id), {
    tittel: data.tittel,
    ordliste: data.ordliste,
    antallSporsmal: data.ordliste.length,
    bland: data.bland ?? true,
  });
}

export async function slettProve(id: string): Promise<void> {
  await deleteDoc(doc(db, 'prover', id));
}
