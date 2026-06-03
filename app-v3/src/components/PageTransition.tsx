/**
 * #5 Skjermovergangsanimasjoner + #7 spring-fysikk.
 * Pakker rute-innholdet i en motion-div som glir inn ved navigering — fra
 * høyre når man går fremover (PUSH), fra venstre når man går tilbake (POP) —
 * med iOS-aktig fjær-easing. Enter-animasjon (ikke exit), som er det
 * data-routeren støtter rent med <Outlet/>.
 *
 * Viktig: ved hvile kollapses transformen til `none` (transformTemplate), slik
 * at den ikke etablerer en containing block som ville forskjøvet `position:
 * fixed`-elementer inne i sidene (f.eks. kort-popup i øvemodus).
 */
import { motion } from 'framer-motion';
import { useLocation, useNavigationType } from 'react-router-dom';
import type { ReactNode } from 'react';

const collapseAtRest = (_latest: unknown, generated: string): string =>
  /^translateX\(0(px|%)?\)$/.test(generated.trim()) ? 'none' : generated;

export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const tilbake = useNavigationType() === 'POP';

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: tilbake ? -28 : 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }}
      transformTemplate={collapseAtRest}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
}
