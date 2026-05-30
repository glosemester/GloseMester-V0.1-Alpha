import { Link } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout';
import { ROUTES } from '../../routes/paths';

interface Plan {
  navn: string;
  pris: string;
  punkter: string[];
  fremhevet?: boolean;
}

const PLANER: Plan[] = [
  { navn: 'Gratis', pris: '0 kr', punkter: ['Opptil 3 prøver', 'Alle elevfunksjoner', 'QR-kode deling', 'Basis resultatstatistikk'] },
  { navn: 'Premium', pris: '99 kr/mnd', fremhevet: true, punkter: ['Ubegrenset antall prøver', 'Tilgang til standardprøver', 'Avansert statistikk', 'Prioritert support'] },
  { navn: 'Skolepakke', pris: 'Kontakt oss', punkter: ['Alt i Premium', 'GloseBank (delt prøvebank)', 'Ubegrenset antall lærere', 'Feide-innlogging'] },
];

export function Oppgrader() {
  return (
    <MarketingLayout tittel="Priser" ingress="Velg planen som passer deg. Har du en kampanjekode, kan du aktivere den på Min side.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {PLANER.map((plan) => (
          <div
            key={plan.navn}
            style={{
              background: 'var(--color-surface)',
              border: plan.fremhevet ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-card)',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)' }}>{plan.navn}</h2>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)' }}>{plan.pris}</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-text)' }}>
              {plan.punkter.map((p) => (
                <li key={p}>✅ {p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontSize: 14 }}>
        Betaling med kort kommer i appen. I mellomtiden: har du en kampanjekode, aktiver den på{' '}
        <Link to={ROUTES.PROFILE} style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Min side</Link>,
        eller kontakt <strong>kontakt@glosemester.no</strong>.
      </p>
    </MarketingLayout>
  );
}
