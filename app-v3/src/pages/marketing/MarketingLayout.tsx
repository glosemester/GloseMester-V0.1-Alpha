/**
 * Felles ramme for marketing-/info-sider (løser A6 fra Del A: én header/footer
 * i stedet for duplisert markup på hver statiske HTML-side).
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/paths';

export function MarketingLayout({ tittel, ingress, children }: { tittel: string; ingress?: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', maxWidth: 960, margin: '0 auto' }}>
        <Link to={ROUTES.LANDING} style={{ fontWeight: 900, fontSize: 20, color: 'var(--color-primary)', textDecoration: 'none' }}>
          GloseMester
        </Link>
        <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to={ROUTES.LANDING} style={navLenke}>Hjem</Link>
          <Link to="/for-laerere" style={navLenke}>For lærere</Link>
          <Link to="/for-skoler" style={navLenke}>For skoler</Link>
          <Link to="/faq" style={navLenke}>FAQ</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 56px' }}>
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 5vw, 40px)', color: 'var(--color-text)' }}>{tittel}</h1>
        {ingress && <p style={{ color: 'var(--color-text-muted)', fontSize: 18, marginTop: 8, lineHeight: 1.5 }}>{ingress}</p>}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '24px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <Link to="/om-oss" style={navLenke}>Om oss</Link>
          <a href="/vilkar.html" style={navLenke}>Kjøpsvilkår</a>
          <a href="/personvern.html" style={navLenke}>Personvern</a>
        </div>
        © {new Date().getFullYear()} GloseMester · Oksvold EDB
      </footer>
    </div>
  );
}

const navLenke: React.CSSProperties = { color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 14, textDecoration: 'none' };

/** Gjenbrukbart innholds-kort for marketing-seksjoner. */
export function InfoKort({ tittel, children }: { tittel: string; children: ReactNode }) {
  return (
    <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-card)' }}>
      <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 10 }}>{tittel}</h2>
      <div style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>{children}</div>
    </section>
  );
}
