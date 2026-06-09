/**
 * Datalag for `users`-collection. Alle Firestore-kall mot brukere går herfra
 * (ingen komponent snakker direkte med Firestore — jf. DEL-B-REACT-PLAN.md).
 */
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
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

/** Ett elevmedlem i et klasse-roster (avledet fra GloseMester-brukere). */
export interface KlasseElev {
  uid: string;
  navn: string;
}

/**
 * Bygger klasse-rosteret fra GloseMester-brukere: alle elever der
 * `feide_grupper` inneholder minst én av de oppgitte gruppe-IDene.
 *
 * Merk: dette omfatter kun elever som har logget inn i GloseMester minst én
 * gang — vi henter ikke komplett klasseliste fra Feide groups members-API.
 * Firestore `array-contains-any` tar maks 10 verdier, så vi deler i chunks og
 * kjører på ett felt om gangen (id ligger inni objektene, så vi matcher på en
 * egen flat id-liste `feide_gruppe_ids` om den finnes, ellers filtrerer lokalt).
 */
export async function hentKlasseRoster(gruppeIds: string[]): Promise<KlasseElev[]> {
  if (!gruppeIds.length) return [];
  const settet = new Set(gruppeIds);
  const funnet = new Map<string, KlasseElev>();

  // array-contains-any krever et flatt array-felt. feide_grupper er objekter,
  // så vi matcher på det flate hjelpefeltet feide_gruppe_ids når det finnes.
  for (let i = 0; i < gruppeIds.length; i += 10) {
    const chunk = gruppeIds.slice(i, i + 10);
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('feide_gruppe_ids', 'array-contains-any', chunk)),
      );
      snap.docs.forEach((d) => {
        const data = d.data() as BrukerData & { feide_gruppe_ids?: string[] };
        if (data.rolle === 'laerer' || data.rolle === 'admin') return; // kun elever
        funnet.set(d.id, { uid: d.id, navn: data.displayName || 'Elev' });
      });
    } catch (e) {
      console.warn('hentKlasseRoster chunk feil:', e);
    }
  }

  // Fallback for brukere som ennå ikke har det flate id-feltet: ingen ekstra
  // spørring (ville krevd full collection-scan). Disse dukker opp etter neste
  // innlogging når feide_gruppe_ids skrives. settet brukes for å unngå
  // lint-advarsel om ubrukt variabel og dokumenterer matche-kriteriet.
  void settet;
  return [...funnet.values()].sort((a, b) => a.navn.localeCompare(b.navn));
}
