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
import { cacheHent, cacheSett } from '../nativeCache';

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
  opprettetAvNavn?: string;
  /** Hvor mange dager prøven er tilgjengelig for elevene (1–14). */
  tilgjengeligDager?: number;
  /** Epoch (ms) når prøven slutter å være tilgjengelig. 0/undefined = aldri. */
  utloperDato?: number;
  /** Feide-gruppe-IDer prøven er tildelt — elever i disse gruppene ser den. */
  tildeltGrupper?: string[];
  /** Visningsnavn for de tildelte gruppene (for elevens «Mine prøver»-liste). */
  tildeltGruppeNavn?: string[];
}

/** Standard og grenser for hvor lenge en prøve er tilgjengelig. */
export const MIN_TILGJENGELIG_DAGER = 1;
export const MAX_TILGJENGELIG_DAGER = 14;
export const STANDARD_TILGJENGELIG_DAGER = 7;

/** Er prøven utløpt nå? (utloperDato 0/undefined = aldri utløpt.) */
export function erProveUtloept(prove: Pick<Prove, 'utloperDato'>, naa = Date.now()): boolean {
  return Boolean(prove.utloperDato && prove.utloperDato > 0 && naa >= prove.utloperDato);
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

/**
 * Henter alle prøver opprettet av en lærer (jf. v2 loadTests).
 * #20 Offline-first: skriver hver vellykkede henting til lokal cache, og faller
 * tilbake til siste cachede liste hvis nettverket er nede.
 */
export async function hentLaererProver(uid: string): Promise<Prove[]> {
  const cacheKey = `cache_laererprover_${uid}`;
  try {
    const q = query(collection(db, 'prover'), where('opprettet_av', '==', uid));
    const snap = await getDocs(q);
    const prover = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Prove, 'id'>) }));
    void cacheSett(cacheKey, prover);
    return prover;
  } catch (e) {
    const cachet = await cacheHent<Prove[]>(cacheKey);
    if (cachet) {
      console.warn('Offline — bruker cachede lærerprøver:', e);
      return cachet;
    }
    throw e;
  }
}

export interface NyProve {
  tittel: string;
  ordliste: ProveOrd[];
  bland?: boolean;
  fag?: Fag;
  /** Tilgjengelig i N dager (1–14). Klemmes til gyldig område. */
  tilgjengeligDager?: number;
  /** Feide-gruppe-IDer prøven tildeles. */
  tildeltGrupper?: string[];
  /** Visningsnavn for de tildelte gruppene. */
  tildeltGruppeNavn?: string[];
}

/**
 * Henter ikke-utløpte prøver tildelt en av elevens Feide-grupper (D).
 * array-contains-any tar maks 10 verdier → vi deler opp i chunks og deduper.
 */
export async function hentProverForGrupper(gruppeIds: string[]): Promise<Prove[]> {
  if (!gruppeIds.length) return [];
  const prover: Prove[] = [];
  const sett = new Set<string>();
  for (let i = 0; i < gruppeIds.length; i += 10) {
    const chunk = gruppeIds.slice(i, i + 10);
    try {
      const snap = await getDocs(
        query(collection(db, 'prover'), where('tildeltGrupper', 'array-contains-any', chunk)),
      );
      snap.docs.forEach((d) => {
        if (sett.has(d.id)) return;
        sett.add(d.id);
        prover.push({ id: d.id, ...(d.data() as Omit<Prove, 'id'>) });
      });
    } catch (e) {
      console.warn('hentProverForGrupper chunk feil:', e);
    }
  }
  return prover.filter((p) => !erProveUtloept(p));
}

/** Klem dager til [MIN, MAX] og regn ut utløps-epoch fra et starttidspunkt. */
function regnUtloep(dager: number | undefined, fra = Date.now()): { dager: number; utloperDato: number } {
  const d = Math.min(MAX_TILGJENGELIG_DAGER, Math.max(MIN_TILGJENGELIG_DAGER, Math.round(dager ?? STANDARD_TILGJENGELIG_DAGER)));
  return { dager: d, utloperDato: fra + d * 24 * 60 * 60 * 1000 };
}

/** Oppretter en ny prøve. Returnerer id + generert kode. */
export async function opprettProve(
  data: NyProve,
  laerer: { uid: string; navn: string },
): Promise<{ id: string; kode: string }> {
  const kode = genererProvekode();
  const { dager, utloperDato } = regnUtloep(data.tilgjengeligDager);
  const ref = await addDoc(collection(db, 'prover'), {
    kode,
    fag: data.fag ?? 'gloser',
    tittel: data.tittel,
    ordliste: data.ordliste,
    antallSporsmal: data.ordliste.length,
    tidsbegrensning: 0,
    bland: data.bland ?? true,
    tilgjengeligDager: dager,
    utloperDato,
    tildeltGrupper: data.tildeltGrupper ?? [],
    tildeltGruppeNavn: data.tildeltGruppeNavn ?? [],
    opprettet_av: laerer.uid,
    opprettetAvNavn: laerer.navn,
    opprettetDato: serverTimestamp(),
  });

  // Send push-varsel til elever i tildelte grupper (fire-and-forget).
  if ((data.tildeltGrupper?.length ?? 0) > 0) {
    void fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gruppeIds: data.tildeltGrupper, tittel: data.tittel }),
    }).catch(() => {}); // varselfeil skal ikke blokkere oppretting
  }

  return { id: ref.id, kode };
}

/**
 * Oppdaterer tittel/ordliste/bland for en eksisterende prøve. Hvis
 * tilgjengeligDager sendes, regnes utløp på nytt fra NÅ (lærer forlenger).
 */
export async function oppdaterProve(id: string, data: NyProve): Promise<void> {
  const oppdatering: Record<string, unknown> = {
    tittel: data.tittel,
    ordliste: data.ordliste,
    antallSporsmal: data.ordliste.length,
    bland: data.bland ?? true,
  };
  if (data.tildeltGrupper !== undefined) {
    oppdatering.tildeltGrupper = data.tildeltGrupper;
    oppdatering.tildeltGruppeNavn = data.tildeltGruppeNavn ?? [];
  }
  if (data.tilgjengeligDager !== undefined) {
    const { dager, utloperDato } = regnUtloep(data.tilgjengeligDager);
    oppdatering.tilgjengeligDager = dager;
    oppdatering.utloperDato = utloperDato;
  }
  await updateDoc(doc(db, 'prover', id), oppdatering);
}

export async function slettProve(id: string): Promise<void> {
  await deleteDoc(doc(db, 'prover', id));
}
