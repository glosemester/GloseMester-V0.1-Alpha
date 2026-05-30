/**
 * Hjem-side (innlogget). Placeholder som viser at auth-store og rute-vakt
 * virker. Faktisk innhold (fag-valg, snarveier) portes i fase B3.
 */
import { useAuthStore } from '../state/useAuthStore';

export function Hjem() {
  const bruker = useAuthStore((s) => s.bruker);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loggUt = useAuthStore((s) => s.loggUt);

  return (
    <section style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>
        Hei{bruker?.displayName ? `, ${bruker.displayName}` : ''}!
      </h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Innlogget som {firebaseUser?.email ?? 'ukjent'} · rolle: {bruker?.rolle ?? 'ukjent'}
      </p>
      <button
        type="button"
        onClick={() => void loggUt()}
        style={{
          alignSelf: 'flex-start',
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          padding: 'var(--space-2) var(--space-4)',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Logg ut
      </button>
    </section>
  );
}
