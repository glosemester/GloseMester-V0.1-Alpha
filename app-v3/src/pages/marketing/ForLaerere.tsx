import { Link } from 'react-router-dom';
import { MarketingLayout, InfoKort } from './MarketingLayout';
import { ROUTES } from '../../routes/paths';

export function ForLaerere() {
  return (
    <MarketingLayout
      tittel="For lærere"
      ingress="Lag gloseprøver på to minutter og del dem med klassen via kode eller QR. Følg med på resultatene i sanntid."
    >
      <InfoKort tittel="📝 Lag prøver raskt">
        Skriv inn glose-par (norsk/engelsk), gi prøven en tittel, og du er ferdig.
        Du får en delbar kode og QR-kode umiddelbart.
      </InfoKort>
      <InfoKort tittel="📲 Del med klassen">
        Vis QR-koden på tavla eller send koden i Teams. Elevene starter prøven uten
        innlogging — de skriver bare inn navnet sitt.
      </InfoKort>
      <InfoKort tittel="📊 Se resultatene">
        Resultatene samles automatisk: gjennomføringer, gjennomsnitt og hvert
        elevsvar. Alt på ett sted.
      </InfoKort>
      <InfoKort tittel="🎮 Motiverte elever">
        Elevene øver i en gamifisert modus med samlekort og spaced repetition
        (Leitner), så de kommer tilbake og repeterer det de strever med.
      </InfoKort>
      <div style={{ textAlign: 'center' }}>
        <Link
          to={ROUTES.LANDING}
          style={{ display: 'inline-block', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '14px 28px', fontWeight: 700, textDecoration: 'none' }}
        >
          Kom i gang gratis
        </Link>
      </div>
    </MarketingLayout>
  );
}
