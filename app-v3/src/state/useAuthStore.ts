/**
 * Auth-store (Zustand) — erstatter v2 sitt window.GloseMester.bruker /
 * window.MesterSuite-alias. Eneste kilde til sannhet for innlogget bruker.
 *
 * initAuth() kobler på Firebase onAuthStateChanged én gang (kalles fra main.tsx),
 * laster brukerdata fra Firestore og oppdaterer storage-token slik at lokal
 * data namespaces på UID.
 */
import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { hentEllerOpprettBruker, type BrukerData } from '../lib/data/users';
import { erFeidebruker } from '../lib/tilgang';
import { redirectTilFeideLogout } from '../lib/auth';
import { setUserToken } from '../lib/storage';

interface AuthState {
  /** Firebase auth-bruker (uid, email, ...). */
  firebaseUser: User | null;
  /** Beriket brukerdokument fra Firestore (rolle, Feide-klasser, ...). */
  bruker: BrukerData | null;
  /** True til første onAuthStateChanged-callback har kjørt. */
  laster: boolean;
  initAuth: () => () => void;
  loggUt: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  bruker: null,
  laster: true,

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserToken(user.uid);
        let bruker: BrukerData | null = null;
        try {
          bruker = await hentEllerOpprettBruker(user);
        } catch (error) {
          console.error('Kunne ikke laste brukerdata:', error);
        }
        set({ firebaseUser: user, bruker, laster: false });
      } else {
        setUserToken(null);
        set({ firebaseUser: null, bruker: null, laster: false });
      }
    });
    return unsubscribe;
  },

  loggUt: async () => {
    // Fang innloggingskilde FØR signOut nullstiller bruker-doc-en.
    const brukerVarFeide = erFeidebruker(useAuthStore.getState().bruker);
    // 1. Drep lokal Firebase-sesjon (jf. Feide-docs: kill local session first).
    await signOut(auth);
    // 2. Feide-brukere: kjed til Feide SLO så SSO-sesjonen faktisk tømmes.
    //    Kritisk på delte skole-PC-er — ellers arver neste bruker innloggingen.
    //    Full sidenavigasjon; resten kjører ikke videre.
    if (brukerVarFeide) {
      redirectTilFeideLogout();
    }
  },
}));
