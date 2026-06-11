/**
 * Landingsside — hero + funksjoner + innlogging (Feide/Google). Innloggede
 * sendes til /hjem. Gjester kan også gå rett til øving uten innlogging.
 */
import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Gamepad2, Brain, Smartphone, Lock, CheckCircle2, type LucideIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { startFeideLogin, loggInnMedGoogle } from '../lib/auth';
import { taVentendeProve } from '../lib/provePending';
import { useAuthStore } from '../state/useAuthStore';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

const FUNKSJONER: { Ikon: LucideIcon; tittel: string; tekst: string }[] = [
  { Ikon: Gamepad2, tittel: 'Motiverende øving', tekst: 'Samle samlekort og klatre i nivåene mens du lærer.' },
  { Ikon: Brain, tittel: 'Smart repetisjon', tekst: 'Du øver mest på det du strever med, så det sitter raskere.' },
  { Ikon: Smartphone, tittel: 'Prøver med QR', tekst: 'Lærere lager prøver på to minutter og deler med ett klikk.' },
];

interface TilgangRad {
  tekst: string;
  gratis: boolean;
  feide: boolean;
}

const TILGANG_RADER: TilgangRad[] = [
  { tekst: 'Øving — alle 4 nivåer', gratis: true, feide: true },
  { tekst: 'Kortpakker: Biler & Dinosaurer', gratis: true, feide: true },
  { tekst: 'Kortpakker: Dyr, Guder, Romvesener & Planeter', gratis: false, feide: true },
  { tekst: 'Bytte av kort med andre', gratis: false, feide: true },
  { tekst: 'Mine prøver (tildelt av lærer)', gratis: false, feide: true },
];

export function Landing() {
  const navigate = useNavigate();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const laster = useAuthStore((s) => s.laster);
  const [googleLaster, setGoogleLaster] = useState(false);

  // Allerede innlogget → rett til hjem. Men hvis eleven logget inn med Feide
  // midt i en prøve (kode parkert før redirect), send dem tilbake til prøven.
  if (!laster && firebaseUser) {
    const ventende = taVentendeProve();
    if (ventende) {
      return <Navigate to={`${ROUTES.QUIZ}?kode=${encodeURIComponent(ventende)}`} replace />;
    }
    return <Navigate to={ROUTES.HJEM} replace />;
  }

  async function handleGoogle() {
    setGoogleLaster(true);
    const res = await loggInnMedGoogle();
    if (!res.success) toast.error('Google-innlogging feilet');
    setGoogleLaster(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Toppnav */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', maxWidth: 960, margin: '0 auto' }}>
        <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--color-primary)' }}>GloseMester</span>
        <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/for-laerere" style={navLenke}>For lærere</Link>
          <Link to="/for-skoler" style={navLenke}>For skoler</Link>
          <Link to="/faq" style={navLenke}>FAQ</Link>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'clamp(34px, 7vw, 56px)', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1.1 }}>
          Gjør glosepugging om til en skattejakt
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: '46ch', lineHeight: 1.5 }}>
          Elevene samler kort og klatrer i nivåene. Lærere lager prøver på to minutter
          og deler med QR-kode.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%', maxWidth: 360, marginTop: 8 }}>
          {/* For elever — øverst: logg inn (Feide) eller øv uten innlogging. */}
          <div style={gruppe}>
            <span style={gruppeEtikett}>For elever</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" onClick={startFeideLogin} style={{ flex: 1 }}>
                Logg inn med Feide
              </Button>
              <Button variant="secondary" onClick={() => navigate(ROUTES.GLOSEMESTER)} style={{ flex: 1 }}>
                Øv uten innlogging
              </Button>
            </div>
          </div>

          {/* For lærere — under: to innloggingsmåter. */}
          <div style={gruppe}>
            <span style={gruppeEtikett}>For lærere</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" onClick={startFeideLogin} style={{ flex: 1 }}>
                Feide
              </Button>
              <Button variant="secondary" onClick={handleGoogle} disabled={googleLaster} style={{ flex: 1 }}>
                {googleLaster ? 'Logger inn…' : 'Google'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Funksjoner */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {FUNKSJONER.map((f) => (
          <div key={f.tittel} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <f.Ikon size={40} color="var(--color-primary)" aria-hidden="true" />
            <h3 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', margin: '8px 0 6px' }}>{f.tittel}</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.tekst}</p>
          </div>
        ))}
      </section>

      {/* Tilgangsoversikt */}
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 56px' }}>
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(20px, 4vw, 26px)', textAlign: 'center', marginBottom: 20 }}>Hva er gratis?</h2>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 0 }}>
            {/* Kolonneoverskrifter */}
            <div style={th} />
            <div style={{ ...th, textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: 13 }}>Uten innlogging</div>
            <div style={{ ...th, textAlign: 'center', color: 'var(--color-primary)', fontWeight: 800, fontSize: 13 }}>Med Feide</div>
            {/* Rader */}
            {TILGANG_RADER.map((r, i) => (
              <>
                <div key={`t${i}`} style={{ ...td, borderTop: '1px solid var(--color-border)', fontWeight: 600, fontSize: 14 }}>{r.tekst}</div>
                <div key={`g${i}`} style={{ ...tdSenter, borderTop: '1px solid var(--color-border)' }}>
                  {r.gratis
                    ? <CheckCircle2 size={18} color="var(--color-success)" aria-label="Ja" />
                    : <Lock size={16} color="var(--color-text-muted)" aria-label="Nei" />}
                </div>
                <div key={`f${i}`} style={{ ...tdSenter, borderTop: '1px solid var(--color-border)' }}>
                  {r.feide
                    ? <CheckCircle2 size={18} color="var(--color-success)" aria-label="Ja" />
                    : <Lock size={16} color="var(--color-text-muted)" aria-label="Nei" />}
                </div>
              </>
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 12 }}>
          Feide er skolens innloggingssystem — gratis for alle elever og lærere.
        </p>
      </section>

      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '24px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <Link to="/om-oss" style={navLenke}>Om oss</Link>
          <a href="/vilkar.html" style={navLenke}>Kjøpsvilkår</a>
          <a href="/personvern.html" style={navLenke}>Personvern</a>
        </div>
        © {new Date().getFullYear()} GloseMester · Oksvold EDB
      </footer>
    </div>
  );
}

const navLenke: React.CSSProperties = { color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 14, textDecoration: 'none' };
const th: React.CSSProperties = { padding: '10px 16px', background: 'var(--color-bg)' };
const td: React.CSSProperties = { padding: '12px 16px', color: 'var(--color-text)' };
const tdSenter: React.CSSProperties = { ...td, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const gruppe: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', boxShadow: 'var(--shadow-sm)',
};
const gruppeEtikett: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
  color: 'var(--color-text-muted)', textAlign: 'left',
};

