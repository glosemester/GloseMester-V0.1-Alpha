/**
 * UI-store (Zustand) — flyktig grensesnitt-tilstand som ikke hører hjemme i
 * en enkelt side. Foreløpig kun «skjul bunnmeny», som øve-økten slår på mens
 * eleven svarer på et spørsmål (jf. bug 3 — bunnmenyen dekket 4. svaralternativ).
 */
import { create } from 'zustand';

interface UiState {
  /** Når sann skjules den globale bunnmenyen (TabBar) selv på elev-ruter. */
  bunnmenySkjult: boolean;
  setBunnmenySkjult: (skjult: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  bunnmenySkjult: false,
  setBunnmenySkjult: (bunnmenySkjult) => set({ bunnmenySkjult }),
}));
