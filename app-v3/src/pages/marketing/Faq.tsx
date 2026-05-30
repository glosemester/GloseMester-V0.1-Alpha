import { MarketingLayout, InfoKort } from './MarketingLayout';

const SPORSMAL: { q: string; a: string }[] = [
  { q: 'Må elevene logge inn?', a: 'Nei. Elever kan øve som gjest og ta prøver ved å skrive inn prøvekoden fra læreren. Innlogging (Feide/Google) lar dem lagre fremgang, XP og samlekort.' },
  { q: 'Hvordan deler jeg en prøve?', a: 'Når du lager en prøve får du en 6-tegns kode og en QR-kode. Vis QR-en på tavla eller del koden — elevene er i gang umiddelbart.' },
  { q: 'Hva koster det?', a: 'Gratis-planen gir opptil 3 prøver og alle elevfunksjoner. Premium gir ubegrenset antall prøver og standardprøver. Skoler kan få egne pakker.' },
  { q: 'Hva er samlekort?', a: 'Når elever gjør det bra på prøver og øving, vinner de digitale samlekort i fire sjeldenhetsgrader. Det motiverer til å øve mer.' },
  { q: 'Hva er Leitner?', a: 'Et system for spaced repetition: ord du svarer feil på dukker opp oftere, så du repeterer akkurat det du strever med.' },
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
