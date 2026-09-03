/**
 * Datalag for `users`-collection. Alle Firestore-kall mot brukere går herfra
 * (ingen komponent snakker direkte med Firestore — jf. DEL-B-REACT-PLAN.md).
 */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, limit } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebase';

// 'elev' finnes fortsatt som mulig verdi på gamle Firestore-dokumenter, men
// ingen nye brukerdokumenter kan få denne rollen — elever logger aldri inn.
export type Rolle = 'laerer' | 'admin';

/** En Feide-klasse/gruppe brukeren er medlem av (jf. feide-roles.hentRelevanteGrupper). */
export interface FeideGruppe {
  id: string;
  navn: string;
  type: string;
  /** Feide go_type: 'u'=undervisningsgruppe (fag), 'b'=basisgruppe (klasse), 'a'=årstrinn. */
  go_type?: string;
  undervisning?: boolean;
}

export interface BrukerData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  rolle: Rolle;
  /** Feide-klasser (settes server-side ved Feide-innlogging). */
  feide_grupper?: FeideGruppe[];
  opprettetDato?: unknown;
}

/** Henter brukerdokument, eller oppretter det (standardrolle 'laerer') ved første innlogging. */
export async function hentEllerOpprettBruker(user: User): Promise<BrukerData> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as BrukerData;
  }

  const nyBruker: BrukerData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Lærer',
    photoURL: user.photoURL || null,
    rolle: 'laerer',
  };

  await setDoc(userRef, { ...nyBruker, opprettetDato: serverTimestamp() });
  return nyBruker;
}

export async function hentBrukerData(uid: string): Promise<BrukerData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as BrukerData) : null;
}

/** Setter en brukers rolle (kun mulig for admin, jf. firestore.rules). */
export async function settBrukerRolle(uid: string, rolle: Rolle): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { rolle });
}

/** Brukersammendrag for adminpanel — ingen data om aktivitet. */
export interface AdminBrukerRad {
  uid: string;
  navn: string;
  rolle: string;
  /** 'feide' = logget inn via Feide (har org/klasser); 'annet' = f.eks. Google. */
  kilde: 'feide' | 'annet';
  organisasjon: string; // Navn på skole/kommune (fc:org-gruppe) — kun Feide
  antallKlasser: number;
}

/**
 * Henter alle brukere for adminpanelet — Feide OG Google/annet.
 * Returnerer uid, navn, rolle, innloggingskilde og org/skole der det finnes
 * (kun Feide-brukere har `feide_grupper`) — ingen aktivitetsdata.
 */
export async function hentAlleBrukere(): Promise<AdminBrukerRad[]> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(2000)));
    return snap.docs.map((d): AdminBrukerRad => {
      const data = d.data() as BrukerData & { kilde?: string };
      const grupper = data.feide_grupper ?? [];
      const org = grupper.find((g) => g.type === 'fc:org');
      const klasser = grupper.filter((g) => g.type === 'fc:gogroup');
      return {
        uid: d.id,
        navn: data.displayName || 'Ukjent',
        rolle: data.rolle ?? 'laerer',
        kilde: data.kilde === 'feide' ? 'feide' : 'annet',
        organisasjon: org?.navn ?? '—',
        antallKlasser: klasser.length,
      };
    }).sort((a, b) => a.organisasjon.localeCompare(b.organisasjon) || a.navn.localeCompare(b.navn));
  } catch (e) {
    console.error('hentAlleBrukere feil:', e);
    return [];
  }
}

