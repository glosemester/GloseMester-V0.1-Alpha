/**
 * Prøvemotor — ren logikk (ingen DOM/React), portet fra v2 quiz-engine.js
 * (byggSporsmalsliste, sjekkSvar, normaliser). Bygger spørsmål fra en prøve og
 * sjekker svar. Gjør den enkel å enhetsteste.
 */
import type { Prove } from '../../lib/data/prover';

export type SporsmalType = 'flervalg' | 'tekst';

export interface Sporsmal {
  type: SporsmalType;
  sporsmal: string;
  riktigSvar: string;
  /** Kun for flervalg. */
  alternativer?: string[];
  forklaring?: string | null;
}

/** Fisher-Yates (portet fra v2 stokkArray). Muterer ikke input. */
export function stokkArray<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Normaliserer svar for sammenligning: trim, små bokstaver, æ→ae ø→o å→aa.
 * Portet 1:1 fra v2 normaliser().
 */
export function normaliser(s: string): string {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'aa');
}

/** Velger inntil 3 feilalternativer (jf. v2 lagFeilAlternativer). */
export function lagFeilAlternativer(riktig: string, alleSvar: readonly string[]): string[] {
  const feil = alleSvar.filter((s) => normaliser(s) !== normaliser(riktig));
  return stokkArray(feil).slice(0, 3);
}

/** Bygger spørsmålsliste fra en prøve, basert på fagtype (jf. v2 byggSporsmalsliste). */
export function byggSporsmalsliste(prove: Prove): Sporsmal[] {
  const { fag, ordliste = [], oppgaver = [] } = prove;

  if (fag === 'matte') {
    return oppgaver.map((o) => ({
      type: 'tekst' as const,
      sporsmal: o.sporsmal ?? o.s ?? '',
      riktigSvar: String(o.svar ?? o.e ?? ''),
      forklaring: o.forklaring ?? null,
    }));
  }

  // Gloser / Norsk: ordliste-basert med 4 alternativer. Lærerens bland-valg
  // styrer ordrekkefølgen; svaralternativene stokkes uansett.
  const rekkefolge = prove.bland === false ? [...ordliste] : stokkArray(ordliste);
  return rekkefolge.map((ord) => {
    const riktig = fag === 'norsk' ? ord.s : ord.e;
    const vises = fag === 'norsk' ? ord.e || ord.s : ord.s;
    const feil = lagFeilAlternativer(
      riktig,
      rekkefolge.map((o) => (fag === 'norsk' ? o.s : o.e)),
    );
    return {
      type: 'flervalg' as const,
      sporsmal: vises,
      alternativer: stokkArray([riktig, ...feil]),
      riktigSvar: riktig,
    };
  });
}

/** Sjekker om et svar er riktig (normalisert sammenligning). */
export function erSvarRiktig(brukersvar: string, riktigSvar: string): boolean {
  return normaliser(brukersvar) === normaliser(riktigSvar);
}

export interface QuizResultat {
  riktige: number;
  totalt: number;
  prosent: number;
}

/** Beregner sluttresultat. */
export function beregnResultat(riktige: number, totalt: number): QuizResultat {
  return {
    riktige,
    totalt,
    prosent: totalt > 0 ? Math.round((riktige / totalt) * 100) : 0,
  };
}
