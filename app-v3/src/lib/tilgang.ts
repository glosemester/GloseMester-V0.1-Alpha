/**
 * Tilgangslogikk — énkilde-sannhet for hva som er tilgjengelig per
 * abonnementstype og rolle. Brukes på tvers av sider og komponenter for
 * konsistent tilgangsstyring.
 *
 * Tilgangsnivåer:
 *  free       — gratis bruker (elev eller lærer uten abonnement)
 *  premium    — betalt individuelt abonnement (Stripe)
 *  skole      — skolelisens (enkeltskole via Feide/faktura)
 *  skolepakke — kommunepakke (flere skoler via faktura)
 *  admin      — GloseMester-administrator
 */
import type { BrukerData } from './data/users';

export type Abonnementstype = 'free' | 'premium' | 'skole' | 'skolepakke';

export const ABONNEMENT_ETIKETT: Record<string, string> = {
  free: 'Gratis',
  premium: 'Premium',
  skole: 'Skolelisens',
  skolepakke: 'Kommunepakke',
};

export function harSkolelisens(type: string | undefined): boolean {
  return type === 'skole' || type === 'skolepakke';
}

export function harPremiumEllerOver(type: string | undefined): boolean {
  return type === 'premium' || harSkolelisens(type);
}

export function erLaerer(bruker: BrukerData | null | undefined): boolean {
  return bruker?.rolle === 'laerer' || bruker?.rolle === 'admin';
}

export function erFeidebruker(bruker: BrukerData | null | undefined): boolean {
  return (bruker?.feide_grupper?.length ?? 0) > 0;
}

/** Feide-innlogget = har tilgang til alle nivåer. Gjest/Google = kun niva1+niva2. */
export function harAlleNivaer(bruker: BrukerData | null | undefined): boolean {
  return (bruker as (BrukerData & { kilde?: string }) | null | undefined)?.kilde === 'feide';
}

/** Nivåer tilgjengelig for denne brukeren. */
export const GRATIS_NIVA = ['niva1', 'niva2'] as const;
export const ALLE_NIVA = ['niva1', 'niva2', 'niva3', 'niva4'] as const;

/**
 * Hva en bruker har tilgang til, som en lesbar liste.
 * Brukes på MinSide og i onboarding-flow.
 */
export interface Tilgangspunkt {
  tekst: string;
  tilgjengelig: boolean;
  forklaring?: string;
}

export function hentTilgangsliste(
  bruker: BrukerData | null | undefined,
  erInnlogget: boolean,
): Tilgangspunkt[] {
  const abo = bruker?.abonnement?.type ?? 'free';
  const laerer = erLaerer(bruker);
  const feide = erFeidebruker(bruker);

  return [
    {
      tekst: 'Øving — Nivå 1 og 2',
      tilgjengelig: true,
      forklaring: 'Tilgjengelig for alle, også uten innlogging.',
    },
    {
      tekst: 'Øving — Nivå 3 og 4',
      tilgjengelig: harAlleNivaer(bruker),
      forklaring: harAlleNivaer(bruker) ? undefined : 'Krever innlogging med Feide.',
    },
    {
      tekst: 'Samlekort — vinn kort ved riktige svar',
      tilgjengelig: true,
      forklaring: 'Gratis for alle, også uten innlogging.',
    },
    {
      tekst: 'Bytte av kort med andre elever',
      tilgjengelig: erInnlogget,
      forklaring: erInnlogget ? undefined : 'Krever innlogging.',
    },
    {
      tekst: 'Mine prøver — se prøver tildelt av læreren',
      tilgjengelig: feide,
      forklaring: feide ? undefined : 'Krever Feide-innlogging.',
    },
    {
      tekst: 'Øve-til-prøve-modus',
      tilgjengelig: harSkolelisens(abo),
      forklaring: harSkolelisens(abo) ? undefined : 'Krever skolelisens.',
    },
    {
      tekst: 'Lag og del prøver (lærer)',
      tilgjengelig: laerer,
      forklaring: laerer ? undefined : 'Kun for lærere med Feide.',
    },
    {
      tekst: 'Tildel prøver til klassen via Feide',
      tilgjengelig: laerer && feide,
      forklaring: laerer && feide ? undefined : laerer ? 'Krever Feide-innlogging som lærer.' : 'Kun for lærere.',
    },
    {
      tekst: 'Klassestatus — se hvem som har tatt prøven',
      tilgjengelig: laerer && feide,
      forklaring: laerer && feide ? undefined : 'Kun for Feide-lærere.',
    },
  ];
}
