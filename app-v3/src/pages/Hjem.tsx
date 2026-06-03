/**
 * Hjem — navet etter innlogging. Rollebevisste snarveier til øving, galleri,
 * min side og (for lærere) lærerpanelet. Erstatter v2 velkomst/fag-start.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Layers, User, Target, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '../state/useAuthStore';
import { hentLaererProver } from '../lib/data/prover';
import { ROUTES } from '../routes/paths';
// «Logg ut» ligger nå i den globale AppHeader (tilgjengelig fra alle sider).

interface Snarvei {
  Ikon: LucideIcon;
  tittel: string;
  tekst: string;
  rute: string;
  farge: string;
  tint: string;
}

export function Hjem() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const erLaerer = bruker?.rolle === 'laerer' || bruker?.rolle === 'admin';
  const [hover, setHover] = useState<string | null>(null);

  // #19 Forhåndslast lærerens prøver mens brukeren er på hjem, så lærerpanelet
  // vises umiddelbart ved navigering (og varmer offline-cachen, jf. #20).
  useEffect(() => {
    if (erLaerer && uid) void hentLaererProver(uid).catch(() => {});
  }, [erLaerer, uid]);

  const snarveier: Snarvei[] = [
    { Ikon: BookOpen, tittel: 'Øv gloser', tekst: 'Tren med kort, lyd og smart repetisjon.', rute: ROUTES.GLOSEMESTER, farge: 'var(--color-primary)', tint: 'var(--color-primary-light)' },
    { Ikon: FileText, tittel: 'Ta en prøve', tekst: 'Skriv inn prøvekoden fra læreren.', rute: ROUTES.QUIZ, farge: 'var(--color-secondary)', tint: 'var(--color-secondary-light)' },
    { Ikon: Layers, tittel: 'Kortsamling', tekst: 'Se kortene du har samlet.', rute: ROUTES.GALLERY, farge: 'var(--color-accent)', tint: 'var(--color-accent-light)' },
    { Ikon: User, tittel: 'Min side', tekst: 'Profil, abonnement og personvern.', rute: ROUTES.PROFILE, farge: 'var(--color-success)', tint: 'var(--color-success-light)' },
  ];
  if (erLaerer) {
    snarveier.unshift({ Ikon: Target, tittel: 'Lærerpanel', tekst: 'Lag og del prøver, se resultater.', rute: ROUTES.TEACHER_HOME, farge: 'var(--color-primary-hover)', tint: 'var(--color-primary-light)' });
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
          Velkommen tilbake
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 900, lineHeight: 1.1 }}>
          Hei{bruker?.displayName ? `, ${bruker.displayName}` : ''}!
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        {snarveier.map((s) => (
          <button
            key={s.tittel}
            type="button"
            onClick={() => navigate(s.rute)}
            onMouseEnter={() => setHover(s.tittel)}
            onMouseLeave={() => setHover(null)}
            style={{
              ...kort,
              transform: hover === s.tittel ? 'translateY(-4px)' : 'none',
              boxShadow: hover === s.tittel ? 'var(--shadow-lg)' : 'var(--shadow-card)',
              borderColor: hover === s.tittel ? s.farge : 'var(--color-border)',
            }}
          >
            <div style={{ ...ikonSirkel, background: s.tint }}>
              <s.Ikon size={30} color={s.farge} aria-hidden="true" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', margin: '14px 0 4px' }}>{s.tittel}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>{s.tekst}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const kort: React.CSSProperties = {
  textAlign: 'left', background: 'var(--color-surface)', border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)', padding: 24, cursor: 'pointer', boxShadow: 'var(--shadow-card)',
  fontFamily: 'var(--font-primary)', willChange: 'transform',
  transition: 'transform 0.2s var(--ease-spring), box-shadow 0.15s ease, border-color 0.15s ease',
};
const ikonSirkel: React.CSSProperties = {
  display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: '50%',
};
