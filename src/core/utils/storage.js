/* ============================================
   STORAGE.JS - Sikker lagring v2.0
   Håndterer Kort, XP, Diamanter OG Elev-prøver
   GloseMester v2.6
   ============================================ */

const STORAGE_KEY = 'mester_samling';
const CREDITS_KEY = 'mester_credits';
const XP_KEY = 'mester_xp';
const ELEV_PROVER_KEY = 'mester_elev_prover';

// Hent brukernavn (brukes som nøkkel hvis flere spiller på samme enhet)
function getUserKey(baseKey) {
    const user = window.brukerNavn || localStorage.getItem('aktiv_bruker') || "Spiller";
    return `${baseKey}_${user}`;
}

// --- KORTSAMLING ---

export function getSamling(fag = 'gloser') {
    const raw = localStorage.getItem(getUserKey(`${STORAGE_KEY}_${fag}`));
    return raw ? JSON.parse(raw) : [];
}

export function setSamling(nySamling, fag = 'gloser') {
    localStorage.setItem(getUserKey(`${STORAGE_KEY}_${fag}`), JSON.stringify(nySamling));
}

export function lagreBrukerKort(kort, fag = 'gloser') {
    if (!kort || !kort.id) {
        console.error("Forsøkte å lagre ugyldig kort:", kort);
        return;
    }

    let samling = getSamling(fag);

    // Legg til dato for når kortet ble vunnet
    const kortMedData = {
        ...kort,
        vunnetDato: new Date().toISOString()
    };

    samling.push(kortMedData);
    setSamling(samling, fag);

    // Fiks for undefined-feilen: Sjekk både name og navn
    const kortNavn = kort.name || kort.navn || "Ukjent kort";
    console.log(`✅ Kort lagret: ${kortNavn} (${fag})`);
}

// --- DIAMANTER (CREDITS) ---

export function getCredits(fag = 'gloser') {
    const raw = localStorage.getItem(getUserKey(`${CREDITS_KEY}_${fag}`));
    return raw ? parseInt(raw, 10) : 0; // Standard: 0 diamanter
}

export function saveCredits(amount, fag = 'gloser') {
    localStorage.setItem(getUserKey(`${CREDITS_KEY}_${fag}`), amount);
}

// --- TOTAL XP (Progresjon) ---

export function getTotalCorrect(fag = 'gloser') {
    const raw = localStorage.getItem(getUserKey(`${XP_KEY}_${fag}`));
    return raw ? parseInt(raw, 10) : 0;
}

export function saveTotalCorrect(amount, fag = 'gloser') {
    localStorage.setItem(getUserKey(`${XP_KEY}_${fag}`), amount);
}

// ==============================================
// ELEV-PRØVER (7-dagers lagring)
// ==============================================

/**
 * Lagrer en prøve lokalt for eleven (7 dagers cache)
 */
export function lagreElevProveLokalt(proveData) {
    const prover = hentElevProverLokalt();

    // Sjekk om prøven allerede finnes
    const eksisterende = prover.findIndex(p => p.id === proveData.id);

    const proveObjekt = {
        id: proveData.id,
        tittel: proveData.tittel,
        ordliste: proveData.ordliste,
        lagretDato: Date.now(),
        utloperDato: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dager
    };

    if (eksisterende > -1) {
        // Oppdater eksisterende
        prover[eksisterende] = proveObjekt;
    } else {
        // Legg til ny
        prover.push(proveObjekt);
    }

    // Lagre tilbake
    localStorage.setItem(getUserKey(ELEV_PROVER_KEY), JSON.stringify(prover));
    console.log(`📝 Prøve lagret lokalt: ${proveData.tittel}`);
}

/**
 * Henter alle lagrede prøver for eleven
 * Fjerner automatisk utløpte prøver
 */
export function hentElevProverLokalt() {
    const raw = localStorage.getItem(getUserKey(ELEV_PROVER_KEY));
    if (!raw) return [];

    try {
        const prover = JSON.parse(raw);
        const now = Date.now();

        // Filtrer bort utløpte prøver
        const aktiveProver = prover.filter(p => p.utloperDato > now);

        // Lagre tilbake den rensede listen
        if (aktiveProver.length !== prover.length) {
            localStorage.setItem(getUserKey(ELEV_PROVER_KEY), JSON.stringify(aktiveProver));
            console.log(`🗑️ Fjernet ${prover.length - aktiveProver.length} utløpte prøver`);
        }

        return aktiveProver;
    } catch (error) {
        console.error("❌ Feil ved henting av elev-prøver:", error);
        return [];
    }
}

/**
 * Sletter en spesifikk prøve
 */
export function slettElevProveLokalt(proveId) {
    const prover = hentElevProverLokalt();
    const filtrert = prover.filter(p => p.id !== proveId);
    localStorage.setItem(getUserKey(ELEV_PROVER_KEY), JSON.stringify(filtrert));
}

/**
 * Sletter alle elev-prøver
 */
export function tomElevProverLokalt() {
    localStorage.removeItem(getUserKey(ELEV_PROVER_KEY));
}

// Make globally available
if (typeof window !== 'undefined') {
    window.MesterStorage = {
        getSamling,
        setSamling,
        lagreBrukerKort,
        getCredits,
        saveCredits,
        getTotalCorrect,
        saveTotalCorrect,
        lagreElevProveLokalt,
        hentElevProverLokalt,
        slettElevProveLokalt,
        tomElevProverLokalt
    };
}

console.log('💾 Storage utilities loaded (v2.0)');
