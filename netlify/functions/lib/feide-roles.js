/* ============================================
   FEIDE-ROLES - Delt rollelogikk + gruppe-uttrekk for Feide-innlogging
   Brukes av feide-auth.js (web) og feide-mobile-auth.js (mobil).
   ============================================ */

const LAERER_AFFILIATIONS = ['employee', 'faculty', 'staff'];
const ELEV_AFFILIATIONS = ['student', 'pupil'];
const LAERER_NOKKELORD = ['teacher', 'ansatt', 'tilsatt', 'laerer', 'lærer'];
const ELEV_NOKKELORD = ['student', 'elev', 'pupil'];

function lower(value) {
  return String(value == null ? '' : value).toLowerCase();
}

/** Gjør et felt som kan være string ELLER array til en normalisert array. */
function tilArray(value) {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value]).map(lower);
}

function harLaerer(aff) {
  return aff.some((a) => LAERER_AFFILIATIONS.includes(a));
}
function harElev(aff) {
  return aff.some((a) => ELEV_AFFILIATIONS.includes(a));
}

/**
 * Bestemmer om en Feide-bruker er lærer eller elev.
 *
 * Prioritert rekkefølge (sterkeste signal først):
 *   1. eduPersonPrimaryAffiliation
 *   2. eduPersonAffiliation (kan være array)
 *   3. gruppe-medlemskap (membership.primaryAffiliation / membership.affiliation)
 *   4. nøkkelord i principal name / e-post (siste utvei)
 * Faller tilbake til 'elev' (tryggest standard for en elev-app).
 *
 * @param {object} userinfo - Feide userinfo-respons
 * @param {Array|null} groupsData - Feide groups-respons (valgfri)
 * @returns {'laerer'|'elev'}
 */
function bestemRolle(userinfo, groupsData = null) {
  // 1. eduPersonPrimaryAffiliation
  const primary = lower(
    userinfo.eduPersonPrimaryAffiliation ||
      userinfo['https://n.feide.no/claims/eduPersonPrimaryAffiliation'],
  );
  if (LAERER_AFFILIATIONS.includes(primary)) return 'laerer';
  if (ELEV_AFFILIATIONS.includes(primary)) return 'elev';

  // 2. eduPersonAffiliation (array eller string)
  const affListe = tilArray(
    userinfo.eduPersonAffiliation ||
      userinfo['https://n.feide.no/claims/eduPersonAffiliation'],
  );
  if (harLaerer(affListe)) return 'laerer';
  if (harElev(affListe)) return 'elev';

  // 3. Gruppe-medlemskap. NB: membership.basic er 'member'/'admin'/'owner' (IKKE
  //    en eduPerson-affiliation) — vi ser derfor på primaryAffiliation/affiliation.
  if (Array.isArray(groupsData)) {
    for (const group of groupsData) {
      const m = (group && group.membership) || {};
      const mAff = [lower(m.primaryAffiliation), ...tilArray(m.affiliation)].filter(Boolean);
      if (harLaerer(mAff)) return 'laerer';
      if (harElev(mAff)) return 'elev';
    }
  }

  // 4. Nøkkelord (siste utvei). Elev sjekkes FØR lærer, så en org-/skolestreng
  //    ikke feilklassifiserer en elev som lærer.
  const principalName = lower(
    userinfo.eduPersonPrincipalName ||
      userinfo['https://n.feide.no/claims/eduPersonPrincipalName'],
  );
  const email = lower(userinfo.email);
  if (ELEV_NOKKELORD.some((w) => principalName.includes(w) || email.includes(w))) return 'elev';
  if (LAERER_NOKKELORD.some((w) => principalName.includes(w) || email.includes(w))) return 'laerer';

  return 'elev';
}

/**
 * Plukker ut klasser/grupper vi kan tildele prøver til (Feide «gogroup» =
 * basis-/undervisningsgrupper) i en kompakt, lagrbar form. Brukt til:
 *  - lærer: liste å velge blant ved tildeling.
 *  - elev:  match mot prøver tildelt en gruppe-id.
 *
 * @param {Array|null} groupsData
 * @returns {Array<{id:string, navn:string, type:string, undervisning:boolean}>}
 */
function hentRelevanteGrupper(groupsData) {
  if (!Array.isArray(groupsData)) return [];
  return groupsData
    .filter((g) => g && g.id && (g.type === 'fc:gogroup' || g.type === 'fc:org'))
    .map((g) => ({
      id: String(g.id),
      navn: String(g.displayName || g.id),
      type: String(g.type),
      // go_type 'u' = undervisningsgruppe, 'b' = basisgruppe, 'a' = årstrinn.
      undervisning: g.go_type === 'u',
    }));
}

module.exports = { bestemRolle, hentRelevanteGrupper };
