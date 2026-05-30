/**
 * Landingsside — hero + funksjoner + innlogging (Feide/Google). Innloggede
 * sendes til /hjem. Gjester kan også gå rett til øving uten innlogging.
 */
import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { startFeideLogin, loggInnMedGoogle } from '../lib/auth';
import { useAuthStore } from '../state/useAuthStore';
import { toast } from '../state/useToastStore';
import { ROUTES } from '../routes/paths';

const FUNKSJONER: { ikon: string; tittel: string; tekst: string }[] = [
  { ikon: '🎮', tittel: 'Gamifisert øving', tekst: 'Samle kort og klatre i nivåene mens du lærer.' },
  { ikon: '🧠', tittel: 'Smart repetisjon', tekst: 'Leitner sørger for at du øver mest på det du strever med.' },
  { ikon: '📲', tittel: 'Prøver med QR', tekst: 'Lærere lager prøver på to minutter og deler med ett klikk.' },
];

export function Landing() {
  const navigate = useNavigate();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const laster = useAuthStore((s) => s.laster);
  const [googleLaster, setGoogleLaster] = useState(false);

  // Allerede innlogget → rett til hjem.
  if (!laster && firebaseUser) {
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', maxWidth: 320, marginTop: 8 }}>
          <Button variant="primary" onClick={startFeideLogin} style={{ width: '100%' }}>
            Logg inn med Feide
          </Button>
          <Button variant="secondary" onClick={handleGoogle} disabled={googleLaster} style={{ width: '100%' }}>
            {googleLaster ? 'Logger inn…' : 'Logg inn med Google'}
          </Button>
          <button type="button" onClick={() => navigate(ROUTES.GLOSEMESTER)} style={gjestKnapp}>
            Øv som gjest →
          </button>
        </div>
      </section>

      {/* Funksjoner */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {FUNKSJONER.map((f) => (
          <div key={f.tittel} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 40 }}>{f.ikon}</div>
            <h3 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', margin: '8px 0 6px' }}>{f.tittel}</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.tekst}</p>
          </div>
        ))}
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
const gjestKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-text-muted)', border: 'none',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)', padding: 8,
};

