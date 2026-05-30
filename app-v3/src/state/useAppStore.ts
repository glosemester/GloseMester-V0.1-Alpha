/**
 * App-store (Zustand) — generell app-tilstand som ikke hører til auth.
 * Speiler de øvrige feltene i v2 sitt window.GloseMester.
 */
import { create } from 'zustand';

export type Fag = 'gloser' | 'norsk' | 'matte';
export type AktivRolle = 'elev' | 'laerer' | null;

interface AppState {
  aktivtFag: Fag;
  aktivRolle: AktivRolle;
  setAktivtFag: (fag: Fag) => void;
  setAktivRolle: (rolle: AktivRolle) => void;
}

export const useAppStore = create<AppState>((set) => ({
  aktivtFag: 'gloser',
  aktivRolle: null,
  setAktivtFag: (aktivtFag) => set({ aktivtFag }),
  setAktivRolle: (aktivRolle) => set({ aktivRolle }),
}));
