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
import { setUserToken } from '../lib/storage';

interface AuthState {
  /** Firebase auth-bruker (uid, email, ...). */
  firebaseUser: User | null;
  /** Beriket brukerdokument fra Firestore (rolle, abonnement, ...). */
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
    await signOut(auth);
  },
}));
