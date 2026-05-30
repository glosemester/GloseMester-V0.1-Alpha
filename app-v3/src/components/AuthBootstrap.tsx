/**
 * Kobler Firebase auth-lytteren på én gang for hele appen, og håndterer
 * Feide-redirect (`/?code=...`) ved oppstart. Kalles fra main.tsx.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { handleFeideCallback } from '../lib/auth';
import { toast } from '../state/useToastStore';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  const feideHandlet = useRef(false);

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

    return unsubscribe;
  }, [initAuth]);

  return <>{children}</>;
}
