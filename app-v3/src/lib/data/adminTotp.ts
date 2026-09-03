/**
 * Tynn klient mot /.netlify/functions/admin-totp — 2FA-oppsett/verifisering
 * for adminpanelet. Funksjonen selv krever ingen endringer; den verifiserer
 * idToken og admin-rolle server-side for hvert kall.
 */
const ENDEPUNKT = '/.netlify/functions/admin-totp';

async function kallTotp<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDEPUNKT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export interface TotpOppsett {
  otpauthUrl: string;
  secret: string;
}

export function totpSetup(idToken: string): Promise<TotpOppsett> {
  return kallTotp<TotpOppsett>({ idToken, action: 'setup' });
}

export function totpVerify(idToken: string, token: string): Promise<{ valid: boolean }> {
  return kallTotp<{ valid: boolean }>({ idToken, action: 'verify', token });
}

export function totpReset(idToken: string): Promise<{ ok: boolean }> {
  return kallTotp<{ ok: boolean }>({ idToken, action: 'reset' });
}
