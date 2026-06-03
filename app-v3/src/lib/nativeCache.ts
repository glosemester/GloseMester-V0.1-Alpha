/**
 * #20 Offline-first lokal cache. Skriver/leser JSON med Capacitor Preferences
 * på native og localStorage på web — begge overlever app-restart. Brukes som
 * read-through-cache rundt nettverksdata (f.eks. lærerens prøver), så appen
 * starter og viser innhold selv uten internett.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface CacheBoks<T> {
  /** Tidspunkt lagret (epoch ms) — kan brukes til å vurdere ferskhet. */
  t: number;
  v: T;
}

/** Lagre en verdi i den lokale cachen. Feil (full disk / privat modus) svelges. */
export async function cacheSett<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify({ t: Date.now(), v: value } satisfies CacheBoks<T>);
  try {
    if (Capacitor.isNativePlatform()) await Preferences.set({ key, value: json });
    else localStorage.setItem(key, json);
  } catch {
    /* lagring feilet — ikke kritisk */
  }
}

/** Hent en verdi fra den lokale cachen, eller null om den mangler/er ugyldig. */
export async function cacheHent<T>(key: string): Promise<T | null> {
  try {
    const json = Capacitor.isNativePlatform()
      ? (await Preferences.get({ key })).value
      : localStorage.getItem(key);
    if (!json) return null;
    return (JSON.parse(json) as CacheBoks<T>).v;
  } catch {
    return null;
  }
}
