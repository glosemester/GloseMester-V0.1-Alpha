/**
 * Rute-vakt: sender uinnloggede til landingssiden. Venter til auth-status er
 * avklart (laster) før den redirecter, så vi ikke kaster ut en bruker som
 * faktisk er innlogget mens Firebase initialiseres.
 */
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../state/useAuthStore';
import { ROUTES } from './paths';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const laster = useAuthStore((s) => s.laster);

  if (laster) {
    return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;
  }
  if (!firebaseUser) {
    return <Navigate to={ROUTES.LANDING} replace />;
  }
  return <>{children}</>;
}
