/* ============================================
   STORAGE.JS - Sikker lagring v2.0
   Håndterer Kort, XP, Diamanter OG Elev-prøver
   GloseMester v2.6
   ============================================ */

const STORAGE_KEY = 'mester_samling';
const CREDITS_KEY = 'mester_credits';
const XP_KEY = 'mester_xp';
const ELEV_PROVER_KEY = 'mester_elev_prover';

// Brukeridentitet for nøkkel-namespacing.
// Bruker Firebase UID (serverbekreftet) slik at data på en delt enhet ikke kan
// nås av en annen bruker ved å endre et klient-satt navn. Uinnloggede brukere
// deler ett "gjest"-namespace.
const LEGACY_USER_TOKEN = 'Spiller';

function getUserToken() {
    const uid = window.GloseMester?.bruker?.uid;
    return uid || 'gjest';
}

function getUserKey(baseKey) {
    return `${baseKey}_${getUserToken()}`;
}

// Engangsmigrering: tidligere ble alt lagret under det klient-satte navnet
// (nesten alltid fallback-verdien "Spiller"). Flytt slike nøkler over til
// gjeldende brukers UID-namespace første gang vedkommende er innlogget, så
// ingen mister kortsamling/XP/diamanter ved overgangen.
function migrerLegacyNokler() {
    const token = getUserToken();
    if (token === 'gjest' || token === LEGACY_USER_TOKEN) return;
    if (localStorage.getItem('mester_migrert_uid') === token) return;

    const baser = [STORAGE_KEY, CREDITS_KEY, XP_KEY, ELEV_PROVER_KEY];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.endsWith(`_${LEGACY_USER_TOKEN}`)) continue;
        const base = key.slice(0, -(`_${LEGACY_USER_TOKEN}`).length);
        if (!baser.some(b => base === b || base.startsWith(`${b}_`))) continue;

        const nyNokkel = `${base}_${token}`;
        if (localStorage.getItem(nyNokkel) === null) {
            localStorage.setItem(nyNokkel, localStorage.getItem(key));
        }
    }
    localStorage.setItem('mester_migrert_uid', token);
}

if (typeof window !== 'undefined') {
    window.addEventListener('glosemester:bruker-innlogget', migrerLegacyNokler);
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
