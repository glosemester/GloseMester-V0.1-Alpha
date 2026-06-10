/**
 * Ordanalyse for lærer: hvilke gloser klassen sliter med, basert på beste
 * forsøk per elev (samme grunnlag som klassesnittet). Skjules av forelderen
 * når det ikke finnes svardata (eldre resultater uten svar-rader).
 */
import type { OrdStat } from '../../features/teacher/resultatGruppering';

export function OrdAnalyse({ stats }: { stats: OrdStat[] }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {stats.map((stat) => {
        const vanskelig = stat.feilProsent >= 50;
        return (
          <div key={stat.sporsmal} style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 14 }}>
              <span style={{ fontWeight: 700, color: vanskelig ? 'var(--color-error)' : 'var(--color-text)' }}>
                {stat.sporsmal}
                {stat.fasit && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> → {stat.fasit}</span>}
              </span>
              <span style={{ fontWeight: 700, whiteSpace: 'nowrap', color: vanskelig ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                {stat.antallFeil} av {stat.antallSvar} feil
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
              <div style={{
                height: '100%', width: '100%',
                background: vanskelig ? 'var(--color-error)' : 'var(--color-warning)',
                borderRadius: 999, transform: `scaleX(${stat.feilProsent / 100})`, transformOrigin: 'left',
              }} />
            </div>
            {stat.vanligeFeilsvar.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Vanlige feilsvar: {stat.vanligeFeilsvar.join(', ')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
