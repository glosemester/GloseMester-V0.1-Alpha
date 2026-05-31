/**
 * Delt sidelayout (header + innhold via <Outlet/>). Felles ramme for alle
 * ruter — ÉN kilde til app-header med tilbakeknapp + logo.
 *
 * Landings- og marketing-sider har egen header (via MarketingLayout / Landing),
 * så AppHeader skjules der for å unngå dobbel chrome.
 */
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { ROUTES } from '../routes/paths';

// Ruter med egen header — skal IKKE ha den globale AppHeader.
const UTEN_APP_HEADER = new Set<string>([
  ROUTES.LANDING,
  '/for-laerere',
  '/for-skoler',
  '/om-oss',
  '/faq',
  '/oppgrader',
]);

export function Layout() {
  const { pathname } = useLocation();
  const visAppHeader = !UTEN_APP_HEADER.has(pathname);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {visAppHeader && <AppHeader />}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
