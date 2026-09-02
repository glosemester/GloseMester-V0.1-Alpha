/**
 * Onboarding-steg for nye lærere — ren logikk uten Firebase-avhengighet.
 * Utleder en «kom i gang»-sjekkliste fra lærerens faktiske data slik at
 * dashbordet kan vise fremdrift: lag prøve → del/tildel → første besvarelse.
 */

export interface OnboardingSteg {
  /** Stabil id for React-nøkkel og testing. */
  id: 'lag' | 'del' | 'resultat';
  tittel: string;
  beskrivelse: string;
  fullfort: boolean;
}

export interface OnboardingInput {
  /** Antall prøver læreren har laget. */
  antallProver: number;
  /** Totalt antall elevbesvarelser på tvers av lærerens prøver. */
  totaltGjennomforinger: number;
}

/**
 * Beregner sjekkliste-stegene. «Del»-steget regnes som fullført når minst én
 * besvarelse har kommet inn (en besvarelse beviser at koden ble delt og brukt).
 */
export function beregnOnboardingSteg(input: OnboardingInput): OnboardingSteg[] {
  const harProve = input.antallProver > 0;
  const harDelt = input.totaltGjennomforinger > 0;
  const harResultat = input.totaltGjennomforinger > 0;

  return [
    {
      id: 'lag',
      tittel: 'Lag din første prøve',
      beskrivelse: 'Skriv inn ordpar på norsk og fremmedspråket.',
      fullfort: harProve,
    },
    {
      id: 'del',
      tittel: 'Del prøven med klassen',
      beskrivelse: 'Gi elevene prøvekoden eller QR-koden.',
      fullfort: harDelt,
    },
    {
      id: 'resultat',
      tittel: 'Følg med på resultatene',
      beskrivelse: 'Se hvem som har tatt prøven og hvordan det gikk.',
      fullfort: harResultat,
    },
  ];
}

/** Er alle steg fullført? Da er læreren ferdig onboardet og listen kan skjules. */
export function alleStegFullfort(steg: OnboardingSteg[]): boolean {
  return steg.every((s) => s.fullfort);
}

/** Indeks til første ufullførte steg, eller -1 hvis alt er gjort. */
export function nesteSteg(steg: OnboardingSteg[]): number {
  return steg.findIndex((s) => !s.fullfort);
}
