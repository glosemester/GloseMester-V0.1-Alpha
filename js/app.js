/* ============================================
   APP.JS - GloseMester v0.5
   Binder sammen alle moduler + Global Lyd
   ============================================ */

import { velgRolle, tilbakeTilStart, visSide, velgKategori } from './core/navigation.js';
import { visSamling, visStortKort, lukkKort, byttSortering, visFeilMelding } from './features/kort-display.js';
import { startProve, sjekkSvar, settProveSprak, lesOppProve } from './features/quiz.js';
import { startOving, sjekkOvingSvar, settSprakRetning, lesOppOving, visOvingSamling, avsluttOving } from './features/practice.js';
import { startQRScanner, stopQRScanner } from './features/qr-scanner.js';
import { visEksportPopup, visImportPopup, kopierBackupKode } from './export-import.js';
import { lagreLokaleProver, hentLokaleProver, lagreBrukerKort } from './core/storage.js';

import './features/teacher.js';

// --- GLOBAL CLICK SOUND ---
// Vi bruker pop.mp3 som standard "klikk-lyd" for UI
const uiClickSound = new Audio('sounds/pop.mp3');
uiClickSound.volume = 0.4; // Litt lavere volum så det ikke blir slitsomt

// --- EXPORT TO WINDOW (HTML Access) ---
window.velgRolle = velgRolle;
window.tilbakeTilStart = tilbakeTilStart;
window.visSide = visSide;
window.velgKategori = velgKategori;

window.visStortKort = visStortKort;
window.lukkKort = lukkKort;
window.byttSortering = byttSortering;

window.startProve = startProve;
window.sjekkSvar = sjekkSvar;
window.settProveSprak = settProveSprak;
window.lesOppProve = lesOppProve;

window.startOving = startOving;
window.sjekkOvingSvar = sjekkOvingSvar;
window.settSprakRetning = settSprakRetning;
window.lesOppOving = lesOppOving;
window.visOvingSamling = visOvingSamling;
window.avsluttOving = avsluttOving;

window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;

window.visEksportPopup = visEksportPopup;
window.visImportPopup = visImportPopup;
window.kopierBackupKode = kopierBackupKode;
window.visFeilMelding = visFeilMelding;

window.lagreLokaleProver = lagreLokaleProver;
window.hentLokaleProver = hentLokaleProver;
window.lagreBrukerKort = lagreBrukerKort;

/**
 * Åpne mobilens dele-meny (Anbefal App)
 */
function delApp() {
    if (navigator.share) {
        navigator.share({
            title: 'GloseMester 🎮',
            text: 'Sjekk ut dette glose-spillet! Jeg samler kort og lærer engelsk.',
            url: window.location.href
        }).catch((error) => console.log('Deling avbrutt', error));
    } else {
        alert("Kopier denne lenken og send til en venn:\n" + window.location.href);
    }
}
window.delApp = delApp;


// --- INITIALISERING ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 GloseMester v0.5 - Audio & Design Active");
    
    // 1. Koble Enter-taster
    const ovingInput = document.getElementById('oving-svar');
    if(ovingInput) ovingInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkOvingSvar(); });
    
    const quizInput = document.getElementById('svar-input');
    if(quizInput) quizInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkSvar(); });

    // 2. AKTIVER GLOBAL LYD PÅ ALLE KNAPPER 🎵
    document.body.addEventListener('click', (e) => {
        // Sjekk om vi trykket på en knapp (eller inni en knapp)
        const targetBtn = e.target.closest('button') || e.target.closest('.role-card') || e.target.closest('.kategori-btn');
        
        if (targetBtn) {
            // Unngå dobbelt-lyd hvis knappen allerede har egen lyd-logikk (f.eks. i spillet)
            // Vi spiller kun hvis knappen IKKE har klassen 'alt-btn' (fordi practice.js håndterer den lyden selv)
            if (!targetBtn.classList.contains('alt-btn')) {
                uiClickSound.currentTime = 0;
                uiClickSound.play().catch(err => {
                    // Nettlesere blokkerer lyd til brukeren har interagerte med siden første gang.
                    // Dette er forventet, så vi ignorerer feilen.
                });
            }
        }
    });
});