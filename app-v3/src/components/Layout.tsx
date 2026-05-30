/**
 * Delt sidelayout (header + innhold via <Outlet/>). Felles ramme for alle
 * ruter — løser A6-punktet fra Del A (gjentatt header/footer på frittstående
 * sider) ved å ha ÉN kilde. Bygges ut med navigasjon/footer i fase B3.
 */
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
