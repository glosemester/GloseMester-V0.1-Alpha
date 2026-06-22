/* ============================================
   FEIDE-ROLES - Delt rollelogikk + gruppe-uttrekk for Feide-innlogging
   Brukes av feide-auth.js (web) og feide-mobile-auth.js (mobil).
   ============================================ */

const LAERER_AFFILIATIONS = ['employee', 'faculty', 'staff'];
const ELEV_AFFILIATIONS = ['student', 'pupil'];
const LAERER_NOKKELORD = ['teacher', 'ansatt', 'tilsatt', 'laerer', 'lærer'];
// Tittel-baserte lærersignaler (userinfo-title). Tiebreaker når affiliation/
// grupper ikke avgjør rollen — jf. begrunnelsen i Feide-konfig.
const LAERER_TITTEL_NOKKELORD = ['laerer', 'lærer', 'teacher', 'adjunkt', 'lektor', 'rektor', 'pedagog', 'inspektor', 'inspektør', 'undervis'];
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

  // 4. Tittel (userinfo-title) som tiebreaker. Pedagogiske titler peker på
  //    lærer. Sjekkes før det svakere navn-/e-post-nøkkelordet.
  const title = lower(userinfo.title || userinfo['https://n.feide.no/claims/title']);
  if (title && LAERER_TITTEL_NOKKELORD.some((w) => title.includes(w))) return 'laerer';

  // 5. Nøkkelord (siste utvei). Elev sjekkes FØR lærer, så en org-/skolestreng
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

// Hvor langt etter utløp en skoleårsgruppe fortsatt regnes som «forrige
// skoleår». Brukes som fallback i sommerferien (skoleåret slutter midt i juni,
// nytt år starter midt i august) så lærerens klasser ikke forsvinner mellom to
// skoleår. ~6 mnd dekker sommergapet med margin, men dropper eldre årganger.
const FORRIGE_SKOLEAR_DAGER = 184;

/** Er gruppa aktiv/fremtidig nå? fc:org og gogroup uten notAfter regnes alltid aktiv. */
function erAktivGruppe(group, naaMs) {
  if (!group.notAfter) return true;
  const ms = Date.parse(group.notAfter);
  return Number.isNaN(ms) ? true : ms >= naaMs;
}

/**
 * Plukker ut klasser/grupper vi kan tildele prøver til (Feide «gogroup» =
 * basis-/undervisningsgrupper) i en kompakt, lagrbar form. Brukt til:
 *  - lærer: liste å velge blant ved tildeling.
 *  - elev:  match mot prøver tildelt en gruppe-id.
 *
 * Feide groups-API kalles med `showAll=true` (ellers utelates utløpte grupper
 * — og skoleårsgrupper utløper midt i juni, så hele sommeren satt lærere igjen
 * med «kun skoletilhørighet»). Vi filtrerer derfor selv: behold alltid skolen
 * (fc:org, utløper aldri) + aktive/fremtidige klasser. Hvis ingen klasser er
 * aktive (sommerferie) faller vi tilbake til forrige skoleårs klasser, men
 * dropper eldre årganger så lista ikke samler opp døde klasser over tid.
 *
 * @param {Array|null} groupsData
 * @param {Date} [naa] - referansetidspunkt (injiserbart for test)
 * @returns {Array<{id:string, navn:string, type:string, undervisning:boolean}>}
 */
function hentRelevanteGrupper(groupsData, naa = new Date()) {
  if (!Array.isArray(groupsData)) return [];
  const naaMs = naa.getTime();
  const nadeMs = FORRIGE_SKOLEAR_DAGER * 24 * 60 * 60 * 1000;

  const relevante = groupsData.filter(
    (g) => g && g.id && (g.type === 'fc:gogroup' || g.type === 'fc:org'),
  );
  const harAktivGogruppe = relevante.some(
    (g) => g.type === 'fc:gogroup' && erAktivGruppe(g, naaMs),
  );

  return relevante
    .filter((g) => {
      if (g.type !== 'fc:gogroup') return true; // fc:org (skole): alltid med
      if (erAktivGruppe(g, naaMs)) return true; // aktive/fremtidige klasser
      if (harAktivGogruppe) return false; // skoleåret går: dropp utløpte
      const ms = Date.parse(g.notAfter); // sommerferie: behold forrige skoleår
      return !Number.isNaN(ms) && ms >= naaMs - nadeMs;
    })
    .map((g) => ({
      id: String(g.id),
      navn: String(g.displayName || g.id),
      type: String(g.type),
      // go_type 'u' = undervisningsgruppe (fag), 'b' = basisgruppe (klasse),
      // 'a' = årstrinn. Lagres eksplisitt så lærer-UI kan skille fag fra klasse
      // — alle tre deler type 'fc:gogroup' (jf. Feide-docs).
      go_type: g.go_type ? String(g.go_type) : undefined,
      undervisning: g.go_type === 'u',
    }));
}

module.exports = { bestemRolle, hentRelevanteGrupper };
