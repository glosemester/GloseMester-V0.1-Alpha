import { Link } from 'react-router-dom';
import { ClipboardList, Smartphone, BarChart3, Gamepad2 } from 'lucide-react';
import { MarketingLayout, InfoKort } from './MarketingLayout';
import { FlytendeKjop } from '../../components/FlytendeKjop';
import { ROUTES } from '../../routes/paths';

export function ForLaerere() {
  return (
    <MarketingLayout
      tittel="For lærere"
      ingress="Lag gloseprøver på to minutter og del dem med klassen via kode eller QR. Følg med på resultatene i sanntid."
    >
      <InfoKort tittel={<><ClipboardList size={20} color="var(--color-primary)" aria-hidden="true" /> Lag prøver raskt</>}>
        Skriv inn glose-par (norsk/engelsk), gi prøven en tittel, og du er ferdig.
        Du får en delbar kode og QR-kode umiddelbart.
      </InfoKort>
      <InfoKort tittel={<><Smartphone size={20} color="var(--color-primary)" aria-hidden="true" /> Del med klassen</>}>
        Vis QR-koden på tavla eller send koden i Teams. Elevene starter prøven uten
        innlogging — de skriver bare inn navnet sitt.
      </InfoKort>
      <InfoKort tittel={<><BarChart3 size={20} color="var(--color-primary)" aria-hidden="true" /> Se resultatene</>}>
        Resultatene samles automatisk: gjennomføringer, gjennomsnitt og hvert
        elevsvar. Alt på ett sted.
      </InfoKort>
      <InfoKort tittel={<><Gamepad2 size={20} color="var(--color-primary)" aria-hidden="true" /> Motiverte elever</>}>
        Elevene øver i en motiverende modus med samlekort og smart repetisjon,
        så de kommer tilbake og repeterer det de strever med.
      </InfoKort>
      <div style={{ textAlign: 'center' }}>
        <Link
          to={ROUTES.LANDING}
          style={{ display: 'inline-block', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '14px 28px', fontWeight: 700, textDecoration: 'none' }}
        >
          Kom i gang gratis
        </Link>
      </div>
      <FlytendeKjop
        id="laerer"
        to="/oppgrader"
        tittel="Kjøp Premium"
        info="Ubegrenset prøver og standardprøver — fra 99 kr/mnd."
      />
    </MarketingLayout>
  );
}
