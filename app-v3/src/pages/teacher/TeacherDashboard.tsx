/**
 * Lærer-dashboard — React-port av v2 renderDashboard/renderMyTests.
 * Hilsen + nøkkeltall (antall prøver, gjennomføringer, snitt-%), liste over
 * prøver med søk, og snarvei til å lage ny prøve.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/useAuthStore';
import { useLaererProver } from '../../features/teacher/useLaererProver';
import { TEACHER_ROUTES } from './teacherPaths';

export function TeacherDashboard() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const { prover, laster, totaltGjennomforinger, totaltSnitt } = useLaererProver(firebaseUser?.uid);
  const [sok, setSok] = useState('');

  const filtrert = useMemo(
    () => prover.filter((p) => (p.tittel ?? '').toLowerCase().includes(sok.toLowerCase())),
    [prover, sok],
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 48px' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, var(--color-dark-bg) 0%, #0071e3 100%)',
          color: '#fff', borderRadius: 'var(--radius-lg)', padding: '28px 24px', marginBottom: 20,
        }}
      >
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>
          Hei{bruker?.displayName ? `, ${bruker.displayName}` : ''}! 👋
        </h1>
        <p style={{ opacity: 0.85, marginTop: 6 }}>Velkommen til lærerpanelet</p>
      </header>

      {/* Nøkkeltall */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatKort tall={prover.length} etikett="Prøver" />
        <StatKort tall={totaltGjennomforinger} etikett="Gjennomføringer" />
        <StatKort tall={`${totaltSnitt}%`} etikett="Snitt" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate(TEACHER_ROUTES.CREATE_TEST)} style={primaerKnapp}>
          ✨ Lag ny prøve
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)' }}>Mine prøver</h2>
        {prover.length > 0 && (
          <input value={sok} onChange={(e) => setSok(e.target.value)} placeholder="Søk i prøver…" style={sokInput} />
        )}
      </div>

      {laster ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Laster…</p>
      ) : prover.length === 0 ? (
        <TomTilstand onLag={() => navigate(TEACHER_ROUTES.CREATE_TEST)} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtrert.map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(TEACHER_ROUTES.testDetails(p.id))} style={proveKort}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{p.tittel ?? 'Uten tittel'}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {(p.ordliste?.length ?? 0)} ord · kode {p.kode} · {p.resultater.length} gjennomføringer
                </div>
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
            </button>
          ))}
          {filtrert.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>Ingen prøver matcher søket.</p>}
        </div>
      )}
    </div>
  );
}

function StatKort({ tall, etikett }: { tall: number | string; etikett: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '18px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)' }}>{tall}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{etikett}</div>
    </div>
  );
}

function TomTilstand({ onLag }: { onLag: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>📝</div>
      <h3 style={{ fontWeight: 800 }}>Ingen prøver ennå</h3>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '36ch' }}>Lag din første prøve og del den med klassen via kode eller QR.</p>
      <button type="button" onClick={onLag} style={primaerKnapp}>Lag prøve</button>
    </div>
  );
}

const primaerKnapp: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const sokInput: React.CSSProperties = {
  padding: '8px 14px', fontSize: 14, border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-full)', outline: 'none', fontFamily: 'var(--font-primary)',
};
const proveKort: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: '16px 18px', cursor: 'pointer',
  textAlign: 'left', fontFamily: 'var(--font-primary)', boxShadow: 'var(--shadow-card)',
};
