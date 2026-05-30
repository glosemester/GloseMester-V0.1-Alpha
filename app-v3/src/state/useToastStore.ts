/**
 * Toast-store (Zustand) — React-erstatning for v2 sin imperative visToast().
 * Komponenter kaller `toast.success(...)` etc.; <Toaster/> rendrer køen.
 */
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  melding: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  vis: (melding: string, type?: ToastType) => void;
  fjern: (id: number) => void;
}

let nesteId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  vis: (melding, type = 'info') => {
    const id = nesteId++;
    set((s) => ({ toasts: [...s.toasts, { id, melding, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  fjern: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Bekvemmelighets-API som ligner v2 sin visToast. */
export const toast = {
  success: (m: string) => useToastStore.getState().vis(m, 'success'),
  error: (m: string) => useToastStore.getState().vis(m, 'error'),
  info: (m: string) => useToastStore.getState().vis(m, 'info'),
  warning: (m: string) => useToastStore.getState().vis(m, 'warning'),
};
