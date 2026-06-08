/**
 * Tekst-til-tale via Web Speech API. Portet fra v2 sin lesOpp (MesterUtils).
 * Stille no-op hvis nettleseren mangler talesyntese.
 */
/**
 * Om enheten i det hele tatt støtter talesyntese. Brukes til å skjule/deaktivere
 * høyttaler-knappen der lesOpp uansett ville vært en stille no-op (jf. bug 2 —
 * en grå, «død» knapp uten forklaring). Relevant særlig i native-webview der
 * Web Speech API ikke alltid finnes.
 */
export function talesynteseStottes(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function lesOpp(tekst: string, lang = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(tekst);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignorer talefeil */
  }
}

/** Kort vibrasjon hvis enheten støtter det (jf. v2 vibrer). */
export function vibrer(ms = 200): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}
