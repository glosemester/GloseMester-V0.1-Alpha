/* ============================================
   APP.JS - GloseMester v1.0
   Binder sammen alle moduler
   ============================================ */

import { velgRolle, tilbakeTilStart, visSide, velgKategori } from './core/navigation.js';
import { visSamling, visStortKort, lukkKort, byttSortering, visFeilMelding } from './features/kort-display.js';
import { startProve, sjekkSvar, settProveSprak, lesOppProve } from './features/quiz.js';
// ✅ Oppdatert import: Inkluderer avsluttOving
import { startOving, sjekkOvingSvar, settSprakRetning, lesOppOving, visOvingSamling, avsluttOving } from './features/practice.js';
import { startQRScanner, stopQRScanner } from './features/qr-scanner.js';
import { visEksportPopup, visImportPopup, kopierBackupKode } from './export-import.js';

// ✅ Ny import: Kobler storage til appen
import { lagreLokaleProver, hentLokaleProver, lagreBrukerKort } from './core/storage.js';

// Last inn lærer-logikk (side-effect import)
import './features/teacher.js';

// --- VIKTIG: KOBLE TIL WINDOW FOR HTML ONCLICK ---
// Siden du har onclick="..." i HTML-en din, må funksjonene ligge på window-objektet.

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
window.avsluttOving = avsluttOving; // ✅ Ny funksjon koblet til

window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;

window.visEksportPopup = visEksportPopup;
window.visImportPopup = visImportPopup;
window.kopierBackupKode = kopierBackupKode;
window.visFeilMelding = visFeilMelding;

// ✅ Storage bridge (gjør at HTML og teacher.js finner disse)
window.lagreLokaleProver = lagreLokaleProver;
window.hentLokaleProver = hentLokaleProver;
window.lagreBrukerKort = lagreBrukerKort;

// Setup events når appen laster
/**
 * Åpne mobilens dele-meny
 */
function delApp() {
    if (navigator.share) {
        navigator.share({
            title: 'GloseMester 🎮',
            text: 'Sjekk ut dette glose-spillet! Jeg samler kort og lærer engelsk.',
            url: window.location.href
        })
        .then(() => console.log('Delt vellykket'))
        .catch((error) => console.log('Deling avbrutt', error));
    } else {
        // Fallback for PC som ikke støtter deling
        alert("Kopier denne lenken og send til en venn:\n" + window.location.href);
    }
}

// Husk å binde den til window slik at HTML finner den
window.delApp = delApp;
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 GloseMester v1.0 Module System Active");
    
    // Koble Enter-taster manuelt der det trengs
    const ovingInput = document.getElementById('oving-svar');
    if(ovingInput) ovingInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkOvingSvar(); });
    
    const quizInput = document.getElementById('svar-input');
    if(quizInput) quizInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkSvar(); });
});