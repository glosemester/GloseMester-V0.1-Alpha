/**
 * «Mine prøver» (elev) — viser prøver læreren har tildelt en av elevens
 * Feide-klasser, med status for hvilke eleven IKKE har gjennomført ennå (D).
 *
 * Match skjer på Feide-gruppe-ID: prøver med `tildeltGrupper` som overlapper
 * elevens `feide_grupper` hentes, og kryssjekkes mot elevens resultater.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, Circle, Rocket, Users, Clock } from 'lucide-react';
import { hentProverForGrupper, type Prove } from '../lib/data/prover';
import { hentGjennomforteProveIder } from '../lib/data/resultater';
import { useAuthStore } from '../state/useAuthStore';
import { ROUTES } from '../routes/paths';

export function MineProver() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const uid = useAuthStore((s) => s.firebaseUser?.uid);

  const gruppeIds = useMemo(() => (bruker?.feide_grupper ?? []).map((g) => g.id), [bruker]);
  const harGrupper = gruppeIds.length > 0;

  const [prover, setProver] = useState<Prove[]>([]);
  const [gjennomfort, setGjennomfort] = useState<Set<string>>(new Set());
  const [laster, setLaster] = useState(true);

  useEffect(() => {
    let avbrutt = false;
    async function last() {
      setLaster(true);
      try {
        const [liste, gjort] = await Promise.all([
          hentProverForGrupper(gruppeIds),
          uid ? hentGjennomforteProveIder(uid) : Promise.resolve(new Set<string>()),
        ]);
        if (avbrutt) return;
        // Ikke-gjennomførte øverst, deretter gjennomførte.
        liste.sort((a, b) => Number(gjort.has(a.id)) - Number(gjort.has(b.id)));
        setProver(liste);
        setGjennomfort(gjort);
      } catch (e) {
        console.warn('Kunne ikke laste tildelte prøver:', e);
      } finally {
        if (!avbrutt) setLaster(false);
      }
    }
    if (harGrupper) void last();
    else setLaster(false);
    return () => { avbrutt = true; };
  }, [gruppeIds, harGrupper, uid]);

  const antallUgjort = prover.filter((p) => !gjennomfort.has(p.id)).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={28} color="var(--color-primary)" aria-hidden="true" /> Mine prøver
        </h1>
        {harGrupper && !laster && (
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6 }}>
            {antallUgjort > 0 ? `Du har ${antallUgjort} prøve${antallUgjort === 1 ? '' : 'r'} igjen å ta.` : 'Du er à jour — alt er gjennomført! 🎉'}
          </p>
        )}
      </header>

      {!harGrupper ? (
        <TomBoks
          ikon={<Users size={48} color="var(--color-primary)" aria-hidden="true" />}
          tittel="Ingen klasse funnet"
          tekst="Logg inn med Feide for å se prøvene klassen din har fått tildelt."
        />
      ) : laster ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Laster prøver…</p>
      ) : prover.length === 0 ? (
        <TomBoks
          ikon={<FileText size={48} color="var(--color-primary)" aria-hidden="true" />}
          tittel="Ingen tildelte prøver"
          tekst="Læreren din har ikke tildelt klassen noen prøver ennå. Du kan fortsatt ta en prøve med kode."
          knapp={{ tekst: 'Ta prøve med kode', rute: ROUTES.QUIZ }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {prover.map((p) => {
            const gjort = gjennomfort.has(p.id);
            return (
              <div key={p.id} style={kort}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{p.tittel ?? 'Prøve'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
                    {(p.tildeltGruppeNavn ?? []).length > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Users size={14} aria-hidden="true" /> {(p.tildeltGruppeNavn ?? []).join(', ')}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: gjort ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                      {gjort ? <><CheckCircle2 size={14} aria-hidden="true" /> Gjennomført</> : <><Circle size={14} aria-hidden="true" /> Ikke gjennomført</>}
                    </span>
                    {p.utloperDato ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} aria-hidden="true" /> Frist {new Date(p.utloperDato).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`${ROUTES.QUIZ}?kode=${encodeURIComponent(p.kode)}`)}
                  style={gjort ? sekundaerKnapp : primaerKnapp}
                >
                  {gjort ? 'Ta på nytt' : <><Rocket size={16} aria-hidden="true" /> Ta prøven</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TomBoks({ ikon, tittel, tekst, knapp }: { ikon: React.ReactNode; tittel: string; tekst: string; knapp?: { tekst: string; rute: string } }) {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {ikon}
      <h2 style={{ fontWeight: 800 }}>{tittel}</h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '40ch' }}>{tekst}</p>
      {knapp && (
        <button type="button" onClick={() => navigate(knapp.rute)} style={primaerKnapp}>{knapp.tekst}</button>
      )}
    </div>
  );
}

const kort: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-card)',
};
const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '10px 18px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const sekundaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
  background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-full)', padding: '10px 18px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
