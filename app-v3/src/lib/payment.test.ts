/**
 * Tester for Stripe-checkout-klienten (payment.ts). Vi mocker `./firebase`
 * (auth), `fetch` og `window.location` siden testene kjører i node-miljø.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// auth.currentUser styres per test via dette mutable objektet. vi.hoisted gjør
// at det er tilgjengelig i den (heisede) vi.mock-faktoren.
const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { currentUser: null as { uid: string; email: string | null } | null },
}));
vi.mock('./firebase', () => ({ auth: mockAuth }));

import { startStripeCheckout } from './payment';

const ORIGIN = 'https://glosemester.no';

beforeEach(() => {
  mockAuth.currentUser = { uid: 'bruker-1', email: 'larer@skole.no' };
  vi.stubGlobal('window', { location: { origin: ORIGIN, href: '' } });
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetchSvar(ok: boolean, body: unknown) {
  (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  });
}

describe('startStripeCheckout', () => {
  it('avviser når brukeren ikke er innlogget — kaller ikke serveren', async () => {
    mockAuth.currentUser = null;

    const res = await startStripeCheckout('premium_monthly');

    expect(res.ok).toBe(false);
    expect(res.feil).toMatch(/innlogget/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('poster riktig payload og redirecter til Stripe-URL ved suksess', async () => {
    mockFetchSvar(true, { url: 'https://checkout.stripe.com/abc' });

    const res = await startStripeCheckout('premium_yearly');

    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/.netlify/functions/stripe-checkout');
    expect(init.method).toBe('POST');
    const sendt = JSON.parse(init.body);
    expect(sendt).toMatchObject({
      plan: 'premium_yearly',
      userId: 'bruker-1',
      userEmail: 'larer@skole.no',
      successUrl: `${ORIGIN}/oppgrader/takk`,
      cancelUrl: `${ORIGIN}/oppgrader`,
    });
    // Klienten forlater appen mot Stripe.
    expect(window.location.href).toBe('https://checkout.stripe.com/abc');
  });

  it('returnerer serverens feilmelding når svaret ikke er ok', async () => {
    mockFetchSvar(false, { error: 'Ugyldig abonnement valgt.' });

    const res = await startStripeCheckout('premium_monthly');

    expect(res.ok).toBe(false);
    expect(res.feil).toBe('Ugyldig abonnement valgt.');
    expect(window.location.href).toBe('');
  });

  it('feiler når serveren ikke returnerer en betalings-URL', async () => {
    mockFetchSvar(true, {});

    const res = await startStripeCheckout('premium_monthly');

    expect(res.ok).toBe(false);
    expect(res.feil).toMatch(/URL/i);
  });

  it('fanger nettverksfeil og returnerer feilmelding', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Nettverk nede'));

    const res = await startStripeCheckout('premium_monthly');

    expect(res.ok).toBe(false);
    expect(res.feil).toBe('Nettverk nede');
  });
});
