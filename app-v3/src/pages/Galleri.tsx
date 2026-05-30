/**
 * Kortsamling / galleri — React-port av v2 KortGalleri.
 * Viser elevens samlede kort gruppert per kort med antall, sjeldenhetsfarge og
 * panting av dubletter (≥3 kopier). Tomtilstand lenker til øving.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hentSamling, samlingStats, panteKort } from '../features/kort/kortSamling';
import { getKortById, RARITY_CONFIG, type Rarity } from '../features/kort/kortData';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

type Sortering = 'nyeste' | 'sjeldenhet' | 'navn';

const RARITY_RANG: Record<Rarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };

interface GruppertKort {
  id: string;
  navn: string;
  bilde: string;
  rarity: Rarity;
  antall: number;
}

export function Galleri() {
  const navigate = useNavigate();
  const [sortering, setSortering] = useState<Sortering>('nyeste');
  const [versjon, setVersjon] = useState(0); // tving re-les etter pant

  const { grupper, stats } = useMemo(() => {
    const samling = hentSamling();
    const stats = samlingStats();
    const map = new Map<string, GruppertKort>();
    samling.forEach((k) => {
      const def = getKortById(String(k.id));
      if (!def) return;
      const eks = map.get(def.id);
      if (eks) eks.antall++;
      else map.set(def.id, { id: def.id, navn: def.name, bilde: def.image, rarity: def.rarity, antall: 1 });
    });
    let grupper = [...map.values()];
    if (sortering === 'navn') grupper.sort((a, b) => a.navn.localeCompare(b.navn));
    else if (sortering === 'sjeldenhet') grupper.sort((a, b) => RARITY_RANG[b.rarity] - RARITY_RANG[a.rarity]);
    // 'nyeste' beholder innsettingsrekkefølge (siste vunnet sist i samling)
    else grupper = grupper.reverse();
    return { grupper, stats };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortering, versjon]);

  function pant(id: string) {
    const nytt = panteKort(id);
    if (nytt) {
      toast.success(`♻️ Pantet! Du fikk ${nytt.name} (${RARITY_CONFIG[nytt.rarity].tekst})`);
      setVersjon((v) => v + 1);
    }
  }

  if (grupper.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <div style={{ fontSize: 64 }}>🃏</div>
        <h3 style={{ fontWeight: 800 }}>Ingen kort ennå</h3>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '36ch' }}>
          Svar riktig på minst 80&nbsp;% av en prøve for å vinne ditt første kort!
        </p>
        <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={primaerKnapp}>
          🚀 Start øving
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '24px 20px 48px', maxWidth: 900, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>Min kortsamling</h1>
        <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 14 }}>
          {stats.unike} unike · {stats.total} totalt
        </div>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['nyeste', 'sjeldenhet', 'navn'] as Sortering[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSortering(s)}
            style={{
              ...chip,
              ...(sortering === s ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' } : {}),
            }}
          >
            {s === 'nyeste' ? 'Nyeste' : s === 'sjeldenhet' ? 'Sjeldenhet' : 'Navn'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {grupper.map((k) => {
          const cfg = RARITY_CONFIG[k.rarity];
          return (
            <div
              key={k.id}
              style={{
                background: 'var(--color-surface)',
                border: `2px solid ${cfg.farge}`,
                borderRadius: 'var(--radius-lg)',
                padding: 12,
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ position: 'relative' }}>
                <img src={k.bilde} alt={k.navn} loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }} />
                {k.antall > 1 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--color-primary)', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                    ×{k.antall}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{k.navn}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: cfg.farge }}>{cfg.emoji} {cfg.tekst}</div>
              {k.antall >= 3 && (
                <button type="button" onClick={() => pant(k.id)} style={pantKnapp}>
                  ♻️ Pant 2 → nytt kort
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const primaerKnapp: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const chip: React.CSSProperties = {
  background: 'var(--color-surface)', color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)',
  padding: '6px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const pantKnapp: React.CSSProperties = {
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-md)', padding: '6px 8px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
