/**
 * Priser/oppgrader — viser planer og starter Stripe Checkout for Premium
 * (månedlig/årlig). Premium aktiveres server-side via stripe-webhook; her
 * håndterer vi også ?status=success/cancelled ved retur fra Stripe.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { MarketingLayout } from './MarketingLayout';
import { ROUTES } from '../../routes/paths';
import { startStripeCheckout, type StripePlan } from '../../lib/payment';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from '../../state/useToastStore';

interface Plan {
  navn: string;
  pris: string;
  punkter: string[];
  fremhevet?: boolean;
  /** Stripe-plan hvis planen kan kjøpes direkte. */
  kjop?: StripePlan;
}

const PLANER: Plan[] = [
  { navn: 'Gratis', pris: '0 kr', punkter: ['Opptil 3 prøver', 'Alle elevfunksjoner', 'QR-kode deling', 'Basis resultatstatistikk'] },
  { navn: 'Premium månedlig', pris: '99 kr/mnd', fremhevet: true, kjop: 'premium_monthly', punkter: ['Ubegrenset antall prøver', 'Tilgang til standardprøver', 'Avansert statistikk', 'Prioritert support'] },
  { navn: 'Premium årlig', pris: '800 kr/år', kjop: 'premium_yearly', punkter: ['Alt i månedlig', 'Spar 388 kr per år', 'Full redigering og duplisering'] },
  { navn: 'Skolepakke', pris: 'Fra 2 000 kr/år', punkter: ['Alt i Premium', 'GloseBank (delt prøvebank)', 'Ubegrenset antall lærere', 'Feide-innlogging', '2 000 / 4 000 / 8 000 kr etter skolestørrelse'] },
];

export function Oppgrader() {
  const [params, setParams] = useSearchParams();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [laster, setLaster] = useState<StripePlan | null>(null);

  // Håndter retur fra Stripe Checkout (?status=success|cancelled).
  useEffect(() => {
    const status = params.get('status');
    if (!status) return;
    if (status === 'success') {
      toast.success('Takk for kjøpet! Premium aktiveres straks — last siden på nytt om noen sekunder.');
    } else if (status === 'cancelled') {
      toast.info('Betalingen ble avbrutt. Du kan prøve igjen når du vil.');
    }
    // Rydd query-param så meldingen ikke gjentas.
    params.delete('status');
    params.delete('orderId');
    setParams(params, { replace: true });
  }, [params, setParams]);

  async function kjop(plan: StripePlan) {
    if (!firebaseUser) {
      toast.error('Logg inn først for å kjøpe Premium.');
      return;
    }
    setLaster(plan);
    const res = await startStripeCheckout(plan);
    if (!res.ok) {
      toast.error(res.feil ?? 'Kunne ikke starte betaling.');
      setLaster(null);
    }
    // Ved suksess forlater vi siden (redirect til Stripe), så ingen reset her.
  }

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
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-text)', flex: 1 }}>
              {plan.punkter.map((p) => (
                <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={18} color="var(--color-success)" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>
            {plan.kjop && (
              <button type="button" onClick={() => kjop(plan.kjop!)} disabled={laster !== null} style={kjopKnapp}>
                {laster === plan.kjop ? 'Sender til Stripe…' : 'Velg denne'}
              </button>
            )}
            {plan.navn === 'Skolepakke' && (
              <a href="mailto:kontakt@glosemester.no" style={{ ...kjopKnapp, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                Kontakt oss
              </a>
            )}
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontSize: 14 }}>
        Betaling skjer trygt via Stripe. Har du en kampanjekode, kan du i stedet aktivere den på{' '}
        <Link to={ROUTES.PROFILE} style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Min side</Link>.
      </p>
    </MarketingLayout>
  );
}

const kjopKnapp: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '12px 18px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
