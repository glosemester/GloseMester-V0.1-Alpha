/* ============================================
   FEIDE-ROLES - Delt rollelogikk for Feide-innlogging
   Brukes av feide-auth.js (web) og feide-mobile-auth.js (mobil).
   ============================================ */

const LAERER_AFFILIATIONS = ['employee', 'faculty', 'staff'];
const ELEV_AFFILIATIONS = ['student', 'pupil'];
const LAERER_NOKKELORD = ['teacher', 'ansatt', 'tilsatt', 'laerer', 'lærer', 'admin'];
const ELEV_NOKKELORD = ['student', 'elev', 'pupil'];

/**
 * Bestemmer om en Feide-bruker er lærer eller elev.
 * Vurderer i prioritert rekkefølge: primær affiliation → gruppe-affiliations
 * → nøkkelord i principal name / e-post. Faller tilbake til 'elev'.
 *
 * @param {object} userinfo - Feide userinfo-respons
 * @param {Array|null} groupsData - Feide groups-respons (valgfri)
 * @returns {'laerer'|'elev'}
 */
function bestemRolle(userinfo, groupsData = null) {
    const primaryAffiliation = userinfo.eduPersonPrimaryAffiliation ||
                               userinfo['https://n.feide.no/claims/eduPersonPrimaryAffiliation'];
    if (primaryAffiliation) {
        const aff = primaryAffiliation.toLowerCase();
        if (LAERER_AFFILIATIONS.includes(aff)) return 'laerer';
        if (ELEV_AFFILIATIONS.includes(aff)) return 'elev';
    }

    if (groupsData && Array.isArray(groupsData)) {
        for (const group of groupsData) {
            const membership = group.membership || {};
            const aff = (membership.primaryAffiliation || membership.basic || '').toLowerCase();
            if (LAERER_AFFILIATIONS.includes(aff)) return 'laerer';
            if (ELEV_AFFILIATIONS.includes(aff)) return 'elev';
        }
    }

    const principalName = (userinfo.eduPersonPrincipalName ||
                           userinfo['https://n.feide.no/claims/eduPersonPrincipalName'] || '').toLowerCase();
    const email = (userinfo.email || '').toLowerCase();

    if (LAERER_NOKKELORD.some(w => principalName.includes(w) || email.includes(w))) return 'laerer';
    if (ELEV_NOKKELORD.some(w => principalName.includes(w) || email.includes(w))) return 'elev';

    return 'elev';
}

module.exports = { bestemRolle };
