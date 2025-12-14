// ============================================
// NAVIGATION.JS - GloseMester v0.1-ALPHA
// Navigasjon mellom sider og roller
// ============================================

/**
 * Velg rolle (elev, øving, lærer)
 * @param {string} rolle - Rolle å velge ('kode', 'oving', 'laerer', 'om-oss')
 */
function velgRolle(rolle) {
    // Skjul alle sider
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    aktivRolle = rolle;
    
    // Sett opp brukernavn hvis ikke satt
    if (!brukerNavn) {
        brukerNavn = "Spiller";
        loadUserData();
    }
    
    // Håndter forskjellige roller
    if (rolle === 'kode') {
        aktivRolle = 'elev'; 
        document.getElementById('elev-meny').style.display = 'flex';
        document.getElementById('elev-dashboard').classList.add('active');
        markerKnapp('elev-meny', 'elev-dashboard');
        updateCreditUI();
        
        // Vis lagrede prøver hvis funksjon finnes
        if (typeof visLagredeProver === 'function') {
            visLagredeProver();
        }
        
        // Sett fokus på input etter kort delay
        setTimeout(() => {
            const proveKodeInput = document.getElementById('prove-kode');
            if (proveKodeInput) proveKodeInput.focus();
        }, 100);
        
        // Track i analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Navigation', 'Valgte rolle', 'Elev (har kode)');
        }
    }
    else if (rolle === 'laerer') {
        visSide('laerer-dashboard');
        
        if (typeof trackEvent === 'function') {
            trackEvent('Navigation', 'Valgte rolle', 'Lærer');
        }
    } 
    else if (rolle === 'oving') { 
        document.getElementById('oving-meny').style.display = 'flex'; 
        updateCreditUI();
        visSide('oving-start');
        
        if (typeof trackEvent === 'function') {
            trackEvent('Navigation', 'Valgte rolle', 'Øving');
        }
    }
    else if (rolle === 'om-oss') {
        document.getElementById('om-oss').classList.add('active');
        
        if (typeof trackEvent === 'function') {
            trackEvent('Navigation', 'Åpnet side', 'Om oss');
        }
    }
}

/**
 * Tilbake til startside (landing page)
 */
function tilbakeTilStart() {
    // Skjul alle menyer
    ['elev-meny', 'laerer-meny', 'oving-meny'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Skjul alle sider
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Vis landing page
    const landingPage = document.getElementById('landing-page');
    if (landingPage) landingPage.classList.add('active');
    
    // Reset inputs
    document.querySelectorAll('input').forEach(i => i.value = "");
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('Navigation', 'Tilbake til start', aktivRolle);
    }
    
    // Reset aktiv rolle
    aktivRolle = "";
    
    console.log('🏠 Tilbake til landing page');
}

/**
 * Vis en spesifikk side
 * @param {string} sideId - ID på siden å vise
 */
function visSide(sideId) {
    // Skjul alle sider
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Skjul alle menyer først
    ['elev-meny', 'laerer-meny', 'oving-meny'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Håndter spesialtilfeller
    if (sideId === 'om-oss') {
        // Ingen meny for om-oss
    } else if (aktivRolle === 'elev') {
        const elevMeny = document.getElementById('elev-meny');
        if (elevMeny) elevMeny.style.display = 'flex';
        markerKnapp('elev-meny', sideId);
    } else if (aktivRolle === 'laerer') {
        const laererMeny = document.getElementById('laerer-meny');
        if (laererMeny) laererMeny.style.display = 'flex';
        markerKnapp('laerer-meny', sideId);
    } else if (aktivRolle === 'oving') {
        const ovingMeny = document.getElementById('oving-meny');
        if (ovingMeny) ovingMeny.style.display = 'flex';
        markerKnapp('oving-meny', sideId);
    }
    
    // Vis valgt side
    const side = document.getElementById(sideId);
    if (side) {
        side.classList.add('active');
        
        // Kjør side-spesifikk logikk
        if (sideId === 'elev-samling' && typeof visSamling === 'function') {
            visSamling();
        }
        if (sideId === 'oving-samling' && typeof visOvingSamling === 'function') {
            visOvingSamling();
        }
        if (sideId === 'laerer-dashboard' && typeof oppdaterBibliotekVisning === 'function') {
            oppdaterBibliotekVisning();
        }
        if (sideId === 'elev-dashboard' && typeof visLagredeProver === 'function') {
            visLagredeProver();
        }
        
        // Track i analytics
        if (typeof trackEvent === 'function') {
            trackEvent('Navigation', 'Åpnet side', sideId);
        }
    }
}

/**
 * Marker aktiv knapp i navigasjon
 * @param {string} menyId - ID på menyen
 * @param {string} sideId - ID på siden
 */
function markerKnapp(menyId, sideId) {
    const meny = document.getElementById(menyId);
    if (!meny) return;
    
    // Fjern active fra alle knapper i denne menyen
    meny.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    
    // Legg til active på riktig knapp
    const btn = document.getElementById('btn-' + sideId);
    if (btn) btn.classList.add('active');
}

/**
 * Velg kategori (for kort-samling)
 * @param {string} kategori - Kategori å velge ('biler', 'guder', 'dinosaurer', 'dyr')
 */
function velgKategori(kategori) {
    valgtKategori = kategori;
    
    // Oppdater UI
    document.querySelectorAll('.kategori-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const aktivCard = document.querySelector(`.kategori-card[data-kategori="${kategori}"]`);
    if (aktivCard) {
        aktivCard.classList.add('active');
    }
    
    console.log('📂 Kategori valgt:', kategori);
    
    // Track i analytics
    if (typeof trackEvent === 'function') {
        trackEvent('Navigation', 'Valgte kategori', kategori);
    }
}

console.log('🧭 navigation.js lastet');