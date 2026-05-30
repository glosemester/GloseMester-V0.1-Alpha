/**
 * Lag/rediger prøve — React-port av v2 renderCreateTest/handleCreate/handleEdit.
 * Tittel + dynamisk liste av glose-par (norsk/engelsk). Minst 4 par kreves.
 * Ved oppretting genereres en kode og brukeren sendes til prøvedetaljer.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { opprettProve, oppdaterProve, type ProveOrd } from '../../lib/data/prover';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from '../../state/useToastStore';
import { useLaererProver } from '../../features/teacher/useLaererProver';
import { TEACHER_ROUTES } from './teacherPaths';

const MIN_PAR = 4;

interface Rad {
  s: string;
  e: string;
}

export function TeacherCreateTest() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const bruker = useAuthStore((s) => s.bruker);
  const { prover } = useLaererProver(firebaseUser?.uid);

  const eksisterende = testId ? prover.find((p) => p.id === testId) : undefined;

  const [tittel, setTittel] = useState(eksisterende?.tittel ?? '');
  const [bland, setBland] = useState(true);
  const [rader, setRader] = useState<Rad[]>(() => {
    const fra = eksisterende?.ordliste;
    if (fra && fra.length) return fra.map((o) => ({ s: o.s, e: o.e }));
    return [{ s: '', e: '' }, { s: '', e: '' }, { s: '', e: '' }, { s: '', e: '' }];
  });
  const [lagrer, setLagrer] = useState(false);

  function settRad(i: number, felt: 's' | 'e', verdi: string) {
    setRader((r) => r.map((rad, idx) => (idx === i ? { ...rad, [felt]: verdi } : rad)));
  }
  function leggTilRad() {
    setRader((r) => [...r, { s: '', e: '' }]);
  }
  function fjernRad(i: number) {
    setRader((r) => r.filter((_, idx) => idx !== i));
  }

  async function lagre(e: React.FormEvent) {
    e.preventDefault();
    if (!tittel.trim()) {
      toast.warning('Fyll ut prøvetittel');
      return;
    }
    const ordliste: ProveOrd[] = rader
      .map((r) => ({ s: r.s.trim(), e: r.e.trim() }))
      .filter((r) => r.s && r.e);
    if (ordliste.length < MIN_PAR) {
      toast.warning(`Du trenger minst ${MIN_PAR} glose-par`);
      return;
    }
    if (!firebaseUser) {
      toast.error('Du må være innlogget.');
      return;
    }

    setLagrer(true);
    try {
      if (eksisterende) {
        await oppdaterProve(eksisterende.id, { tittel: tittel.trim(), ordliste, bland });
        toast.success('Prøve oppdatert!');
        navigate(TEACHER_ROUTES.testDetails(eksisterende.id));
      } else {
        const { id } = await opprettProve(
          { tittel: tittel.trim(), ordliste, bland },
          { uid: firebaseUser.uid, navn: bruker?.displayName ?? 'Lærer' },
        );
        toast.success('Prøve opprettet!');
        navigate(TEACHER_ROUTES.testDetails(id));
      }
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke lagre prøven.');
    } finally {
      setLagrer(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 48px' }}>
      <button type="button" onClick={() => navigate(TEACHER_ROUTES.MY_TESTS)} style={tilbakeKnapp}>← Mine prøver</button>
      <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)', margin: '16px 0 24px' }}>
        {eksisterende ? 'Rediger prøve' : 'Lag prøve'}
      </h1>

      <form onSubmit={lagre} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 }}>
          Tittel
          <input value={tittel} onChange={(e) => setTittel(e.target.value)} placeholder="F.eks. Ukas gloser" style={input} />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Glose-par ({rader.length})</div>
          {rader.map((rad, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input value={rad.s} onChange={(e) => settRad(i, 's', e.target.value)} placeholder="Norsk" style={{ ...input, flex: 1 }} />
              <input value={rad.e} onChange={(e) => settRad(i, 'e', e.target.value)} placeholder="Engelsk" style={{ ...input, flex: 1 }} />
              <button type="button" onClick={() => fjernRad(i)} aria-label="Fjern rad" style={fjernKnapp}>✕</button>
            </div>
          ))}
          <button type="button" onClick={leggTilRad} style={sekundaerKnapp}>+ Legg til par</button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <input type="checkbox" checked={bland} onChange={(e) => setBland(e.target.checked)} />
          Bland rekkefølgen for elevene
        </label>

        <button type="submit" disabled={lagrer} style={primaerKnapp}>
          {lagrer ? 'Lagrer…' : eksisterende ? 'Lagre endringer' : '✨ Opprett prøve'}
        </button>
      </form>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: '12px 14px', fontSize: 16, border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', outline: 'none', fontFamily: 'var(--font-primary)',
};
const primaerKnapp: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const sekundaerKnapp: React.CSSProperties = {
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-md)', padding: '10px 14px', fontWeight: 700, cursor: 'pointer',
  fontFamily: 'var(--font-primary)', alignSelf: 'flex-start',
};
const tilbakeKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-text-muted)', border: 'none',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)', padding: 0,
};
const fjernKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-error)', border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', padding: '0 12px', cursor: 'pointer', fontWeight: 700,
};
