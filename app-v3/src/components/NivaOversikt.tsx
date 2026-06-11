/**
 * Nivåoversikt — popup som viser alle nivåene (1–10), XP-kravene og hva som
 * låses opp på hvert nivå. Åpnes ved å trykke på nivå-badgen (NivaBadge).
 * Nådde nivåer hukes av; fremtidige opplåsinger vises med lås.
 */
import { Check, Lock, Unlock, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  NIVA_TERSKLER,
  nivaFarge,
  nivaProgresjon,
  opplasningerVedNiva,
} from '../features/niva/nivaSystem';
import { RARITY_CONFIG } from '../features/kort/kortData';

export function NivaOversikt({ xp, onLukk }: { xp: number; onLukk: () => void }) {
  const p = nivaProgresjon(xp);
  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Nivåoversikt" onClick={onLukk}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={popup}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <h2 style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>Nivåoversikt</h2>
          <button type="button" onClick={onLukk} aria-label="Lukk" style={lukkKnapp}>
            <X size={20} />
          </button>
        </div>
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, margin: 0 }}>
          <Zap size={14} color="var(--color-accent)" aria-hidden="true" />
          Du er på nivå {p.niva}. {p.erMaks ? 'Maks nivå — alt er låst opp!' : `${p.xpTilNeste} XP til nivå ${p.niva + 1} — hvert riktige svar gir 1 XP.`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {NIVA_TERSKLER.map((terskel, i) => {
            const niva = i + 1;
            const nadd = p.niva >= niva;
            const aktiv = p.niva === niva;
            const opplasninger = opplasningerVedNiva(niva);
            const farge = nivaFarge(niva);
            return (
              <div
                key={niva}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: aktiv ? 'var(--color-primary-light)' : 'transparent',
                  border: aktiv ? '2px solid var(--color-primary)' : '2px solid transparent',
                  opacity: nadd ? 1 : 0.75,
                }}
                aria-current={aktiv ? 'true' : undefined}
              >
                <span
                  style={{
                    display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '50%',
                    flexShrink: 0, fontWeight: 900, fontSize: 15,
                    background: nadd ? farge : 'var(--color-bg)',
                    color: nadd ? '#fff' : 'var(--color-text-muted)',
                    border: `2px solid ${nadd ? farge : 'var(--color-border)'}`,
                  }}
                  aria-hidden="true"
                >
                  {niva}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>Nivå {niva}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>
                      {terskel === 0 ? 'start' : `fra ${terskel} XP`}
                    </span>
                  </div>
                  {opplasninger.map((o) => (
                    <div key={`${o.category}-${o.rarity}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: RARITY_CONFIG[o.rarity].farge }}>
                      {nadd
                        ? <Unlock size={13} aria-hidden="true" />
                        : <Lock size={13} aria-hidden="true" />}
                      {o.etikett}
                    </div>
                  ))}
                </div>
                {nadd && <Check size={18} color="var(--color-success)" aria-label="Nådd" style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        <p style={{ color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center', margin: 0 }}>
          Kortpakkene Biler og Dinosaurer har alle kort åpne fra start.
        </p>
      </motion.div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center',
  padding: 16, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const popup: React.CSSProperties = {
  background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
  border: '3px solid var(--color-border)', padding: '20px 18px', cursor: 'default',
  display: 'flex', flexDirection: 'column', gap: 12,
  maxWidth: 400, width: '100%', maxHeight: '84dvh', boxShadow: 'var(--shadow-lg)',
};
const lukkKnapp: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--color-text-muted)', padding: 4, display: 'grid', placeItems: 'center',
};
