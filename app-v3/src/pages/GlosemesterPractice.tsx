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
    (word: Word, korrekt: boolean) => {
      // Oppdater + lagre Leitner-tilstand.
      leitnerRef.current = recordAnswer(leitnerRef.current, word, korrekt);
      saveLeitnerState(level as LevelId, leitnerRef.current);

      setBesvart((n) => n + 1);
      if (korrekt) {
        setRiktige((n) => n + 1);
        const { diamanterTildelt } = registrerRiktigSvar();
        if (diamanterTildelt) toast.success(`💎 BONUS! Du fikk ${diamanterTildelt} diamanter!`);
        setFeedback({ type: 'correct', correctAnswer: answerFor(word, direction) });
        window.setTimeout(gaaVidere, 800);
      } else {
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
          <button type="button" onClick={() => { setFerdig(false); setBesvart(0); setRiktige(0); forrigeRef.current = undefined; nesteSporsmal(); }} style={primaerKnapp}>Øv igjen</button>
          <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>Velg nivå</button>
        </div>
      </div>
    );
  }

  if (!klar || !sporsmal) return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;

  const { word, mode, alternatives } = sporsmal;
  const svarLang = direction === 'en' ? 'en-US' : 'no-NO';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>← Tilbake</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999 }}>
            <div style={{ width: `${progresjon}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{besvart + 1}/{rundeLengde}</span>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)', padding: 'var(--space-6)', textAlign: 'center' }}>
        {word.image && direction === 'en' && (
          <img src={word.image} alt={word.s} style={{ maxWidth: 160, maxHeight: 160 }} />
        )}
        <h2 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, color: 'var(--color-text)' }}>
          {promptFor(word, direction)}
        </h2>

        {mode === 'mc' && alternatives ? (
          <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 420 }}>
            {alternatives.map((alt) => {
              const tekst = answerFor(alt, direction);
              return (
                <button
                  key={tekst}
                  type="button"
                  disabled={feedback !== null}
                  onClick={() => registrerSvar(word, isAnswerCorrect(tekst, word, direction))}
                  style={alternativKnapp}
                >
                  <span>{tekst}</span>
                  <span
                    role="button"
                    aria-label={`Les opp ${tekst}`}
                    onClick={(e) => { e.stopPropagation(); lesOpp(tekst, svarLang); }}
                    style={{ fontSize: 20, cursor: 'pointer' }}
                  >
                    🔊
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (feedback) return; registrerSvar(word, isAnswerCorrect(typedAnswer, word, direction)); }}
            style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 420 }}
          >
            <input
              autoFocus
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              disabled={feedback !== null}
              placeholder="Skriv svaret…"
              style={{ flex: 1, padding: '12px 16px', fontSize: 16, border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
            />
            <button type="submit" disabled={feedback !== null} style={primaerKnapp}>Sjekk</button>
          </form>
        )}

        {feedback?.type === 'correct' && <p style={{ color: 'var(--color-success)', fontWeight: 700 }}>✅ Riktig!</p>}
        {feedback?.type === 'wrong' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <p style={{ color: 'var(--color-error)', fontWeight: 700 }}>Riktig svar: {feedback.correctAnswer}</p>
            <button type="button" onClick={gaaVidere} style={primaerKnapp}>Neste →</button>
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
  padding: '15px 20px', fontSize: 16, fontWeight: 600,
  background: 'var(--color-surface)', color: 'var(--color-text)',
  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
