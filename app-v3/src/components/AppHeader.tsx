/**
 * Global app-header for innloggede/in-app-sider. Gir konsekvent navigasjon:
 * tilbakeknapp + logo (→ hjem) + logg ut. Vises IKKE på landings-/marketing-
 * sider (de har egen header via MarketingLayout) — Layout styrer det via skjulListe.
 */
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../routes/paths';
import { useAuthStore } from '../state/useAuthStore';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const bruker = useAuthStore((s) => s.bruker);
  const loggUt = useAuthStore((s) => s.loggUt);
  // Tilbakeknapp skjules på selve hjem-navet (ingen naturlig «tilbake» derfra).
  const visTilbake = location.pathname !== ROUTES.HJEM;

  return (
    <header style={header}>
      <div style={venstre}>
        {visTilbake && (
          <button type="button" onClick={() => navigate(-1)} style={tilbakeKnapp} aria-label="Gå tilbake">
            <span aria-hidden="true">←</span> Tilbake
          </button>
        )}
      </div>
      <Link to={ROUTES.HJEM} style={logo} aria-label="GloseMester – til forsiden">
        <span style={logoG}>G</span>
        <span style={logoTekst}>GloseMester</span>
      </Link>
      <div style={hoyre}>
        {bruker && (
          <button type="button" onClick={() => void loggUt()} style={loggUtKnapp}>
            Logg ut
          </button>
        )}
      </div>
    </header>
  );
}

const header: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 100,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '10px 16px', background: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  backdropFilter: 'saturate(180%) blur(8px)',
};
const venstre: React.CSSProperties = { flex: 1, display: 'flex', justifyContent: 'flex-start' };
const hoyre: React.CSSProperties = { flex: 1, display: 'flex', justifyContent: 'flex-end' };
const knappBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', color: 'var(--color-text-muted)',
  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-full)',
  padding: '7px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  fontFamily: 'var(--font-primary)',
};
const tilbakeKnapp: React.CSSProperties = { ...knappBase };
const loggUtKnapp: React.CSSProperties = { ...knappBase };
const logo: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
};
const logoG: React.CSSProperties = {
  display: 'grid', placeItems: 'center', width: 30, height: 30,
  borderRadius: '50%', background: 'var(--color-primary)', color: '#fff',
  fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-primary)',
};
const logoTekst: React.CSSProperties = {
  fontWeight: 900, fontSize: 18, color: 'var(--color-primary)', fontFamily: 'var(--font-primary)',
};
