/**
 * Kontoer-fanen — oversikt over alle lærer-/adminkontoer (Feide og Google),
 * gruppert per skole/kommune der det finnes (kun Feide-kontoer har det).
 * Lar en admin gjøre en konto til/fra admin-rolle.
 */
import { useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, School, Search, ChevronDown, ChevronUp, ShieldCheck, ShieldOff } from 'lucide-react';
import { useAuthStore } from '../../state/useAuthStore';
import { hentAlleBrukere, settBrukerRolle, type AdminBrukerRad, type Rolle } from '../../lib/data/users';
import { erSelvDemotering } from './adminGuards';
import { toast } from '../../state/useToastStore';
import { StatKort } from './StatKort';

export function Kontoer() {
  const egenUid = useAuthStore((s) => s.firebaseUser?.uid);
  const [brukere, setBrukere] = useState<AdminBrukerRad[]>([]);
  const [henter, setHenter] = useState(true);
  const [sok, setSok] = useState('');
  const [apneOrg, setApneOrg] = useState<Set<string>>(new Set());
  const [endrer, setEndrer] = useState<string | null>(null);

  useEffect(() => {
    hentAlleBrukere()
      .then(setBrukere)
      .catch(() => setBrukere([]))
      .finally(() => setHenter(false));
  }, []);

  const filtrert = useMemo(() => {
    const q = sok.toLowerCase();
    return q ? brukere.filter((b) => b.navn.toLowerCase().includes(q) || b.organisasjon.toLowerCase().includes(q)) : brukere;
  }, [brukere, sok]);

  const perOrg = useMemo(() => {
    const map = new Map<string, AdminBrukerRad[]>();
    filtrert.forEach((b) => {
      const list = map.get(b.organisasjon) ?? [];
      list.push(b);
      map.set(b.organisasjon, list);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtrert]);

  const totaltLaerere = brukere.filter((b) => b.rolle === 'laerer').length;
  const totaltAdmin = brukere.filter((b) => b.rolle === 'admin').length;
  const totaltOrger = new Set(brukere.map((b) => b.organisasjon)).size;

  function toggleOrg(org: string) {
    setApneOrg((prev) => {
      const neste = new Set(prev);
      if (neste.has(org)) neste.delete(org);
      else neste.add(org);
      return neste;
    });
  }

  async function bytteRolle(rad: AdminBrukerRad) {
    const nyRolle: Rolle = rad.rolle === 'admin' ? 'laerer' : 'admin';
    const melding = erSelvDemotering(rad.uid, egenUid, nyRolle)
      ? `Fjerne din egen admin-tilgang? Du mister tilgangen til adminpanelet umiddelbart.`
      : nyRolle === 'admin'
        ? `Gjøre ${rad.navn} til admin?`
        : `Fjerne admin-rollen fra ${rad.navn}?`;
    if (!window.confirm(melding)) return;

    setEndrer(rad.uid);
    try {
      await settBrukerRolle(rad.uid, nyRolle);
      setBrukere((prev) => prev.map((b) => (b.uid === rad.uid ? { ...b, rolle: nyRolle } : b)));
      toast.success('Rolle oppdatert.');
    } catch {
      toast.error('Kunne ikke oppdatere rollen.');
    } finally {
      setEndrer(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatKort tall={totaltOrger} etikett="Skoler/orger" />
        <StatKort tall={totaltLaerere} etikett="Lærere" />
        <StatKort tall={totaltAdmin} etikett="Admin" />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '8px 16px' }}>
        <Search size={16} color="var(--color-text-muted)" aria-hidden="true" />
        <input
          value={sok}
          onChange={(e) => setSok(e.target.value)}
          placeholder="Søk etter navn eller skole…"
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent', fontFamily: 'var(--font-primary)' }}
        />
      </div>

      {henter ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Laster kontoer…</p>
      ) : perOrg.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Ingen kontoer funnet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {perOrg.map(([org, liste]) => {
            const apen = apneOrg.has(org);
            return (
              <div key={org} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                <button
                  type="button"
                  onClick={() => toggleOrg(org)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', textAlign: 'left' }}
                >
                  <School size={18} color="var(--color-primary)" aria-hidden="true" />
                  <span style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{org}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Users size={14} aria-hidden="true" /> {liste.length}
                  </span>
                  {apen ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </button>

                {apen && (
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    {liste.map((b) => (
                      <div key={b.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderTop: '1px solid var(--color-border)', fontSize: 14, flexWrap: 'wrap' }}>
                        <GraduationCap size={15} color="var(--color-primary)" aria-hidden="true" />
                        <span style={{ flex: 1, minWidth: 100 }}>{b.navn}</span>
                        <span style={kildePille}>{b.kilde === 'feide' ? 'Feide' : 'Google/annet'}</span>
                        <span style={{ ...rollePille, ...(b.rolle === 'admin' ? rollePilleAdmin : {}) }}>
                          {b.rolle === 'admin' ? 'Admin' : 'Lærer'}
                        </span>
                        {b.antallKlasser > 0 && (
                          <span style={klassePille}>{b.antallKlasser} {b.antallKlasser === 1 ? 'klasse' : 'klasser'}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => void bytteRolle(b)}
                          disabled={endrer === b.uid}
                          style={rolleKnapp}
                        >
                          {b.rolle === 'admin'
                            ? <><ShieldOff size={14} aria-hidden="true" /> Fjern admin</>
                            : <><ShieldCheck size={14} aria-hidden="true" /> Gjør til admin</>}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 24, textAlign: 'center' }}>
        Ingen brukerdata om aktivitet lagres her — kun navn, rolle, innloggingskilde og org.
      </p>
    </div>
  );
}

const kildePille: React.CSSProperties = {
  fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-border)', borderRadius: 999, padding: '2px 10px',
};
const rollePille: React.CSSProperties = {
  fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-border)', borderRadius: 999, padding: '2px 10px',
};
const rollePilleAdmin: React.CSSProperties = {
  color: 'var(--color-primary)', background: 'var(--color-primary-light)',
};
const klassePille: React.CSSProperties = {
  fontSize: 12, color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 999, padding: '2px 10px',
};
const rolleKnapp: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'var(--font-primary)',
};
