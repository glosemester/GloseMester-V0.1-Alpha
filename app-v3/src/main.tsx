import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/base.css';
import { Layout } from './components/Layout';
import { AuthBootstrap } from './components/AuthBootstrap';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ROUTES } from './routes/paths';
import { Landing } from './pages/Landing';
import { Hjem } from './pages/Hjem';

// Rute-tre. Beskyttede ruter pakkes i <ProtectedRoute>. Flere sider kobles på
// i fase B3 (øvemodus, prøve, galleri, lærer-dashboard, min-side ...).
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
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthBootstrap>
      <RouterProvider router={router} />
    </AuthBootstrap>
  </StrictMode>,
);
