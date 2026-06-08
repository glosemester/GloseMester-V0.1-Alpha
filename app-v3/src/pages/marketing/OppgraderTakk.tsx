/**
 * Kvitterings-/takkeside etter fullført kjøp i Stripe Checkout.
 * Stripe sender brukeren hit (success_url → /oppgrader/takk?status=success&orderId=…)
 * etter betaling. Selve premium-aktiveringen skjer server-side via stripe-webhook;
 * her bekrefter vi bare kjøpet for brukeren.
 *
 * Denne dedikerte URL-en brukes også som KONVERTERINGSMÅL i Google Ads («Kjøp»),
 * siden den kun nås etter et fullført kjøp.
 */
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { MarketingLayout, InfoKort } from './MarketingLayout';
import { ROUTES } from '../../routes/paths';

export function OppgraderTakk() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <MarketingLayout
      tittel="Takk for kjøpet! 🎉"
      ingress="Betalingen er fullført. Premium aktiveres automatisk – vanligvis i løpet av noen sekunder."
    >
      <InfoKort tittel={<><CheckCircle2 size={22} color="var(--color-success)" aria-hidden="true" /> Betalingen er bekreftet</>}>
        <p style={{ margin: 0 }}>
          Vi aktiverer Premium på kontoen din automatisk. Hvis du ikke ser endringen
          med en gang, last siden på nytt om litt – den oppdateres så snart Stripe har
          bekreftet betalingen.
        </p>
      </InfoKort>

      <InfoKort tittel={<><Sparkles size={22} color="var(--color-primary)" aria-hidden="true" /> Hva du får nå</>}>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Ubegrenset antall prøver</li>
          <li>Tilgang til standardprøver</li>
          <li>Avansert statistikk</li>
          <li>Prioritert support</li>
        </ul>
      </InfoKort>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to={ROUTES.HJEM} style={primaerKnapp}>
          Gå til appen <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to={ROUTES.PROFILE} style={sekundaerKnapp}>
          Se abonnementet på Min side
        </Link>
      </div>

      <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
        Kvittering er sendt til e-posten din.{orderId ? ` Ordre-ID: ${orderId}.` : ''} Spørsmål?{' '}
        <a href="mailto:kontakt@glosemester.no" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
          kontakt@glosemester.no
        </a>
      </p>
    </MarketingLayout>
  );
}

const primaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-primary)', color: '#fff', textDecoration: 'none',
  borderRadius: 'var(--radius-full)', padding: '12px 22px', fontWeight: 700,
  fontFamily: 'var(--font-primary)',
};
const sekundaerKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-surface)', color: 'var(--color-text)', textDecoration: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-full)', padding: '12px 22px', fontWeight: 700,
  fontFamily: 'var(--font-primary)',
};
