/**
 * Skolepakke-forespørsel — kaller Netlify-funksjonen school-inquiry, som lagrer
 * forespørselen i Firestore (school_inquiries) og varsler via Resend.
 *
 * Denne forespørselen er inngangen til agent-systemets kontakt-/salgsflyt
 * (auto-oppretting av kontakt fra innkommende henvendelser), så skjemaet må
 * sende NØYAKTIG feltene funksjonen forventer. Port av v2 for-skoler.html.
 */
export interface SkoleForesporsel {
  schoolName: string;
  orgNumber: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  teacherCount: string;
  message?: string;
}

export interface ForesporselResultat {
  ok: boolean;
  feil?: string;
}

export async function sendSkoleforesporsel(data: SkoleForesporsel): Promise<ForesporselResultat> {
  try {
    const response = await fetch('/.netlify/functions/school-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { ok: false, feil: body.error || 'Kunne ikke sende forespørselen.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('Skoleforespørsel feilet:', e);
    return { ok: false, feil: e instanceof Error ? e.message : 'Ukjent feil.' };
  }
}
