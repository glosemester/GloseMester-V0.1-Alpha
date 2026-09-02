/**
 * Prøvedetaljer — React-port av v2 renderTestDetails/renderTestSuccess.
 * Viser prøvekode + QR (lenke til /prove?kode=), elevresultater, og knapper for
 * å kopiere kode/lenke, redigere og slette prøven.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Link as LinkIcon, Pencil, Trash2, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../../state/useAuthStore';
import { useLaererProver } from '../../features/teacher/useLaererProver';
import { beregnOrdStatistikk } from '../../features/teacher/resultatGruppering';
import { slettProve, erProveUtloept } from '../../lib/data/prover';
import { toast } from '../../state/useToastStore';
import { ROUTES } from '../../routes/paths';
import { TEACHER_ROUTES } from './teacherPaths';
import { ResultatListe } from './ResultatListe';
import { OrdAnalyse } from './OrdAnalyse';

export function TeacherTestDetails() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const { prover, laster, reload } = useLaererProver(firebaseUser?.uid);
  const [sletter, setSletter] = useState(false);

  const prove = prover.find((p) => p.id === testId);

  // Ordanalyse over beste forsøk per elev — tom når ingen svardata finnes (legacy).
  const ordStats = useMemo(
    () => (prove ? beregnOrdStatistikk(prove.grupper, prove) : []),
    [prove],
  );

  const proveLenke = prove ? `${window.location.origin}${ROUTES.QUIZ}?kode=${prove.kode}` : '';

  async function kopier(tekst: string, melding: string) {
    try {
      await navigator.clipboard.writeText(tekst);
      toast.success(melding);
    } catch {
      toast.error('Kunne ikke kopiere.');
    }
  }

  function eksporterCSV() {
    if (!prove) return;

    // Én rad per elev (beste forsøk) + roster-elever som ikke har svart.
    const rader: string[][] = [];
    rader.push(['Elevnavn', 'Prosent', 'Poengsum', 'Maks poeng', 'Antall forsøk', 'Status', 'Tidspunkt']);

    prove.grupper
      .slice()
      .sort((a, b) => a.elevNavn.localeCompare(b.elevNavn))
      .forEach((g) => {
        const dato = g.beste.tidspunkt ? new Date(g.beste.tidspunkt).toLocaleString('no-NO') : '';
        rader.push([
          g.erGjest ? `${g.elevNavn} (gjest)` : g.elevNavn,
          String(g.beste.prosent), String(g.beste.poengsum), String(g.beste.maksPoeng),
          String(g.antallForsok), 'Gjennomført', dato,
        ]);
      });

    const csvInnhold = rader
      .map((rad) => rad.map((felt) => `"${felt.replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['﻿' + csvInnhold, ''], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(prove.tittel ?? 'prove').replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '_')}_resultater.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function slett() {
    if (!prove) return;
    if (!window.confirm(`Slette prøven «${prove.tittel}»? Dette kan ikke angres.`)) return;
    setSletter(true);
    try {
      await slettProve(prove.id);
      toast.success('Prøve slettet.');
      reload();
      navigate(TEACHER_ROUTES.MY_TESTS);
    } catch {
      toast.error('Kunne ikke slette prøven.');
      setSletter(false);
    }
  }

  if (laster) return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;
  if (!prove) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p>Fant ikke prøven.</p>
        <button type="button" onClick={() => navigate(TEACHER_ROUTES.MY_TESTS)} style={primaerKnapp}>Mine prøver</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 48px' }}>
      <button type="button" onClick={() => navigate(TEACHER_ROUTES.MY_TESTS)} style={tilbakeKnapp}>← Mine prøver</button>
      <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)', margin: '16px 0 4px' }}>{prove.tittel}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 12 }}>{prove.ordliste?.length ?? 0} ord</p>

      {/* Kode + QR */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Prøvekode</div>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 4, color: 'var(--color-primary)', margin: '4px 0 16px' }}>{prove.kode}</div>
        <div style={{ display: 'inline-block', background: '#fff', padding: 12, borderRadius: 'var(--radius-md)' }}>
          <QRCodeSVG value={proveLenke} size={160} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 12 }}>Elever scanner QR eller skriver inn koden</p>
        {prove.utloperDato ? (
          erProveUtloept(prove) ? (
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-error)', marginTop: 6 }}>
              Utløpt {new Date(prove.utloperDato).toLocaleDateString('no-NO')} — ikke lenger tilgjengelig.
              Rediger prøven for å forlenge.
            </p>
          ) : (
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-success)', marginTop: 6 }}>
              Tilgjengelig til {new Date(prove.utloperDato).toLocaleDateString('no-NO')}
            </p>
          )
        ) : null}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => kopier(prove.kode, 'Prøvekode kopiert!')} style={sekundaerKnapp}><Copy size={16} aria-hidden="true" /> Kopier kode</button>
          <button type="button" onClick={() => kopier(proveLenke, 'Lenke kopiert!')} style={sekundaerKnapp}><LinkIcon size={16} aria-hidden="true" /> Kopier lenke</button>
        </div>
      </div>

      {/* Handlinger */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate(TEACHER_ROUTES.editTest(prove.id))} style={primaerKnapp}><Pencil size={16} aria-hidden="true" /> Rediger</button>
        {prove.resultater.length > 0 && (
          <button type="button" onClick={eksporterCSV} style={sekundaerKnapp}><Download size={16} aria-hidden="true" /> Eksporter CSV</button>
        )}
        <button type="button" onClick={slett} disabled={sletter} style={slettKnapp}><Trash2 size={16} color="var(--color-error)" aria-hidden="true" /> Slett</button>
      </div>

      {/* Ordanalyse — hvilke gloser klassen sliter med (beste forsøk per elev) */}
      {ordStats.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 4 }}>
            Ordanalyse
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 12 }}>
            Disse glosene sliter klassen mest med
          </p>
          <OrdAnalyse stats={ordStats} />
        </div>
      )}

      {/* Resultater — gruppert per elev, gjester som egne rader */}
      <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>
        Resultater ({prove.grupper.length})
      </h2>
      {prove.grupper.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Ingen resultater ennå. Del prøven med klassen for å samle inn besvarelser.</p>
      ) : (
        <>
          <div style={{ padding: '12px 16px', background: 'var(--color-primary-light)', fontWeight: 700, fontSize: 14, color: 'var(--color-text-muted)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
            Snitt: {prove.snitt}% (beste forsøk)
          </div>
          <ResultatListe grupper={prove.grupper} />
        </>
      )}
    </div>
  );
}

const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const sekundaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const slettKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', color: 'var(--color-error)', border: '2px solid var(--color-error)',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const tilbakeKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-text-muted)', border: 'none',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)', padding: 0,
};
