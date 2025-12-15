// ============================================
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

// ENDRET: Norsk er nå standard
let ovingRetning = 'no'; 
let proveSprak = 'no';

let credits = 0;
let creditProgress = 0;
let valgtSortering = 'nyeste';
let valgtKategori = 'biler';
let editorListe = [];

// SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('✅ Service Worker registrert:', reg.scope);
                
                // Sjekk for oppdateringer
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
    
    // Last inn brukerdata
    const aktivBruker = localStorage.getItem('aktiv_bruker');
    if(aktivBruker) {
        brukerNavn = aktivBruker;
    } else {
        brukerNavn = "Spiller";
    }
    
    // Initialiser brukerdata hvis loadUserData finnes
    if (typeof loadUserData === 'function') {
        loadUserData();
    }

    // Sjekk om app kjører som PWA (standalone)
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            installBtn.style.display = 'none';
        } else {
            installBtn.style.display = 'block';
        }
    }

    // Sjekk om det er en quiz-kode i URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quiz');
    if (quizCode) {
        setTimeout(() => {
            if (typeof velgRolle === 'function') {
                velgRolle('kode');
                setTimeout(() => {
                    const proveKodeInput = document.getElementById('prove-kode');
                    if (proveKodeInput) {
                        proveKodeInput.value = quizCode;
                        if (typeof startProve === 'function') {
                            startProve();
                        }
                    }
                }, 200);
                alert("Prøve funnet! Starter automatisk...");
            }
        }, 500);
    }
    
    console.log('✅ GloseMester initialisert!');
    console.log('👤 Bruker:', brukerNavn);
    console.log('💎 Credits:', credits);
});

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
                console.log(`User response: ${outcome}`);
                deferredPrompt = null;
            }
        });
    }
});

// APP INSTALLED EVENT
window.addEventListener('appinstalled', () => {
    console.log('✅ GloseMester installert som PWA!');
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
});

console.log('📦 init.js lastet');