/**
 * Ren gruppering/statistikk over prøveresultater for lærervisningen.
 * «Ta på nytt» gir flere dokumenter per elev — her grupperes de per elev_id,
 * klassestatus/snitt bruker beste forsøk, og ordanalysen aggregerer hvilke
 * gloser klassen sliter med. Ingen Firebase-avhengigheter.
 */
import type { Prove } from '../../lib/data/prover';
import type { ProveResultat } from '../../lib/data/resultater';
import { normaliser } from '../quiz/quizEngine';

export interface ElevGruppe {
  elevId: string;
  elevNavn: string;
  erGjest: boolean;
  /** Alle forsøk, nyeste først. */
  forsok: ProveResultat[];
  /** Høyest prosent; ved likhet det nyeste forsøket. */
  beste: ProveResultat;
  antallForsok: number;
}

/** Gjest-flagget skrives eksplisitt nå; eldre gjestedokumenter gjenkjennes på UUID-bindestreker. */
function erGjesteResultat(r: ProveResultat): boolean {
  return r.gjest || r.elev_id.includes('-') || r.elev_id === '';
}

function nyest(a: ProveResultat, b: ProveResultat): number {
  return (b.tidspunkt ?? '').localeCompare(a.tidspunkt ?? '');
}

/**
 * Grupperer resultater per elev. Gjester kan ikke gjenkjennes på tvers av
 * forsøk (tilfeldig elev_id per innlevering) og blir én rad per innlevering.
 * Identisk klient_id innen en gruppe dedupes (historiske doble lagringer).
 */
export function grupperResultaterPerElev(resultater: ProveResultat[]): ElevGruppe[] {
  const perElev = new Map<string, ProveResultat[]>();
  const gjester: ProveResultat[] = [];
  const setteKlientIder = new Set<string>();

  for (const r of resultater) {
    if (r.klient_id) {
      if (setteKlientIder.has(r.klient_id)) continue;
      setteKlientIder.add(r.klient_id);
    }
    if (erGjesteResultat(r)) {
      gjester.push(r);
    } else {
      const liste = perElev.get(r.elev_id) ?? [];
      liste.push(r);
      perElev.set(r.elev_id, liste);
    }
  }

  const grupper: ElevGruppe[] = [];
  for (const [elevId, forsok] of perElev) {
    forsok.sort(nyest);
    const beste = forsok.reduce((b, f) => (f.prosent > b.prosent ? f : b), forsok[0]);
    grupper.push({
      elevId,
      elevNavn: forsok[0].elevNavn,
      erGjest: false,
      forsok,
      beste,
      antallForsok: forsok.length,
    });
  }
  for (const r of gjester) {
    grupper.push({
      elevId: r.elev_id || r.klient_id || r.elevNavn,
      elevNavn: r.elevNavn,
      erGjest: true,
      forsok: [r],
      beste: r,
      antallForsok: 1,
    });
  }

  // Innloggede elever etter beste prosent (synkende), gjester til slutt.
  grupper.sort((a, b) => {
    if (a.erGjest !== b.erGjest) return a.erGjest ? 1 : -1;
    return b.beste.prosent - a.beste.prosent;
  });
  return grupper;
}

/** Snitt over beste forsøk per elev/gjest (0 uten resultater). */
export function beregnSnitt(grupper: ElevGruppe[]): number {
  if (!grupper.length) return 0;
  return Math.round(grupper.reduce((s, g) => s + g.beste.prosent, 0) / grupper.length);
}

export interface OrdStat {
  /** Visningsordet (spørsmålet eleven fikk). */
  sporsmal: string;
  fasit: string | null;
  antallSvar: number;
  antallFeil: number;
  feilProsent: number;
  /** Topp 3 distinkte gale brukersvar. */
  vanligeFeilsvar: string[];
}

/**
 * Aggregerer hvilke ord klassen sliter med, basert på hver gruppes BESTE
 * forsøk (samme grunnlag som klassesnittet — omtak telles ikke dobbelt).
 * Fasit hentes fra svar-radene, med fallback til prøvens ordliste.
 */
export function beregnOrdStatistikk(
  grupper: ElevGruppe[],
  prove?: Pick<Prove, 'fag' | 'ordliste'>,
): OrdStat[] {
  interface Akkumulator {
    sporsmal: string;
    fasit: string | null;
    antallSvar: number;
    antallFeil: number;
    feilsvar: Map<string, number>;
  }
  const perOrd = new Map<string, Akkumulator>();

  for (const gruppe of grupper) {
    for (const rad of gruppe.beste.svar) {
      const nokkel = normaliser(rad.sporsmal);
      let akk = perOrd.get(nokkel);
      if (!akk) {
        akk = { sporsmal: rad.sporsmal, fasit: rad.fasit ?? null, antallSvar: 0, antallFeil: 0, feilsvar: new Map() };
        perOrd.set(nokkel, akk);
      }
      akk.fasit ??= rad.fasit ?? null;
      akk.antallSvar += 1;
      if (!rad.riktig) {
        akk.antallFeil += 1;
        const svar = rad.brukersvar.trim();
        if (svar) akk.feilsvar.set(svar, (akk.feilsvar.get(svar) ?? 0) + 1);
      }
    }
  }

  // Fallback-fasit fra ordlisten for eldre resultater uten fasit-felt.
  for (const ord of prove?.ordliste ?? []) {
    const vises = prove?.fag === 'norsk' ? ord.e || ord.s : ord.s;
    const riktig = prove?.fag === 'norsk' ? ord.s : ord.e;
    const akk = perOrd.get(normaliser(vises));
    if (akk) akk.fasit ??= riktig;
  }

  return [...perOrd.values()]
    .map((akk) => ({
      sporsmal: akk.sporsmal,
      fasit: akk.fasit,
      antallSvar: akk.antallSvar,
      antallFeil: akk.antallFeil,
      feilProsent: akk.antallSvar ? Math.round((akk.antallFeil / akk.antallSvar) * 100) : 0,
      vanligeFeilsvar: [...akk.feilsvar.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([svar]) => svar),
    }))
    .sort((a, b) => b.feilProsent - a.feilProsent || b.antallFeil - a.antallFeil);
}
