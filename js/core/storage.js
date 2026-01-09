/* ============================================
   STORAGE.JS - Sikker lagring v0.9.5
   Håndterer Kort, XP, Diamanter OG Elev-prøver
   ============================================ */

const STORAGE_KEY = 'glosemester_samling';
const CREDITS_KEY = 'glosemester_credits';
const XP_KEY = 'glosemester_xp';
const ELEV_PROVER_KEY = 'glosemester_elev_prover'; // NYTT

// Hent brukernavn (brukes som nøkkel hvis flere spiller på samme enhet)
function getUserKey(baseKey) {
    const user = window.brukerNavn || "Spiller";
    return `${baseKey}_${user}`;
}

// --- KORTSAMLING ---

export function getSamling() {
    const raw = localStorage.getItem(getUserKey(STORAGE_KEY));
    return raw ? JSON.parse(raw) : [];
}

export function setSamling(nySamling) {
    localStorage.setItem(getUserKey(STORAGE_KEY), JSON.stringify(nySamling));
}

export function lagreBrukerKort(kort) {
    if (!kort || !kort.id) {
        console.error("Forsokte a lagre ugyldig kort:", kort);
        return;
    }

    let samling = getSamling();
    
    // Legg til dato for når kortet ble vunnet
    const kortMedData = {
        ...kort,
        vunnetDato: new Date().toISOString()
    };
    
    samling.push(kortMedData);
    setSamling(samling);
    
    // Fiks for undefined-feilen: Sjekk både name og navn
    const kortNavn = kort.name || kort.navn || "Ukjent kort";
    console.log(`Kort lagret sikkert: ${kortNavn}`);
}

// --- DIAMANTER (CREDITS) ---

export function getCredits() {
    const raw = localStorage.getItem(getUserKey(CREDITS_KEY));
    return raw ? parseInt(raw, 10) : 0; // Standard: 0 diamanter
}

export function saveCredits(amount) {
    localStorage.setItem(getUserKey(CREDITS_KEY), amount);
}

// --- TOTAL XP (Progresjon) ---

export function getTotalCorrect() {
    const raw = localStorage.getItem(getUserKey(XP_KEY));
    return raw ? parseInt(raw, 10) : 0;
}

export function saveTotalCorrect(amount) {
    localStorage.setItem(getUserKey(XP_KEY), amount);
}

// ==============================================
// NYTT: ELEV-PRØVER (7-dagers lagring)
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
    console.log(`Prove lagret lokalt: ${proveData.tittel}`);
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
            console.log(`Fjernet ${prover.length - aktiveProver.length} utlopte prover`);
        }
        
        return aktiveProver;
    } catch (error) {
        console.error("Feil ved henting av elev-prover:", error);
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