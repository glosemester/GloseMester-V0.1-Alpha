/**
 * Offline-kø for prøveresultater. Når lagreResultatDokument feiler (ingen
 * nett), fryses det ferdige dokumentet her og sendes automatisk ved neste
 * oppstart / online-event. Dokumentet bygges FØR køing (byggResultatDokument),
 * så gjeste-ID og klient_id er faste — retries er dermed idempotente.
 */
import { cacheHent, cacheSett } from '../nativeCache';
import { lagreResultatDokument, type ResultatDokument } from './resultater';

const KO_NOKKEL = 'resultat_ko_v1';

export interface KoElement {
  koId: string;
  dok: ResultatDokument;
  lagtTilTid: number;
}

async function lesKo(): Promise<KoElement[]> {
  return (await cacheHent<KoElement[]>(KO_NOKKEL)) ?? [];
}

/** Legg et ferdig bygget resultatdokument i køen. */
export async function leggIResultatKo(dok: ResultatDokument): Promise<void> {
  const ko = await lesKo();
  ko.push({ koId: dok.klient_id, dok, lagtTilTid: Date.now() });
  await cacheSett(KO_NOKKEL, ko);
}

export async function hentResultatKo(): Promise<KoElement[]> {
  return lesKo();
}

// Hindrer at mount + online-event sender køen parallelt (dobbel-send).
let paagaar = false;

/**
 * Prøver å sende alt i køen. Stopper på første feil (fortsatt offline) og
 * beholder resten. Returnerer hvor mange som ble sendt / gjenstår.
 */
export async function provSendResultatKo(
  send: (dok: ResultatDokument) => Promise<void> = lagreResultatDokument,
): Promise<{ sendt: number; gjenstaar: number }> {
  if (paagaar) return { sendt: 0, gjenstaar: (await lesKo()).length };
  paagaar = true;
  try {
    let ko = await lesKo();
    let sendt = 0;
    while (ko.length > 0) {
      try {
        await send(ko[0].dok);
      } catch {
        break; // fortsatt offline — prøv igjen ved neste trigger
      }
      ko = ko.slice(1);
      sendt += 1;
      await cacheSett(KO_NOKKEL, ko);
    }
    return { sendt, gjenstaar: ko.length };
  } finally {
    paagaar = false;
  }
}
