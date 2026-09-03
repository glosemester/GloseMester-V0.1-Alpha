import type { Rolle } from '../../lib/data/users';

/** Sant hvis handlingen fjerner admin-rollen fra brukeren som selv utfører den. */
export function erSelvDemotering(radUid: string, egenUid: string | undefined, nyRolle: Rolle): boolean {
  return radUid === egenUid && nyRolle !== 'admin';
}
