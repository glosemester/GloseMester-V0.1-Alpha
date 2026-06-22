import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import './styles/tokens.css';
import './styles/base.css';
import './styles/native.css';
import { initNative } from './lib/native';
import { Layout } from './components/Layout';
import { AuthBootstrap } from './components/AuthBootstrap';
import { Toaster } from './components/Toaster';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ROUTES } from './routes/paths';
import { Landing } from './pages/Landing';
import { Hjem } from './pages/Hjem';
import { GlosemesterStart } from './pages/GlosemesterStart';
import { GlosemesterPractice } from './pages/GlosemesterPractice';
import { Quiz } from './pages/Quiz';
import { Galleri } from './pages/Galleri';
import { Bytte } from './pages/Bytte';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherCreateTest } from './pages/teacher/TeacherCreateTest';
import { TeacherTestDetails } from './pages/teacher/TeacherTestDetails';
import { TEACHER_ROUTE_PATTERNS } from './pages/teacher/teacherPaths';
import { MinSide } from './pages/MinSide';
import { Admin } from './pages/Admin';
import { MineProver } from './pages/MineProver';
import { ForLaerere } from './pages/marketing/ForLaerere';
import { ForSkoler } from './pages/marketing/ForSkoler';
import { OmOss } from './pages/marketing/OmOss';
import { Faq } from './pages/marketing/Faq';
import { Oppgrader } from './pages/marketing/Oppgrader';
import { OppgraderTakk } from './pages/marketing/OppgraderTakk';
import { IkkeFunnet } from './pages/IkkeFunnet';

// Rute-tre. Beskyttede ruter pakkes i <ProtectedRoute>. Flere sider kobles på
// utover i fase B3 (galleri, lærer-dashboard, min-side ...).
const router = createBrowserRouter([
  {
    element: <Layout />,
    // Vennlig feilside i stedet for React Routers rå «Unexpected Application
    // Error!» når en rute kaster (f.eks. en loader/komponent-feil).
    errorElement: <IkkeFunnet />,
    children: [
      { path: ROUTES.LANDING, element: <Landing /> },
      {
        path: ROUTES.HJEM,
        element: (
          <ProtectedRoute>
            <Hjem />
          </ProtectedRoute>
        ),
      },
      // Øvemodus er åpen (gjest kan øve, jf. v2).
      { path: ROUTES.GLOSEMESTER, element: <GlosemesterStart /> },
      { path: ROUTES.GLOSEMESTER_START, element: <GlosemesterStart /> },
      { path: ROUTES.PRACTICE, element: <GlosemesterPractice /> },
      // Prøvemodus: elev tar lærerens prøve via kode/QR (åpen for gjest).
      { path: ROUTES.QUIZ, element: <Quiz /> },
      // Galleri/Mine Kort: åpent for gjest (jf. øvemodus). Gjester samler kort
      // lokalt og skal kunne se dem uten innlogging.
      { path: ROUTES.MY_CARDS, element: <Galleri /> },
      { path: ROUTES.GALLERY, element: <Galleri visAlle /> },
      // Bytte: kortbytte mellom elever (krever innlogging).
      { path: ROUTES.TRADE, element: <ProtectedRoute><Bytte /></ProtectedRoute> },
      // Mine prøver (elev): prøver tildelt elevens Feide-klasse(r).
      { path: ROUTES.STUDENT_PROVER, element: <ProtectedRoute><MineProver /></ProtectedRoute> },
      // Lærer-modul (krever lærer-/admin-rolle — elever sendes til /hjem).
      { path: ROUTES.TEACHER_HOME, element: <ProtectedRoute krav="laerer"><TeacherDashboard /></ProtectedRoute> },
      { path: ROUTES.MY_TESTS, element: <ProtectedRoute krav="laerer"><TeacherDashboard /></ProtectedRoute> },
      { path: ROUTES.CREATE_TEST, element: <ProtectedRoute krav="laerer"><TeacherCreateTest /></ProtectedRoute> },
      { path: TEACHER_ROUTE_PATTERNS.EDIT_TEST, element: <ProtectedRoute krav="laerer"><TeacherCreateTest /></ProtectedRoute> },
      { path: TEACHER_ROUTE_PATTERNS.TEST_DETAILS, element: <ProtectedRoute krav="laerer"><TeacherTestDetails /></ProtectedRoute> },
      // Min side (profil/abonnement/GDPR) — krever innlogging.
      { path: ROUTES.PROFILE, element: <ProtectedRoute><MinSide /></ProtectedRoute> },
      // Admin — tilgangsvakt inne i komponenten (sjekker rolle === 'admin').
      { path: ROUTES.ADMIN, element: <ProtectedRoute><Admin /></ProtectedRoute> },
      // Offentlige info-/marketing-sider.
      { path: '/for-laerere', element: <ForLaerere /> },
      { path: '/for-skoler', element: <ForSkoler /> },
      { path: '/om-oss', element: <OmOss /> },
      { path: '/faq', element: <Faq /> },
      { path: '/oppgrader', element: <Oppgrader /> },
      { path: ROUTES.OPPGRADER_TAKK, element: <OppgraderTakk /> },
      // Catch-all: ukjente URL-er får vennlig 404 i stedet for rå feilside.
      { path: '*', element: <IkkeFunnet /> },
    ],
  },
]);

// Init Capacitor-broen (status bar, splash, tastatur). No-op på web/PWA.
void initNative();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" → respekterer «reduser bevegelse» i OS for alle
        Framer-animasjoner (rute-overganger m.m.). */}
    <MotionConfig reducedMotion="user">
      <AuthBootstrap>
        <RouterProvider router={router} />
        <Toaster />
      </AuthBootstrap>
    </MotionConfig>
  </StrictMode>,
);

// Fjern loading-skjermen (i index.html) når React har mountet. Lar logo-
// animasjonen få minst ett gjennomløp før den toner ut.
const loader = document.getElementById('loading-screen');
if (loader) {
  window.setTimeout(() => {
    loader.classList.add('skjul');
    window.setTimeout(() => loader.remove(), 400);
  }, 600);
}
