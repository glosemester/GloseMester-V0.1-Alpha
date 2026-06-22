/**
 * Rute-vakt: sender uinnloggede til landingssiden. Venter til auth-status er
 * avklart (laster) før den redirecter, så vi ikke kaster ut en bruker som
 * faktisk er innlogget mens Firebase initialiseres.
 *
 * Valgfritt `krav` håndhever rolle: en lærer-rute med krav="laerer" sender en
 * elev til /hjem i stedet for å vise lærer-UI. Klient-vakten er første forsvar;
 * firestore.rules håndhever det samme server-side (defense in depth).
 */
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../state/useAuthStore';
import type { Rolle } from '../lib/data/users';
import { ROUTES } from './paths';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Påkrevd rolle. 'laerer' slipper også inn 'admin'. Utelatt = kun innlogging. */
  krav?: Rolle;
}

export function ProtectedRoute({ children, krav }: ProtectedRouteProps) {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const bruker = useAuthStore((s) => s.bruker);
  const laster = useAuthStore((s) => s.laster);

  if (laster) {
    return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;
  }
  if (!firebaseUser) {
    return <Navigate to={ROUTES.LANDING} replace />;
  }
  // Rollekrav: lærer-ruter krever 'laerer' (admin teller som lærer). En elev som
  // navigerer direkte til en lærer-URL sendes til sin egen startside.
  if (krav === 'laerer' && bruker?.rolle !== 'laerer' && bruker?.rolle !== 'admin') {
    return <Navigate to={ROUTES.HJEM} replace />;
  }
  return <>{children}</>;
}
