/**
 * Datalag for `users`-collection. Alle Firestore-kall mot brukere går herfra
 * (ingen komponent snakker direkte med Firestore — jf. DEL-B-REACT-PLAN.md).
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebase';

export type Rolle = 'laerer' | 'elev' | 'admin';

export interface Abonnement {
  type: 'free' | 'premium' | 'skole' | 'skolepakke';
}

/** En Feide-klasse/gruppe brukeren er medlem av (jf. feide-roles.hentRelevanteGrupper). */
export interface FeideGruppe {
  id: string;
  navn: string;
  type: string;
  undervisning?: boolean;
}

export interface BrukerData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  rolle: Rolle;
  abonnement: Abonnement;
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
    abonnement: { type: 'free' },
  };

  await setDoc(userRef, { ...nyBruker, opprettetDato: serverTimestamp() });
  return nyBruker;
}

export async function hentBrukerData(uid: string): Promise<BrukerData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as BrukerData) : null;
}
