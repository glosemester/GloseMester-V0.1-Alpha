import type { FeideGruppe } from '../../lib/data/users';

/**
 * En Feide-«klasse» i lærer-UI er en basis-/undervisningsgruppe (`fc:gogroup`)
 * — IKKE org-nivå (`fc:org` = skole/kommune/skoleeier). Org-gruppene lagres for
 * adminvisning, men skal aldri presenteres som en klasse læreren kan tildele
 * prøver til (ellers ser «Dine klasser» ut som «kun skoletilhørighet»).
 */
export function erKlasse(g: FeideGruppe): boolean {
  return g.type === 'fc:gogroup';
}

/** Filtrerer en Feide-gruppeliste ned til kun klasser (`fc:gogroup`). */
export function kunKlasser(grupper: FeideGruppe[] | undefined): FeideGruppe[] {
  return (grupper ?? []).filter(erKlasse);
}
