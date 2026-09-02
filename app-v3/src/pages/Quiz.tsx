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
import { Rocket, Check, X, Trophy, Star, ThumbsUp, Dumbbell, Gift, CheckCircle2, CloudOff, Layers, Home, FileText, ListChecks, Repeat, Zap, type LucideIcon } from 'lucide-react';
import {
  byggSporsmalsliste,
  erSvarRiktig,
  beregnResultat,
  type Sporsmal,
} from '../features/quiz/quizEngine';
import { hentProveMedKode, erProveUtloept, type Prove } from '../lib/data/prover';
import { byggResultatDokument, lagreResultatDokument, type SvarRad } from '../lib/data/resultater';
import { leggIResultatKo } from '../lib/data/resultatKo';
import { registrerRiktigeMotKort } from '../features/kort/kortProgress';
import { leggTilKort } from '../features/kort/kortSamling';
import { glodStil, RARITY_CONFIG, type KortDef } from '../features/kort/kortData';
import { registrerRiktigeSvar } from '../lib/rewards';
import { beregnElevNiva, nivaProgresjon, nivaTittel, sjekkNivaOpp, type NivaOppResultat } from '../features/niva/nivaSystem';
import { NivaOppOverlay } from '../components/NivaOppOverlay';
import { useAuthStore } from '../state/useAuthStore';
import { toast } from '../state/useToastStore';
import { hapticLett, hapticTung, hapticSuksess } from '../lib/native';
import { ALLE_KORTPAKKER } from '../lib/tilgang';
import { ROUTES } from '../routes/paths';

type Fase = 'kode' | 'modus' | 'navn' | 'quiz' | 'resultat';

interface QuizState {
  prove: Prove;
  sporsmal: Sporsmal[];
  index: number;
  riktige: number;
  svar: SvarRad[];
  startTid: number;
  /** Øve-til-prøve: ordene kjøres på repeat, resultat sendes IKKE til læreren. */
  ovemodus?: boolean;
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
  const [lagret, setLagret] = useState<'sendt' | 'koet' | null>(null);
  const [vunnetKort, setVunnetKort] = useState<KortDef | null>(null);
  const [visSvar, setVisSvar] = useState(false);
  // XP etter levering (til «+N XP»-chip og nivåfremdrift på resultatskjermen).
  const [xpEtter, setXpEtter] = useState<number | null>(null);
  // Nivå-opp-feiring (kun innloggede).
  const [nivaOpp, setNivaOpp] = useState<NivaOppResultat | null>(null);
  // Guard mot dobbel lagring (StrictMode/re-render) — settes idet lagring starter.
  const harLagretRef = useRef(false);

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
      setState({ prove, sporsmal: [], index: 0, riktige: 0, svar: [], startTid: 0 });
      // La eleven velge «Ta prøven» eller «Øv til prøve» — ingen innlogging.
      setFase('modus');
    } catch (e) {
      console.error('Kunne ikke hente prøve:', e);
      toast.error('Noe gikk galt — prøv igjen.');
    } finally {
      setLaster(false);
    }
  }

  function startQuiz(prove: Prove, ovemodus = false) {
    setState({
      prove,
      sporsmal: byggSporsmalsliste(prove),
      index: 0,
      riktige: 0,
      svar: [],
      startTid: Date.now(),
      ovemodus,
    });
    setFeedback(null);
    setValgtSvar(null);
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

  // Velg «Ta prøven» (resultat sendes til læreren, krever navn) eller
  // «Øv på ordene» (kun trening, sendes ikke inn). Ingen innlogging noe sted.
  if (fase === 'modus' && state) {
    return (
      <Skjema tittel={state.prove.tittel ?? 'Prøve'} beskrivelse="Vil du ta prøven, eller øve på ordene først?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => setFase('navn')} style={valgBoks}>
            <FileText size={26} color="var(--color-primary)" aria-hidden="true" />
            <span style={valgTittel}>Ta prøven</span>
            <span style={valgTekst}>Resultatet sendes til læreren din.</span>
          </button>
          <button type="button" onClick={() => startQuiz(state.prove, true)} style={valgBoks}>
            <Repeat size={26} color="var(--color-primary)" aria-hidden="true" />
            <span style={valgTittel}>Øv på ordene</span>
            <span style={valgTekst}>Tren på ordene i prøven på repeat — sendes ikke til læreren.</span>
          </button>
        </div>
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
    if (state.index >= totalt && !state.ovemodus) {
      // Lagringen trigges fra svarPa (siste svar) — her vises kun ventetilstand.
      return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Lagrer resultat…</div>;
    }
    const spm = state.sporsmal[state.index];
    const prosent = Math.round((state.index / totalt) * 100);

    return (
      <div style={{ minHeight: '100vh', padding: 20, maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {state.ovemodus && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', padding: '8px 16px', fontWeight: 700, fontSize: 13 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Repeat size={16} aria-hidden="true" /> Øving — sendes ikke til læreren
            </span>
            <button type="button" onClick={() => navigate(bruker ? ROUTES.HJEM : ROUTES.LANDING)} style={avsluttKnapp}>
              Avslutt
            </button>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 600 }}>
          <span>{state.ovemodus ? 'Ord' : 'Spørsmål'} {state.index + 1} av {totalt}</span>
          <span>{state.prove.tittel ?? 'Prøve'}</span>
        </div>
        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
          {/* #4 Animer transform (scaleX) i stedet for width — GPU-akselerert. */}
          <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', borderRadius: 999, transform: `scaleX(${prosent / 100})`, transformOrigin: 'left', transition: 'transform 0.4s', willChange: 'transform' }} />
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
    const nivaInfo = xpEtter !== null ? nivaProgresjon(xpEtter) : null;
    return (
      <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
        {nivaOpp && (
          <NivaOppOverlay
            nyttNiva={nivaOpp.nyttNiva}
            opplasninger={nivaOpp.opplasninger}
            onLukk={() => setNivaOpp(null)}
          />
        )}
        <ResultatIkon size={80} color={farge} aria-hidden="true" />
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Prøven er ferdig!</h1>
        <div style={{ background: 'var(--color-surface)', borderRadius: 24, padding: '32px 40px', boxShadow: 'var(--shadow-card)', width: '100%' }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: farge, lineHeight: 1 }}>{prosent}%</div>
          <div style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>{riktige} av {state.sporsmal.length} riktige</div>
          {riktige > 0 && xpEtter !== null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, background: 'var(--color-accent-light)', color: 'var(--color-text)', borderRadius: 999, padding: '6px 14px', fontWeight: 800, fontSize: 14 }}>
              <Zap size={16} color="var(--color-accent)" aria-hidden="true" /> +{riktige} XP
            </div>
          )}
          {nivaInfo && (
            <div style={{ marginTop: 14, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                <span>Nivå {nivaInfo.niva} · {nivaTittel(nivaInfo.niva)}</span>
                <span>{nivaInfo.erMaks ? 'Maks nivå!' : `${nivaInfo.xpTilNeste} XP til nivå ${nivaInfo.niva + 1}`}</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--color-accent)', borderRadius: 999, transform: `scaleX(${nivaInfo.prosent / 100})`, transformOrigin: 'left', transition: 'transform 0.6s ease', willChange: 'transform' }} />
              </div>
            </div>
          )}
        </div>
        {vunnetKort && (
          <div className="kort-glod" style={{ ...glodStil(vunnetKort.rarity), background: 'var(--color-surface)', border: `2px solid ${RARITY_CONFIG[vunnetKort.rarity].farge}`, borderRadius: 20, padding: 20, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Gift size={20} color="var(--color-primary)" aria-hidden="true" /> Du vant et kort!</div>
            <img src={vunnetKort.image} alt={vunnetKort.name} style={{ width: 120, height: 120, objectFit: 'contain' }} />
            <div style={{ fontWeight: 700 }}>{vunnetKort.name}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: RARITY_CONFIG[vunnetKort.rarity].farge }}>
              {RARITY_CONFIG[vunnetKort.rarity].tekst}
            </div>
          </div>
        )}
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: lagret === 'sendt' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {lagret === null ? '' : lagret === 'sendt'
            ? <><CheckCircle2 size={18} aria-hidden="true" /> Resultat sendt til læreren.</>
            : <><CloudOff size={18} aria-hidden="true" /> Du er offline — resultatet sendes til læreren når du er på nett.</>}
        </p>
        {state.svar.length > 0 && (
          <button type="button" onClick={() => setVisSvar((v) => !v)} style={svarKnapp}>
            <ListChecks size={18} aria-hidden="true" /> {visSvar ? 'Skjul svarene' : 'Se svarene dine'}
          </button>
        )}
        {visSvar && <SvarGjennomgang svar={state.svar} />}
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
    void (riktig ? hapticLett() : hapticTung()); // #17 haptikk på svar
    const nySvar: SvarRad = { sporsmal: spm.sporsmal, brukersvar, fasit: spm.riktigSvar, riktig };
    setValgtSvar(brukersvar);
    setFeedback({ riktig, fasit: spm.riktigSvar });
    window.setTimeout(() => {
      const nesteIndex = s.index + 1;
      if (s.ovemodus && nesteIndex >= s.sporsmal.length) {
        // Øve-til-prøve: stokk om og start runden på nytt (endeløs repetisjon).
        setState({ ...s, sporsmal: byggSporsmalsliste(s.prove), index: 0, riktige: 0, svar: [] });
      } else {
        const neste: QuizState = {
          ...s,
          index: nesteIndex,
          riktige: s.riktige + (riktig ? 1 : 0),
          svar: [...s.svar, nySvar],
        };
        setState(neste);
        // Siste spørsmål besvart: lagre herfra (én gang) — ikke fra render.
        if (!s.ovemodus && nesteIndex >= s.sporsmal.length) void avsluttOgLagre(neste);
      }
      setFeedback(null);
      setValgtSvar(null);
    }, riktig ? 900 : 1600);
  }

  async function avsluttOgLagre(s: QuizState) {
    if (harLagretRef.current) return; // unngå dobbel lagring
    harLagretRef.current = true;
    setFase('resultat');
    const { riktige, totalt, prosent } = beregnResultat(s.riktige, s.sporsmal.length);
    const tidSekunder = Math.round((Date.now() - s.startTid) / 1000);
    const elevNavn = firebaseUser
      ? bruker?.displayName ?? firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Elev'
      : navn.trim() || null;
    // Dokumentet bygges ferdig FØR sending, så det kan køes uendret ved nettfeil.
    const dok = byggResultatDokument({
      prove: s.prove, riktige, totalt, prosent, svar: s.svar, tidSekunder,
      elevNavn, elevUid: firebaseUser?.uid ?? null,
    });
    try {
      await lagreResultatDokument(dok);
      setLagret('sendt');
    } catch (e) {
      console.warn('Kunne ikke sende resultat — legger i offline-kø:', e);
      await leggIResultatKo(dok);
      setLagret('koet');
    }

    // XP: prøvens riktige svar gir +1 XP hver, som i øvemodus. Gjelder også
    // gjester (XP-en merges inn i kontoen ved innlogging, som kortene).
    const { xpFoer, nyXP, diamanterTildelt } = registrerRiktigeSvar(riktige);
    setXpEtter(nyXP);
    if (diamanterTildelt) toast.success(`BONUS! Du fikk ${diamanterTildelt} diamanter!`);
    // Nivå-opp gjelder også gjester (enklere feiring med Feide-oppfordring).
    setNivaOpp(sjekkNivaOpp(xpFoer, nyXP));

    // Felles kort-teller: prøvens riktige svar teller mot samme «X av 10»-bar
    // som øvemodus — ikke et engangskort. Gjelder også gjester (samlingen
    // lagres i 'gjest'-namespace). Nivålåste kort filtreres bort for innloggede.
    const tilgjengeligeKategorier = ALLE_KORTPAKKER;
    const elevNiva = firebaseUser ? beregnElevNiva(nyXP) : null;
    const { kort } = registrerRiktigeMotKort(riktige, s.prove.niva ?? null, Math.random, tilgjengeligeKategorier, elevNiva);
    if (kort.length > 0) {
      void hapticSuksess(); // #17 suksess-haptikk ved vunnet kort
      kort.forEach((k) => leggTilKort(k));
      setVunnetKort(kort[0]);
      if (kort.length > 1) toast.success(`Du tjente ${kort.length} kort!`);
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

/** Elevens svargjennomgang etter prøven: hvert spørsmål med eget svar og fasit. */
function SvarGjennomgang({ svar }: { svar: SvarRad[] }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
      {svar.map((rad, i) => (
        <div
          key={i}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            background: rad.riktig ? 'var(--color-success-light)' : 'var(--color-error-light)',
            border: `2px solid ${rad.riktig ? 'var(--color-success)' : 'var(--color-error)'}`,
            borderRadius: 14, padding: '10px 14px',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: 'var(--color-text)' }}>{rad.sporsmal}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Du svarte: {rad.brukersvar}
              {!rad.riktig && rad.fasit ? <> — Fasit: <strong>{rad.fasit}</strong></> : null}
            </div>
          </div>
          {rad.riktig
            ? <Check size={18} color="var(--color-success)" aria-label="Riktig" />
            : <X size={18} color="var(--color-error)" aria-label="Feil" />}
        </div>
      ))}
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
const valgBoks: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  padding: '20px 18px', border: '2px solid var(--color-border)', borderRadius: 16,
  background: 'var(--color-surface)', cursor: 'pointer', textAlign: 'center',
  fontFamily: 'var(--font-primary)',
};
const valgTittel: React.CSSProperties = { fontWeight: 800, fontSize: 16, color: 'var(--color-text)', marginTop: 4 };
const valgTekst: React.CSSProperties = { fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.4 };
const svarKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 14, padding: '12px 20px', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const avsluttKnapp: React.CSSProperties = {
  background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
  borderRadius: 'var(--radius-full)', padding: '4px 14px', fontWeight: 700, fontSize: 13,
  cursor: 'pointer', fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap',
};
