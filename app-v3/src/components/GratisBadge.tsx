/**
 * Klistremerke nede i hjørnet på offentlige sider — «Gratis ut juli 2027».
 * Glir inn med fjær-animasjon og har en diskret pulserende glød for å trekke
 * blikket. Rent dekorativt (ingen lenke, ingen lukkeknapp) — teksten er
 * synlig for alle, kun animasjonen er dekorativ. Respekterer reduced-motion
 * via appens globale <MotionConfig reducedMotion="user"> (main.tsx).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function GratisBadge() {
  const reduser = useReducedMotion();

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
        style={merke}
      >
        <motion.span
          style={{ display: 'inline-flex' }}
          animate={reduser ? undefined : { rotate: [0, -10, 10, 0] }}
          transition={reduser ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
        >
          <Sparkles size={18} aria-hidden="true" />
        </motion.span>
        <span>Gratis ut juli 2027</span>
      </motion.div>
    </motion.div>
  );
}

const beholder: React.CSSProperties = {
  position: 'fixed',
  right: 'clamp(12px, 4vw, 24px)',
  bottom: 'clamp(12px, 4vw, 24px)',
  zIndex: 50,
};

const merke: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 'var(--radius-full)',
  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  color: '#fff',
  fontWeight: 800,
  fontSize: 14,
  fontFamily: 'var(--font-primary)',
  whiteSpace: 'nowrap',
};
