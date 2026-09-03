/**
 * Trafikk-/aktivitetsdata for adminpanelet. Appen har ingen ekte side-
 * besøksstatistikk (ingen analyseverktøy) — dette er avledet aktivitet fra
 * Firestore: prøver opprettet og besvarelser levert over tid. «Unike aktive
 * lærere» er en tilnærming (distincte eiere av nylig aktivitet), IKKE ekte
 * innloggingsdata — det finnes ingen sist-innlogget-felt i datamodellen.
 */
import { collection, query, where, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

function sidenTidspunkt(dager: number): Timestamp {
  return Timestamp.fromMillis(Date.now() - dager * 24 * 60 * 60 * 1000);
}

/** Antall prøver opprettet siste N dager. */
export async function tellProverSiste(dager: number): Promise<number> {
  const q = query(collection(db, 'prover'), where('opprettetDato', '>=', sidenTidspunkt(dager)));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export interface ResultatTelling {
  totalt: number;
  gjest: number;
  innlogget: number;
}

/** Antall besvarelser levert siste N dager, fordelt på gjest/innlogget. */
export async function tellResultaterSiste(dager: number): Promise<ResultatTelling> {
  const fra = sidenTidspunkt(dager);
  const base = collection(db, 'resultater');
  const [totalt, gjest, innlogget] = await Promise.all([
    getCountFromServer(query(base, where('tidspunkt', '>=', fra))),
    getCountFromServer(query(base, where('tidspunkt', '>=', fra), where('gjest', '==', true))),
    getCountFromServer(query(base, where('tidspunkt', '>=', fra), where('gjest', '==', false))),
  ]);
  return {
    totalt: totalt.data().count,
    gjest: gjest.data().count,
    innlogget: innlogget.data().count,
  };
}

/**
 * Rent hjelp: teller distincte, ikke-tomme uider på tvers av to lister.
 * Trukket ut for testbarhet uten Firestore.
 */
export function tellDistincteUider(...uidLister: (string | null | undefined)[][]): number {
  const uider = new Set<string>();
  for (const liste of uidLister) {
    for (const uid of liste) {
      if (uid) uider.add(uid);
    }
  }
  return uider.size;
}

/**
 * Distincte «eiere» av nylig aktivitet (opprettet_av på prøver, prove_eier på
 * resultater) siste N dager — en tilnærming til «aktive lærere», ikke ekte
 * innloggingsdata. Eneste funksjon her som må hente faktiske dokumenter
 * (avgrenset til tidsvinduet, ikke hele samlingen).
 */
export async function tellUnikeAktiveLaerere(dager: number): Promise<number> {
  const fra = sidenTidspunkt(dager);
  const [proverSnap, resultaterSnap] = await Promise.all([
    getDocs(query(collection(db, 'prover'), where('opprettetDato', '>=', fra))),
    getDocs(query(collection(db, 'resultater'), where('tidspunkt', '>=', fra))),
  ]);
  const proverUider = proverSnap.docs.map((d) => d.data().opprettet_av as string | null | undefined);
  const resultaterUider = resultaterSnap.docs.map((d) => d.data().prove_eier as string | null | undefined);
  return tellDistincteUider(proverUider, resultaterUider);
}
