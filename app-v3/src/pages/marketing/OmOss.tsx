import { MarketingLayout, InfoKort } from './MarketingLayout';

export function OmOss() {
  return (
    <MarketingLayout
      tittel="Om oss"
      ingress="GloseMester gjør glosepugging om til en skattejakt — for norske elever og lærere."
    >
      <InfoKort tittel="Misjonen vår">
        Å gjøre ordlæring til noe elevene faktisk gleder seg til. Mestring, trygghet
        og lek står i sentrum.
      </InfoKort>
      <InfoKort tittel="Hvem står bak">
        GloseMester er utviklet av Øyvind Nilsen Oksvold (Oksvold EDB). Plattformen er
        bygget for norsk skole, med Feide-integrasjon og innhold tilpasset LK20.
      </InfoKort>
      <InfoKort tittel="Kontakt">
        E-post: <strong>kontakt@glosemester.no</strong><br />
        Responstid: innen 2 virkedager.
      </InfoKort>
    </MarketingLayout>
  );
}
