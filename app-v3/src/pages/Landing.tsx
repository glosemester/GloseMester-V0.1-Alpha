/**
 * Landingsside (offentlig). Foreløpig en placeholder som beviser ruting +
 * merkevare. Full landingsside portes i fase B3.
 */
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/paths';

export function Landing() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--color-primary)' }}>
        GloseMester
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '40ch' }}>
        Gamifisert språklæring. Fundament for v3 (fase B2) er på plass — ruting,
        state og datalag.
      </p>
      <Link
        to={ROUTES.HJEM}
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-full)',
          padding: 'var(--space-3) var(--space-6)',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Til hjem
      </Link>
    </section>
  );
}
