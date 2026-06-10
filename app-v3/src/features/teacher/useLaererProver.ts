/**
 * Henter lærerens prøver + tilhørende resultater, og avleder enkel statistikk.
 * Port av v2 teacher-module loadTests/_loadResults, men som React-hook.
 * Resultatene grupperes per elev («Ta på nytt» = flere forsøk i samme gruppe);
 * snitt og klassestatus bruker beste forsøk per elev.
 */
import { useCallback, useEffect, useState } from 'react';
import { hentLaererProver, type Prove } from '../../lib/data/prover';
import { hentResultaterForLaerer, type ProveResultat } from '../../lib/data/resultater';
import { grupperResultaterPerElev, beregnSnitt, type ElevGruppe } from './resultatGruppering';

export interface ProveMedResultat extends Prove {
  /** Alle innleveringer (rå, inkl. omtak). */
  resultater: ProveResultat[];
  /** Innleveringene gruppert per elev (gjester = én rad per innlevering). */
  grupper: ElevGruppe[];
  /** Snitt-% over beste forsøk per elev (0 hvis ingen). */
  snitt: number;
}

export interface LaererData {
  prover: ProveMedResultat[];
  laster: boolean;
  /** Antall elever/gjester som har gjennomført, på tvers av prøver. */
  totaltGjennomforinger: number;
  /** Snitt-% på tvers av alle prøver (beste forsøk per elev). */
  totaltSnitt: number;
  reload: () => void;
}

export function useLaererProver(uid: string | undefined): LaererData {
  const [prover, setProver] = useState<ProveMedResultat[]>([]);
  const [laster, setLaster] = useState(true);

  const last = useCallback(async () => {
    if (!uid) {
      setProver([]);
      setLaster(false);
      return;
    }
    setLaster(true);
    try {
      const p = await hentLaererProver(uid);
      const resultater = p.length ? await hentResultaterForLaerer(uid) : [];
      const medResultat: ProveMedResultat[] = p.map((prove) => {
        const egne = resultater.filter((r) => r.prove_id === prove.id);
        const grupper = grupperResultaterPerElev(egne);
        return { ...prove, resultater: egne, grupper, snitt: beregnSnitt(grupper) };
      });
      setProver(medResultat);
    } catch (e) {
      console.error('Kunne ikke laste lærerprøver:', e);
      setProver([]);
    } finally {
      setLaster(false);
    }
  }, [uid]);

  useEffect(() => {
    void last();
  }, [last]);

  const alleGrupper = prover.flatMap((p) => p.grupper);
  const totaltSnitt = beregnSnitt(alleGrupper);

  return {
    prover,
    laster,
    totaltGjennomforinger: alleGrupper.length,
    totaltSnitt,
    reload: () => void last(),
  };
}
