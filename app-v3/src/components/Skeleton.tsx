/**
 * #18 Skeleton-skjermer — grå, pulserende plassholdere som vises mens data
 * lastes, i stedet for blank skjerm eller spinner. Shimmer-stilen ligger i
 * native.css (.gm-skeleton).
 */
import type { CSSProperties } from 'react';

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({ height = 16, width = '100%', radius = 8, style }: SkeletonProps) {
  return (
    <div
      className="gm-skeleton"
      aria-hidden="true"
      style={{ height, width, borderRadius: radius, ...style }}
    />
  );
}

/** Plassholder formet som et listekort (jf. lærerpanelets prøvekort). */
export function SkeletonKort() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Skeleton height={16} width="55%" />
      <Skeleton height={12} width="80%" />
    </div>
  );
}
