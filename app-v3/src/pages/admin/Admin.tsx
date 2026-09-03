/**
 * Adminpanel — kun tilgjengelig for brukere med rolle 'admin'. Rollevakt her
 * (klient-side, defense-in-depth), deretter 2FA-port (AdminTotpGate), så
 * fanene Kontoer (kontooversikt + rolle-styring) og Trafikk (avledet aktivitet).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../state/useAuthStore';
import { ROUTES } from '../../routes/paths';
import { AdminTotpGate } from './AdminTotpGate';
import { Kontoer } from './Kontoer';
import { Trafikk } from './Trafikk';

type Fane = 'kontoer' | 'trafikk';

export function Admin() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const laster = useAuthStore((s) => s.laster);
  const [fane, setFane] = useState<Fane>('kontoer');

  // Tilgangsvakt — kun admin.
  useEffect(() => {
    if (!laster && bruker?.rolle !== 'admin') {
      navigate(ROUTES.HJEM, { replace: true });
    }
  }, [laster, bruker, navigate]);

  if (laster || bruker?.rolle !== 'admin') return null;

  return (
    <AdminTotpGate>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 56px' }}>
        <header style={{
          background: 'linear-gradient(135deg, var(--color-dark-bg) 0%, var(--color-secondary) 100%)',
          color: '#fff', borderRadius: 'var(--radius-lg)', padding: '28px 24px', marginBottom: 24,
        }}>
          <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>Adminpanel</h1>
          <p style={{ opacity: 0.85, marginTop: 6 }}>Kontoer og trafikk i GloseMester</p>
        </header>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button type="button" onClick={() => setFane('kontoer')} style={{ ...faneKnapp, ...(fane === 'kontoer' ? faneKnappAktiv : {}) }}>
            <Users size={16} aria-hidden="true" /> Kontoer
          </button>
          <button type="button" onClick={() => setFane('trafikk')} style={{ ...faneKnapp, ...(fane === 'trafikk' ? faneKnappAktiv : {}) }}>
            <TrendingUp size={16} aria-hidden="true" /> Trafikk
          </button>
        </div>

        {fane === 'kontoer' ? <Kontoer /> : <Trafikk />}
      </div>
    </AdminTotpGate>
  );
}

const faneKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-surface)', color: 'var(--color-text-muted)',
  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-full)',
  padding: '8px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const faneKnappAktiv: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)',
};
