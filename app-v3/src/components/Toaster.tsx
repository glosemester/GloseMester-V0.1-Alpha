/**
 * Toast-visning. Monteres én gang i app-roten; leser køen fra useToastStore.
 * Farger kommer fra de semantiske tokenene i tokens.css.
 */
import { useToastStore, type ToastType } from '../state/useToastStore';

const farge: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const fjern = useToastStore((s) => s.fjern);

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => fjern(t.id)}
          style={{
            background: farge[t.type],
            color: '#fff',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            maxWidth: '320px',
          }}
        >
          {t.melding}
        </div>
      ))}
    </div>
  );
}
