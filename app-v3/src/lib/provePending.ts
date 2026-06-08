/**
 * Mellomlagring av en prøvekode mens eleven sendes gjennom Feide-innlogging.
 *
 * Feide-redirecten forlater appen og kommer tilbake på «/», så en prøvekode
 * eleven var i ferd med å starte ville gått tapt. Vi parkerer koden i
 * sessionStorage og lar Landing-siden sende eleven videre til /prove?kode=…
 * når innloggingen er fullført.
 */
const KEY = 'gm_pending_prove';

export function settVentendeProve(kode: string): void {
  try {
    sessionStorage.setItem(KEY, kode);
  } catch {
    /* sessionStorage utilgjengelig (privat modus o.l.) — da mister vi bare koden */
  }
}

/** Henter og fjerner en ev. ventende prøvekode (engangsbruk). */
export function taVentendeProve(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v) sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}
