/**
 * Trafikk-fanen — avledet aktivitet fra Firestore (ingen ekte
 * besøksstatistikk finnes). Veksle mellom 7 og 30 dager.
 */
import { useEffect, useState } from 'react';
import {
  tellProverSiste,
  tellResultaterSiste,
  tellUnikeAktiveLaerere,
  type ResultatTelling,
} from '../../lib/data/adminStats';
import { StatKort } from './StatKort';

const VINDUER = [7, 30] as const;

export function Trafikk() {
  const [dager, setDager] = useState<(typeof VINDUER)[number]>(7);
  const [henter, setHenter] = useState(true);
  const [prover, setProver] = useState<number | null>(null);
  const [resultater, setResultater] = useState<ResultatTelling | null>(null);
  const [aktiveLaerere, setAktiveLaerere] = useState<number | null>(null);

  useEffect(() => {
    let aktiv = true;
    setHenter(true);
    Promise.all([
      tellProverSiste(dager),
      tellResultaterSiste(dager),
      tellUnikeAktiveLaerere(dager),
    ])
      .then(([p, r, a]) => {
        if (!aktiv) return;
        setProver(p);
        setResultater(r);
        setAktiveLaerere(a);
      })
      .catch(() => {
        if (!aktiv) return;
        setProver(null);
        setResultater(null);
        setAktiveLaerere(null);
      })
      .finally(() => aktiv && setHenter(false));
    return () => {
      aktiv = false;
    };
  }, [dager]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {VINDUER.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setDager(v)}
            style={{ ...vindusKnapp, ...(dager === v ? vindusKnappAktiv : {}) }}
          >
            Siste {v} dager
          </button>
        ))}
      </div>

      {henter ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Henter tall…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatKort tall={prover ?? '—'} etikett="Prøver opprettet" />
          <StatKort tall={resultater?.totalt ?? '—'} etikett="Besvarelser levert" />
          <StatKort tall={resultater?.gjest ?? '—'} etikett="…som gjest" />
          <StatKort tall={resultater?.innlogget ?? '—'} etikett="…som elev/lærer" />
          <StatKort tall={aktiveLaerere ?? '—'} etikett="Aktive lærere (avledet)" />
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 24, textAlign: 'center' }}>
        Appen har ingen ekte besøksstatistikk — tallene er avledet fra prøver
        opprettet og besvarelser levert. «Aktive lærere» er en tilnærming
        (distincte eiere av nylig aktivitet), ikke faktiske innloggingstall.
      </p>
    </div>
  );
}

const vindusKnapp: React.CSSProperties = {
  background: 'var(--color-surface)', color: 'var(--color-text-muted)',
  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-full)',
  padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const vindusKnappAktiv: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)',
};
