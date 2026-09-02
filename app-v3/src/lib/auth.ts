/**
 * Auth-handlinger for v3 — kun Feide (OAuth2 authorization-code), for lærere.
 * Elever logger aldri inn. Portet fra v2 (src/core/auth/auth-service.js) med
 * identiske endepunkter, scope og redirect-URI slik at Feide-oppsettet på
 * serversiden er uendret.
 *
 * Opprettelse av brukerdokument håndteres sentralt av auth-store
 * (hentEllerOpprettBruker via onAuthStateChanged), så vi unngår å duplisere
 * "sikre bruker"-logikken her.
 */
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

const FEIDE_CLIENT_ID = '82131d17-cccd-48da-8397-4e9d70434d4d';
const FEIDE_AUTHORIZE = 'https://auth.dataporten.no/oauth/authorization';
// OIDC end-session-endepunkt (RP-initiated logout). Logger brukeren ut av selve
// Feide SSO-sesjonen — ikke bare GloseMester — så neste bruker på en delt PC
// faktisk får brukervalg i stedet for å arve forrige innlogging.
const FEIDE_ENDSESSION = 'https://auth.dataporten.no/openid/endsession';
// Samme scope som v2 — Netlify-funksjonen (bestemRolle) forventer disse claimene.
const FEIDE_SCOPE = 'openid userid-feide email userinfo-name userinfo-title groups-org groups-edu';
const FEIDE_STATE_KEY = 'feide_state';

function getFeideRedirectUri(): string {
  return `${window.location.origin}/`;
}

/**
 * Sender nettleseren til Feides end-session-endepunkt. MÅ kalles ETTER at den
 * lokale Firebase-sesjonen er drept (jf. Feide-docs: «kill local session first,
 * then redirect to the end session endpoint»). Full sidenavigasjon — returnerer
 * ikke. Brukes kun for Feide-innloggede; Google-brukere trenger den ikke.
 */
export function redirectTilFeideLogout(): void {
  window.location.href = FEIDE_ENDSESSION;
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
  const feideError = params.get('error');
  const returnedState = params.get('state');
  const savedState = sessionStorage.getItem(FEIDE_STATE_KEY);

  // Feide avviste/avbrøt: sender ?error=... (vanligvis uten code). v2 viste denne
  // feilen; v3 svelget den i stillhet. Surface den så rotårsak (f.eks. uregistrert
  // redirect_uri eller ugyldig scope) blir synlig.
  if (feideError) {
    sessionStorage.removeItem(FEIDE_STATE_KEY);
    window.history.replaceState({}, document.title, getFeideRedirectUri());
    return { handled: true, success: false, error: params.get('error_description') || feideError };
  }

  if (!code) return { handled: false };

  // CSRF-vern: avvis kun ved REELL mismatch. Hvis savedState mangler (tapt
  // sessionStorage e.l.) slipper vi gjennom som v2 gjorde — ellers ville en
  // tapt state gi falsk avvisning av en gyldig innlogging.
  if (savedState && returnedState !== savedState) {
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
    const data: { token?: string; error?: string } = await response.json().catch(() => ({}));

    if (data.token) {
      await signInWithCustomToken(auth, data.token);
      sessionStorage.removeItem(FEIDE_STATE_KEY);
      window.history.replaceState({}, document.title, redirectUri);
      return { handled: true, success: true };
    }
    return { handled: true, success: false, error: data.error || `HTTP ${response.status}` };
  } catch (error) {
    console.error('Feide callback feilet:', error);
    return {
      handled: true,
      success: false,
      error: error instanceof Error ? error.message : 'ukjent',
    };
  }
}
