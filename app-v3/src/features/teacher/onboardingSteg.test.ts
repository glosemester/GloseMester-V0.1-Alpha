import { describe, it, expect } from 'vitest';
import { beregnOnboardingSteg, alleStegFullfort, nesteSteg } from './onboardingSteg';

describe('beregnOnboardingSteg', () => {
  it('alt ufullført for en helt ny lærer', () => {
    const steg = beregnOnboardingSteg({ antallProver: 0, totaltGjennomforinger: 0 });
    expect(steg.map((s) => s.fullfort)).toEqual([false, false, false]);
    expect(alleStegFullfort(steg)).toBe(false);
    expect(nesteSteg(steg)).toBe(0);
  });

  it('«lag» fullført når læreren har en prøve', () => {
    const steg = beregnOnboardingSteg({ antallProver: 1, totaltGjennomforinger: 0 });
    expect(steg[0].fullfort).toBe(true);
    expect(steg[1].fullfort).toBe(false);
    expect(nesteSteg(steg)).toBe(1);
  });

  it('«del» og «resultat» fullført når en besvarelse har kommet inn', () => {
    const steg = beregnOnboardingSteg({ antallProver: 1, totaltGjennomforinger: 3 });
    expect(steg[1].fullfort).toBe(true);
    expect(steg[2].fullfort).toBe(true);
  });

  it('alle steg fullført når besvarelser finnes', () => {
    const steg = beregnOnboardingSteg({ antallProver: 2, totaltGjennomforinger: 5 });
    expect(alleStegFullfort(steg)).toBe(true);
    expect(nesteSteg(steg)).toBe(-1);
  });
});
