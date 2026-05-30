import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/base.css';
import App from './App';

// Ruteoppsett bygges ut i fase B2/B3. Foreløpig én rot-rute som beviser at
// scaffoldet rendrer med korrekt merkevare (tokens + Nunito).
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
