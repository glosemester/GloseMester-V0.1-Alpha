/**
 * Bunnmeny (tab-bar) for elev-flyten — React-port av v2 menu-system tab-bar.
 * Gir rask veksling mellom Øv, Kortsamling/Galleri og Hjem. Vises på øve-,
 * nivåvalg- og galleri-sidene (styres av Layout).
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths';

interface Fane {
  id: string;
  ikon: string;
  label: string;
  rute: string;
  /** Stier som skal markere denne fanen som aktiv. */
  match: string[];
}

const FANER: Fane[] = [
  { id: 'ov', ikon: '✏️', label: 'Øv', rute: ROUTES.GLOSEMESTER, match: [ROUTES.GLOSEMESTER, ROUTES.GLOSEMESTER_START, ROUTES.PRACTICE] },
  { id: 'mine', ikon: '🃏', label: 'Mine Kort', rute: ROUTES.MY_CARDS, match: [ROUTES.MY_CARDS] },
  { id: 'galleri', ikon: '🏆', label: 'Galleri', rute: ROUTES.GALLERY, match: [ROUTES.GALLERY] },
];

export function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={tabBar} role="tablist" aria-label="Hovedmeny">
      {FANER.map((f) => {
        const aktiv = f.match.includes(pathname);
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={aktiv}
            aria-label={f.label}
            onClick={() => navigate(f.rute)}
            data-testid={`tab-${f.id}`}
            style={{ ...fane, color: aktiv ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1, filter: aktiv ? 'none' : 'grayscale(0.4)' }}>{f.ikon}</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{f.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Høyde som innhold må holde av plass til (jf. Layout paddingBottom). */
export const TAB_BAR_HOYDE = 64;

const tabBar: React.CSSProperties = {
  position: 'fixed', left: '50%', bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
  transform: 'translateX(-50%)', zIndex: 150,
  display: 'flex', gap: 4, padding: 6,
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-lg)',
};
const fane: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  background: 'transparent', border: 'none', cursor: 'pointer',
  padding: '8px 20px', borderRadius: 'var(--radius-full)',
  fontFamily: 'var(--font-primary)',
};
