import { describe, it, expect } from 'vitest';
import { kunKlasser, erKlasse } from './feideKlasser';
import type { FeideGruppe } from '../../lib/data/users';

const klasse10A: FeideGruppe = { id: 'g:10a', navn: '10A', type: 'fc:gogroup', go_type: 'b' };
const fag10AMat: FeideGruppe = { id: 'g:10amat', navn: '10A-MAT', type: 'fc:gogroup', go_type: 'u', undervisning: true };
const skole: FeideGruppe = { id: 'o:skole', navn: 'Egge barneskole', type: 'fc:org' };
const kommune: FeideGruppe = { id: 'o:kommune', navn: 'Steinkjer kommune', type: 'fc:org' };

describe('erKlasse', () => {
  it('fc:gogroup er en klasse', () => {
    expect(erKlasse(klasse10A)).toBe(true);
    expect(erKlasse(fag10AMat)).toBe(true);
  });

  it('fc:org (skole/kommune) er IKKE en klasse', () => {
    expect(erKlasse(skole)).toBe(false);
    expect(erKlasse(kommune)).toBe(false);
  });
});

describe('kunKlasser', () => {
  it('filtrerer bort org-grupper, beholder klasser', () => {
    const r = kunKlasser([kommune, skole, klasse10A, fag10AMat]);
    expect(r.map((g) => g.navn)).toEqual(['10A', '10A-MAT']);
  });

  it('tom liste når kun org-grupper finnes (typisk «kun skoletilhørighet»)', () => {
    expect(kunKlasser([kommune, skole])).toEqual([]);
  });

  it('undefined → []', () => {
    expect(kunKlasser(undefined)).toEqual([]);
  });
});
