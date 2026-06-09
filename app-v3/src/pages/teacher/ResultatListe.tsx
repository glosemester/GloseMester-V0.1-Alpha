/**
 * Resultatliste for lærerens prøvedetaljer: én rad per elev (gjester per
 * innlevering), med beste forsøk synlig og alle forsøk + svardetaljer i en
 * ekspanderbar visning.
 */
import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import type { ElevGruppe } from '../../features/teacher/resultatGruppering';
import type { ProveResultat } from '../../lib/data/resultater';

function prosentFarge(prosent: number): string {
  return prosent >= 70 ? 'var(--color-success)' : prosent >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
}

function formaterTid(sekunder: number | null): string | null {
  if (sekunder === null) return null;
  const min = Math.floor(sekunder / 60);
  const sek = sekunder % 60;
  return min > 0 ? `${min} min ${sek} s` : `${sek} s`;
}

export function ResultatListe({ grupper }: { grupper: ElevGruppe[] }) {
  const [apen, setApen] = useState<string | null>(null);

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {grupper.map((g) => {
        const erApen = apen === g.elevId;
        return (
          <div key={g.elevId} style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setApen(erApen ? null : g.elevId)}
              aria-expanded={erApen}
              style={radKnapp}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                {g.elevNavn}
                {g.erGjest && <span style={pille}>Gjest</span>}
                {g.antallForsok > 1 && <span style={pille}>{g.antallForsok} forsøk</span>}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: prosentFarge(g.beste.prosent) }}>
                  {g.beste.prosent}% ({g.beste.poengsum}/{g.beste.maksPoeng})
                </span>
                {erApen
                  ? <ChevronUp size={16} color="var(--color-text-muted)" aria-hidden="true" />
                  : <ChevronDown size={16} color="var(--color-text-muted)" aria-hidden="true" />}
              </span>
            </button>
            {erApen && (
              <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {g.forsok.map((forsok, i) => (
                  <Forsok
                    key={forsok.klient_id ?? i}
                    forsok={forsok}
                    nummer={g.forsok.length - i}
                    antall={g.forsok.length}
                    erBeste={forsok === g.beste}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Forsok({ forsok, nummer, antall, erBeste }: { forsok: ProveResultat; nummer: number; antall: number; erBeste: boolean }) {
  const [visSvar, setVisSvar] = useState(false);
  const dato = forsok.tidspunkt ? new Date(forsok.tidspunkt).toLocaleDateString('no-NO') : null;
  const tid = formaterTid(forsok.tidSekunder);

  return (
    <div style={{ background: 'var(--color-bg, rgba(0,0,0,0.03))', border: '1px solid var(--color-border)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {antall > 1 ? `Forsøk ${nummer} av ${antall}` : 'Forsøk'}
          {erBeste && antall > 1 && <span style={pille}>Beste forsøk</span>}
          {dato && <span>{dato}</span>}
          {tid && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} aria-hidden="true" /> {tid}</span>}
        </span>
        <span style={{ fontWeight: 700, color: prosentFarge(forsok.prosent) }}>{forsok.prosent}%</span>
      </div>
      {forsok.svar.length > 0 && (
        <>
          <button type="button" onClick={() => setVisSvar((v) => !v)} style={visSvarKnapp}>
            {visSvar ? 'Skjul svar' : 'Vis svar'}
          </button>
          {visSvar && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {forsok.svar.map((rad, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  {rad.riktig
                    ? <Check size={14} color="var(--color-success)" aria-label="Riktig" />
                    : <X size={14} color="var(--color-error)" aria-label="Feil" />}
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{rad.sporsmal}</span>
                  <span style={{ color: rad.riktig ? 'var(--color-text-muted)' : 'var(--color-error)' }}>{rad.brukersvar}</span>
                  {!rad.riktig && rad.fasit && (
                    <span style={{ color: 'var(--color-text-muted)' }}>(fasit: {rad.fasit})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const radKnapp: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  width: '100%', padding: '12px 16px', fontSize: 14, background: 'transparent',
  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', textAlign: 'left',
};
const pille: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
  borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 12, fontWeight: 700,
};
const visSvarKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-primary)', border: 'none', padding: 0,
  marginTop: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
