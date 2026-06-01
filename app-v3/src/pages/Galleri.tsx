/**
 * Kortsamling / galleri — React-port av v2 KortGalleri, med to visninger:
 *  - «Mine Kort» (visAlle=false): kun kort eleven eier, med antall + panting.
 *  - «Galleri»   (visAlle=true):  alle 152 kort; ikke-samlede vises grået ut.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Trophy, Rocket, Lock, Recycle } from 'lucide-react';
import { hentSamling, samlingStats, panteKort } from '../features/kort/kortSamling';
import { getKortById, kortData, RARITY_CONFIG, type Rarity } from '../features/kort/kortData';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

type Sortering = 'nyeste' | 'sjeldenhet' | 'navn';

const RARITY_RANG: Record<Rarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };

interface VisKort {
  id: string;
  navn: string;
  bilde: string;
  rarity: Rarity;
  antall: number; // 0 = ikke samlet (kun relevant i galleri-visning)
}

export function Galleri({ visAlle = false }: { visAlle?: boolean }) {
  const navigate = useNavigate();
  const [sortering, setSortering] = useState<Sortering>('nyeste');
  const [versjon, setVersjon] = useState(0); // tving re-les etter pant

  const { kort, stats } = useMemo(() => {
    const samling = hentSamling();
    const stats = samlingStats();

    // Antall per kort-id i samlingen.
    const antallPer = new Map<string, number>();
    samling.forEach((k) => antallPer.set(String(k.id), (antallPer.get(String(k.id)) ?? 0) + 1));

    let kort: VisKort[];
    if (visAlle) {
      // Hele katalogen; eide markeres med antall, resten antall=0 (grået ut).
      kort = kortData.map((def) => ({
        id: def.id, navn: def.name, bilde: def.image, rarity: def.rarity,
        antall: antallPer.get(def.id) ?? 0,
      }));
    } else {
      // Kun eide kort, i innsamlingsrekkefølge (siste vunnet sist).
      const sett = new Set<string>();
      kort = [];
      samling.forEach((k) => {
        const def = getKortById(String(k.id));
        if (!def || sett.has(def.id)) return;
        sett.add(def.id);
        kort.push({ id: def.id, navn: def.name, bilde: def.image, rarity: def.rarity, antall: antallPer.get(def.id) ?? 1 });
      });
    }

    // Sortering. I galleri-visning sorteres alltid eide før ueide.
    const cmp = (a: VisKort, b: VisKort) => {
      if (sortering === 'navn') return a.navn.localeCompare(b.navn);
      if (sortering === 'sjeldenhet') return RARITY_RANG[b.rarity] - RARITY_RANG[a.rarity];
      return 0; // 'nyeste' håndteres under
    };
    if (visAlle) {
      kort.sort((a, b) => {
        const eid = (b.antall > 0 ? 1 : 0) - (a.antall > 0 ? 1 : 0);
        if (eid !== 0) return eid;
        return sortering === 'nyeste' ? RARITY_RANG[b.rarity] - RARITY_RANG[a.rarity] : cmp(a, b);
      });
    } else if (sortering === 'nyeste') {
      kort.reverse();
    } else {
      kort.sort(cmp);
    }

    return { kort, stats };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortering, versjon, visAlle]);

  function pant(id: string) {
    const nytt = panteKort(id);
    if (nytt) {
      toast.success(`Pantet! Du fikk ${nytt.name} (${RARITY_CONFIG[nytt.rarity].tekst})`);
      setVersjon((v) => v + 1);
    }
  }

  // Tom «Mine Kort»-visning: vennlig tomtilstand med CTA.
  if (!visAlle && kort.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <Layers size={64} color="var(--color-primary)" aria-hidden="true" />
        <h3 style={{ fontWeight: 800 }}>Ingen kort ennå</h3>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '38ch' }}>
          Øv og svar riktig for å vinne kort — du får ett for hvert 10. riktige svar,
          og ekstra når du gjør det bra på en prøve!
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER_START)} style={primaerKnapp}>
            <Rocket size={16} aria-hidden="true" /> Start øving
          </button>
          <button type="button" onClick={() => navigate(ROUTES.GALLERY)} style={chip}>
            <Trophy size={16} aria-hidden="true" /> Se hele galleriet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '24px 20px 48px', maxWidth: 900, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>{visAlle ? 'Galleri' : 'Mine Kort'}</h1>
        <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 14 }}>
          {stats.unike} av {kortData.length} samlet
        </div>
      </header>

      {/* Bytt mellom Mine Kort og Galleri */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => navigate(ROUTES.MY_CARDS)} style={{ ...chip, ...(!visAlle ? aktivChip : {}) }}>
          <Layers size={16} aria-hidden="true" /> Mine Kort
        </button>
        <button type="button" onClick={() => navigate(ROUTES.GALLERY)} style={{ ...chip, ...(visAlle ? aktivChip : {}) }}>
          <Trophy size={16} aria-hidden="true" /> Galleri
        </button>
      </div>

      {/* Fremgang (kun i galleri-visning) */}
      {visAlle && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${(stats.unike / kortData.length) * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999 }} />
          </div>
        </div>
      )}

      {/* Sortering */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['nyeste', 'sjeldenhet', 'navn'] as Sortering[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSortering(s)}
            style={{ ...chip, ...(sortering === s ? aktivChip : {}) }}
          >
            {s === 'nyeste' ? 'Nyeste' : s === 'sjeldenhet' ? 'Sjeldenhet' : 'Navn'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {kort.map((k) => {
          const cfg = RARITY_CONFIG[k.rarity];
          const eid = k.antall > 0;
          return (
            <div
              key={k.id}
              style={{
                background: 'var(--color-surface)',
                border: `2px solid ${eid ? cfg.farge : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 12,
                textAlign: 'center',
                boxShadow: eid ? 'var(--shadow-card)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                opacity: eid ? 1 : 0.55,
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={k.bilde}
                  alt={eid ? k.navn : 'Ikke samlet'}
                  loading="lazy"
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', filter: eid ? 'none' : 'grayscale(1)' }}
                />
                {!eid && (
                  <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }} aria-hidden="true"><Lock size={32} color="var(--color-text-muted)" /></span>
                )}
                {k.antall > 1 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--color-primary)', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                    ×{k.antall}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: eid ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                {eid ? k.navn : '???'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: eid ? cfg.farge : 'var(--color-text-muted)' }}>
                {cfg.tekst}
              </div>
              {!visAlle && k.antall >= 3 && (
                <button type="button" onClick={() => pant(k.id)} style={pantKnapp}>
                  <Recycle size={14} aria-hidden="true" /> Pant 2 → nytt kort
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
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const chip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-surface)', color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)',
  padding: '6px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const aktivChip: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)',
};
const pantKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-md)', padding: '6px 8px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
