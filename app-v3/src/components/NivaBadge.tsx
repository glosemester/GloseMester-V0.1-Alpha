/**
 * Nivå-badge — SVG-progresjonsring rundt elevens nivåtall (1–10), med animert
 * fyll (framer-motion spring), pulserende glød i nivåfargen og pop ved mount.
 * Samme ringteknikk som kort-hjulet i øvemodus (strokeDasharray/-offset).
 * Badgen er klikkbar og åpner nivåoversikten (NivaOversikt). Kun innloggede.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { nivaFarge, nivaProgresjon } from '../features/niva/nivaSystem';
import { NivaOversikt } from './NivaOversikt';

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
 * Klikkbar badge med glødende ring + valgfri etikett («Nivå 3 · 45 XP til
 * nivå 4»). Tar total XP og regner selv ut nivå og fremgang; trykk åpner
 * nivåoversikten.
 */
export function NivaBadge({ xp, storrelse = 56, visEtikett = false }: { xp: number; storrelse?: number; visEtikett?: boolean }) {
  const [visOversikt, setVisOversikt] = useState(false);
  const p = nivaProgresjon(xp);
  const farge = nivaFarge(p.niva);
  return (
    <>
      <button
        type="button"
        onClick={() => setVisOversikt(true)}
        aria-label={`Nivå ${p.niva} — trykk for å se nivåoversikten`}
        style={badgeKnapp}
      >
        <span
          className="kort-glod"
          style={{
            display: 'inline-block', borderRadius: '50%', animation: 'pop 0.4s ease',
            '--glod-farge': farge, '--glod-radius': '10px',
          } as React.CSSProperties}
        >
          <NivaRing niva={p.niva} prosent={p.prosent} storrelse={storrelse} />
        </span>
        {visEtikett && (
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: 'var(--color-text)' }}>Nivå {p.niva}</span>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 12, color: 'var(--color-text-muted)' }}>
              {p.erMaks ? 'Maks nivå!' : `${p.xpTilNeste} XP til nivå ${p.niva + 1}`}
            </span>
          </span>
        )}
      </button>
      {visOversikt && <NivaOversikt xp={xp} onLukk={() => setVisOversikt(false)} />}
    </>
  );
}

const badgeKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'var(--font-primary)',
};
