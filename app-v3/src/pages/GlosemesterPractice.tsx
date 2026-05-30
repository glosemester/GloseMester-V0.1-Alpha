/**
 * Øve-økt — React-port av v2 renderQuizUI/showNextQuestion-flyten.
 * Bruker den rene practiceEngine for logikk og holder økt-state i React.
 * Flervalg eller skriving avgjøres per spørsmål av nivået.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createSession,
  currentQuestion,
  isAnswerCorrect,
  answerFor,
  promptFor,
  type PracticeSession,
  type Question,
} from '../features/glosemester/practiceEngine';
import { getAvailableLevels, type LevelId, type Word } from '../features/glosemester/vocabulary';
import { registrerRiktigSvar } from '../lib/rewards';
import { lesOpp, vibrer } from '../lib/speech';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

type Feedback = { type: 'correct' | 'wrong'; correctAnswer: string } | null;

export function GlosemesterPractice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const level = params.get('niva') as LevelId | null;

  const gyldigNiva = level && getAvailableLevels().includes(level);

  const [session, setSession] = useState<PracticeSession | null>(() =>
    gyldigNiva ? createSession(level) : null,
  );
  const [question, setQuestion] = useState<Question | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [ferdig, setFerdig] = useState(false);

  // Bygg spørsmål når index endrer seg.
  useEffect(() => {
    if (!session) return;
    const q = currentQuestion(session);
    if (q === null) {
      setFerdig(true);
    } else {
      setQuestion(q);
      setTypedAnswer('');
      setFeedback(null);
    }
  }, [session]);

  const gaaTilNeste = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, index: prev.index + 1 } : prev));
  }, []);

  const registrerSvar = useCallback(
    (word: Word, korrekt: boolean) => {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              totalQuestions: prev.totalQuestions + 1,
              correctAnswers: prev.correctAnswers + (korrekt ? 1 : 0),
            }
          : prev,
      );

      if (korrekt) {
        const { diamantTildelt } = registrerRiktigSvar();
        if (diamantTildelt) toast.success('💎 +1 Diamant! (100 XP nådd)');
        setFeedback({ type: 'correct', correctAnswer: answerFor(word, session!.direction) });
        window.setTimeout(gaaTilNeste, 800);
      } else {
        vibrer(200);
        setFeedback({ type: 'wrong', correctAnswer: answerFor(word, session!.direction) });
      }
    },
    [gaaTilNeste, session],
  );

  const progresjon = useMemo(() => {
    if (!session) return 0;
    return Math.round((session.index / session.words.length) * 100);
  }, [session]);

  if (!gyldigNiva || !session) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p>Ugyldig eller manglende nivå.</p>
        <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>
          Velg nivå
        </button>
      </div>
    );
  }

  if (ferdig) {
    const prosent = session.totalQuestions
      ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
      : 0;
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>Bra jobbet! 🎉</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {session.correctAnswers} av {session.totalQuestions} riktig ({prosent}%)
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => { setFerdig(false); setSession(createSession(session.level)); }} style={primaerKnapp}>
            Øv igjen
          </button>
          <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>
            Velg nivå
          </button>
        </div>
      </div>
    );
  }

  if (!question) return <div style={{ padding: 'var(--space-8)' }}>Laster…</div>;

  const { word, mode, alternatives } = question;
  const svarLang = session.direction === 'en' ? 'en-US' : 'no-NO';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* Topplinje med tilbake + progresjon */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={tilbakeKnapp}>
          ← Tilbake
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999 }}>
            <div style={{ width: `${progresjon}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {session.index + 1}/{session.words.length}
        </span>
      </header>

      {/* Spørsmål */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)', padding: 'var(--space-6)', textAlign: 'center' }}>
        {word.image && session.direction === 'en' && (
          <img src={word.image} alt={word.s} style={{ maxWidth: 160, maxHeight: 160 }} />
        )}
        <h2 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, color: 'var(--color-text)' }}>
          {promptFor(word, session.direction)}
        </h2>

        {mode === 'mc' && alternatives ? (
          <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 420 }}>
            {alternatives.map((alt) => {
              const tekst = answerFor(alt, session.direction);
              return (
                <button
                  key={tekst}
                  type="button"
                  disabled={feedback !== null}
                  onClick={() => registrerSvar(word, isAnswerCorrect(tekst, word, session.direction))}
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
            onSubmit={(e) => { e.preventDefault(); if (feedback) return; registrerSvar(word, isAnswerCorrect(typedAnswer, word, session.direction)); }}
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

        {/* Tilbakemelding */}
        {feedback?.type === 'correct' && (
          <p style={{ color: 'var(--color-success)', fontWeight: 700 }}>✅ Riktig!</p>
        )}
        {feedback?.type === 'wrong' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <p style={{ color: 'var(--color-error)', fontWeight: 700 }}>
              Riktig svar: {feedback.correctAnswer}
            </p>
            <button type="button" onClick={gaaTilNeste} style={primaerKnapp}>Neste →</button>
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
