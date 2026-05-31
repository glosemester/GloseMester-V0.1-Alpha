/**
 * Sjetong-indikator — viser tilgjengelige byttesjetonger, gjennomgående i appen
 * (øve-header, Bytte-side, Min side). `compact` gir en liten pille; full variant
 * viser fremdriftslinje mot neste sjetong.
 *
 * Brand: Coins-ikon (Lucide), korall ved tilgjengelige sjetonger, nøytral ellers.
 */
import { Coins } from 'lucide-react';
import { useTradeStore } from '../state/useTradeStore';

export function TokenBalance({ compact = false }: { compact?: boolean }) {
  const f = useTradeStore((s) => s.fremgang);
  const harSjetong = f.tilgjengelig > 0;

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          background: harSjetong ? 'var(--color-primary-light)' : 'var(--color-surface)',
          border: `1px solid ${harSjetong ? 'var(--color-primary)' : 'var(--color-border)'}`,
          fontWeight: 800, fontSize: 13,
          color: harSjetong ? 'var(--color-primary)' : 'var(--color-text-muted)',
          whiteSpace: 'nowrap', fontFamily: 'var(--font-primary)',
        }}
        title="Byttesjetonger"
      >
        <Coins size={15} strokeWidth={2.5} aria-hidden="true" />
        {f.tilgjengelig}
      </span>
    );
  }

  return (
    <div style={fullKort}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
          <Coins size={22} strokeWidth={2.5} color="var(--color-primary)" aria-hidden="true" />
          {f.tilgjengelig} byttesjetong{f.tilgjengelig === 1 ? '' : 'er'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
          {f.manglerXP} XP til neste
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
        <div style={{ width: `${Math.round(f.pct * 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

const fullKort: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: 16, boxShadow: 'var(--shadow-card)',
  fontFamily: 'var(--font-primary)',
};
