/**
 * Nivåvalg for GloseMester — React-port av v2 renderPracticeUI.
 * Viser ett kort per nivå; klikk navigerer til øve-økten (/ov?niva=...).
 */
import { useNavigate } from 'react-router-dom';
import { BookOpen, Flame } from 'lucide-react';
import { getAvailableLevels, getWordCountForLevel, levelMetadata } from '../features/glosemester/vocabulary';
import { lesStreak } from '../lib/streak';
import { ROUTES } from '../routes/paths';

export function GlosemesterStart() {
  const navigate = useNavigate();
  const levels = getAvailableLevels();
  // Bug 6: vis den vedvarende streaken her også, ikke bare inne i øvemodus.
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
          return (
            <button
              key={level}
              type="button"
              onClick={() => navigate(`${ROUTES.PRACTICE}?niva=${level}`)}
              data-level={level}
              style={{
                textAlign: 'left',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px 24px 24px',
                boxShadow: 'var(--shadow-card)',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{meta.name}</h3>
                <span
                  style={{
                    flexShrink: 0,
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    borderRadius: 999,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {meta.description}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, marginBottom: 20 }}>
                <BookOpen size={18} aria-hidden="true" /> {getWordCountForLevel(level)} ord
              </div>
              <span
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  padding: '14px 20px',
                  fontWeight: 700,
                }}
              >
                Start øving
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
