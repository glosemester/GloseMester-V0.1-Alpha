/**
 * Auth-handlinger for v3 — Feide (OAuth2 authorization-code) og Google (popup).
 * Portet fra v2 (src/core/auth/auth-service.js) med identiske endepunkter,
 * scope og redirect-URI slik at Feide-oppsettet på serversiden er uendret.
 *
 * Opprettelse av brukerdokument håndteres sentralt av auth-store
 * (hentEllerOpprettBruker via onAuthStateChanged), så vi unngår å duplisere
 * "sikre bruker"-logikken her.
 */
import { signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const FEIDE_CLIENT_ID = '82131d17-cccd-48da-8397-4e9d70434d4d';
const FEIDE_AUTHORIZE = 'https://auth.dataporten.no/oauth/authorization';
const FEIDE_SCOPE = 'openid profile email groups';
const FEIDE_STATE_KEY = 'feide_state';

function getFeideRedirectUri(): string {
  return `${window.location.origin}/`;
}

/** Starter Feide-innlogging ved å redirecte til Dataporten authorize-endepunktet. */
export function startFeideLogin(): void {
  const state = Math.random().toString(36).substring(2);
  sessionStorage.setItem(FEIDE_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: FEIDE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getFeideRedirectUri(),
    scope: FEIDE_SCOPE,
    state,
  });
  window.location.href = `${FEIDE_AUTHORIZE}?${params}`;
}

export interface FeideCallbackResult {
  handled: boolean;
  success?: boolean;
  error?: string;
}

/**
 * Håndterer Feide-redirect tilbake til appen (`/?code=...&state=...`).
 * Verifiserer state (CSRF), bytter code mot Firebase custom token via
 * Netlify-funksjonen, og logger inn. Returnerer { handled:false } hvis det ikke
 * er en Feide-callback.
 */
export async function handleFeideCallback(): Promise<FeideCallbackResult> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const returnedState = params.get('state');
  const savedState = sessionStorage.getItem(FEIDE_STATE_KEY);

  if (!code) return { handled: false };

  if (returnedState !== savedState) {
    console.error('Feide state-mismatch');
    return { handled: true, success: false, error: 'state_mismatch' };
  }

  try {
    const redirectUri = getFeideRedirectUri();
    const response = await fetch('/.netlify/functions/feide-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
    const data: { token?: string; error?: string } = await response.json();

    if (data.token) {
      await signInWithCustomToken(auth, data.token);
      sessionStorage.removeItem(FEIDE_STATE_KEY);
      window.history.replaceState({}, document.title, redirectUri);
      return { handled: true, success: true };
    }
    return { handled: true, success: false, error: data.error };
  } catch (error) {
    console.error('Feide callback feilet:', error);
    return {
      handled: true,
      success: false,
      error: error instanceof Error ? error.message : 'ukjent',
    };
  }
}

export interface GoogleLoginResult {
  success: boolean;
  error?: string;
}

/** Google-innlogging via popup. Brukerdokument sikres av auth-store. */
export async function loggInnMedGoogle(): Promise<GoogleLoginResult> {
  try {
    await signInWithPopup(auth, googleProvider);
    return { success: true };
  } catch (error) {
    console.error('Google-innlogging feilet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ukjent',
    };
  }
}
