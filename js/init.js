// ============================================
// INIT.JS - GloseMester v3.1
// Oppdatert: 17. desember 2025
// ============================================
// Global state og app-initialisering
// ============================================

// ============================================
// GLOBAL STATE
// ============================================
window.brukerNavn = "Spiller"; 
window.aktivRolle = ""; 
window.aktivProve = [];
window.gjeldendeSporsmaalIndex = 0;
window.riktigeSvar = 0;
window.ovingOrdliste = [];
window.ovingIndex = 0;

// VIKTIG ENDRING: Standard er nå 'no' (Norsk)
window.ovingRetning = 'no'; 
window.proveSprak = 'no';

window.credits = 0;
window.creditProgress = 0;
window.valgtSortering = 'nyeste';
window.editorListe = [];
window.valgtKategori = 'biler'; // Standard kategori
window.qrStream = null;
window.qrCanvas = null;
window.qrContext = null;
window.qrAnimationFrame = null;
window.currentProveIdForPrint = null;

// ============================================
// SERVICE WORKER REGISTRERING
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('✅ Service Worker registrert');
            
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
        }).catch(err => {
            console.warn('⚠️ Service Worker feilet:', err);
        });
    });
}

// ============================================
// APP INITIALISERING
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 GloseMester v3.1 - Starter...');
    
    // Last brukerdata
    const aktivBruker = localStorage.getItem('aktiv_bruker');
    if(aktivBruker) {
        window.brukerNavn = aktivBruker;
    } else {
        window.brukerNavn = "Spiller";
    }
    
    // Kall på loadUserData fra credits.js (hvis den er lastet)
    if(typeof loadUserData === 'function') loadUserData();

    // Sjekk om app er installert
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        const btn = document.getElementById('install-btn');
        if(btn) btn.style.display = 'none';
    } else {
        const btn = document.getElementById('install-btn');
        if(btn) btn.style.display = 'block';
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
    
    console.log('✅ GloseMester lastet!');
});

// ============================================
// PLACEHOLDER KORT-SYSTEM
// ============================================
function lagPlaceholderBilde(kategori) {
    const ikoner = {
        'biler': '🚗',
        'guder': '🏛️',
        'dinosaurer': '🦖',
        'dyr': '🐾'
    };
    
    return ikoner[kategori] || '🎴';
}