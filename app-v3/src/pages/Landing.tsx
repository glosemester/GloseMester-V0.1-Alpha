/**
 * Landingsside med innlogging (Feide + Google). Innloggede brukere sendes til
 * /hjem. Full markedsførings-landingsside portes senere; her er fokus B3:
 * fungerende auth mot uendret server-oppsett.
 */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { startFeideLogin, loggInnMedGoogle } from '../lib/auth';
import { useAuthStore } from '../state/useAuthStore';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

export function Landing() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const laster = useAuthStore((s) => s.laster);
  const [googleLaster, setGoogleLaster] = useState(false);

  // Allerede innlogget → rett til hjem.
  if (!laster && firebaseUser) {
    return <Navigate to={ROUTES.HJEM} replace />;
  }

  async function handleGoogle() {
    setGoogleLaster(true);
    const res = await loggInnMedGoogle();
    if (!res.success) toast.error('Google-innlogging feilet');
    setGoogleLaster(false);
  }

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--color-primary)' }}>
          GloseMester
        </h1>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '42ch' }}>
          Gjør glosepugging om til en skattejakt. Logg inn for å komme i gang.
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          width: '100%',
          maxWidth: '320px',
        }}
      >
        <Button variant="primary" onClick={startFeideLogin} style={{ width: '100%' }}>
          Logg inn med Feide
        </Button>
        <Button
          variant="secondary"
          onClick={handleGoogle}
          disabled={googleLaster}
          style={{ width: '100%' }}
        >
          {googleLaster ? 'Logger inn…' : 'Logg inn med Google'}
        </Button>
      </div>
    </section>
  );
}
