/* ============================================
   APP.JS - GloseMester v0.8.1 (Auth Fix)
   ============================================ */

import { velgRolle, tilbakeTilStart, visSide, velgKategori } from './core/navigation.js';
import { visSamling, visStortKort, lukkKort, byttSortering, visFeilMelding, oppdaterProgresjonUI } from './features/kort-display.js';
import { startProve, sjekkSvar, settProveSprak, lesOppProve, visLagredeProverUI } from './features/quiz.js';
import { startOving, sjekkOvingSvar, byttOvingRetning, lesOppOving, visOvingSamling, avsluttOving, settSprakRetning } from './features/practice.js';
import { startQRScanner, stopQRScanner } from './features/qr-scanner.js';
import { visEksportPopup, visImportPopup, kopierBackupKode } from './export-import.js';
import { lagreLokaleProver, hentLokaleProver, lagreBrukerKort } from './core/storage.js';
import { leggTilOrd, slettOrd, lagreProve } from './features/teacher.js';

// VIKTIG: Importér auth direkte fra firebase.js for å sjekke status
import { auth } from './features/firebase.js';

import { 
    loggInnMedGoogle, loggInnMedEmail, loggInnMedFeide,
    registrerLaerer, loggUt, visInnlogging, visRegistrering,
    godtaPersonvern, avvisPersonvern
} from './features/auth.js';

import {
    lastInnProver, sokProver, kopierProvekode, visQRKode,
    redigerProve, slettProve, oppdaterProveliste
} from './features/saved-tests.js';

// --- GLOBALE INNSTILLINGER ---
window.appLydErPaa = false; 
let deferredPrompt; 

const uiClickSound = new Audio('sounds/pop.mp3');
uiClickSound.volume = 0.4;

// --- EXPORT TO WINDOW ---
// (Gjør funksjonene tilgjengelige for HTML onclick)
window.velgRolle = velgRolle;
window.tilbakeTilStart = tilbakeTilStart;
window.visSide = visSide;
window.velgKategori = velgKategori;
window.visSamling = visSamling;
window.visStortKort = visStortKort;
window.lukkKort = lukkKort;
window.byttSortering = byttSortering;
window.visFeilMelding = visFeilMelding;
window.oppdaterProgresjonUI = oppdaterProgresjonUI;
window.startProve = startProve;
window.sjekkSvar = sjekkSvar;
window.settProveSprak = settProveSprak;
window.lesOppProve = lesOppProve;
window.visLagredeProverUI = visLagredeProverUI;
window.startOving = startOving;
window.sjekkOvingSvar = sjekkOvingSvar;
window.byttOvingRetning = byttOvingRetning;
window.settSprakRetning = settSprakRetning;
window.lesOppOving = lesOppOving;
window.visOvingSamling = visOvingSamling;
window.avsluttOving = avsluttOving;
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;
window.visEksportPopup = visEksportPopup;
window.visImportPopup = visImportPopup;
window.kopierBackupKode = kopierBackupKode;
window.lagreLokaleProver = lagreLokaleProver;
window.hentLokaleProver = hentLokaleProver;
window.lagreBrukerKort = lagreBrukerKort;
window.leggTilOrd = leggTilOrd;
window.slettOrd = slettOrd;
window.lagreProve = lagreProve;
window.loggInnMedGoogle = loggInnMedGoogle;
window.loggInnMedEmail = loggInnMedEmail;
window.loggInnMedFeide = loggInnMedFeide;
window.registrerLaerer = registrerLaerer;
window.loggUt = loggUt;
window.visInnlogging = visInnlogging;
window.visRegistrering = visRegistrering;
window.godtaPersonvern = godtaPersonvern;
window.avvisPersonvern = avvisPersonvern;
window.lastInnProver = lastInnProver;
window.sokProver = sokProver;
window.kopierProvekode = kopierProvekode;
window.visQRKode = visQRKode;
window.redigerProve = redigerProve;
window.slettProve = slettProve;
window.oppdaterProveliste = oppdaterProveliste;

window.delApp = function() {
    if (navigator.share) {
        navigator.share({ title: 'GloseMester', url: window.location.href }).catch(() => {});
    } else {
        prompt("Kopier lenke:", window.location.href);
    }
};

// --- CUSTOM NAVIGATION OVERRIDES ---

// 1. Sjekk rolle-valg mot auth.currentUser
const originalVelgRolle = velgRolle;
window.velgRolle = function(rolle) {
    if (rolle === 'laerer') {
        // Her var feilen: Vi sjekker nå auth.currentUser direkte
        if (!auth.currentUser) {
            document.getElementById('laerer-login-popup').style.display = 'flex';
            return;
        }
    }
    originalVelgRolle(rolle);
};

// 2. Sjekk side-visning mot auth.currentUser
const originalVisSide = visSide;
window.visSide = function(sideId) {
    if (sideId === 'elev-dashboard') {
        oppdaterProgresjonUI();
        visLagredeProverUI();
    }
    
    // Her var den andre feilen
    if (sideId === 'lagrede-prover') {
        if (!auth.currentUser) {
            alert('Du må være innlogget for å se lagrede prøver');
            return;
        }
        lastInnProver();
    }
    
    originalVisSide(sideId);
};

// --- INIT FUNKSJONER ---
function initAudioToggle() {
    const btn = document.getElementById('lyd-toggle');
    if (!btn) return;

    btn.innerText = window.appLydErPaa ? '🔊' : '🔇';

    btn.onclick = () => {
        window.appLydErPaa = !window.appLydErPaa;
        btn.innerText = window.appLydErPaa ? '🔊' : '🔇';
        btn.style.transform = "scale(1.2)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
    };
}

function initPWAInstaller() {
    const installBtn = document.getElementById('pwa-install-btn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if(installBtn) installBtn.style.display = 'block';
    });

    if(installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA Install: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log(`🚀 GloseMester v0.8.1 - Ready`);
    
    initAudioToggle();
    initPWAInstaller();
    
    const ovingInput = document.getElementById('oving-svar');
    if(ovingInput) ovingInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkOvingSvar(); });
    
    const quizInput = document.getElementById('quiz-input');
    if(quizInput) quizInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkSvar(); });

    const passInput = document.getElementById('laerer-passord');
    if(passInput) passInput.addEventListener('keydown', (e) => { if(e.key==='Enter') loggInnMedEmail(); });

    document.body.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button') || e.target.closest('.role-card');
        if (targetBtn && targetBtn.id !== 'lyd-toggle' && !targetBtn.classList.contains('alt-btn')) {
            if (window.appLydErPaa) {
                uiClickSound.currentTime = 0;
                uiClickSound.play().catch(() => {});
            }
        }
    });
});