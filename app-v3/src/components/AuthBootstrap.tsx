/**
 * Kobler Firebase auth-lytteren på én gang for hele appen (kalles fra main.tsx).
 */
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../state/useAuthStore';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => initAuth(), [initAuth]);
  return <>{children}</>;
}
