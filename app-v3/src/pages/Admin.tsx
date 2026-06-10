/**
 * Kommunalt adminpanel — kun tilgjengelig for brukere med rolle 'admin'.
 * Viser alle Feide-lærere og -elever gruppert per skole/kommune.
 * Ingen data om brukeraktivitet — kun navn, rolle og tilknyttet org.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, School, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../state/useAuthStore';
import { hentAdminBrukere, type AdminBrukerRad } from '../lib/data/users';
import { ROUTES } from '../routes/paths';

export function Admin() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const laster = useAuthStore((s) => s.laster);

  const [brukere, setBrukere] = useState<AdminBrukerRad[]>([]);
  const [henter, setHenter] = useState(true);
  const [sok, setSok] = useState('');
  const [apneOrg, setApneOrg] = useState<Set<string>>(new Set());

  // Tilgangsvakt — kun admin.
  useEffect(() => {
    if (!laster && bruker?.rolle !== 'admin') {
      navigate(ROUTES.HJEM, { replace: true });
    }
  }, [laster, bruker, navigate]);

  useEffect(() => {
    if (bruker?.rolle !== 'admin') return;
    hentAdminBrukere()
      .then(setBrukere)
      .catch(() => setBrukere([]))
      .finally(() => setHenter(false));
  }, [bruker?.rolle]);

  const filtrert = useMemo(() => {
    const q = sok.toLowerCase();
    return q ? brukere.filter((b) => b.navn.toLowerCase().includes(q) || b.organisasjon.toLowerCase().includes(q)) : brukere;
  }, [brukere, sok]);

  // Grupper per org.
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
  const totaltElever = brukere.filter((b) => b.rolle === 'elev').length;
  const totaltOrger = new Set(brukere.map((b) => b.organisasjon)).size;

  function toggleOrg(org: string) {
    setApneOrg((prev) => {
      const neste = new Set(prev);
      if (neste.has(org)) neste.delete(org);
      else neste.add(org);
      return neste;
    });
  }

  if (laster || (bruker?.rolle !== 'admin' && !laster)) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 56px' }}>
      <header style={{
        background: 'linear-gradient(135deg, var(--color-dark-bg) 0%, var(--color-secondary) 100%)',
        color: '#fff', borderRadius: 'var(--radius-lg)', padding: '28px 24px', marginBottom: 24,
      }}>
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>Adminpanel</h1>
        <p style={{ opacity: 0.85, marginTop: 6 }}>Oversikt over Feide-brukere i GloseMester</p>
      </header>

      {/* Nøkkeltall */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatKort tall={totaltOrger} etikett="Skoler/orger" />
        <StatKort tall={totaltLaerere} etikett="Lærere" />
        <StatKort tall={totaltElever} etikett="Elever" />
      </div>

      {/* Søk */}
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
        <p style={{ color: 'var(--color-text-muted)' }}>Laster brukere…</p>
      ) : perOrg.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Ingen Feide-brukere funnet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {perOrg.map(([org, liste]) => {
            const apen = apneOrg.has(org);
            const lærere = liste.filter((b) => b.rolle === 'laerer');
            const elever = liste.filter((b) => b.rolle === 'elev');
            return (
              <div key={org} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {/* Org-header — klikk for å ekspandere */}
                <button
                  type="button"
                  onClick={() => toggleOrg(org)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', textAlign: 'left' }}
                >
                  <School size={18} color="var(--color-primary)" aria-hidden="true" />
                  <span style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{org}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', gap: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <GraduationCap size={14} aria-hidden="true" /> {lærere.length}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} aria-hidden="true" /> {elever.length}
                    </span>
                  </span>
                  {apen ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </button>

                {/* Bruker-liste */}
                {apen && (
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    {liste.map((b) => (
                      <div key={b.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderTop: '1px solid var(--color-border)', fontSize: 14 }}>
                        {b.rolle === 'laerer'
                          ? <GraduationCap size={15} color="var(--color-primary)" aria-hidden="true" />
                          : <Users size={15} color="var(--color-text-muted)" aria-hidden="true" />}
                        <span style={{ flex: 1 }}>{b.navn}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-border)', borderRadius: 999, padding: '2px 10px' }}>
                          {b.rolle === 'laerer' ? 'Lærer' : 'Elev'}
                        </span>
                        {b.antallKlasser > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 999, padding: '2px 10px' }}>
                            {b.antallKlasser} {b.antallKlasser === 1 ? 'klasse' : 'klasser'}
                          </span>
                        )}
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
        Viser kun brukere som har logget inn med Feide. Ingen brukerdata om aktivitet lagres her.
      </p>
    </div>
  );
}

function StatKort({ tall, etikett }: { tall: number; etikett: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '18px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)' }}>{tall}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{etikett}</div>
    </div>
  );
}
