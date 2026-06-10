/**
 * Kobler Firebase auth-lytteren på én gang for hele appen, og håndterer
 * Feide-redirect (`/?code=...`) ved oppstart. Kalles fra main.tsx.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { useTradeStore } from '../state/useTradeStore';
import { handleFeideCallback } from '../lib/auth';
import { provSendResultatKo } from '../lib/data/resultatKo';
import { toast } from '../state/useToastStore';

/** Tøm offline-køen med prøveresultater og si fra når noe faktisk ble sendt. */
async function sendKoedeResultater() {
  const { sendt } = await provSendResultatKo();
  if (sendt > 0) {
    toast.success(sendt === 1 ? '1 prøveresultat sendt til læreren.' : `${sendt} prøveresultater sendt til læreren.`);
  }
}

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  const settPendingKode = useTradeStore((s) => s.settPendingKode);
  const feideHandlet = useRef(false);
  const byttHandlet = useRef(false);
  // Vis loading-overlay mens Feide-callback behandles (kan ta 2-4 sek).
  const [feideLaster, setFeideLaster] = useState(() =>
    new URLSearchParams(window.location.search).has('code'),
  );

  useEffect(() => {
    const unsubscribe = initAuth();

    const sokeParams = new URLSearchParams(window.location.search);
    if (!feideHandlet.current && (sokeParams.has('code') || sokeParams.has('error'))) {
      feideHandlet.current = true;
      void handleFeideCallback().then((res) => {
        setFeideLaster(false);
        if (res.handled && res.success) toast.success('Innlogget med Feide!');
        else if (res.handled) toast.error(`Feide-innlogging feilet: ${res.error ?? 'ukjent'}`);
      });
    }

    if (!byttHandlet.current) {
      const m = window.location.hash.match(/#bytt=([A-Z0-9]{4,8})/i);
      if (m) {
        byttHandlet.current = true;
        settPendingKode(m[1].toUpperCase());
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    // Prøveresultater som ble køet offline: prøv ved oppstart og når nettet kommer tilbake.
    void sendKoedeResultater();
    const vedOnline = () => void sendKoedeResultater();
    window.addEventListener('online', vedOnline);

    return () => {
      window.removeEventListener('online', vedOnline);
      unsubscribe();
    };
  }, [initAuth, settPendingKode]);

  return (
    <>
      {feideLaster && <FeideLoadingOverlay />}
      {children}
    </>
  );
}

function FeideLoadingOverlay() {
  return (
    <div
      role="status"
      aria-label="Logger inn med Feide"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(255,255,255,0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        {/* Ytre ring — spinner */}
        <svg width={72} height={72} viewBox="0 0 72 72" aria-hidden="true" style={{ animation: 'feideSpinn 1.1s linear infinite', position: 'absolute', inset: 0 }}>
          <circle cx={36} cy={36} r={30} fill="none" stroke="var(--color-primary)" strokeWidth={5} strokeLinecap="round" strokeDasharray="94 100" />
        </svg>
        {/* Feide-logo (F) i midten */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'var(--font-primary)',
        }}>
          F
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>
        Logger inn med Feide…
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        Henter klasser og brukerinfo
      </div>
      <style>{`
        @keyframes feideSpinn { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
