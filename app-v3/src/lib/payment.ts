/**
 * Stripe-betaling (klientside) — port av v2 payment.js.
 * Kaller Netlify-funksjonen /.netlify/functions/stripe-checkout, som lager en
 * Stripe Checkout-sesjon og returnerer en URL vi redirecter til. Selve
 * aktiveringen av premium skjer server-side via stripe-webhook (skriver
 * abonnement.type = 'premium' i Firestore), så klienten trenger bare starte
 * flyten og lese status ved retur.
 *
 * I Stripe test-modus brukes testkort (f.eks. 4242 4242 4242 4242) — ingen
 * ekte betaling.
 */
import { auth } from './firebase';

export type StripePlan = 'premium_monthly' | 'premium_yearly';

export interface CheckoutResultat {
  ok: boolean;
  feil?: string;
}

/**
 * Starter Stripe Checkout for valgt plan og redirecter til betalingssiden.
 * Returnerer kun hvis noe gikk galt før redirect (ellers forlater vi siden).
 */
export async function startStripeCheckout(plan: StripePlan): Promise<CheckoutResultat> {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, feil: 'Du må være innlogget for å kjøpe Premium.' };
  }

  // Suksess → egen kvitteringsside (/oppgrader/takk), som også er
  // konverteringsmål i Google Ads. Avbrutt → tilbake til prislisten (/oppgrader).
  // Serveren legger selv på ?status=…&orderId=… på disse URL-ene.
  const origin = window.location.origin;

  try {
    const response = await fetch('/.netlify/functions/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        userId: user.uid,
        userEmail: user.email,
        successUrl: `${origin}/oppgrader/takk`,
        cancelUrl: `${origin}/oppgrader`,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { ok: false, feil: data.error || 'Kunne ikke opprette betalingssesjon.' };
    }

    const { url } = (await response.json()) as { url?: string };
    if (!url) return { ok: false, feil: 'Mangler betalings-URL fra serveren.' };

    window.location.href = url; // forlater appen → Stripe Checkout
    return { ok: true };
  } catch (error) {
    console.error('Stripe checkout-feil:', error);
    return { ok: false, feil: error instanceof Error ? error.message : 'Ukjent feil.' };
  }
}
