/**
 * Min side — profil, abonnement, kampanjekode og GDPR-rettigheter.
 * React-port av v2 min-side.html / teacher renderMinSide. Betaling (Stripe)
 * er bevisst utelatt her; «Oppgrader» lenker til prisinfo-siden.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/useAuthStore';
import { toast } from '../state/useToastStore';
import { aktiverKampanjekode } from '../lib/data/kampanje';
import { eksporterMinData, slettMinKonto } from '../lib/data/gdpr';
import { hentSamling, samlingStats } from '../features/kort/kortSamling';
import { getKortById, getTotalKortCount, RARITY_CONFIG } from '../features/kort/kortData';
import { TokenBalance } from '../components/TokenBalance';
import { ROUTES } from '../routes/paths';

const ABONNEMENT_ETIKETT: Record<string, string> = {
  free: 'Gratis',
  premium: 'Premium',
  skolepakke: 'Skolepakke',
};

export function MinSide() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const [kode, setKode] = useState('');
  const [aktiverer, setAktiverer] = useState(false);
  const [busy, setBusy] = useState(false);

  const abonnement = bruker?.abonnement?.type ?? 'free';

  // Kortsamling — forhåndsvisning av innsamlede kort (samme kilde som galleriet).
  const samling = useMemo(() => {
    const stats = samlingStats();
    const totalt = getTotalKortCount();
    // Unike eide kort, nyeste først, med kortdefinisjon.
    const sett = new Set<string>();
    const unike = hentSamling()
      .slice()
      .reverse()
      .filter((k) => {
        const id = String(k.id);
        if (sett.has(id)) return false;
        sett.add(id);
        return true;
      })
      .map((k) => getKortById(String(k.id)))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
    return { unike, antallUnike: stats.unike, totalt };
  }, []);

  async function aktiver() {
    if (!firebaseUser) return;
    setAktiverer(true);
    const res = await aktiverKampanjekode(firebaseUser.uid, kode);
    if (res.ok && res.kampanje) {
      toast.success(`✅ ${res.kampanje.beskrivelse} aktivert!`);
      setKode('');
    } else {
      toast.error(res.feil ?? 'Kunne ikke aktivere koden.');
    }
    setAktiverer(false);
  }

  async function eksporter() {
    if (!firebaseUser) return;
    setBusy(true);
    try {
      toast.info('📥 Henter data…');
      await eksporterMinData(firebaseUser.uid);
      toast.success('Data lastet ned.');
    } catch {
      toast.error('Kunne ikke eksportere data.');
    } finally {
      setBusy(false);
    }
  }

  async function slett() {
    if (!firebaseUser) return;
    if (!window.confirm('Slette kontoen din permanent? All data fjernes og kan ikke gjenopprettes.')) return;
    setBusy(true);
    try {
      await slettMinKonto(firebaseUser.uid);
      toast.success('Kontoen er slettet.');
      navigate(ROUTES.LANDING);
    } catch (e) {
      console.error(e);
      toast.error('Kunne ikke slette kontoen. Logg inn på nytt og prøv igjen.');
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ fontWeight: 900, fontSize: 'var(--font-size-2xl)' }}>
          Hei{bruker?.displayName ? `, ${bruker.displayName}` : ''}! 👋
        </h1>
      </header>

      {/* Kortsamling */}
      <Kort tittel="🃏 Kortsamlingen din">
        {samling.antallUnike === 0 ? (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 14 }}>
              Du har ikke samlet noen kort ennå. Svar riktig på prøver og øvinger for å vinne kort!
            </p>
            <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER)} style={primaerKnapp}>
              🎴 Øv for å samle kort
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{samling.antallUnike} av {samling.totalt} kort samlet</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>
                {Math.round((samling.antallUnike / samling.totalt) * 100)} %
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${(samling.antallUnike / samling.totalt) * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {samling.unike.slice(0, 8).map((kort) => {
                const cfg = RARITY_CONFIG[kort.rarity];
                return (
                  <div key={kort.id} title={`${kort.name} · ${cfg.tekst}`} style={{ ...miniKort, borderColor: cfg.farge, boxShadow: `0 0 0 1px ${cfg.farge}33` }}>
                    <img src={kort.image} alt={kort.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                );
              })}
              {samling.antallUnike > 8 && (
                <div style={{ ...miniKort, borderColor: 'var(--color-border)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  +{samling.antallUnike - 8}
                </div>
              )}
            </div>
            <button type="button" onClick={() => navigate(ROUTES.GALLERY)} style={primaerKnapp}>
              Se hele samlingen →
            </button>
          </>
        )}
      </Kort>

      {/* Byttesjetonger */}
      <Kort tittel="Byttesjetonger">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 12 }}>
          Tjen sjetonger ved å øve, og bytt kort med andre elever.
        </p>
        <TokenBalance />
        <button type="button" onClick={() => navigate(ROUTES.TRADE)} style={{ ...primaerKnapp, marginTop: 14 }}>
          Gå til bytte →
        </button>
      </Kort>

      {/* Abonnement */}
      <Kort tittel="📦 Ditt abonnement">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={badge}>{ABONNEMENT_ETIKETT[abonnement] ?? abonnement}</span>
          {abonnement === 'free' && (
            <button type="button" onClick={() => navigate('/oppgrader')} style={primaerKnapp}>
              ⬆️ Se Premium
            </button>
          )}
        </div>
      </Kort>

      {/* Kampanjekode */}
      <Kort tittel="🎁 Har du kampanjekode?">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 12 }}>
          Premium-koder gir ubegrenset antall prøver og tilgang til standardprøver.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            placeholder="F.eks. BETA2026"
            style={{ ...input, flex: 1, minWidth: 160 }}
          />
          <button type="button" onClick={aktiver} disabled={aktiverer} style={primaerKnapp}>
            {aktiverer ? 'Aktiverer…' : 'Aktiver'}
          </button>
        </div>
      </Kort>

      {/* Profil */}
      <Kort tittel="👤 Min profil">
        <Rad etikett="E-post" verdi={firebaseUser?.email ?? '–'} />
        <Rad etikett="Rolle" verdi={bruker?.rolle ?? '–'} />
        <Rad etikett="Bruker-ID" verdi={firebaseUser?.uid ?? '–'} />
      </Kort>

      {/* GDPR */}
      <Kort tittel="🛡️ Personvern & dine rettigheter">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 12 }}>
          I henhold til GDPR kan du laste ned eller slette dataene dine.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button" onClick={eksporter} disabled={busy} style={sekundaerKnapp}>
            📥 Last ned mine data (JSON)
          </button>
          <button type="button" onClick={slett} disabled={busy} style={fareKnapp}>
            🗑️ Slett min konto
          </button>
        </div>
      </Kort>

      {/* Support */}
      <Kort tittel="💬 Support & kontakt">
        <Rad etikett="E-post" verdi="kontakt@glosemester.no" />
        <Rad etikett="Responstid" verdi="Innen 2 virkedager" />
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <a href="/vilkar.html" style={lenke}>📄 Kjøpsvilkår</a>
          <a href="/personvern.html" style={lenke}>🔒 Personvern</a>
        </div>
      </Kort>
    </div>
  );
}

function Kort({ tittel, children }: { tittel: string; children: React.ReactNode }) {
  return (
    <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-card)' }}>
      <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: 12 }}>{tittel}</h2>
      {children}
    </section>
  );
}

function Rad({ etikett, verdi }: { etikett: string; verdi: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{etikett}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>{verdi}</span>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: '10px 14px', fontSize: 15, border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', outline: 'none', fontFamily: 'var(--font-primary)',
};
const primaerKnapp: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-full)', padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
const sekundaerKnapp: React.CSSProperties = {
  background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none',
  borderRadius: 'var(--radius-md)', padding: '12px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)', textAlign: 'left',
};
const fareKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-error)', border: '2px solid var(--color-error)',
  borderRadius: 'var(--radius-md)', padding: '12px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)', textAlign: 'left',
};
const miniKort: React.CSSProperties = {
  width: 56, height: 72, padding: 4, borderRadius: 'var(--radius-md)',
  border: '2px solid var(--color-border)', background: 'var(--color-bg)', flexShrink: 0,
};
const badge: React.CSSProperties = {
  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
  borderRadius: 'var(--radius-full)', padding: '6px 16px', fontWeight: 800, fontSize: 15,
};
const lenke: React.CSSProperties = { color: 'var(--color-secondary)', fontWeight: 600, fontSize: 14, textDecoration: 'none' };
