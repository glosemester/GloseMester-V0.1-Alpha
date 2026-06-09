/**
 * Nivåvalg for GloseMester — React-port av v2 renderPracticeUI.
 * Viser ett kort per nivå; klikk navigerer til øve-økten (/ov?niva=...).
 */
import { useNavigate } from 'react-router-dom';
import { BookOpen, Flame, Lock } from 'lucide-react';
import { getAvailableLevels, getWordCountForLevel, getWordsForLevel, levelMetadata } from '../features/glosemester/vocabulary';
import { loadLeitnerState, nivaProsent } from '../features/glosemester/leitner';
import { lesStreak } from '../lib/streak';
import { harAlleNivaer, GRATIS_NIVA } from '../lib/tilgang';
import { startFeideLogin } from '../lib/auth';
import { useAuthStore } from '../state/useAuthStore';
import { ROUTES } from '../routes/paths';

export function GlosemesterStart() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const levels = getAvailableLevels();
  const alleNivaer = harAlleNivaer(bruker);
  const streak = lesStreak();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 40 }}>
      <header
        style={{
          background: 'linear-gradient(170deg, var(--color-primary-hover) 0%, var(--color-primary) 100%)',
          padding: '52px 24px 44px',
          textAlign: 'center',
          borderRadius: '0 0 48px 48px',
          marginBottom: 32,
          color: '#fff',
        }}
      >
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 5vw, 42px)' }}>GloseMester</h1>
        <p style={{ opacity: 0.85, marginTop: 8 }}>Velg nivå for å begynne å øve</p>
        {streak >= 2 && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14,
              background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '6px 14px',
              fontWeight: 800, fontSize: 15,
            }}
            aria-label={`Streak: ${streak} riktige på rad`}
          >
            <Flame size={18} aria-hidden="true" /> {streak} på rad
          </div>
        )}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 18,
          maxWidth: 740,
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {levels.map((level) => {
          const meta = levelMetadata[level];
          const totalt = getWordCountForLevel(level);
          const pct = nivaProsent(loadLeitnerState(level), getWordsForLevel(level));
          const laast = !alleNivaer && !(GRATIS_NIVA as readonly string[]).includes(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => laast ? startFeideLogin() : navigate(`${ROUTES.PRACTICE}?niva=${level}`)}
              data-level={level}
              aria-label={laast ? `${meta.name} — krever Feide-innlogging` : meta.name}
              style={{
                textAlign: 'left',
                background: laast ? 'var(--color-bg)' : 'var(--color-surface)',
                border: `1px solid ${laast ? 'var(--color-border)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '28px 24px 24px',
                boxShadow: laast ? 'none' : 'var(--shadow-card)',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                opacity: laast ? 0.7 : 1,
                position: 'relative',
              }}
            >
              {laast && (
                <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5, background: 'var(--color-border)', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  <Lock size={12} aria-hidden="true" /> Feide
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, paddingRight: laast ? 80 : 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{meta.name}</h3>
                <span style={{ flexShrink: 0, background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: laast ? 'none' : undefined }}>
                  {meta.description}
                </span>
              </div>
              {!laast && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><BookOpen size={18} aria-hidden="true" /> {totalt} ord</span>
                    <span>{pct}% lært</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden', marginBottom: 20 }} aria-label={`Fremgang: ${pct} prosent`}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ display: 'block', textAlign: 'center', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '14px 20px', fontWeight: 700 }}>
                    Start øving
                  </span>
                </>
              )}
              {laast && (
                <div style={{ marginTop: 4 }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 16px' }}>{meta.description} · {totalt} ord</p>
                  <span style={{ display: 'block', textAlign: 'center', background: 'var(--color-dark-bg)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '14px 20px', fontWeight: 700, fontSize: 14 }}>
                    Logg inn med Feide for å låse opp
                  </span>
                </div>
              )}
            </button>
          );
        })}

        {/* Forklaring under rutenettet for gjester */}
        {!alleNivaer && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, paddingTop: 4 }}>
            Nivå 3 og 4 låses opp gratis med Feide-innlogging.
          </div>
        )}
      </div>
    </div>
  );
}
