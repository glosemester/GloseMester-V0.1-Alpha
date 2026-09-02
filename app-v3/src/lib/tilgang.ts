/**
 * Tilgangslogikk — énkilde-sannhet for hva en lærer har tilgang til.
 * Elever logger aldri inn og har tilgang til alt gratis uten sjekk her.
 */
import type { BrukerData } from './data/users';

export function erLaerer(bruker: BrukerData | null | undefined): boolean {
  return bruker?.rolle === 'laerer' || bruker?.rolle === 'admin';
}

/** Brukes til Feide SLO-logout-logikk — alle innloggede brukere er lærere via Feide. */
export function erFeidebruker(bruker: BrukerData | null | undefined): boolean {
  return (bruker?.feide_grupper?.length ?? 0) > 0;
}

/** Kortpakker (kategorier) tilgjengelig uten Feide (historisk skille — se ALLE_KORTPAKKER). */
export const GRATIS_KORTPAKKER = ['biler', 'dinosaurer', 'glosehelter'] as const;
/** Alle kortpakker — åpne for alle, uansett innlogging. */
export const ALLE_KORTPAKKER = ['biler', 'dinosaurer', 'dyr', 'guder', 'romvesener', 'planeter', 'skapninger', 'landemerker', 'kart', 'glosehelter'] as const;

export type Kortpakke = typeof ALLE_KORTPAKKER[number];

/**
 * Hva en bruker har tilgang til, som en lesbar liste.
 * Brukes på MinSide (lærer-kontoside).
 */
export interface Tilgangspunkt {
  tekst: string;
  tilgjengelig: boolean;
  forklaring?: string;
}

export function hentTilgangsliste(bruker: BrukerData | null | undefined): Tilgangspunkt[] {
  const laerer = erLaerer(bruker);

  return [
    {
      tekst: 'Øving — alle nivåer',
      tilgjengelig: true,
      forklaring: 'Alle nivåer er gratis — også uten innlogging.',
    },
    {
      tekst: 'Alle kortpakker og samlekort',
      tilgjengelig: true,
      forklaring: 'Gratis for alle, også uten innlogging.',
    },
    {
      tekst: 'Lag og del prøver (lærer)',
      tilgjengelig: laerer,
      forklaring: laerer ? undefined : 'Kun for lærere med Feide.',
    },
    {
      tekst: 'Ubegrenset antall prøver',
      tilgjengelig: true,
      forklaring: 'Gratis og ubegrenset for alle lærere.',
    },
    {
      tekst: 'Standardprøver — ferdige prøver å dele',
      tilgjengelig: true,
    },
    {
      tekst: 'Avansert statistikk',
      tilgjengelig: true,
    },
    {
      tekst: 'Øve-til-prøve-modus',
      tilgjengelig: true,
    },
  ];
}
