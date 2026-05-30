/**
 * Henter lærerens prøver + tilhørende resultater, og avleder enkel statistikk.
 * Port av v2 teacher-module loadTests/_loadResults, men som React-hook.
 */
import { useCallback, useEffect, useState } from 'react';
import { hentLaererProver, type Prove } from '../../lib/data/prover';
import { hentResultaterForProver, type ProveResultat } from '../../lib/data/resultater';

export interface ProveMedResultat extends Prove {
  resultater: ProveResultat[];
  /** Gjennomsnittlig prosent over resultatene (0 hvis ingen). */
  snitt: number;
}

export interface LaererData {
  prover: ProveMedResultat[];
  laster: boolean;
  /** Sum gjennomføringer på tvers av prøver. */
  totaltGjennomforinger: number;
  /** Snitt-% på tvers av alle resultater. */
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
      const resultater = p.length ? await hentResultaterForProver(p.map((x) => x.id)) : [];
      const medResultat: ProveMedResultat[] = p.map((prove) => {
        const egne = resultater.filter((r) => r.prove_id === prove.id);
        const snitt = egne.length ? Math.round(egne.reduce((s, r) => s + r.prosent, 0) / egne.length) : 0;
        return { ...prove, resultater: egne, snitt };
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

  const alleResultater = prover.flatMap((p) => p.resultater);
  const totaltSnitt = alleResultater.length
    ? Math.round(alleResultater.reduce((s, r) => s + r.prosent, 0) / alleResultater.length)
    : 0;

  return {
    prover,
    laster,
    totaltGjennomforinger: alleResultater.length,
    totaltSnitt,
    reload: () => void last(),
  };
}
