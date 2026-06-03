/**
 * Native-bro for Capacitor. ALT her er web-trygt: på web/PWA er
 * `Capacitor.isNativePlatform()` false, så native-kall hoppes over eller
 * faller tilbake til web-APIer. Importeres fra main.tsx (init) og fra
 * øve-/prøvesidene (haptics).
 *
 * Dekker sjekklistepunktene:
 *  #11 Status bar (farge + stil)
 *  #12 Splash screen (skjules når appen er klar; fade styres av capacitor.config)
 *  #15 Tastatur skyver ikke innhold i stykker (flytt aktivt felt opp)
 *  #16 Skjul tastatur ved trykk utenfor input
 *  #17 Haptisk feedback
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const erNative = (): boolean => Capacitor.isNativePlatform();

/** Kjøres én gang ved oppstart. No-op på web. */
export async function initNative(): Promise<void> {
  if (!erNative()) return;

  const morkt = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

  // #11 Status bar — match appens faktiske chrome (lys flate / mørkt tema).
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: morkt ? Style.Dark : Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      // Android tegner en ugjennomsiktig status bar — fargelegg den som appen.
      await StatusBar.setBackgroundColor({ color: morkt ? '#1A1D2E' : '#FAFAF8' });
    }
  } catch (e) {
    console.warn('StatusBar utilgjengelig:', e);
  }

  // #12 Splash screen — skjul når React har mountet (fade-out styres av config).
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    /* ingen splash i denne konteksten — ignorer */
  }

  // #15 + #16 Tastatur-oppførsel.
  try {
    const { Keyboard } = await import('@capacitor/keyboard');

    // #15: flytt det aktive feltet opp så tastaturet ikke dekker det.
    Keyboard.addListener('keyboardWillShow', () => {
      const el = document.activeElement as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // #16: ett trykk utenfor et skrivefelt lukker tastaturet.
    Keyboard.addListener('keyboardDidShow', () => {
      document.addEventListener(
        'touchend',
        (e) => {
          const mål = e.target as HTMLElement | null;
          if (!mål?.closest('input, textarea, [contenteditable]')) void Keyboard.hide();
        },
        { once: true },
      );
    });
  } catch (e) {
    console.warn('Keyboard utilgjengelig:', e);
  }
}

/* ── #17 Haptisk feedback ──────────────────────────────────────────────
   Capacitor sitt web-fallback bruker Vibration API der det finnes; ellers
   er kallene stille no-ops. Alle er «fire and forget». */

/** Lett dunk — f.eks. riktig svar. */
export async function hapticLett(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* ingen haptikk tilgjengelig — ignorer */
  }
}

/** Tungt dunk — f.eks. feil svar. */
export async function hapticTung(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    /* ignorer */
  }
}

/** Suksess-mønster — f.eks. vunnet kort / fullført prøve. */
export async function hapticSuksess(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* ignorer */
  }
}
