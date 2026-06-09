/**
 * Datalag for `resultater`-collection. Elevens prøveresultat sendes (anonymt
 * eller med navn/uid) til lærer. Portet fra v2 quiz-engine lagreResultat.
 *
 * Lagringen er delt i ren dokumentbygging (byggResultatDokument) og selve
 * sendingen (lagreResultatDokument) slik at offline-køen kan fryse et ferdig
 * dokument og sende det idempotent senere.
 */
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Prove } from './prover';

export interface SvarRad {
  sporsmal: string;
  brukersvar: string;
  /** Riktig svar — for elevens svargjennomgang og lærerens ordanalyse. Mangler i eldre dokumenter. */
  fasit?: string;
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

/** Ferdig utfylt resultatdokument — alt unntatt server-tidsstempelet. */
export interface ResultatDokument {
  prove_id: string;
  kode: string;
  tittel: string;
  fag: string;
  elev_id: string;
  elevNavn: string | null;
  /** true når eleven ikke var innlogget (elev_id er da en tilfeldig UUID). */
  gjest: boolean;
  prove_eier: string | null;
  poengsum: number;
  maksPoeng: number;
  prosent: number;
  svar: SvarRad[];
  tidSekunder: number;
  /** Idempotensnøkkel satt av klienten — gjør kø-retries og dobbelklikk ufarlige. */
  klient_id: string;
  /** Når prøven ble fullført på enheten (epoch ms) — tidspunkt settes først ved sending. */
  klientTidspunkt: number;
}

/** Bygger resultatdokumentet (rent — ingen Firestore-kall). */
export function byggResultatDokument(input: ResultatInput, naa = Date.now()): ResultatDokument {
  const { prove, riktige, totalt, prosent, svar, tidSekunder, elevNavn = null, elevUid = null } = input;
  return {
    prove_id: prove.id,
    kode: prove.kode,
    tittel: prove.tittel ?? '',
    fag: prove.fag ?? 'ukjent',
    elev_id: elevUid ?? crypto.randomUUID(),
    elevNavn,
    gjest: !elevUid,
    prove_eier: prove.opprettet_av ?? null,
    poengsum: riktige,
    maksPoeng: totalt,
    prosent,
    svar,
    tidSekunder,
    klient_id: crypto.randomUUID(),
    klientTidspunkt: naa,
  };
}

/** Sender et ferdig bygget resultatdokument til Firestore. */
export async function lagreResultatDokument(dok: ResultatDokument): Promise<void> {
  await addDoc(collection(db, 'resultater'), { ...dok, tidspunkt: serverTimestamp() });
}

/** Lagrer prøveresultat til Firestore. */
export async function lagreResultat(input: ResultatInput): Promise<void> {
  await lagreResultatDokument(byggResultatDokument(input));
}

/** Prøve-IDer eleven har gjennomført (for «Mine prøver»-statusen). */
export async function hentGjennomforteProveIder(elevUid: string): Promise<Set<string>> {
  const snap = await getDocs(query(collection(db, 'resultater'), where('elev_id', '==', elevUid)));
  return new Set(snap.docs.map((d) => String(d.data().prove_id)));
}

export interface ProveResultat {
  prove_id: string;
  elev_id: string;
  elevNavn: string;
  gjest: boolean;
  prosent: number;
  poengsum: number;
  maksPoeng: number;
  svar: SvarRad[];
  tidSekunder: number | null;
  klient_id: string | null;
  tidspunkt: string | null;
}

/**
 * Henter alle resultater for prøver læreren eier. Én spørring på prove_eier —
 * den er også bevisbar under sikkerhetsregelen som begrenser lesing til
 * prøveeier/elev (en `prove_id in [...]`-spørring ville blitt avvist).
 */
export async function hentResultaterForLaerer(uid: string): Promise<ProveResultat[]> {
  const snap = await getDocs(query(collection(db, 'resultater'), where('prove_eier', '==', uid)));
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      prove_id: r.prove_id,
      elev_id: r.elev_id ?? '',
      elevNavn: r.elevNavn || 'Anonym',
      gjest: r.gjest === true,
      prosent: r.prosent ?? 0,
      poengsum: r.poengsum ?? 0,
      maksPoeng: r.maksPoeng ?? 0,
      svar: Array.isArray(r.svar) ? r.svar : [],
      tidSekunder: typeof r.tidSekunder === 'number' ? r.tidSekunder : null,
      klient_id: r.klient_id ?? null,
      tidspunkt: r.tidspunkt?.toDate?.()?.toISOString() ?? null,
    };
  });
}
