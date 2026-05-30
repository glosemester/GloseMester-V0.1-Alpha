import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/base.css';
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

// Rute-tre. Beskyttede ruter pakkes i <ProtectedRoute>. Flere sider kobles på
// utover i fase B3 (galleri, lærer-dashboard, min-side ...).
const router = createBrowserRouter([
  {
    element: <Layout />,
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
      // Kortsamling/galleri (krever innlogging for å lagre samling på UID).
      {
        path: ROUTES.GALLERY,
        element: (
          <ProtectedRoute>
            <Galleri />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthBootstrap>
      <RouterProvider router={router} />
      <Toaster />
    </AuthBootstrap>
  </StrictMode>,
);
