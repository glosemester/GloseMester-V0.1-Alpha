/**
 * Øve-økt — React-port av v2 øvemodus, nå drevet av Leitner spaced-repetition
 * (ny i v3). I stedet for å gå sekvensielt gjennom en stokket liste, velges
 * neste ord vektet mot lave Leitner-bokser, så ord man strever med kommer
 * oftere. Leitner-tilstanden persisteres per bruker og nivå.
 *
 * Økten har fast lengde (= antall ord i nivået) så den fortsatt har en tydelig
 * slutt, slik som v2.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  answerFor,
  promptFor,
  isAnswerCorrect,
  shouldBeMultipleChoice,
  buildAlternatives,
  type Direction,
  type QuestionMode,
} from '../features/glosemester/practiceEngine';
import {
  getAvailableLevels,
  getWordsForLevel,
  type LevelId,
  type Word,
} from '../features/glosemester/vocabulary';
import {
  loadLeitnerState,
  saveLeitnerState,
  recordAnswer,
  pickNextWord,
  nivaProsent,
  type LeitnerState,
} from '../features/glosemester/leitner';
import { registrerRiktigSvar } from '../lib/rewards';
import { KORT_PER_RIKTIGE, lesKortProgresjon, registrerRiktigeMotKort } from '../features/kort/kortProgress';
import { leggTilKort } from '../features/kort/kortSamling';
import { RARITY_CONFIG, type KortDef } from '../features/kort/kortData';
import { PartyPopper, Dumbbell, Gift, Plus, Flame, Layers, Volume2, Check, X, LogOut } from 'lucide-react';
import { lesOpp, talesynteseStottes } from '../lib/speech';
import { lesStreak, settStreak } from '../lib/streak';
import { hapticLett, hapticTung, hapticSuksess } from '../lib/native';
import { toast } from '../state/useToastStore';
import { useAuthStore } from '../state/useAuthStore';
import { useUiStore } from '../state/useUiStore';
import { useTradeStore } from '../state/useTradeStore';
import { tilgjengeligeSjetonger } from '../features/trade/byttesjetonger';
import { TokenBalance } from '../components/TokenBalance';
import { ROUTES } from '../routes/paths';

/** Antall ord per øverunde (= én runde på kort-hjulet). */
const RUNDE_LENGDE = 10;

/** True på skjermer ≥10 tommer (nettbrett/desktop) — gir to-spalte øvemodus. */
function useErStorskjerm(): boolean {
  const [er, setEr] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const oppdater = () => setEr(mq.matches);
    mq.addEventListener('change', oppdater);
    return () => mq.removeEventListener('change', oppdater);
  }, []);
  return er;
}

type Feedback = { type: 'correct' | 'wrong'; correctAnswer: string } | null;

interface AktivtSporsmal {
  word: Word;
  mode: QuestionMode;
  alternatives?: Word[];
}

export function GlosemesterPractice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const innlogget = useAuthStore((s) => Boolean(s.firebaseUser));
  const setBunnmenySkjult = useUiStore((s) => s.setBunnmenySkjult);
  const oppdaterSjetonger = useTradeStore((s) => s.oppdaterSjetonger);
  // Bug 2: høyttaler-knappen skjules der talesyntese mangler (ellers «død» knapp).
  const harTale = useMemo(() => talesynteseStottes(), []);
  const level = params.get('niva') as LevelId | null;
  const gyldigNiva = Boolean(level && getAvailableLevels().includes(level));

  const direction: Direction = 'en';
  const words = useMemo(() => (gyldigNiva ? getWordsForLevel(level as LevelId) : []), [gyldigNiva, level]);
  // Fase 4: øvingen går i RUNDER på 10 ord (= én runde på hjulet = ett kort), i
  // stedet for å gå gjennom hele nivået på én gang. Kortere, mer motiverende økter.
  const rundeLengde = Math.min(RUNDE_LENGDE, words.length);
  const erStorskjerm = useErStorskjerm();

  // Leitner-tilstand i en ref (persisteres); UI trenger ikke re-rendre på hver endring.
  const leitnerRef = useRef<LeitnerState>({});
  const [klar, setKlar] = useState(false);

  const [sporsmal, setSporsmal] = useState<AktivtSporsmal | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [besvart, setBesvart] = useState(0);
  const [riktige, setRiktige] = useState(0);
  // Bug 6: streaken fortsetter på tvers av økter (lagres) og vises også utenfor
  // øvemodus. oppdaterStreak holder React-state og localStorage i synk.
  const [streak, setStreak] = useState(() => lesStreak());
  const oppdaterStreak = useCallback((oppdater: number | ((n: number) => number)) => {
    setStreak((n) => {
      const ny = typeof oppdater === 'function' ? oppdater(n) : oppdater;
      settStreak(ny);
      return ny;
    });
  }, []);
  const [valgtSvar, setValgtSvar] = useState<string | null>(null);
  const [ferdig, setFerdig] = useState(false);
  // Bug 4: «Avslutt» midt i en økt ber om bekreftelse i stedet for å hoppe ut.
  const [visAvslutt, setVisAvslutt] = useState(false);
  const forrigeRef = useRef<Word | undefined>(undefined);

  // Kortprogresjon: felles teller for øving + prøve (lib/kortProgress). Hvert
  // 10. riktige svar gir et kort, og prøvesvar teller mot samme bar.
  const [kortProgresjon, setKortProgresjon] = useState(() => lesKortProgresjon());
  const [vunnetKort, setVunnetKort] = useState<KortDef | null>(null);
  // Fase 4 (storskjerm): kort vunnet i denne økten — vises i kortbunken til høyre.
  const [oktKort, setOktKort] = useState<KortDef[]>([]);

  // Bygger neste spørsmål basert på Leitner-vekting.
  const nesteSporsmal = useCallback(() => {
    const word = pickNextWord(words, leitnerRef.current, forrigeRef.current);
    if (!word) {
      setFerdig(true);
      return;
    }
    forrigeRef.current = word;
    const mode: QuestionMode = shouldBeMultipleChoice(level as LevelId) ? 'mc' : 'typing';
    setSporsmal({
      word,
      mode,
      alternatives: mode === 'mc' ? buildAlternatives(word, words, direction) : undefined,
    });
    setTypedAnswer('');
    setFeedback(null);
    setValgtSvar(null);
  }, [words, level]);

  // Init: last Leitner-tilstand og lag første spørsmål.
  useEffect(() => {
    if (!gyldigNiva) return;
    leitnerRef.current = loadLeitnerState(level as LevelId);
    nesteSporsmal();
    setKlar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyldigNiva, level]);

  // Bug 3: skjul den globale bunnmenyen mens et spørsmål er aktivt (den dekket
  // det 4. svaralternativet). Den vises igjen på resultatskjermen (ferdig) og
  // på ugyldig-nivå-skjermen, og når vi forlater øve-økten (cleanup).
  const iAktivtSporsmal = gyldigNiva && !ferdig;
  useEffect(() => {
    setBunnmenySkjult(iAktivtSporsmal);
    return () => setBunnmenySkjult(false);
  }, [iAktivtSporsmal, setBunnmenySkjult]);

  // Bug 4: forlat øve-økten. Har eleven svart på noe, be om bekreftelse først
  // (et feilklikk skal ikke kaste bort konteksten); ellers bare ut.
  const avslutt = useCallback(() => {
    if (besvart > 0) setVisAvslutt(true);
    else navigate(ROUTES.GLOSEMESTER_START);
  }, [besvart, navigate]);

  const gaaVidere = useCallback(() => {
    if (besvart + 1 >= rundeLengde) {
      setFerdig(true);
    } else {
      nesteSporsmal();
    }
  }, [besvart, rundeLengde, nesteSporsmal]);

  const registrerSvar = useCallback(
    (word: Word, korrekt: boolean, svartekst?: string) => {
      if (svartekst !== undefined) setValgtSvar(svartekst);
      // Oppdater + lagre Leitner-tilstand.
      leitnerRef.current = recordAnswer(leitnerRef.current, word, korrekt);
      saveLeitnerState(level as LevelId, leitnerRef.current);

      setBesvart((n) => n + 1);
      if (korrekt) {
        void hapticLett(); // #17 lett dunk ved riktig svar
        setRiktige((n) => n + 1);
        oppdaterStreak((n) => n + 1);
        const { diamanterTildelt } = registrerRiktigSvar();
        if (diamanterTildelt) toast.success(`BONUS! Du fikk ${diamanterTildelt} diamanter!`);

        // Oppdater byttesjetong-saldoen (XP kan nettopp ha krysset en milepæl).
        const forUt = tilgjengeligeSjetonger();
        oppdaterSjetonger();
        if (tilgjengeligeSjetonger() > forUt) toast.success('Du tjente en byttesjetong!');

        // Kortbelønning via den felles telleren (deles med prøvemodus). Hvert
        // 10. riktige svar gir et kort; kortet legges IKKE til automatisk —
        // eleven bekrefter via popup-knappen.
        {
          const { kort, rest } = registrerRiktigeMotKort(1, level);
          setKortProgresjon(rest);
          if (kort.length > 0) {
            void hapticSuksess(); // #17 suksess-haptikk ved vunnet kort
            setVunnetKort(kort[0]);
            setOktKort((b) => [...b, kort[0]]); // legg øverst i kortbunken (storskjerm)
          }
        }

        setFeedback({ type: 'correct', correctAnswer: answerFor(word, direction) });
        window.setTimeout(gaaVidere, 900);
      } else {
        oppdaterStreak(0);
        void hapticTung(); // #17 tungt dunk ved feil svar (erstatter web-vibrer)
        setFeedback({ type: 'wrong', correctAnswer: answerFor(word, direction) });
      }
    },
    [level, gaaVidere, oppdaterSjetonger, oppdaterStreak],
  );

  // Bekreft og legg vunnet kort i samlingen (eleven trykker selv, jf. ønske).
  const leggTilVunnetKort = useCallback(() => {
    if (!vunnetKort) return;
    leggTilKort(vunnetKort);
    toast.success(`${vunnetKort.name} lagt i samlingen!`);
    setVunnetKort(null);
  }, [vunnetKort]);

  // +1 fordi telleren viser nåværende spørsmål (besvart+1/total), ikke antall ferdig.
  const progresjon = rundeLengde > 0 ? Math.round(((besvart + 1) / rundeLengde) * 100) : 0;

  if (!gyldigNiva) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p>Ugyldig eller manglende nivå.</p>
        <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>Velg nivå</button>
      </div>
    );
  }

  if (ferdig) {
    const prosent = besvart ? Math.round((riktige / besvart) * 100) : 0;
    const nivaPct = nivaProsent(leitnerRef.current, words);
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>Runde fullført! <PartyPopper size={28} color="var(--color-primary)" aria-hidden="true" /></h2>
        <p style={{ color: 'var(--color-text-muted)' }}>{riktige} av {besvart} riktig ({prosent}%)</p>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14 }}><Dumbbell size={18} aria-hidden="true" /> {nivaPct}% av nivået lært</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {/* Fortsett til neste runde — streak og kortprogresjon beholdes. */}
          <button type="button" onClick={() => { setFerdig(false); setBesvart(0); setRiktige(0); forrigeRef.current = undefined; nesteSporsmal(); }} style={primaerKnapp}>Fortsett</button>
          <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>Velg nivå</button>
        </div>
      </div>
    );
  }

  if (!klar || !sporsmal) return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;

  const { word, mode, alternatives } = sporsmal;
  const svarLang = direction === 'en' ? 'en-US' : 'no-NO';

  const korrektSvar = answerFor(word, direction);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-bg) 40%)' }}>
      {/* Designforslag #2: kort, subtil grønn glow ved riktig svar. */}
      {feedback?.type === 'correct' && (
        <div
          key={besvart}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90, opacity: 0,
            boxShadow: 'inset 0 0 110px 12px var(--color-success)',
            animation: 'glowPulse 0.5s ease forwards',
          }}
        />
      )}
      {vunnetKort && (
        <div style={kortOverlay} role="dialog" aria-label="Du vant et kort">
          <div style={{ ...kortPopup, borderColor: RARITY_CONFIG[vunnetKort.rarity].farge }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18 }}><Gift size={24} color="var(--color-primary)" aria-hidden="true" /> Du vant et kort!</div>
            <img src={vunnetKort.image} alt={vunnetKort.name} style={{ width: 160, height: 160, objectFit: 'contain' }} />
            <div style={{ fontWeight: 800, fontSize: 18 }}>{vunnetKort.name}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: RARITY_CONFIG[vunnetKort.rarity].farge }}>
              {RARITY_CONFIG[vunnetKort.rarity].tekst}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
              <button type="button" onClick={leggTilVunnetKort} style={primaerKnapp}>
                <Plus size={16} aria-hidden="true" /> Legg til i min samling
              </button>
              <button type="button" onClick={() => setVunnetKort(null)} style={tilbakeKnapp}>
                Hopp over
              </button>
            </div>
          </div>
        </div>
      )}
      {visAvslutt && (
        <div style={kortOverlay} role="dialog" aria-label="Avslutte økten?">
          <div style={{ ...kortPopup, maxWidth: 360, gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18 }}>
              <LogOut size={22} color="var(--color-primary)" aria-hidden="true" /> Avslutte økten?
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', margin: 0 }}>
              Du har svart på {besvart} ord så langt. Fremgangen din er lagret,
              men selve økten avsluttes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
              <button type="button" onClick={() => { setVisAvslutt(false); navigate(ROUTES.GLOSEMESTER_START); }} style={primaerKnapp}>
                Avslutt økten
              </button>
              <button type="button" onClick={() => setVisAvslutt(false)} style={tilbakeKnapp} autoFocus>
                Fortsett å øve
              </button>
            </div>
          </div>
        </div>
      )}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
        <button type="button" onClick={avslutt} style={tilbakeKnapp}>← Avslutt</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, background: 'rgba(0,0,0,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            {/* #4 Animer transform (scaleX) i stedet for width — kjører på GPU. */}
            <div style={{ width: '100%', height: '100%', background: 'var(--color-primary)', borderRadius: 999, transform: `scaleX(${progresjon / 100})`, transformOrigin: 'left', transition: 'transform 0.4s ease', willChange: 'transform' }} />
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', minWidth: 44, textAlign: 'right' }}>{besvart + 1}/{rundeLengde}</span>
        {streak >= 2 && (
          <span key={streak} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', animation: 'pop 0.3s ease', whiteSpace: 'nowrap' }}>
            <Flame size={18} color="var(--color-primary)" aria-hidden="true" /> {streak}
          </span>
        )}
        {innlogget && <TokenBalance compact />}
      </header>

      {/* Kortprogresjon — 10 bokser som fylles mot neste kort (mobil). På
          storskjerm vises i stedet kort-hjulet i venstre sidepanel. */}
      {!erStorskjerm && (
        <div style={{ padding: '0 20px', maxWidth: 460, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4, letterSpacing: '0.03em' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Layers size={14} aria-hidden="true" /> NESTE KORT</span>
            <span>{kortProgresjon}/{KORT_PER_RIKTIGE}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: KORT_PER_RIKTIGE }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 8, borderRadius: 999,
                  background: i < kortProgresjon ? 'var(--color-primary)' : 'rgba(0,0,0,0.08)',
                  boxShadow: i < kortProgresjon ? '0 0 8px var(--color-primary)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fase 4: storskjerm-øvemodus (≥10"). Venstre = kort-hjul (fremdrift mot
          neste kort), høyre = kortbunke (sist vunnet øverst). Mobil er uendret. */}
      {erStorskjerm && (
        <>
          <aside style={{ ...sidePanel, left: 'max(16px, calc(50vw - 520px))' }} aria-label="Fremdrift mot neste kort">
            <Hjul fylt={kortProgresjon} total={KORT_PER_RIKTIGE} />
          </aside>
          <aside style={{ ...sidePanel, right: 'max(16px, calc(50vw - 520px))' }} aria-label="Kortbunke">
            <Kortbunke kort={oktKort} />
          </aside>
        </>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)', padding: 'var(--space-6)', textAlign: 'center' }}>
        <div key={word.s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', animation: 'floatIn 0.35s ease', willChange: 'transform, opacity' }}>
          {word.image && direction === 'en' && (
            // Bug 1: skjul bildet pent hvis assetet mangler/ikke laster, i stedet
            // for å vise nettleserens «ødelagt bilde»-blob på spørsmålet.
            <img
              src={word.image}
              alt={word.s}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              style={{ maxWidth: 160, maxHeight: 160, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))' }}
            />
          )}
          <h2 style={{ fontSize: 'clamp(2.2rem, 9vw, 4rem)', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.05 }}>
            {promptFor(word, direction)}
          </h2>
          {harTale && (
            <button
              type="button"
              aria-label="Les opp ordet"
              onClick={() => lesOpp(promptFor(word, direction), direction === 'en' ? 'en-US' : 'no-NO')}
              style={hoyttalerKnapp}
            >
              <Volume2 size={22} aria-hidden="true" />
            </button>
          )}
        </div>

        {mode === 'mc' && alternatives ? (
          <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 440 }}>
            {alternatives.map((alt) => {
              const tekst = answerFor(alt, direction);
              const erFasit = tekst === korrektSvar;
              const erValgt = valgtSvar === tekst;
              // Fargelegg når svar er gitt: fasit = grønn, feilvalgt = rød.
              let stil = alternativKnapp;
              if (feedback) {
                if (erFasit) stil = { ...alternativKnapp, ...riktigStil };
                else if (erValgt) stil = { ...alternativKnapp, ...galtStil };
                else stil = { ...alternativKnapp, opacity: 0.45 };
              }
              return (
                <button
                  key={tekst}
                  type="button"
                  data-testid="svar-alternativ"
                  disabled={feedback !== null}
                  onClick={() => registrerSvar(word, isAnswerCorrect(tekst, word, direction), tekst)}
                  style={stil}
                >
                  <span>{tekst}</span>
                  {feedback && erFasit && <Check size={20} aria-hidden="true" />}
                  {feedback && erValgt && !erFasit && <X size={20} aria-hidden="true" />}
                  {!feedback && harTale && (
                    <span
                      role="button"
                      aria-label={`Les opp ${tekst}`}
                      onClick={(e) => { e.stopPropagation(); lesOpp(tekst, svarLang); }}
                      style={{ display: 'inline-flex', cursor: 'pointer' }}
                    >
                      <Volume2 size={20} aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (feedback) return; registrerSvar(word, isAnswerCorrect(typedAnswer, word, direction), typedAnswer); }}
            style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 440 }}
          >
            <input
              autoFocus
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              disabled={feedback !== null}
              placeholder="Skriv svaret…"
              style={{
                flex: 1, padding: '14px 18px', fontSize: 17, fontFamily: 'var(--font-primary)',
                border: `2px solid ${feedback?.type === 'correct' ? 'var(--color-success)' : feedback?.type === 'wrong' ? 'var(--color-error)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)', outline: 'none', transition: 'border-color 0.2s',
              }}
            />
            <button type="submit" disabled={feedback !== null} style={primaerKnapp}>Sjekk</button>
          </form>
        )}

        {feedback?.type === 'correct' && (
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-success)', fontWeight: 800, fontSize: 20, animation: 'pop 0.3s ease' }}>
            {streak >= 3 ? <><Flame size={20} color="var(--color-primary)" aria-hidden="true" /> {streak} på rad!</> : <>Riktig! <PartyPopper size={20} aria-hidden="true" /></>}
          </p>
        )}
        {feedback?.type === 'wrong' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', animation: 'shake 0.4s ease' }}>
            <p style={{ color: 'var(--color-error)', fontWeight: 700 }}>
              Riktig svar: <strong>{feedback.correctAnswer}</strong>
            </p>
            <button type="button" onClick={gaaVidere} style={primaerKnapp} autoFocus>Neste →</button>
          </div>
        )}
      </main>
    </div>
  );
}

const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const kortOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200, border: 'none',
  background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center',
  padding: 20, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const kortPopup: React.CSSProperties = {
  background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
  border: '3px solid var(--color-border)', padding: '28px 32px', cursor: 'default',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  maxWidth: 320, animation: 'pop 0.35s ease', boxShadow: 'var(--shadow-lg)',
};
const tilbakeKnapp: React.CSSProperties = {
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '8px 16px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap',
};
const alternativKnapp: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '17px 22px', fontSize: 17, fontWeight: 700,
  background: 'var(--color-surface)', color: 'var(--color-text)',
  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
  cursor: 'pointer', fontFamily: 'var(--font-primary)',
  boxShadow: 'var(--shadow-sm)', transition: 'transform 0.12s, border-color 0.2s, background 0.2s',
};
const riktigStil: React.CSSProperties = {
  background: 'var(--color-success)', color: '#fff', borderColor: 'var(--color-success)',
};
const galtStil: React.CSSProperties = {
  background: 'var(--color-error)', color: '#fff', borderColor: 'var(--color-error)',
};
const hoyttalerKnapp: React.CSSProperties = {
  display: 'grid', placeItems: 'center', width: 48, height: 48, fontSize: 22,
  background: 'var(--color-surface)', border: '2px solid var(--color-border)',
  borderRadius: '50%', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
};
const sidePanel: React.CSSProperties = {
  position: 'fixed', top: '50%', transform: 'translateY(-50%)', zIndex: 50,
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  pointerEvents: 'none',
};

/** Kort-hjul (storskjerm): fyllingsring med 10 ruter mot neste kort. */
function Hjul({ fylt, total }: { fylt: number; total: number }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const andel = total > 0 ? Math.min(1, fylt / total) : 0;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={128} height={128} viewBox="0 0 120 120" role="img" aria-label={`${fylt} av ${total} mot neste kort`}>
        <circle cx={60} cy={60} r={R} fill="var(--color-surface)" stroke="rgba(0,0,0,0.08)" strokeWidth={10} />
        <circle
          cx={60} cy={60} r={R} fill="none" stroke="var(--color-primary)" strokeWidth={10}
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - andel)}
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.45s ease' }}
        />
        {Array.from({ length: total }, (_, i) => {
          const a = (i / total) * 2 * Math.PI - Math.PI / 2;
          return <circle key={i} cx={60 + Math.cos(a) * R} cy={60 + Math.sin(a) * R} r={3.5} fill={i < fylt ? '#fff' : 'var(--color-border)'} />;
        })}
        <text x={60} y={58} textAnchor="middle" fontSize={26} fontWeight={900} fill="var(--color-text)">{fylt}</text>
        <text x={60} y={76} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--color-text-muted)">av {total}</text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>NESTE KORT</div>
    </div>
  );
}

/** Kortbunke (storskjerm): kort vunnet i økten, sist vunnet øverst. */
function Kortbunke({ kort }: { kort: KortDef[] }) {
  if (kort.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ width: 116, height: 150, margin: '0 auto', border: '2px dashed var(--color-border)', borderRadius: 14, display: 'grid', placeItems: 'center' }}>
          <Layers size={32} aria-hidden="true" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, marginTop: 8 }}>KORTBUNKE</div>
        <div style={{ fontSize: 11 }}>Vinn kort her</div>
      </div>
    );
  }
  const vis = kort.slice(-5); // de 5 siste; sist vunnet ligger øverst
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 172, margin: '0 auto' }}>
        {vis.map((k, i) => (
          <div
            key={`${k.id}-${i}`}
            style={{
              position: 'absolute', top: i * 7, left: '50%',
              transform: `translateX(-50%) rotate(${(i - (vis.length - 1) / 2) * 2}deg)`,
              width: 116, background: 'var(--color-surface)',
              border: `2px solid ${RARITY_CONFIG[k.rarity].farge}`, borderRadius: 14,
              padding: 8, boxShadow: 'var(--shadow-card)', zIndex: i,
              animation: i === vis.length - 1 ? 'pop 0.4s ease' : undefined,
            }}
          >
            <img src={k.image} alt={k.name} style={{ width: '100%', height: 88, objectFit: 'contain' }} />
            <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.name}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', marginTop: 8 }}>{kort.length} KORT</div>
    </div>
  );
}
