/**
 * Lærer-dashboard — React-port av v2 renderDashboard/renderMyTests.
 * Hilsen + nøkkeltall (antall prøver, gjennomføringer, snitt-%), liste over
 * prøver med søk, og snarvei til å lage ny prøve.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Users, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../state/useAuthStore';
import { useLaererProver } from '../../features/teacher/useLaererProver';
import { kunKlasser } from '../../features/teacher/feideKlasser';
import { SkeletonKort } from '../../components/Skeleton';
import { TEACHER_ROUTES } from './teacherPaths';
import {
  beregnOnboardingSteg,
  alleStegFullfort,
  nesteSteg,
  type OnboardingSteg,
} from '../../features/teacher/onboardingSteg';

export function TeacherDashboard() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const { prover, laster, totaltGjennomforinger, totaltSnitt } = useLaererProver(firebaseUser?.uid);
  const [sok, setSok] = useState('');
  // Kun ekte klasser (fc:gogroup) — ikke org-nivå (skole/kommune). Jf. kunKlasser.
  const klasser = kunKlasser(bruker?.feide_grupper);

  const filtrert = useMemo(
    () => prover.filter((p) => (p.tittel ?? '').toLowerCase().includes(sok.toLowerCase())),
    [prover, sok],
  );

  // «Kom i gang»-sjekkliste — vises til læreren har fullført alle stegene.
  const onboardingSteg = useMemo(() => {
    const antallTildelte = prover.filter((p) => (p.tildeltGruppeNavn ?? []).length > 0).length;
    return beregnOnboardingSteg({
      antallProver: prover.length,
      antallTildelte,
      totaltGjennomforinger: totaltGjennomforinger,
    });
  }, [prover, totaltGjennomforinger]);
  const visKomIGang = !laster && !alleStegFullfort(onboardingSteg);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 48px' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, var(--color-dark-bg) 0%, var(--color-secondary) 100%)',
          color: '#fff', borderRadius: 'var(--radius-lg)', padding: '28px 24px', marginBottom: 20,
        }}
      >
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>
          Hei{bruker?.displayName ? `, ${bruker.displayName}` : ''}!
        </h1>
        <p style={{ opacity: 0.85, marginTop: 6 }}>Velkommen til lærerpanelet</p>
      </header>

      {/* Nøkkeltall */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatKort tall={prover.length} etikett="Prøver" />
        <StatKort tall={totaltGjennomforinger} etikett="Elever gjennomført" />
        <StatKort tall={`${totaltSnitt}%`} etikett="Snitt" />
      </div>

      {visKomIGang && (
        <KomIGang steg={onboardingSteg} onLag={() => navigate(TEACHER_ROUTES.CREATE_TEST)} />
      )}

      {/* Dine Feide-klasser — bekrefter at klassene ble fanget ved innlogging,
          og er gruppene du kan tildele prøver til. */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={15} aria-hidden="true" /> Dine klasser
        </div>
        {klasser.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {klasser.map((k) => <span key={k.id} style={klassePille}>{k.navn}</span>)}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Ingen Feide-klasser funnet. Logg inn med Feide for å hente klassene dine og tildele prøver til dem.
          </p>
        )}
      </div>

      {/* MIDLERTIDIG Feide-diagnose — kun for eier-UID, fjernes etter feilsøking.
          Viser de rå lagrede feide_grupper (alle typer) for å avgjøre om skolen
          (fc:org) er lagret (= groups-edu-konfig mangler) eller om lista er tom
          (= groups-API-kallet feilet). */}
      {bruker?.uid === 'feide_7ea12b17-83dd-43a3-aac4-f1f1bfed6723' && (
        <pre
          style={{
            fontSize: 11, lineHeight: 1.5, background: '#fff4e6',
            border: '1px dashed var(--color-primary)', borderRadius: 8,
            padding: 12, marginBottom: 20, overflowX: 'auto', whiteSpace: 'pre-wrap',
          }}
        >
          {[
            '🔧 Feide-diagnose (midlertidig)',
            `feide_grupper: ${bruker.feide_grupper === undefined ? 'undefined (ikke lagret)' : `${bruker.feide_grupper.length} stk`}`,
            ...(bruker.feide_grupper ?? []).map(
              (g) => `  • ${g.navn} — type=${g.type}${g.go_type ? ` go_type=${g.go_type}` : ''}`,
            ),
          ].join('\n')}
        </pre>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate(TEACHER_ROUTES.CREATE_TEST)} style={primaerKnapp}>
          <Sparkles size={16} aria-hidden="true" /> Lag ny prøve
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)' }}>Mine prøver</h2>
        {prover.length > 0 && (
          <input value={sok} onChange={(e) => setSok(e.target.value)} placeholder="Søk i prøver…" style={sokInput} />
        )}
      </div>

      {laster ? (
        /* #18 Skeleton-skjerm i stedet for blank/spinner mens prøvene lastes. */
        <div style={{ display: 'grid', gap: 12 }}>
          <SkeletonKort />
          <SkeletonKort />
          <SkeletonKort />
        </div>
      ) : prover.length === 0 ? (
        <TomTilstand onLag={() => navigate(TEACHER_ROUTES.CREATE_TEST)} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtrert.map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(TEACHER_ROUTES.testDetails(p.id))} style={proveKort}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{p.tittel ?? 'Uten tittel'}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {(p.ordliste?.length ?? 0)} ord · kode {p.kode} · {p.grupper.length} har gjennomført
                </div>
                {(p.tildeltGruppeNavn ?? []).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-primary)', fontWeight: 700, marginTop: 6 }}>
                    <Users size={13} aria-hidden="true" /> {(p.tildeltGruppeNavn ?? []).join(', ')}
                  </div>
                )}
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

function KomIGang({ steg, onLag }: { steg: OnboardingSteg[]; onLag: () => void }) {
  const antallFullfort = steg.filter((s) => s.fullfort).length;
  const nesteIdx = nesteSteg(steg);

  return (
    <section
      aria-label="Kom i gang"
      style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 22px', marginBottom: 24,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)' }}>Kom i gang</h2>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
          {antallFullfort} av {steg.length} fullført
        </span>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
        {steg.map((s, i) => (
          <li key={s.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {s.fullfort ? (
              <CheckCircle2 size={26} color="var(--color-primary)" aria-hidden="true" style={{ flexShrink: 0 }} />
            ) : (
              <span style={stegNummer} aria-hidden="true">{i + 1}</span>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: s.fullfort ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: s.fullfort ? 'line-through' : 'none' }}>
                {s.tittel}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{s.beskrivelse}</div>
              {i === nesteIdx && s.id === 'lag' && (
                <button type="button" onClick={onLag} style={{ ...primaerKnapp, marginTop: 10 }}>
                  <Sparkles size={16} aria-hidden="true" /> Lag prøve
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TomTilstand({ onLag }: { onLag: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <FileText size={48} color="var(--color-primary)" aria-hidden="true" />
      <h3 style={{ fontWeight: 800 }}>Ingen prøver ennå</h3>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '36ch' }}>Lag din første prøve og del den med klassen via kode eller QR.</p>
      <button type="button" onClick={onLag} style={primaerKnapp}>Lag prøve</button>
    </div>
  );
}

const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
const stegNummer: React.CSSProperties = {
  flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: 14,
};
const klassePille: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
  borderRadius: 'var(--radius-full)', padding: '4px 14px', fontSize: 13, fontWeight: 700,
};
