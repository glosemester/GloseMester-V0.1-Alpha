/**
 * Synkroniserer kortsamling, XP, diamanter og streak mellom localStorage og
 * Firestore (`user_progress/{uid}`).
 *
 * Strategi:
 * - Gjester: kun localStorage — ingen endring i oppførsel.
 * - Innloggede: localStorage som skrive-gjennomsiktig cache + push til Firestore.
 *   • pull-on-login: henter Firestore, merger med evt. gjest- og uid-lokal data.
 *   • debounced push (3 s) etter hvert svar/skriv.
 *   • umiddelbar flush ved kortgevinst og utlogging.
 * - Merge: max(XP/credits/streak), union(kortsamling), max(kortprogresjon).
 */
import {
  getSamling,
  setSamling,
  getTotalCorrect,
  saveTotalCorrect,
  getCredits,
  saveCredits,
  getKortProgresjon,
  saveKortProgresjon,
  getSpentTokens,
  saveSpentTokens,
  setUserToken,
  setProgressChangeCallback,
  type Kort,
} from './storage';
import { lesStreak, settStreak, setStreakChangeCallback } from './streak';
import { hentProgress, lagreProgress, type ProgressData } from './data/userProgress';

const FAG = 'gloser';

let activeUid: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
// Hindrer rekursiv trigger når vi skriver til localStorage under innlasting
let isLoading = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readLocalProgress(): ProgressData {
  return {
    samling_gloser: getSamling(FAG),
    xp_gloser: getTotalCorrect(FAG),
    credits_gloser: getCredits(FAG),
    kortprogresjon_gloser: getKortProgresjon(FAG),
    spent_tokens: getSpentTokens(),
    streak: lesStreak(),
  };
}

function writeLocalProgress(data: ProgressData): void {
  isLoading = true;
  try {
    setSamling(data.samling_gloser, FAG);
    saveTotalCorrect(data.xp_gloser, FAG);
    saveCredits(data.credits_gloser, FAG);
    saveKortProgresjon(data.kortprogresjon_gloser, FAG);
    saveSpentTokens(data.spent_tokens);
    settStreak(data.streak);
  } finally {
    isLoading = false;
  }
}

function hasAnyData(data: ProgressData): boolean {
  return data.samling_gloser.length > 0 || data.xp_gloser > 0 || data.credits_gloser > 0;
}

/** Union av to samlinger: unngår eksakt duplikat basert på id + vunnetDato. */
function mergeSamling(a: Kort[], b: Kort[]): Kort[] {
  const keys = new Set(a.map((k) => `${k.id}_${k.vunnetDato ?? ''}`));
  const result = [...a];
  for (const k of b) {
    if (!keys.has(`${k.id}_${k.vunnetDato ?? ''}`)) {
      result.push(k);
      keys.add(`${k.id}_${k.vunnetDato ?? ''}`);
    }
  }
  return result;
}

function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  return {
    samling_gloser: mergeSamling(a.samling_gloser, b.samling_gloser),
    xp_gloser: Math.max(a.xp_gloser, b.xp_gloser),
    credits_gloser: Math.max(a.credits_gloser, b.credits_gloser),
    kortprogresjon_gloser: Math.max(a.kortprogresjon_gloser, b.kortprogresjon_gloser),
    spent_tokens: Math.max(a.spent_tokens, b.spent_tokens),
    streak: Math.max(a.streak, b.streak),
  };
}

async function syncToFirestore(uid: string): Promise<void> {
  const data = readLocalProgress();
  await lagreProgress(uid, data);
}

// ─── Eksporterte funksjoner ────────────────────────────────────────────────────

/**
 * Debounced push — utløses av lagre-callbacks i storage/streak.
 * Er ingen-op for gjester (activeUid === null).
 */
export function notifyProgressChange(): void {
  if (!activeUid || isLoading) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  const uid = activeUid;
  debounceTimer = setTimeout(() => {
    syncToFirestore(uid).catch(console.error);
    debounceTimer = null;
  }, 3000);
}

/**
 * Umiddelbar push — bruk ved kortgevinst og utlogging.
 */
export async function flushSync(): Promise<void> {
  if (!activeUid) return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await syncToFirestore(activeUid);
}

/**
 * Kalles fra useAuthStore før setUserToken er kalt (currentToken er fortsatt 'gjest').
 * 1. Leser gjestdata
 * 2. Bytter namespace → uid
 * 3. Leser ev. usynket uid-lokal data (fra forrige økt)
 * 4. Henter Firestore
 * 5. Tre-veis merge → skriv til localStorage + Firestore
 */
export async function onLogin(uid: string): Promise<void> {
  // 1. Gjestdata (namespace er fortsatt 'gjest')
  const guestData = readLocalProgress();

  // 2. Bytt til uid-namespace (migrerer også legacy-nøkler)
  setUserToken(uid);
  activeUid = uid;

  // 3. Ev. usynket lokal data fra forrige innlogget økt
  const localData = readLocalProgress();

  // 4. Hent fra Firestore
  const serverResult = await hentProgress(uid);

  // Nettverk nede — behold lokal data, prøv igjen ved neste skriv
  if (serverResult === 'error') return;

  isLoading = true;
  try {
    if (!serverResult) {
      // Nytt dokument: merge gjest + lokal → push
      const merged = mergeProgress(guestData, localData);
      writeLocalProgress(merged);
      if (hasAnyData(merged)) {
        await lagreProgress(uid, merged);
      }
    } else {
      // Eksisterende dokument: tre-veis merge
      const merged = mergeProgress(mergeProgress(guestData, localData), serverResult);
      writeLocalProgress(merged);
      // Push alltid for å holde Firestore i sync med ev. lokal-forrang
      await lagreProgress(uid, merged);
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Kalles fra useAuthStore når onAuthStateChanged returnerer null.
 * Flusher ventende endringer og nullstiller state.
 */
export async function onLogout(): Promise<void> {
  if (!activeUid) return;
  await flushSync();
  setUserToken(null);
  activeUid = null;
}

// Registrer callbacks ved modulinnlasting
setProgressChangeCallback(notifyProgressChange);
setStreakChangeCallback(notifyProgressChange);
