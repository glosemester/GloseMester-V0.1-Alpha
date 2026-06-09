/**
 * Lokal lagring for v3 — kort, diamanter, XP og elev-prøver.
 *
 * Portet fra v2 (src/core/utils/storage.js, Del A). Beholder NØYAKTIG samme
 * nøkkelskjema (`mester_*_<uid>`) slik at brukere som migrerer fra v2 beholder
 * kortsamling/XP/diamanter. Nøkler namespaces på Firebase UID (serverbekreftet),
 * ikke et klient-satt navn — hindrer at en bruker på delt enhet leser en annens
 * data. Uinnloggede deler ett "gjest"-namespace.
 *
 * I motsetning til v2 leses ikke UID fra en global; den settes via
 * setUserToken() (kalles fra auth-store) for å holde modulen ren.
 */

const STORAGE_KEY = 'mester_samling';
const CREDITS_KEY = 'mester_credits';
const XP_KEY = 'mester_xp';
const KORTPROGRESJON_KEY = 'mester_kortprogresjon';
const ELEV_PROVER_KEY = 'mester_elev_prover';
const SPENT_TOKENS_KEY = 'mester_trade_tokens_spent';
const LEGACY_USER_TOKEN = 'Spiller';
const GUEST_TOKEN = 'gjest';

let currentToken: string = GUEST_TOKEN;
let _onProgressChange: (() => void) | null = null;

/** Registreres av progressSync for debounced Firestore-push. */
export function setProgressChangeCallback(cb: () => void): void {
  _onProgressChange = cb;
}

/** Settes av auth-store ved innlogging/utlogging. */
export function setUserToken(uid: string | null): void {
  const previous = currentToken;
  currentToken = uid || GUEST_TOKEN;
  if (currentToken !== previous && currentToken !== GUEST_TOKEN) {
    migrerLegacyNokler();
  }
}

/** Gjeldende namespace-token (Firebase UID eller 'gjest'). */
export function getUserToken(): string {
  return currentToken;
}

function getUserKey(baseKey: string): string {
  return `${baseKey}_${currentToken}`;
}

/**
 * Engangsmigrering: v2 lagret tidligere under et klient-satt navn (nesten
 * alltid fallback "Spiller"). Flytt slike nøkler til UID-namespace første gang
 * brukeren er innlogget, så ingen mister progresjon.
 */
function migrerLegacyNokler(): void {
  const token = currentToken;
  if (token === GUEST_TOKEN || token === LEGACY_USER_TOKEN) return;
  if (localStorage.getItem('mester_migrert_uid') === token) return;

  const baser = [STORAGE_KEY, CREDITS_KEY, XP_KEY, ELEV_PROVER_KEY];
  const suffix = `_${LEGACY_USER_TOKEN}`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.endsWith(suffix)) continue;
    const base = key.slice(0, -suffix.length);
    if (!baser.some((b) => base === b || base.startsWith(`${b}_`))) continue;

    const nyNokkel = `${base}_${token}`;
    if (localStorage.getItem(nyNokkel) === null) {
      const value = localStorage.getItem(key);
      if (value !== null) localStorage.setItem(nyNokkel, value);
    }
  }
  localStorage.setItem('mester_migrert_uid', token);
}

export interface Kort {
  id: string;
  name?: string;
  navn?: string;
  vunnetDato?: string;
  [key: string]: unknown;
}

// --- KORTSAMLING ---

export function getSamling(fag = 'gloser'): Kort[] {
  const raw = localStorage.getItem(getUserKey(`${STORAGE_KEY}_${fag}`));
  return raw ? (JSON.parse(raw) as Kort[]) : [];
}

export function setSamling(nySamling: Kort[], fag = 'gloser'): void {
  localStorage.setItem(getUserKey(`${STORAGE_KEY}_${fag}`), JSON.stringify(nySamling));
  _onProgressChange?.();
}

export function lagreBrukerKort(kort: Kort, fag = 'gloser'): void {
  if (!kort || !kort.id) {
    console.error('Forsøkte å lagre ugyldig kort:', kort);
    return;
  }
  const samling = getSamling(fag);
  samling.push({ ...kort, vunnetDato: new Date().toISOString() });
  setSamling(samling, fag);
}

// --- DIAMANTER (CREDITS) ---

export function getCredits(fag = 'gloser'): number {
  const raw = localStorage.getItem(getUserKey(`${CREDITS_KEY}_${fag}`));
  return raw ? parseInt(raw, 10) : 0;
}

export function saveCredits(amount: number, fag = 'gloser'): void {
  localStorage.setItem(getUserKey(`${CREDITS_KEY}_${fag}`), String(amount));
  _onProgressChange?.();
}

// --- TOTAL XP ---

export function getTotalCorrect(fag = 'gloser'): number {
  const raw = localStorage.getItem(getUserKey(`${XP_KEY}_${fag}`));
  return raw ? parseInt(raw, 10) : 0;
}

export function saveTotalCorrect(amount: number, fag = 'gloser'): void {
  localStorage.setItem(getUserKey(`${XP_KEY}_${fag}`), String(amount));
  _onProgressChange?.();
}

// --- KORTPROGRESJON (felles teller mot neste kort: øving + prøve) ---
// Antall riktige svar samlet siden forrige kort (0–9). Deles mellom øvemodus og
// prøvemodus, og er UID-nøklet som XP/diamanter (gjester får 'gjest'-namespace).

export function getKortProgresjon(fag = 'gloser'): number {
  const raw = localStorage.getItem(getUserKey(`${KORTPROGRESJON_KEY}_${fag}`));
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveKortProgresjon(antall: number, fag = 'gloser'): void {
  localStorage.setItem(getUserKey(`${KORTPROGRESJON_KEY}_${fag}`), String(Math.max(0, antall)));
  _onProgressChange?.();
}

// --- BYTTESJETONGER (trade tokens) ---
// Antall sjetonger BRUKT. Tjente sjetonger utledes fra XP (byttesjetonger.ts),
// så `tilgjengelig = tjent − brukt`. Brukt-telleren er UID-nøklet som credits/XP.

export function getSpentTokens(): number {
  const raw = localStorage.getItem(getUserKey(SPENT_TOKENS_KEY));
  return raw ? parseInt(raw, 10) : 0;
}

export function saveSpentTokens(amount: number): void {
  localStorage.setItem(getUserKey(SPENT_TOKENS_KEY), String(Math.max(0, amount)));
  _onProgressChange?.();
}

// --- ELEV-PRØVER (7-dagers lokal cache) ---

export interface ElevProve {
  id: string;
  tittel: string;
  ordliste: unknown[];
  lagretDato: number;
  utloperDato: number;
}

export function lagreElevProveLokalt(proveData: {
  id: string;
  tittel: string;
  ordliste: unknown[];
}): void {
  const prover = hentElevProverLokalt();
  const eksisterende = prover.findIndex((p) => p.id === proveData.id);
  const proveObjekt: ElevProve = {
    id: proveData.id,
    tittel: proveData.tittel,
    ordliste: proveData.ordliste,
    lagretDato: Date.now(),
    utloperDato: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  if (eksisterende > -1) prover[eksisterende] = proveObjekt;
  else prover.push(proveObjekt);
  localStorage.setItem(getUserKey(ELEV_PROVER_KEY), JSON.stringify(prover));
}

export function hentElevProverLokalt(): ElevProve[] {
  const raw = localStorage.getItem(getUserKey(ELEV_PROVER_KEY));
  if (!raw) return [];
  try {
    const prover = JSON.parse(raw) as ElevProve[];
    const now = Date.now();
    const aktive = prover.filter((p) => p.utloperDato > now);
    if (aktive.length !== prover.length) {
      localStorage.setItem(getUserKey(ELEV_PROVER_KEY), JSON.stringify(aktive));
    }
    return aktive;
  } catch (error) {
    console.error('Feil ved henting av elev-prøver:', error);
    return [];
  }
}

export function slettElevProveLokalt(proveId: string): void {
  const prover = hentElevProverLokalt().filter((p) => p.id !== proveId);
  localStorage.setItem(getUserKey(ELEV_PROVER_KEY), JSON.stringify(prover));
}

export function tomElevProverLokalt(): void {
  localStorage.removeItem(getUserKey(ELEV_PROVER_KEY));
}
