import { MarketingLayout, InfoKort } from './MarketingLayout';

const SPORSMAL: { q: string; a: string }[] = [
  { q: 'Må elevene logge inn?', a: 'Nei, aldri. Elever øver og tar prøver ved å skrive inn prøvekoden fra læreren — uten innlogging og uten konto, med full tilgang til alle kortpakker.' },
  { q: 'Hvordan deler jeg en prøve?', a: 'Når du lager en prøve får du en 6-tegns kode og en QR-kode. Vis QR-en på tavla eller del koden — elevene er i gang umiddelbart.' },
  { q: 'Hva koster det?', a: 'GloseMester er helt gratis for lærere. Logg inn med Feide og lag et ubegrenset antall prøver.' },
  { q: 'Hva er samlekort?', a: 'Når elever gjør det bra på prøver og øving, vinner de digitale samlekort i fire sjeldenhetsgrader. Det motiverer til å øve mer.' },
  { q: 'Hvordan vet appen hva jeg bør øve på?', a: 'Ord du svarer feil på dukker opp oftere, mens ord du mestrer kommer sjeldnere — slik repeterer du akkurat det du strever med, og det sitter raskere.' },
  { q: 'Hvordan ivaretas personvernet?', a: 'Vi samler inn minimalt med data. Du kan når som helst laste ned eller slette dataene dine fra Min side (GDPR art. 17 og 20).' },
];

export function Faq() {
  return (
    <MarketingLayout tittel="Ofte stilte spørsmål" ingress="Finner du ikke svaret? Kontakt oss på kontakt@glosemester.no.">
      {SPORSMAL.map(({ q, a }) => (
        <InfoKort key={q} tittel={q}>{a}</InfoKort>
      ))}
    </MarketingLayout>
  );
}
