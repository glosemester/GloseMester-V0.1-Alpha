// --- ALPHA SIKKERHET ---
// Enkel sjekk for å hindre innsyn under testing
const hemmeligPassord = "glose2025"; // Velg ditt eget passord

if (localStorage.getItem('alpha_access') !== 'true') {
    const input = prompt("🔐 GloseMester Alpha - Skriv passord:");
    if (input === hemmeligPassord) {
        localStorage.setItem('alpha_access', 'true');
        alert("Velkommen, Tester! 👋");
    } else {
        document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>⛔ Ingen tilgang</h1>";
        throw new Error("Feil passord - Tilgang nektet"); // Stopper all annen kode
    }
}// ============================================
// INIT.JS - GloseMester v0.1-ALPHA
// Global state og initialisering
// ============================================

// GLOBAL STATE
let brukerNavn = "Spiller";
let aktivRolle = "";
let aktivProve = [];
let gjeldendeSporsmaalIndex = 0;
let riktigeSvar = 0;
let ovingOrdliste = [];
let ovingIndex = 0;

// Norsk er standard
let ovingRetning = 'no'; 
let proveSprak = 'no';

// GLOBAL STATE
let brukerNavn = localStorage.getItem('aktiv_bruker') || "Spiller"; // Hent navn tidlig
let aktivRolle = "";
let aktivProve = [];

// Last inn lagrede credits direkte
let savedCredits = localStorage.getItem('credits_' + brukerNavn);
let credits = savedCredits ? parseInt(savedCredits) : 0;

// ... resten av variablene (gjeldendeSporsmaalIndex osv) ...

// SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('✅ Service Worker registrert:', reg.scope);
                reg.onupdatefound = () => {
                    const newWorker = reg.installing;
                    newWorker.onstatechange = () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if(confirm("Ny versjon tilgjengelig! Last inn på nytt?")) {
                                window.location.reload();
                            }
                        }
                    };
                };
            })
            .catch(err => {
                console.error('❌ Service Worker feilet:', err);
            });
    });
}

// APP INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 GloseMester v0.1-ALPHA - Starter...');
    
    const aktivBruker = localStorage.getItem('aktiv_bruker');
    if(aktivBruker) brukerNavn = aktivBruker;
    
    if (typeof loadUserData === 'function') loadUserData();

    // Sjekk PWA status
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            installBtn.style.display = 'none';
        } else {
            installBtn.style.display = 'block';
        }
    }

    // SJEKK URL PARAMETERE (QR-kode scan)
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quiz');
    const quizNavn = urlParams.get('navn');

    if (quizCode) {
        console.log("🔗 Prøve oppdaget i URL!");
        
        try {
            // Dekomprimer for å sjekke at den er gyldig
            if (typeof dekomprimer === 'function') {
                importertProveData = dekomprimer(quizCode);
                
                // Vis valg-popup i stedet for å starte direkte
                setTimeout(() => {
                    visImportValgPopup(quizNavn);
                }, 500);
                
                // Rydd opp URL slik at den ikke kjører igjen ved refresh
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            console.error("❌ Feil ved lesing av prøvekode:", e);
        }
    }
    
    console.log('✅ GloseMester initialisert!');
});

/**
 * Vis popup for å velge mellom ELEV (ta prøve) og LÆRER (lagre prøve)
 */
function visImportValgPopup(navn) {
    const popup = document.getElementById('import-valg-popup');
    if (popup) {
        document.getElementById('import-navn').innerText = navn ? `"${navn}"` : "en prøve";
        popup.style.display = 'flex';
    }
}

/**
 * Håndter valget fra popup
 */
function handterImportValg(handling) {
    document.getElementById('import-valg-popup').style.display = 'none';
    
    if (handling === 'elev') {
        // Start som elev
        velgRolle('kode');
        setTimeout(() => {
            if (typeof startProveMedData === 'function') {
                startProveMedData(importertProveData);
            } else {
                // Fallback hvis funksjon ikke finnes ennå, bruk input
                const kode = komprimer(importertProveData);
                document.getElementById('prove-kode').value = kode;
                startProve();
            }
        }, 200);
        
    } else if (handling === 'laerer') {
        // Lagre som lærer
        if (typeof lagreImportertProve === 'function') {
            const navn = document.getElementById('import-navn').innerText.replace(/"/g, '');
            lagreImportertProve(importertProveData, navn);
        }
    }
}

// Helper for quiz.js hvis vi starter direkte med data
function startProveMedData(data) {
    aktivProve = data;
    if (typeof lagreProveLokalt === 'function') {
        lagreProveLokalt("importert_" + Date.now(), aktivProve);
    }
    gjeldendeSporsmaalIndex = 0;
    riktigeSvar = 0;
    document.getElementById('prove-omraade').style.display = 'block';
    document.getElementById('prove-kode').parentElement.style.display = 'none';
    visNesteSporsmaal();
}

// INSTALL PROMPT HANDLER
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
            }
        });
    }
});

window.addEventListener('appinstalled', () => {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) installBtn.style.display = 'none';
});

console.log('📦 init.js lastet (v2 - import valg)');