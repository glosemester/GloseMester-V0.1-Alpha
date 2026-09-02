/**
 * Delt sidelayout (header + innhold via <Outlet/>). Felles ramme for alle
 * ruter — ÉN kilde til app-header med tilbakeknapp + logo.
 *
 * Landings- og marketing-sider har egen header (via MarketingLayout / Landing),
 * så AppHeader skjules der for å unngå dobbel chrome.
 */
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { TabBar, TAB_BAR_HOYDE } from './TabBar';
import { PageTransition } from './PageTransition';
import { useUiStore } from '../state/useUiStore';
import { ROUTES } from '../routes/paths';

// Ruter med egen header — skal IKKE ha den globale AppHeader.
// Marketing-sider har egen header; øve-/prøvesider er fullskjerm med egen
// avslutt-knapp og progresjonslinje.
const UTEN_APP_HEADER = new Set<string>([
  ROUTES.LANDING,
  '/for-laerere',
  '/for-skoler',
  '/om-oss',
  '/faq',
  ROUTES.PRACTICE,
  ROUTES.QUIZ,
]);

// Elev-sider som skal vise bunnmenyen (Øv / Galleri / Hjem). Prøvemodus
// (/prove) holdes utenfor — eleven skal ikke navigere bort midt i en prøve.
const MED_TABBAR = new Set<string>([
  ROUTES.GLOSEMESTER,
  ROUTES.GLOSEMESTER_START,
  ROUTES.PRACTICE,
  ROUTES.GALLERY,
  ROUTES.MY_CARDS,
]);

export function Layout() {
  const { pathname } = useLocation();
  const visAppHeader = !UTEN_APP_HEADER.has(pathname);
  const bunnmenySkjult = useUiStore((s) => s.bunnmenySkjult);
  const visTabBar = MED_TABBAR.has(pathname) && !bunnmenySkjult;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll til toppen ved ruteskifte.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div ref={scrollRef} className="gm-scroll-root" style={{ display: 'flex', flexDirection: 'column' }}>
      {visAppHeader && <AppHeader />}
      <main style={{ flex: 1, paddingBottom: visTabBar ? TAB_BAR_HOYDE + 24 : undefined }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      {visTabBar && <TabBar />}
    </div>
  );
}
