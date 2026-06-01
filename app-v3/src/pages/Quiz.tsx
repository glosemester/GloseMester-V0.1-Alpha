/**
 * Prøvemodus for elever — React-port av v2 quiz-engine startQuiz/visSporsmal.
 *
 * To inngangsveier (jf. v2):
 *  - QR/lenke: /prove?kode=ABC123 → henter og starter direkte.
 *  - Manuell: /prove → skjema for prøvekode, evt. navn for gjest.
 *
 * Henter prøve via datalag (lib/data/prover), bygger spørsmål med den rene
 * quizEngine, og sender resultat til lærer via lib/data/resultater.
 */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Rocket, Check, X, Trophy, Star, ThumbsUp, Dumbbell, Gift, CheckCircle2, Layers, Home, FileText, type LucideIcon } from 'lucide-react';
import {
  byggSporsmalsliste,
  erSvarRiktig,
  beregnResultat,
  type Sporsmal,
} from '../features/quiz/quizEngine';
import { hentProveMedKode, erProveUtloept, type Prove } from '../lib/data/prover';
import { lagreResultat, type SvarRad } from '../lib/data/resultater';
import { checkWinCondition } from '../features/kort/kortReward';
import { leggTilKort } from '../features/kort/kortSamling';
import { RARITY_CONFIG, type KortDef } from '../features/kort/kortData';
import { useAuthStore } from '../state/useAuthStore';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

type Fase = 'kode' | 'navn' | 'quiz' | 'resultat';

interface QuizState {
  prove: Prove;
  sporsmal: Sporsmal[];
  index: number;
  riktige: number;
  svar: SvarRad[];
  startTid: number;
}

export function Quiz() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const [fase, setFase] = useState<Fase>('kode');
  const [kode, setKode] = useState(params.get('kode') ?? '');
  const [navn, setNavn] = useState('');
  const [laster, setLaster] = useState(false);
  const [state, setState] = useState<QuizState | null>(null);
  const [feedback, setFeedback] = useState<{ riktig: boolean; fasit: string } | null>(null);
  const [valgtSvar, setValgtSvar] = useState<string | null>(null);
  const [lagret, setLagret] = useState<boolean | null>(null);
  const [vunnetKort, setVunnetKort] = useState<KortDef | null>(null);

  // Pågående prøve som hentes via kode (QR eller skjema).
  async function startMedKode(rawKode: string) {
    const k = rawKode.trim().toUpperCase();
    if (!k) return;
    setLaster(true);
    try {
      const prove = await hentProveMedKode(k);
      if (!prove) {
        toast.error(`Fant ingen prøve med kode "${k}".`);
        return;
      }
      if (erProveUtloept(prove)) {
        toast.error('Denne prøven er ikke lenger tilgjengelig.');
        return;
      }
      // Innlogget: bruk Firebase-navn. Gjest: be om navn først.
      if (firebaseUser) {
        startQuiz(prove);
      } else {
        setState({ prove, sporsmal: [], index: 0, riktige: 0, svar: [], startTid: 0 });
        setFase('navn');
      }
    } catch (e) {
      console.error('Kunne ikke hente prøve:', e);
      toast.error('Noe gikk galt — prøv igjen.');
    } finally {
      setLaster(false);
    }
  }

  function startQuiz(prove: Prove) {
    setState({
      prove,
      sporsmal: byggSporsmalsliste(prove),
      index: 0,
      riktige: 0,
      svar: [],
      startTid: Date.now(),
    });
    setFeedback(null);
    setFase('quiz');
  }

  // QR-inngang: hvis ?kode= er satt, start automatisk (én gang).
  const autostartet = useRef(false);
  useEffect(() => {
    const qrKode = params.get('kode');
    if (qrKode && !autostartet.current) {
      autostartet.current = true;
      void startMedKode(qrKode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fase === 'kode') {
    return (
      <Skjema tittel="Ta prøve" beskrivelse="Skriv inn prøvekoden fra læreren din.">
        <form
          onSubmit={(e) => { e.preventDefault(); void startMedKode(kode); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          <input
            autoFocus
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            placeholder="F.eks. ABC123"
            style={inputStil}
          />
          <button type="submit" disabled={laster} style={primaerKnapp}>
            {laster ? 'Henter…' : <><Rocket size={18} aria-hidden="true" /> Start prøven</>}
          </button>
        </form>
      </Skjema>
    );
  }

  if (fase === 'navn' && state) {
    return (
      <Skjema tittel={state.prove.tittel ?? 'Prøve'} beskrivelse="Hva heter du?">
        <form
          onSubmit={(e) => { e.preventDefault(); if (navn.trim()) startQuiz(state.prove); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          <input autoFocus value={navn} onChange={(e) => setNavn(e.target.value)} placeholder="Fornavn" style={inputStil} />
          <button type="submit" style={primaerKnapp}><Rocket size={18} aria-hidden="true" /> Start prøven</button>
        </form>
      </Skjema>
    );
  }

  if (fase === 'quiz' && state) {
    const totalt = state.sporsmal.length;
    if (state.index >= totalt) {
      void avsluttOgLagre(state);
      return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Lagrer resultat…</div>;
    }
    const spm = state.sporsmal[state.index];
    const prosent = Math.round((state.index / totalt) * 100);

    return (
      <div style={{ minHeight: '100vh', padding: 20, maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 600 }}>
          <span>Spørsmål {state.index + 1} av {totalt}</span>
          <span>{state.prove.tittel ?? 'Prøve'}</span>
        </div>
        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 999 }}>
          <div style={{ height: '100%', width: `${prosent}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', borderRadius: 999, transition: 'width 0.4s' }} />
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 24, padding: '36px 28px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)' }}>{spm.sporsmal}</div>
        </div>

        {spm.type === 'flervalg' && spm.alternativer ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {spm.alternativer.map((alt) => (
              <button
                key={alt}
                type="button"
                disabled={feedback !== null}
                onClick={() => svarPa(state, alt)}
                style={{
                  ...altKnapp,
                  // Etter svar: marker fasit grønn, og elevens feilvalg rødt.
                  ...(feedback && erSvarRiktig(alt, spm.riktigSvar) ? riktigStil : {}),
                  ...(feedback && !feedback.riktig && erSvarRiktig(alt, valgtSvar ?? '') ? feilStil : {}),
                }}
              >
                {alt}
              </button>
            ))}
          </div>
        ) : (
          <TekstSvar disabled={feedback !== null} onSvar={(v) => svarPa(state, v)} />
        )}

        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', fontWeight: 700, fontSize: 18, minHeight: 28, color: feedback ? (feedback.riktig ? 'var(--color-success)' : 'var(--color-error)') : undefined }}>
          {feedback ? (feedback.riktig ? <><Check size={20} aria-hidden="true" /> Riktig!</> : <><X size={20} aria-hidden="true" /> Fasit: {feedback.fasit}</>) : ''}
        </p>
      </div>
    );
  }

  if (fase === 'resultat' && state) {
    const { riktige, prosent } = beregnResultat(state.riktige, state.sporsmal.length);
    const ResultatIkon: LucideIcon = prosent >= 90 ? Trophy : prosent >= 70 ? Star : prosent >= 50 ? ThumbsUp : Dumbbell;
    const farge = prosent >= 70 ? 'var(--color-success)' : prosent >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
    return (
      <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
        <ResultatIkon size={80} color={farge} aria-hidden="true" />
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Prøven er ferdig!</h1>
        <div style={{ background: 'var(--color-surface)', borderRadius: 24, padding: '32px 40px', boxShadow: 'var(--shadow-card)', width: '100%' }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: farge, lineHeight: 1 }}>{prosent}%</div>
          <div style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>{riktige} av {state.sporsmal.length} riktige</div>
        </div>
        {vunnetKort && (
          <div style={{ background: 'var(--color-surface)', border: `2px solid ${RARITY_CONFIG[vunnetKort.rarity].farge}`, borderRadius: 20, padding: 20, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Gift size={20} color="var(--color-primary)" aria-hidden="true" /> Du vant et kort!</div>
            <img src={vunnetKort.image} alt={vunnetKort.name} style={{ width: 120, height: 120, objectFit: 'contain' }} />
            <div style={{ fontWeight: 700 }}>{vunnetKort.name}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: RARITY_CONFIG[vunnetKort.rarity].farge }}>
              {RARITY_CONFIG[vunnetKort.rarity].tekst}
            </div>
          </div>
        )}
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: lagret ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {lagret === null ? '' : lagret ? <><CheckCircle2 size={18} aria-hidden="true" /> Resultat sendt til læreren.</> : 'Resultat kunne ikke sendes (ingen nettverkstilgang).'}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {vunnetKort && (
            <button type="button" onClick={() => navigate(ROUTES.GALLERY)} style={primaerKnapp}><Layers size={18} aria-hidden="true" /> Se samlingen</button>
          )}
          <button type="button" onClick={() => navigate(bruker ? ROUTES.HJEM : ROUTES.LANDING)} style={primaerKnapp}><Home size={18} aria-hidden="true" /> Tilbake</button>
        </div>
      </div>
    );
  }

  return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;

  // --- handlers ---

  function svarPa(s: QuizState, brukersvar: string) {
    if (feedback) return;
    const spm = s.sporsmal[s.index];
    const riktig = erSvarRiktig(brukersvar, spm.riktigSvar);
    const nySvar: SvarRad = { sporsmal: spm.sporsmal, brukersvar, riktig };
    setValgtSvar(brukersvar);
    setFeedback({ riktig, fasit: spm.riktigSvar });
    window.setTimeout(() => {
      setState({
        ...s,
        index: s.index + 1,
        riktige: s.riktige + (riktig ? 1 : 0),
        svar: [...s.svar, nySvar],
      });
      setFeedback(null);
      setValgtSvar(null);
    }, riktig ? 900 : 1600);
  }

  async function avsluttOgLagre(s: QuizState) {
    if (fase === 'resultat') return; // unngå dobbel lagring
    setFase('resultat');
    const { riktige, totalt, prosent } = beregnResultat(s.riktige, s.sporsmal.length);
    const tidSekunder = Math.round((Date.now() - s.startTid) / 1000);
    const elevNavn = firebaseUser
      ? bruker?.displayName ?? firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Elev'
      : navn.trim() || null;
    try {
      await lagreResultat({
        prove: s.prove, riktige, totalt, prosent, svar: s.svar, tidSekunder,
        elevNavn, elevUid: firebaseUser?.uid ?? null,
      });
      setLagret(true);
    } catch (e) {
      console.warn('Kunne ikke lagre resultat:', e);
      setLagret(false);
    }

    // Kortbelønning ved 80%+ (kun innlogget — samlingen lagres på UID).
    if (firebaseUser) {
      const kort = checkWinCondition(riktige, totalt, s.prove.niva ?? null);
      if (kort) {
        leggTilKort(kort);
        setVunnetKort(kort);
      }
    }
  }
}

// --- små underkomponenter / stiler ---

function Skjema({ tittel, beskrivelse, children }: { tittel: string; beskrivelse: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 24, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
        <FileText size={52} color="var(--color-primary)" aria-hidden="true" style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{tittel}</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>{beskrivelse}</p>
        {children}
      </div>
    </div>
  );
}

function TekstSvar({ disabled, onSvar }: { disabled: boolean; onSvar: (v: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (val.trim()) onSvar(val.trim()); }}
      style={{ display: 'flex', gap: 10 }}
    >
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} disabled={disabled} placeholder="Skriv svaret…" style={{ ...inputStil, flex: 1, marginBottom: 0 }} />
      <button type="submit" disabled={disabled} aria-label="Svar" style={{ ...primaerKnapp, width: 'auto', padding: '16px 24px' }}><Check size={20} aria-hidden="true" /></button>
    </form>
  );
}

const inputStil: React.CSSProperties = {
  width: '100%', padding: '14px 16px', fontSize: 18, fontWeight: 600, textAlign: 'center',
  border: '2px solid var(--color-border)', borderRadius: 14, outline: 'none',
};
const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  width: '100%', padding: 14, background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const altKnapp: React.CSSProperties = {
  padding: '18px 12px', border: '2px solid var(--color-border)', borderRadius: 16,
  background: 'var(--color-surface)', fontSize: 17, fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)',
};
const riktigStil: React.CSSProperties = { background: 'var(--color-success-light)', borderColor: 'var(--color-success)', color: 'var(--color-text)' };
const feilStil: React.CSSProperties = { background: 'var(--color-error-light)', borderColor: 'var(--color-error)', color: 'var(--color-text)' };
