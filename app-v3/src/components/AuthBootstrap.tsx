/**
 * Kobler Firebase auth-lytteren på én gang for hele appen, og håndterer
 * Feide-redirect (`/?code=...`) ved oppstart. Kalles fra main.tsx.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { useTradeStore } from '../state/useTradeStore';
import { handleFeideCallback } from '../lib/auth';
import { toast } from '../state/useToastStore';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  const settPendingKode = useTradeStore((s) => s.settPendingKode);
  const feideHandlet = useRef(false);
  const byttHandlet = useRef(false);

  useEffect(() => {
    const unsubscribe = initAuth();

    // Håndter Feide-callback hvis vi kom tilbake med ?code=... (kun én gang).
    if (!feideHandlet.current && new URLSearchParams(window.location.search).has('code')) {
      feideHandlet.current = true;
      void handleFeideCallback().then((res) => {
        if (res.handled && res.success) toast.success('Innlogget med Feide!');
        else if (res.handled) toast.error('Feide-innlogging feilet');
      });
    }

    // Dyplenke til bytte: #bytt=KODE → lagre koden, fjern hash. Bytte-siden
    // (via TradeDeepLink) navigerer dit og åpner svar-modus. Guard mot
    // StrictMode dobbel-mount.
    if (!byttHandlet.current) {
      const m = window.location.hash.match(/#bytt=([A-Z0-9]{4,8})/i);
      if (m) {
        byttHandlet.current = true;
        settPendingKode(m[1].toUpperCase());
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    return unsubscribe;
  }, [initAuth, settPendingKode]);

  return <>{children}</>;
}
