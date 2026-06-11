/**
 * Nivå-badge — SVG-progresjonsring rundt elevens nivåtall (1–10), med animert
 * fyll (framer-motion spring) mot neste nivå. Samme ringteknikk som kort-hjulet
 * i øvemodus (strokeDasharray/strokeDashoffset). Vises kun for innloggede.
 */
import { motion } from 'framer-motion';
import { nivaFarge, nivaProgresjon } from '../features/niva/nivaSystem';

/** Ren ring med nivåtall — brukes av badgen og nivå-opp-feiringen. */
export function NivaRing({ niva, prosent, storrelse = 64 }: { niva: number; prosent: number; storrelse?: number }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const farge = nivaFarge(niva);
  return (
    <svg
      width={storrelse}
      height={storrelse}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Nivå ${niva}`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx={50} cy={50} r={R} fill="var(--color-surface)" stroke="rgba(0,0,0,0.08)" strokeWidth={9} />
      <g transform="rotate(-90 50 50)">
        <motion.circle
          cx={50} cy={50} r={R} fill="none" stroke={farge} strokeWidth={9}
          strokeLinecap="round" strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - Math.min(100, Math.max(0, prosent)) / 100) }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
      </g>
      <text x={50} y={52} textAnchor="middle" dominantBaseline="central" fontSize={40} fontWeight={900} fill="var(--color-text)" fontFamily="var(--font-primary)">
        {niva}
      </text>
    </svg>
  );
}

/**
 * Badge med ring + valgfri etikett («Nivå 3 · 45 XP til nivå 4»).
 * Tar total XP og regner selv ut nivå og fremgang.
 */
export function NivaBadge({ xp, storrelse = 56, visEtikett = false }: { xp: number; storrelse?: number; visEtikett?: boolean }) {
  const p = nivaProgresjon(xp);
  if (!visEtikett) return <NivaRing niva={p.niva} prosent={p.prosent} storrelse={storrelse} />;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <NivaRing niva={p.niva} prosent={p.prosent} storrelse={storrelse} />
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text)' }}>Nivå {p.niva}</div>
        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-text-muted)' }}>
          {p.erMaks ? 'Maks nivå!' : `${p.xpTilNeste} XP til nivå ${p.niva + 1}`}
        </div>
      </div>
    </div>
  );
}
