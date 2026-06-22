/**
 * 404-side + rute-feilside. Erstatter React Routers rå «Unexpected Application
 * Error!» med en vennlig norsk side. Brukes både som `errorElement` (når en
 * rute kaster) og som catch-all-rute (`path: '*'`) for ukjente URL-er.
 */
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { ROUTES } from '../routes/paths';

export function IkkeFunnet() {
  const error = useRouteError();

  let tittel = 'Siden finnes ikke';
  let melding =
    'Lenken er kanskje feil eller utdatert. Gå tilbake til forsiden og prøv igjen.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      tittel = 'Siden finnes ikke';
      melding = 'Vi fant ingenting på denne adressen. Sjekk lenken, eller gå til forsiden.';
    } else {
      tittel = 'Noe gikk galt';
      melding = 'En uventet feil oppstod. Prøv å laste siden på nytt, eller gå til forsiden.';
    }
  }

  return (
    <main style={wrap}>
      <div style={kort}>
        <div style={emoji} aria-hidden="true">🧭</div>
        <h1 style={overskrift}>{tittel}</h1>
        <p style={tekst}>{melding}</p>
        <Link to={ROUTES.LANDING} style={knapp}>
          Til forsiden
        </Link>
      </div>
    </main>
  );
}

const wrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: 'var(--space-8)',
};

const kort: React.CSSProperties = { textAlign: 'center', maxWidth: '28rem' };
const emoji: React.CSSProperties = { fontSize: '3rem', marginBottom: 'var(--space-4)' };
const overskrift: React.CSSProperties = { margin: '0 0 var(--space-3)', color: 'var(--color-text)' };
const tekst: React.CSSProperties = { margin: '0 0 var(--space-6)', color: 'var(--color-text-muted)', lineHeight: 1.5 };
const knapp: React.CSSProperties = {
  display: 'inline-block',
  padding: 'var(--space-3) var(--space-6)',
  borderRadius: 'var(--radius-pill, 999px)',
  background: 'var(--color-primary)',
  color: 'var(--color-on-primary, #fff)',
  textDecoration: 'none',
  fontWeight: 600,
};
