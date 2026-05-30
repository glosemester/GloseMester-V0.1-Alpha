/**
 * Gjenbrukbar knapp — speiler knappehierarkiet i Brand/brand-guidelines.md
 * (primær korall / sekundær blå kontur / ghost nøytral). Alle farger fra tokens.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base: React.CSSProperties = {
  borderRadius: 'var(--radius-full)',
  padding: 'var(--space-3) var(--space-6)',
  fontFamily: 'var(--font-primary)',
  fontWeight: 700,
  fontSize: 'var(--font-size-md)',
  cursor: 'pointer',
  transition: 'var(--transition-base)',
  border: '2px solid transparent',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
};

const varianter: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--color-primary)', color: '#fff' },
  secondary: {
    background: 'transparent',
    color: 'var(--color-secondary)',
    borderColor: 'var(--color-secondary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-muted)',
    borderColor: 'var(--color-border)',
  },
};

export function Button({ variant = 'primary', children, style, ...rest }: ButtonProps) {
  return (
    <button type="button" style={{ ...base, ...varianter[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}
