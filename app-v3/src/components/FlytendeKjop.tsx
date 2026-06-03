/**
 * Flytende «Kjøp nå»-CTA nederst til høyre på marketing-sider. Glir inn med
 * fjær-animasjon etter en liten forsinkelse, har en diskret pulserende glød for
 * å trekke blikket, og kan lukkes (huskes for økten). Respekterer reduced-motion.
 *
 * Fungerer som position:fixed selv om den rendres inne i en side, fordi
 * PageTransition kollapser transformen til `none` i hvile (se PageTransition.tsx).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShoppingBag, ArrowRight, X } from 'lucide-react';

interface Props {
  /** Lenkemål for kjøp (intern rute). */
  to: string;
  /** Hovedtekst på knappen. */
  tittel?: string;
  /** Kort, relevant info under tittelen. */
  info: string;
  /** Unik nøkkel så «lukket» huskes per CTA i økten. */
  id: string;
}

export function FlytendeKjop({ to, tittel = 'Kjøp nå', info, id }: Props) {
  const nokkel = `cta-skjult-${id}`;
  const [skjult, setSkjult] = useState(() => {
    try { return sessionStorage.getItem(nokkel) === '1'; } catch { return false; }
  });
  const reduser = useReducedMotion();
  if (skjult) return null;

  function lukk(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try { sessionStorage.setItem(nokkel, '1'); } catch { /* tom */ }
    setSkjult(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.6 }}
      style={beholder}
    >
      <motion.div
        animate={reduser ? undefined : {
          boxShadow: [
            '0 8px 24px rgba(0,0,0,0.18)',
            '0 10px 34px rgba(255,107,71,0.50)',
            '0 8px 24px rgba(0,0,0,0.18)',
          ],
        }}
        transition={reduser ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.035 }}
        whileTap={{ scale: 0.97 }}
        style={{ position: 'relative', borderRadius: 'var(--radius-lg)' }}
      >
        <button type="button" onClick={lukk} aria-label="Lukk" style={lukkKnapp}>
          <X size={14} aria-hidden="true" />
        </button>
        <Link to={to} style={kort} aria-label={`${tittel} – ${info}`}>
          <motion.div
            style={ikonSirkel}
            animate={reduser ? undefined : { rotate: [0, -8, 8, 0] }}
            transition={reduser ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
          >
            <ShoppingBag size={20} aria-hidden="true" />
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              {tittel} <ArrowRight size={16} aria-hidden="true" />
            </div>
            <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.35 }}>{info}</div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

const beholder: React.CSSProperties = {
  position: 'fixed',
  right: 'clamp(12px, 4vw, 24px)',
  bottom: 'clamp(12px, 4vw, 24px)',
  zIndex: 50,
  maxWidth: 300,
};

const kort: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px 14px 14px',
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  color: '#fff',
  textDecoration: 'none',
};

const ikonSirkel: React.CSSProperties = {
  flexShrink: 0,
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.22)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const lukkKnapp: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 6,
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,0.22)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  lineHeight: 0,
  zIndex: 2,
};
