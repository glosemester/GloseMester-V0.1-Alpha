/**
 * Kampanjekoder — gir gratis premium/skolepakke-tilgang uten betaling.
 * Portet fra v2 (min-side / teacher-module). Selve aktiveringen skriver til
 * brukerens abonnement i Firestore. Stripe-betaling håndteres separat (ikke her).
 */
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type AbonnementType = 'free' | 'premium' | 'skolepakke';

export interface Kampanje {
  type: AbonnementType;
  dager: number;
  beskrivelse: string;
}

/** Gyldige kampanjekoder (jf. v2). Nøkler er alltid store bokstaver. */
export const KAMPANJEKODER: Record<string, Kampanje> = {
  BETA2026: { type: 'premium', dager: 90, beskrivelse: 'Beta-testkode (90 dager)' },
  LANSERING: { type: 'premium', dager: 30, beskrivelse: 'Lanseringskode (30 dager)' },
  TEST7: { type: 'premium', dager: 7, beskrivelse: 'Testkode (7 dager)' },
  SKOLE2026: { type: 'skolepakke', dager: 365, beskrivelse: 'Skolepakke (365 dager)' },
  SKOLEPILOT: { type: 'skolepakke', dager: 180, beskrivelse: 'Skolepilot (180 dager)' },
  SKOLETEST: { type: 'skolepakke', dager: 30, beskrivelse: 'Skoletest (30 dager)' },
};

/** Slår opp en kampanjekode (normalisert). Returnerer null hvis ugyldig. */
export function finnKampanje(kode: string): Kampanje | null {
  return KAMPANJEKODER[kode.trim().toUpperCase()] ?? null;
}

export interface AktiveringsResultat {
  ok: boolean;
  kampanje?: Kampanje;
  feil?: string;
}

/** Aktiverer en kampanjekode for en bruker — oppdaterer abonnement i Firestore. */
export async function aktiverKampanjekode(uid: string, rawKode: string): Promise<AktiveringsResultat> {
  const kode = rawKode.trim().toUpperCase();
  if (!kode) return { ok: false, feil: 'Skriv inn en kampanjekode.' };

  const kampanje = finnKampanje(kode);
  if (!kampanje) return { ok: false, feil: `Ugyldig kampanjekode: ${kode}` };

  const utloper = new Date();
  utloper.setDate(utloper.getDate() + kampanje.dager);

  try {
    await updateDoc(doc(db, 'users', uid), {
      'abonnement.type': kampanje.type,
      'abonnement.utloper': utloper.toISOString(),
      'abonnement.kampanjekode': kode,
      'abonnement.aktivertDato': serverTimestamp(),
    });
    return { ok: true, kampanje };
  } catch (e) {
    console.error('Kunne ikke aktivere kampanjekode:', e);
    return { ok: false, feil: 'Noe gikk galt ved aktivering.' };
  }
}
