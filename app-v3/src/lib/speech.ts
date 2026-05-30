/**
 * Tekst-til-tale via Web Speech API. Portet fra v2 sin lesOpp (MesterUtils).
 * Stille no-op hvis nettleseren mangler talesyntese.
 */
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
