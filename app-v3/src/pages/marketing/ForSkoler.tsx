import { MarketingLayout, InfoKort } from './MarketingLayout';

export function ForSkoler() {
  return (
    <MarketingLayout
      tittel="For skoler"
      ingress="GloseMester Skolepakke gir hele skolen tilgang — med Feide-innlogging, delt prøvebank og ubegrenset antall lærere."
    >
      <InfoKort tittel="🏫 Feide-innlogging">
        Sikker pålogging for alle lærere via Feide. Ingen separate passord å holde styr på.
      </InfoKort>
      <InfoKort tittel="📚 GloseBank">
        Del prøver internt på skolen, slik at lærere kan gjenbruke og bygge videre
        på hverandres opplegg.
      </InfoKort>
      <InfoKort tittel="👥 Ubegrenset antall lærere">
        Én skolelisens dekker alle lærerne deres — ingen begrensning på antall kontoer.
      </InfoKort>
      <InfoKort tittel="💬 Dedikert support">
        Prioritert support og opplæring, samt fakturering med 30 dagers betalingsfrist.
      </InfoKort>
      <InfoKort tittel="📄 Avtaler">
        Tilgang reguleres av en <a href="/skoleavtale.html" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>skoleavtale</a>{' '}
        og en <a href="/databehandleravtale.html" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>databehandleravtale</a>{' '}
        (GDPR art. 28). Begge kan leses og signeres digitalt.
      </InfoKort>
      <InfoKort tittel="📨 Interessert?">
        Ta kontakt på <strong>kontakt@glosemester.no</strong> for et tilbud tilpasset
        skolen deres.
      </InfoKort>
    </MarketingLayout>
  );
}
