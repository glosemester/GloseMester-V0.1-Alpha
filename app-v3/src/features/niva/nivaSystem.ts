/**
 * Elevnivå (1–15) — ren logikk, utledet fra total XP (riktige svar).
 *
 * Nivået er en ren funksjon av `xp_gloser` (samme mønster som
 * features/trade/byttesjetonger.ts): ingen egen lagring, ingen drift, og
 * max-merge ved innlogging fungerer uendret. Nivå-opp oppdages i selve
 * tildelingsøyeblikket (sjekkNivaOpp med XP før/etter), så et merge-hopp på ny
 * enhet aldri utløser feiring — eleven står stille på riktig nivå.
 *
 * Terskler: en øvingsrunde er 10 ord og en typisk økt gir 20–50 riktige svar,
 * så nivå 2 nås etter én økt (rask første belønning). Deretter øker gapene
 * jevnt (+60, +90, …, +420); nivå 15 ved 3100 XP er en lengre reise over flere
 * måneder. Spiller på lag med diamantbonus (hver 100. XP) og byttesjetonger.
 *
 * Fordel ved å gå opp i nivå: episke og legendariske kort i de 7 Feide-pakkene
 * låses opp utover nivåene (OPPLASNINGER) — én opplåsing per nivå 2–15, med
 * legendariske kort spredt både tidlig og sent. Gratis-pakkene
 * (GRATIS_KORTPAKKER) og alle vanlige/sjeldne kort er ALDRI nivålåst.
 */
import type { Category, Rarity } from '../kort/kortData';
import { GRATIS_KORTPAKKER } from '../../lib/tilgang';

export const MAKS_NIVA = 15;

/** Ringfarge per nivå (CSS-tokens) — gjenbruker nivåfargene; gull på toppen. */
export function nivaFarge(niva: number): string {
  if (niva >= MAKS_NIVA) return 'var(--color-accent)';
  if (niva >= 12) return 'var(--level-4)';
  if (niva >= 9) return 'var(--level-3)';
  if (niva >= 5) return 'var(--level-2)';
  return 'var(--level-1)';
}

/** Kumulativ XP (riktige svar) som kreves for å NÅ nivå n (index 0 = nivå 1). */
export const NIVA_TERSKLER = [
  0, 40, 100, 190, 310, 460, 640, 850, 1080, 1340, 1630, 1950, 2300, 2680, 3100,
] as const;

/**
 * Rangnavn per nivå (1–15) — vises på badge, i nivåoversikten og i feiringen.
 * Stigende «glose»-tema som topper i appens eget navn på maksnivå.
 */
export const NIVA_TITLER = [
  'Nybegynner',   // 1
  'Lærling',      // 2
  'Ordsamler',    // 3
  'Ordjeger',     // 4
  'Glosekjenner', // 5
  'Ordkunstner',  // 6
  'Språkspeider', // 7
  'Ordvokter',    // 8
  'Glosehelt',    // 9
  'Språkviser',   // 10
  'Ordmester',    // 11
  'Glosevirtuos', // 12
  'Språkmester',  // 13
  'Stormester',   // 14
  'Glosemester',  // 15
] as const;

/** Rangnavnet for et nivå (klamret til 1–15). */
export function nivaTittel(niva: number): string {
  const klamret = Math.min(MAKS_NIVA, Math.max(1, Math.round(niva)));
  return NIVA_TITLER[klamret - 1];
}

/** Elevnivå 1–10 ut fra total XP. Tåler NaN/negativ (→ 1). */
export function beregnElevNiva(xp: number): number {
  if (!Number.isFinite(xp) || xp < 0) return 1;
  let niva = 1;
  for (let i = 1; i < NIVA_TERSKLER.length; i++) {
    if (xp >= NIVA_TERSKLER[i]) niva = i + 1;
  }
  return niva;
}

export interface NivaProgresjon {
  niva: number;
  /** XP samlet inn etter forrige nivågrense. */
  xpIDetteNiva: number;
  /** XP som mangler til neste nivå (0 på maksnivå). */
  xpTilNeste: number;
  /** Fremgang mot neste nivå, 0–100 (100 på maksnivå). */
  prosent: number;
  erMaks: boolean;
}

/** Full fremgangsstatus for nivået (til badge/fremdriftslinje). */
export function nivaProgresjon(xp: number): NivaProgresjon {
  const trygtXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  const niva = beregnElevNiva(trygtXp);
  if (niva >= MAKS_NIVA) {
    return { niva, xpIDetteNiva: trygtXp - NIVA_TERSKLER[MAKS_NIVA - 1], xpTilNeste: 0, prosent: 100, erMaks: true };
  }
  const gulv = NIVA_TERSKLER[niva - 1];
  const tak = NIVA_TERSKLER[niva];
  const xpIDetteNiva = trygtXp - gulv;
  return {
    niva,
    xpIDetteNiva,
    xpTilNeste: tak - trygtXp,
    prosent: Math.min(100, Math.max(0, Math.round((xpIDetteNiva / (tak - gulv)) * 100))),
    erMaks: false,
  };
}

export interface Opplasning {
  niva: number;
  category: Category;
  rarity: Rarity;
  /** Visningstekst til feiringsskjerm og galleri. */
  etikett: string;
}

/**
 * Nivå-opplåsinger — episke/legendariske kort i de 7 Feide-pakkene, én per nivå
 * 2–15. Episke kort kommer først (nivå 2–9), legendariske spres tidlig–sent
 * (Dyr alt på nivå 5, finalen Planeter på nivå 15). Alle Feide-pakker er dekket
 * med både episk og legendarisk; gratis-pakker skal ALDRI inn her.
 */
export const OPPLASNINGER: Opplasning[] = [
  { niva: 2, category: 'dyr', rarity: 'epic', etikett: 'Episke dyrekort' },
  { niva: 3, category: 'guder', rarity: 'epic', etikett: 'Episke gudekort' },
  { niva: 4, category: 'romvesener', rarity: 'epic', etikett: 'Episke romvesenkort' },
  { niva: 5, category: 'dyr', rarity: 'legendary', etikett: 'Legendariske dyrekort' },
  { niva: 6, category: 'kart', rarity: 'epic', etikett: 'Episke kartkort' },
  { niva: 7, category: 'skapninger', rarity: 'epic', etikett: 'Episke skapningskort' },
  { niva: 8, category: 'planeter', rarity: 'epic', etikett: 'Episke planetkort' },
  { niva: 9, category: 'landemerker', rarity: 'epic', etikett: 'Episke landemerkekort' },
  { niva: 10, category: 'romvesener', rarity: 'legendary', etikett: 'Legendariske romvesenkort' },
  { niva: 11, category: 'kart', rarity: 'legendary', etikett: 'Legendariske kartkort' },
  { niva: 12, category: 'skapninger', rarity: 'legendary', etikett: 'Legendariske skapningskort' },
  { niva: 13, category: 'landemerker', rarity: 'legendary', etikett: 'Legendariske landemerkekort' },
  { niva: 14, category: 'guder', rarity: 'legendary', etikett: 'Legendariske gudekort' },
  { niva: 15, category: 'planeter', rarity: 'legendary', etikett: 'Legendariske planetkort' },
];

/**
 * Er kortet nivålåst for denne eleven? Gratis-pakker og vanlige/sjeldne kort
 * er aldri låst; ukjente kombinasjoner er åpne (nye pakker hard-låses ikke ved
 * uhell); `elevNiva: null` (gjest) er aldri låst.
 */
export function erKortLaast(kort: { category: Category; rarity: Rarity }, elevNiva: number | null): boolean {
  if (elevNiva === null) return false;
  if ((GRATIS_KORTPAKKER as readonly string[]).includes(kort.category)) return false;
  const rad = OPPLASNINGER.find((o) => o.category === kort.category && o.rarity === kort.rarity);
  return rad ? elevNiva < rad.niva : false;
}

/** Hva som låses opp PÅ akkurat dette nivået — til feiringsskjermen. */
export function opplasningerVedNiva(niva: number): Opplasning[] {
  return OPPLASNINGER.filter((o) => o.niva === niva);
}

/** Nivået et gitt kort låses opp på, eller null hvis det alltid er åpent. */
export function opplastVedNiva(kort: { category: Category; rarity: Rarity }): number | null {
  if ((GRATIS_KORTPAKKER as readonly string[]).includes(kort.category)) return null;
  return OPPLASNINGER.find((o) => o.category === kort.category && o.rarity === kort.rarity)?.niva ?? null;
}

/** Første opplåsing OVER gitt nivå — «neste mål» i UI. Null på toppen. */
export function nesteOpplasning(elevNiva: number): Opplasning | null {
  return OPPLASNINGER.find((o) => o.niva > elevNiva) ?? null;
}

export interface NivaOppResultat {
  nyttNiva: number;
  /** Union av opplåsinger for alle kryssede nivåer (én tildeling kan krysse flere). */
  opplasninger: Opplasning[];
}

/**
 * Nivå-opp-deteksjon: kalles med XP før/etter en tildeling. Returnerer null
 * hvis ingen nivågrense ble krysset.
 */
export function sjekkNivaOpp(xpFoer: number, xpEtter: number): NivaOppResultat | null {
  const foer = beregnElevNiva(xpFoer);
  const etter = beregnElevNiva(xpEtter);
  if (etter <= foer) return null;
  return {
    nyttNiva: etter,
    opplasninger: OPPLASNINGER.filter((o) => o.niva > foer && o.niva <= etter),
  };
}
