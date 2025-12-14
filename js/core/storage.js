// ============================================
// STORAGE.JS - GloseMester v0.1-ALPHA
// localStorage håndtering
// ============================================

/**
 * Hent brukerens samling
 * @returns {Array} Array med kort
 */
function getSamling() {
    try {
        const data = localStorage.getItem('samling_' + brukerNavn);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('❌ Feil ved henting av samling:', e);
        return [];
    }
}

/**
 * Lagre brukerens samling
 * @param {Array} samling - Array med kort å lagre
 */
function setSamling(samling) {
    try {
        localStorage.setItem('samling_' + brukerNavn, JSON.stringify(samling));
        console.log('✅ Samling lagret:', samling.length, 'kort');
    } catch (e) {
        console.error('❌ Feil ved lagring av samling:', e);
    }
}

/**
 * Legg til kort i samling
 * @param {object} kort - Kort-objekt å legge til
 */
function lagreBrukerKort(kort) {
    const samling = getSamling();
    samling.push(kort);
    setSamling(samling);
    console.log('✅ Kort lagt til:', kort.navn);
}

/**
 * Lagre prøve lokalt (14 dagers cache)
 * @param {string} kode - Prøvekode
 * @param {Array} proveData - Prøvedata
 */
function lagreProveLokalt(kode, proveData) {
    try {
        let lagredeProver = JSON.parse(localStorage.getItem('lagrede_prover_' + brukerNavn)) || [];
        
        const eksisterende = lagredeProver.find(p => p.kode === kode);
        
        if (!eksisterende) {
            lagredeProver.push({
                kode: kode,
                data: proveData,
                lagretDato: Date.now(),
                utloperDato: Date.now() + (14 * 24 * 60 * 60 * 1000) // 14 dager
            });
            
            localStorage.setItem('lagrede_prover_' + brukerNavn, JSON.stringify(lagredeProver));
            console.log('✅ Prøve lagret (utløper om 14 dager)');
        } else {
            console.log('ℹ️ Prøve allerede lagret');
        }
        
        rensUtgatteProver();
    } catch (e) {
        console.error('❌ Feil ved lagring av prøve:', e);
    }
}

/**
 * Rens utgåtte prøver (eldre enn 14 dager)
 */
function rensUtgatteProver() {
    try {
        let lagredeProver = JSON.parse(localStorage.getItem('lagrede_prover_' + brukerNavn)) || [];
        const now = Date.now();
        
        const gyldigeProver = lagredeProver.filter(p => p.utloperDato > now);
        
        localStorage.setItem('lagrede_prover_' + brukerNavn, JSON.stringify(gyldigeProver));
        
        const antallSlettet = lagredeProver.length - gyldigeProver.length;
        if (antallSlettet > 0) {
            console.log(`🗑️ Slettet ${antallSlettet} utgåtte prøve(r)`);
        }
    } catch (e) {
        console.error('❌ Feil ved rensing av prøver:', e);
    }
}

/**
 * Hent lagrede prøver
 * @returns {Array} Array med lagrede prøver
 */
function hentLagredeProver() {
    rensUtgatteProver();
    try {
        return JSON.parse(localStorage.getItem('lagrede_prover_' + brukerNavn)) || [];
    } catch (e) {
        console.error('❌ Feil ved henting av prøver:', e);
        return [];
    }
}

/**
 * Slett lagret prøve
 * @param {string} kode - Prøvekode å slette
 */
function slettLagretProve(kode) {
    try {
        let prover = hentLagredeProver();
        prover = prover.filter(p => p.kode !== kode);
        localStorage.setItem('lagrede_prover_' + brukerNavn, JSON.stringify(prover));
        console.log('✅ Prøve slettet');
        
        // Oppdater visning hvis funksjon finnes
        if (typeof visLagredeProver === 'function') {
            visLagredeProver();
        }
    } catch (e) {
        console.error('❌ Feil ved sletting av prøve:', e);
    }
}

/**
 * Hent lærerens lokale prøvebibliotek
 * @returns {Array} Array med prøver
 */
function hentLokaleProver() {
    try {
        return JSON.parse(localStorage.getItem('lokale_prover')) || [];
    } catch (e) {
        console.error('❌ Feil ved henting av lokale prøver:', e);
        return [];
    }
}

/**
 * Lagre prøve i lærerens bibliotek
 * @param {object} prove - Prøve-objekt å lagre
 */
function lagreLokaleProver(prove) {
    try {
        let bib = hentLokaleProver();
        bib.push(prove);
        localStorage.setItem('lokale_prover', JSON.stringify(bib));
        console.log('✅ Prøve lagret i bibliotek');
    } catch (e) {
        console.error('❌ Feil ved lagring av prøve:', e);
    }
}

console.log('💾 storage.js lastet');