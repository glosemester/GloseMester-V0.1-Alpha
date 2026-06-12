/**
 * Nivå-opp-feiring — fullskjerms overlay som vises når en innlogget elev
 * krysser en nivågrense (sjekkNivaOpp). Spring-pop av nivåringen, radierende
 * CSS-partikler (nivaPartikkel i base.css, ingen ekstra avhengighet) og liste
 * over hva som ble låst opp på nivået. Gjester får aldri denne.
 */
import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Unlock, Sparkles } from 'lucide-react';
import { nivaFarge, type Opplasning } from '../features/niva/nivaSystem';
import { RARITY_CONFIG } from '../features/kort/kortData';
import { NivaRing } from './NivaBadge';
import { hapticSuksess } from '../lib/native';

const ANTALL_PARTIKLER = 14;

export function NivaOppOverlay({ nyttNiva, opplasninger, onLukk }: {
  nyttNiva: number;
  opplasninger: Opplasning[];
  onLukk: () => void;
}) {
  const reduserBevegelse = useReducedMotion();
  useEffect(() => {
    void hapticSuksess();
  }, []);

  const farge = nivaFarge(nyttNiva);
  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label={`Du har nådd nivå ${nyttNiva}`}>
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        style={popup}
      >
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          {!reduserBevegelse && Array.from({ length: ANTALL_PARTIKLER }, (_, i) => {
            const vinkel = (i / ANTALL_PARTIKLER) * 2 * Math.PI;
            const avstand = 90 + (i % 3) * 26;
            return (
              <span
                key={i}
                className="niva-partikkel"
                aria-hidden="true"
                style={{
                  '--dx': `${Math.round(Math.cos(vinkel) * avstand)}px`,
                  '--dy': `${Math.round(Math.sin(vinkel) * avstand)}px`,
                  background: i % 2 === 0 ? farge : 'var(--color-accent)',
                  animationDelay: `${(i % 4) * 0.07}s`,
                } as React.CSSProperties}
              />
            );
          })}
          <span
            className="kort-glod"
            style={{
              position: 'relative', display: 'inline-block', borderRadius: '50%',
              '--glod-farge': farge, '--glod-radius': '22px',
            } as React.CSSProperties}
          >
            {/* Sjokkbølger som ekspanderer ut fra ringen (to, forskjøvet). */}
            {!reduserBevegelse && (
              <>
                <span className="niva-bolge" aria-hidden="true" style={{ '--bolge-farge': farge } as React.CSSProperties} />
                <span className="niva-bolge" aria-hidden="true" style={{ '--bolge-farge': 'var(--color-accent)', animationDelay: '0.35s' } as React.CSSProperties} />
              </>
            )}
            <NivaRing niva={nyttNiva} prosent={100} storrelse={140} />
          </span>
        </div>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.18 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 28, color: 'var(--color-text)' }}
        >
          <Sparkles size={26} color={farge} aria-hidden="true" /> Nivå {nyttNiva}!
        </motion.div>
        {opplasninger.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {opplasninger.map((o, i) => (
              <motion.div
                key={`${o.category}-${o.rarity}`}
                className="kort-glod"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.35 + i * 0.12 }}
                style={{
                  ...opplasningRad,
                  borderColor: RARITY_CONFIG[o.rarity].farge,
                  '--glod-farge': RARITY_CONFIG[o.rarity].farge,
                  '--glod-radius': '8px',
                } as React.CSSProperties}
              >
                <Unlock size={18} color={RARITY_CONFIG[o.rarity].farge} aria-hidden="true" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{o.etikett} låst opp!</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', margin: 0 }}>
            Sterkt jobba! Fortsett å øve — du nærmer deg neste opplåsning.
          </p>
        )}
        <button type="button" onClick={onLukk} style={fortsettKnapp} autoFocus>
          Fortsett
        </button>
      </motion.div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center',
  padding: 20, fontFamily: 'var(--font-primary)',
};
const popup: React.CSSProperties = {
  background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
  border: '3px solid var(--color-border)', padding: '32px 32px 28px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
  maxWidth: 340, width: '100%', boxShadow: 'var(--shadow-lg)',
};
const opplasningRad: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  padding: '10px 14px', background: 'var(--color-bg)',
};
const fortsettKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  width: '100%', background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '12px 20px', fontWeight: 700,
  fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-primary)', marginTop: 4,
};
