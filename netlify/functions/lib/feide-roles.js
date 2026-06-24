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
    .map((g) => {
      const ut = {
        id: String(g.id),
        navn: String(g.displayName || g.id),
        type: String(g.type),
        undervisning: g.go_type === 'u',
      };
      // go_type 'u' = undervisningsgruppe (fag), 'b' = basisgruppe (klasse),
      // 'a' = årstrinn — alle tre deler type 'fc:gogroup' (jf. Feide-docs).
      // VIKTIG: fc:org-grupper (skole/kommune) har ingen go_type. Ta med feltet
      // KUN når det finnes — Firestore avviser `undefined`-verdier, og en
      // `go_type:undefined` på skole-gruppa fikk hele innloggings-skrivingen til
      // å kaste (set() feilet → 500 → Feide-login knakk).
      if (g.go_type) ut.go_type = String(g.go_type);
      return ut;
    });
}

/**
 * MIDLERTIDIG feilsøking: oppsummerer det RÅ groups-API-svaret (FØR filtrering i
 * hentRelevanteGrupper) i en kompakt, Firestore-trygg form. Brukt av feide-auth.js
 * til å skrive et `feide_diag`-felt, så lærer-dashbordet kan vise direkte om Feide
 * returnerer klasser (fc:gogroup) i det hele tatt — eller bare skolen (fc:org).
 * Fjernes sammen med diagnose-boksen når groups-edu-årsaken er bekreftet.
 *
 * Personvern: tar IKKE med navn/id — kun type, go_type og utløpt-flagg.
 *
 * @param {Array|null} groupsData - rått svar fra groups-API
 * @param {Date} [naa] - referansetidspunkt (injiserbart for test)
 * @returns {{raaAntall:number, typer:Array<{type:string,antall:number}>, prove:Array<object>}}
 */
function diagnoserRaaGrupper(groupsData, naa = new Date()) {
  const liste = Array.isArray(groupsData) ? groupsData : [];
  const naaMs = naa.getTime();

  const teller = {};
  for (const g of liste) {
    const t = (g && g.type) || 'ukjent';
    teller[t] = (teller[t] || 0) + 1;
  }

  return {
    raaAntall: liste.length,
    // Array (ikke map) så type-strenger aldri blir Firestore-feltnavn.
    typer: Object.keys(teller).map((t) => ({ type: t, antall: teller[t] })),
    // Liten metadata-prøve. Bygges felt-for-felt så objektet aldri får en
    // `undefined`-verdi (Firestore avviser undefined — jf. go_type-krasjen).
    prove: liste.slice(0, 15).map((g) => {
      const rad = { type: (g && g.type) || 'ukjent' };
      if (g && g.go_type) rad.go_type = String(g.go_type);
      if (g && g.notAfter) {
        const ms = Date.parse(g.notAfter);
        if (!Number.isNaN(ms)) rad.utlopt = ms < naaMs;
      }
      return rad;
    }),
  };
}

module.exports = { bestemRolle, hentRelevanteGrupper, diagnoserRaaGrupper };
