/**
 * Hjem — navet etter innlogging. Rollebevisste snarveier til øving, galleri,
 * min side og (for lærere) lærerpanelet. Erstatter v2 velkomst/fag-start.
 */
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/useAuthStore';
import { ROUTES } from '../routes/paths';

interface Snarvei {
  ikon: string;
  tittel: string;
  tekst: string;
  rute: string;
}

export function Hjem() {
  const navigate = useNavigate();
  const bruker = useAuthStore((s) => s.bruker);
  const loggUt = useAuthStore((s) => s.loggUt);
  const erLaerer = bruker?.rolle === 'laerer' || bruker?.rolle === 'admin';

  const snarveier: Snarvei[] = [
    { ikon: '📚', tittel: 'Øv gloser', tekst: 'Tren med kort, lyd og smart repetisjon.', rute: ROUTES.GLOSEMESTER },
    { ikon: '📝', tittel: 'Ta en prøve', tekst: 'Skriv inn prøvekoden fra læreren.', rute: ROUTES.QUIZ },
    { ikon: '🃏', tittel: 'Kortsamling', tekst: 'Se kortene du har samlet.', rute: ROUTES.GALLERY },
    { ikon: '👤', tittel: 'Min side', tekst: 'Profil, abonnement og personvern.', rute: ROUTES.PROFILE },
  ];
  if (erLaerer) {
    snarveier.unshift({ ikon: '🎯', tittel: 'Lærerpanel', tekst: 'Lag og del prøver, se resultater.', rute: ROUTES.TEACHER_HOME });
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 48px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 900 }}>
          Hei{bruker?.displayName ? `, ${bruker.displayName}` : ''}! 👋
        </h1>
        <button type="button" onClick={() => void loggUt()} style={ghostKnapp}>Logg ut</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {snarveier.map((s) => (
          <button key={s.tittel} type="button" onClick={() => navigate(s.rute)} style={kort}>
            <div style={{ fontSize: 40 }}>{s.ikon}</div>
            <h2 style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', margin: '8px 0 4px' }}>{s.tittel}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>{s.tekst}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const kort: React.CSSProperties = {
  textAlign: 'left', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)', padding: 24, cursor: 'pointer', boxShadow: 'var(--shadow-card)',
  fontFamily: 'var(--font-primary)',
};
const ghostKnapp: React.CSSProperties = {
  background: 'transparent', color: 'var(--color-text-muted)', border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-full)', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-primary)',
};
