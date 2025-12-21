// ============================================
// INIT.JS - GloseMester v0.9.0-BETA
// Oppdatert: 20. desember 2025
// ============================================

// ============================================
// GLOBAL STATE
// ============================================
window.APP_VERSION = "v0.9.0-BETA"; // VIKTIG: Oppdater denne ved hver versjon!

window.brukerNavn = "Spiller"; 
window.aktivRolle = ""; 
window.aktivProve = [];
window.gjeldendeSporsmaalIndex = 0;
window.riktigeSvar = 0;
window.ovingOrdliste = [];
window.ovingIndex = 0;
window.ovingRetning = 'no'; 
window.proveSprak = 'no';
window.credits = 0;
window.creditProgress = 0;
window.valgtSortering = 'nyeste';
window.editorListe = [];
window.valgtKategori = 'biler';
window.qrStream = null;
window.qrCanvas = null;
window.qrContext = null;
window.qrAnimationFrame = null;
window.currentProveIdForPrint = null;

// Variabel for å lagre installasjons-prompten (Android/Desktop)
let deferredPrompt;

// ============================================
// VERSJONSTAG (VISES I HJØRNET)
// ============================================
function visVersjonstag() {
    const tag = document.createElement('div');
    tag.id = 'version-tag';
    tag.innerText = window.APP_VERSION;
    tag.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 15px;
        font-size: 11px;
        color: #b0b0b5;
        z-index: 50;
        pointer-events: none;
        font-weight: 500;
        font-family: monospace;
    `;
    document.body.appendChild(tag);
}

// ============================================
// SERVICE WORKER REGISTRERING + UPDATE VARSLING
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('✅ Service Worker registrert');
            
            // LYTT ETTER OPPDATERINGER
            reg.onupdatefound = () => {
                const newWorker = reg.installing;
                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        visUpdateVarsling();
                    }
                };
            };
        }).catch(err => {
            console.warn('⚠️ Service Worker feilet:', err);
        });
        
        // LYTT ETTER MELDINGER FRA SW
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'NEW_VERSION') {
                console.log('🔔 Ny versjon tilgjengelig:', event.data.version);
                visUpdateVarsling(event.data.version);
            }
        });
    });
}

// ============================================
// PWA INSTALL LOGIKK (ANDROID & IOS)
// ============================================

// Lytt etter 'beforeinstallprompt' (Android/Chrome)
window.addEventListener('beforeinstallprompt', (e) => {
    // Forhindre at Chrome viser den automatisk med en gang
    e.preventDefault();
    // Lagre eventet så vi kan bruke det senere
    deferredPrompt = e;
    console.log("📲 Install prompt fanget opp");
    // Sørg for at knappen vises
    visInstallKnapp();
});

function visInstallKnapp() {
    // Sjekk om vi allerede kjører som app (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    if (!isStandalone) {
        const btn = document.getElementById('pwa-install-btn');
        if(btn) btn.style.display = 'block';
    }
}

// Funksjon som kalles når bruker trykker på knappen
window.installerApp = function() {
    // 1. Hvis vi har en automatisk prompt (Android/Chrome)
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    } 
    // 2. Hvis vi IKKE har prompt, sjekk om det er iOS
    else {
        // Enkel sjekk for iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            // Vis manuell instruksjon for iOS
            document.getElementById('ios-install-popup').style.display = 'flex';
        } else {
            // Fallback for andre (f.eks desktop Safari/Firefox som ikke støtter PWA installasjon direkte)
            alert("For å installere: Trykk på delings-ikonet eller menyen i nettleseren din og velg 'Legg til på startsiden' eller 'Installer app'.");
        }
    }
};


// ============================================
// UPDATE VARSLING POPUP
// ============================================
function visUpdateVarsling(nyVersjon) {
    if(document.getElementById('update-popup')) return;
    
    const popup = document.createElement('div');
    popup.id = 'update-popup';
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    popup.innerHTML = `
        <h3 style="margin:0 0 10px 0; font-size:18px;">🎉 Ny versjon!</h3>
        <p style="margin:0 0 15px 0; font-size:14px; color:#666;">
            ${nyVersjon || 'En ny versjon'} er tilgjengelig.
        </p>
        <button class="btn-primary" onclick="oppdaterApp()" style="width:100%; margin-bottom:10px;">
            Oppdater nå
        </button>
        <button class="btn-secondary" onclick="this.parentElement.remove()" style="width:100%; font-size:12px;">
            Senere
        </button>
    `;
    
    document.body.appendChild(popup);
}

// OPPDATER APP (REFRESH)
window.oppdaterApp = function() {
    window.location.reload(true); // Hard refresh
};

// ============================================
// APP INITIALISERING
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    console.log(`🚀 GloseMester ${window.APP_VERSION} - Starter...`);
    
    // Vis versjonstag
    visVersjonstag();
    
    // Last brukerdata
    const aktivBruker = localStorage.getItem('aktiv_bruker');
    if(aktivBruker) {
        window.brukerNavn = aktivBruker;
    } else {
        window.brukerNavn = "Spiller";
    }
    
    // Kall på loadUserData fra credits.js (hvis den er lastet)
    if(typeof loadUserData === 'function') loadUserData();

    // Sjekk om app er installert (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isStandalone) {
        // Skjul installasjonsknappen hvis allerede installert
        const btn = document.getElementById('pwa-install-btn');
        if(btn) btn.style.display = 'none';
    } else {
        // Hvis ikke installert, vis knappen (uansett enhet)
        // Logikken i installerApp() håndterer hva som skjer
        visInstallKnapp();
    }

    // Sjekk for quiz-kode i URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quiz');
    if (quizCode) {
        setTimeout(() => {
            if(typeof velgRolle === 'function') velgRolle('kode'); 
            setTimeout(() => {
                const input = document.getElementById('prove-kode');
                if(input) input.value = quizCode;
                if(typeof startProve === 'function') startProve();
            }, 200);
            alert("Prøve funnet! Starter automatisk...");
        }, 500);
    }
    
    console.log(`✅ GloseMester ${window.APP_VERSION} lastet!`);
});

// ============================================
// SLIDE-IN ANIMATION FOR POPUP
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);