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
  masteredCount,
  type LeitnerState,
} from '../features/glosemester/leitner';
import { registrerRiktigSvar } from '../lib/rewards';
import { lesOpp, vibrer } from '../lib/speech';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

type Feedback = { type: 'correct' | 'wrong'; correctAnswer: string } | null;

interface AktivtSporsmal {
  word: Word;
  mode: QuestionMode;
  alternatives?: Word[];
}

export function GlosemesterPractice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const level = params.get('niva') as LevelId | null;
  const gyldigNiva = Boolean(level && getAvailableLevels().includes(level));

  const direction: Direction = 'en';
  const words = useMemo(() => (gyldigNiva ? getWordsForLevel(level as LevelId) : []), [gyldigNiva, level]);
  const rundeLengde = words.length;

  // Leitner-tilstand i en ref (persisteres); UI trenger ikke re-rendre på hver endring.
  const leitnerRef = useRef<LeitnerState>({});
  const [klar, setKlar] = useState(false);

  const [sporsmal, setSporsmal] = useState<AktivtSporsmal | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [besvart, setBesvart] = useState(0);
  const [riktige, setRiktige] = useState(0);
  const [streak, setStreak] = useState(0);
  const [valgtSvar, setValgtSvar] = useState<string | null>(null);
  const [ferdig, setFerdig] = useState(false);
  const forrigeRef = useRef<Word | undefined>(undefined);

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
        setRiktige((n) => n + 1);
        setStreak((n) => n + 1);
        const { diamanterTildelt } = registrerRiktigSvar();
        if (diamanterTildelt) toast.success(`💎 BONUS! Du fikk ${diamanterTildelt} diamanter!`);
        setFeedback({ type: 'correct', correctAnswer: answerFor(word, direction) });
        window.setTimeout(gaaVidere, 900);
      } else {
        setStreak(0);
        vibrer(200);
        setFeedback({ type: 'wrong', correctAnswer: answerFor(word, direction) });
      }
    },
    [level, gaaVidere],
  );

  const progresjon = rundeLengde > 0 ? Math.round((besvart / rundeLengde) * 100) : 0;

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
    const mestret = masteredCount(leitnerRef.current, words);
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>Bra jobbet! 🎉</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>{riktige} av {besvart} riktig ({prosent}%)</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>💪 {mestret} av {words.length} ord mestret</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => { setFerdig(false); setBesvart(0); setRiktige(0); setStreak(0); forrigeRef.current = undefined; nesteSporsmal(); }} style={primaerKnapp}>Øv igjen</button>
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
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
        <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>← Avslutt</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, background: 'rgba(0,0,0,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${progresjon}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', minWidth: 44, textAlign: 'right' }}>{besvart + 1}/{rundeLengde}</span>
        {streak >= 2 && (
          <span key={streak} style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', animation: 'pop 0.3s ease', whiteSpace: 'nowrap' }}>
            🔥 {streak}
          </span>
        )}
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)', padding: 'var(--space-6)', textAlign: 'center' }}>
        <div key={word.s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', animation: 'floatIn 0.35s ease' }}>
          {word.image && direction === 'en' && (
            <img src={word.image} alt={word.s} style={{ maxWidth: 160, maxHeight: 160, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))' }} />
          )}
          <h2 style={{ fontSize: 'clamp(2.2rem, 9vw, 4rem)', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.05 }}>
            {promptFor(word, direction)}
          </h2>
          <button
            type="button"
            aria-label="Les opp ordet"
            onClick={() => lesOpp(promptFor(word, direction), direction === 'en' ? 'en-US' : 'no-NO')}
            style={hoyttalerKnapp}
          >
            🔊
          </button>
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
                  {feedback && erFasit && <span aria-hidden="true">✓</span>}
                  {feedback && erValgt && !erFasit && <span aria-hidden="true">✕</span>}
                  {!feedback && (
                    <span
                      role="button"
                      aria-label={`Les opp ${tekst}`}
                      onClick={(e) => { e.stopPropagation(); lesOpp(tekst, svarLang); }}
                      style={{ fontSize: 20, cursor: 'pointer' }}
                    >
                      🔊
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
          <p style={{ color: 'var(--color-success)', fontWeight: 800, fontSize: 20, animation: 'pop 0.3s ease' }}>
            {streak >= 3 ? `🔥 ${streak} på rad!` : 'Riktig! 🎉'}
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
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
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
