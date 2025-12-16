/* ============================================
   APP.JS - GloseMester v1.0 (The Brain)
   ============================================ */

// 1. IMPORT AV FUNKSJONER
// Vi henter funksjonalitet fra de andre filene
import { startQRScanner } from './features/qr-scanner.js';
import { startProve, sjekkSvar } from './features/quiz.js';
import { startOving, sjekkOvingSvar, settSprakRetning } from './features/practice.js';
import { opprettBackup, lastInnBackup } from './features/auth.js';
import { velgRolle, tilbakeTilStart, visSide } from './core/navigation.js';
import { visSamling, velgKategori, byttSortering } from './features/kort-display.js';

// 2. INITIALISERING
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 GloseMester v1.0 - App startet");
    setupGlobalListeners();
});

// 3. EVENT LISTENERS (Knappetrykk)
function setupGlobalListeners() {
    
    // --- NAVIGASJON ---
    kobleKnapp('btn-elev-dashboard', () => visSide('elev-dashboard'));
    kobleKnapp('btn-elev-samling', () => visSide('elev-samling'));
    
    // Tilbake-knapper (vi bruker klasse siden det er flere)
    document.querySelectorAll('button').forEach(btn => {
        if (btn.innerText === "Avslutt" || btn.innerText === "Logg ut" || btn.innerText === "Tilbake til start") {
            btn.addEventListener('click', tilbakeTilStart);
        }
    });

    // --- ROLLEVALG (LANDING PAGE) ---
    // Merk: Vi må kanskje legge ID-er på role-cards i HTML for å gjøre dette pent,
    // men foreløpig kan vi bruke onclick i HTML for akkurat disse, 
    // ELLER hente dem via klasser her. La oss bruke onclick i HTML for landing enn så lenge for enkelhets skyld.

    // --- QR SCANNER ---
    // Vi bruker en wrapper-funksjon for å sende med parameter
    kobleKnapp('btn-scan-elev', () => startQRScanner('elev'));
    kobleKnapp('btn-scan-laerer', () => startQRScanner('laerer')); // Må legge ID på knappen i HTML

    // --- QUIZ (PRØVE) ---
    kobleKnapp('btn-start-prove', startProve);
    kobleKnapp('btn-svar-quiz', sjekkSvar); // Gi Svar-knappen i quiz.html en ID: id="btn-svar-quiz"

    // --- ØVING ---
    kobleKnapp('btn-svar-tekst', sjekkOvingSvar); // Knappen i practice.js
    
    // Språkvalg i øving
    kobleKnapp('lang-en', () => settSprakRetning('en'));
    kobleKnapp('lang-no', () => settSprakRetning('no'));

    // --- SETTINGS / BACKUP ---
    kobleKnapp('btn-backup-eksport', opprettBackup);
    // ... import knapp ...

    // --- KORT VISNING ---
    const sorteringSelect = document.querySelector('.sort-select');
    if (sorteringSelect) {
        sorteringSelect.addEventListener('change', (e) => byttSortering(e.target.value));
    }
}

// HJELPEFUNKSJON FOR Å KOBLE KNAPPER SIKKERT
function kobleKnapp(id, handling) {
    const knapp = document.getElementById(id);
    if (knapp) {
        knapp.addEventListener('click', handling);
    } else {
        // Dette er bare for debugging, så vi ser om vi mangler ID-er i HTML
        // console.warn(`Fant ikke knapp med ID: ${id}`);
    }
}

// 4. GJØR NOEN FUNKSJONER GLOBALE (MIDLERTIDIG)
// For at gammel HTML med onclick="..." fortsatt skal virke mens vi rydder,
// kan vi jukse litt og legge funksjonene på window-objektet.
window.velgRolle = velgRolle;
window.visSide = visSide;
window.tilbakeTilStart = tilbakeTilStart;
window.velgKategori = velgKategori;