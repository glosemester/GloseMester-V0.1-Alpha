/** Delt statistikk-kort for adminpanelets faner (Kontoer + Trafikk). */
export function StatKort({ tall, etikett }: { tall: number | string; etikett: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '18px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)' }}>{tall}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{etikett}</div>
    </div>
  );
}
