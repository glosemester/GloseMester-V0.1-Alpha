/**
 * Delt sidelayout (header + innhold via <Outlet/>). Felles ramme for alle
 * ruter — ÉN kilde til app-header med tilbakeknapp + logo.
 *
 * Landings- og marketing-sider har egen header (via MarketingLayout / Landing),
 * så AppHeader skjules der for å unngå dobbel chrome.
 */
import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { TabBar, TAB_BAR_HOYDE } from './TabBar';
import { PageTransition } from './PageTransition';
import { useTradeStore } from '../state/useTradeStore';
import { useUiStore } from '../state/useUiStore';
import { useAuthStore } from '../state/useAuthStore';
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
  '/oppgrader',
  ROUTES.OPPGRADER_TAKK,
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
  ROUTES.TRADE,
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
      <TradeDeepLink />
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

/**
 * Navigerer til /bytte når en dyplenke-kode (#bytt=) er fanget av AuthBootstrap.
 * Ligger inne i routeren, så her er navigate tilgjengelig. ProtectedRoute sender
 * uinnloggede til login først; koden ligger i store til de er fremme.
 */
function TradeDeepLink() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pendingKode = useTradeStore((s) => s.pendingTradeCode);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const laster = useAuthStore((s) => s.laster);

  useEffect(() => {
    if (!pendingKode || laster) return;
    // Utlogget: la ProtectedRoute sende dem til innlogging — koden ligger trygt i
    // sessionStorage og plukkes opp her når firebaseUser er satt (også etter en
    // full Feide-redirect). Hindrer samtidig en LANDING↔TRADE-redirectloop.
    if (!firebaseUser) return;
    if (pathname !== ROUTES.TRADE) navigate(ROUTES.TRADE);
  }, [pendingKode, pathname, firebaseUser, laster, navigate]);

  return null;
}
