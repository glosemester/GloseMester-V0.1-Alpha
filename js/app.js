/* ============================================
   APP.JS - GloseMester v0.6 beta
   Binder sammen alle moduler + Global Lyd
   ============================================ */

import { velgRolle, tilbakeTilStart, visSide, velgKategori } from './core/navigation.js';
import { visSamling, visStortKort, lukkKort, byttSortering, visFeilMelding } from './features/kort-display.js';
import { startProve, sjekkSvar, settProveSprak, lesOppProve } from './features/quiz.js';

// HER VAR FEILEN - NÅ ER DEN RETTET 👇 (Kun én "features/")
import { startOving, sjekkOvingSvar, byttOvingRetning, settSprakRetning, lesOppOving, visOvingSamling, avsluttOving } from './features/practice.js';

import { startQRScanner, stopQRScanner } from './features/qr-scanner.js';
import { visEksportPopup, visImportPopup, kopierBackupKode } from './export-import.js';
import { lagreLokaleProver, hentLokaleProver, lagreBrukerKort } from './core/storage.js';

import { auth, onAuthStateChanged } from './features/firebase.js';
import { leggTilOrd, slettOrd, lagreProve, ensureTeacherPrivacyAccepted, teacherLoginWithGoogle, teacherLogout, renderTeacherAuthUI, initTeacherUI } from './features/teacher.js';

// --- GLOBAL CLICK SOUND ---
const uiClickSound = new Audio('sounds/pop.mp3');
uiClickSound.volume = 0.4;

// --- EXPORT TO WINDOW ---
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
window.byttOvingRetning = byttOvingRetning; 
window.settSprakRetning = settSprakRetning;
window.lesOppOving = lesOppOving;
window.visOvingSamling = visOvingSamling;
window.avsluttOving = avsluttOving;


// Åpne lærerportal med personvern-samtykke (hvis nødvendig)
window.openTeacherPortal = async function() {
    // Vis lærer-dashboard uansett, slik at mobil/Netlify ikke oppleves som "ingenting skjer"
    visSide('laerer-dashboard');

    // Hvis ikke innlogget: vis login-boks
    if (!auth.currentUser) {
        renderTeacherAuthUI();
        return;
    }

    // Innlogget: krev samtykke
    const ok = await ensureTeacherPrivacyAccepted();
    if (!ok) {
        tilbakeTilStart();
        return;
    }
    renderTeacherAuthUI();
};

// Lærer-portal
window.leggTilOrd = leggTilOrd;
window.slettOrd = slettOrd;
window.lagreProve = lagreProve;
window.teacherLoginWithGoogle = teacherLoginWithGoogle;
window.teacherLogout = teacherLogout;

window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;

window.visEksportPopup = visEksportPopup;
window.visImportPopup = visImportPopup;
window.kopierBackupKode = kopierBackupKode;
window.visFeilMelding = visFeilMelding;

window.lagreLokaleProver = lagreLokaleProver;
window.hentLokaleProver = hentLokaleProver;
window.lagreBrukerKort = lagreBrukerKort;

// Mobil deling
window.delApp = function() {
    if (navigator.share) {
        navigator.share({
            title: 'GloseMester 🎮',
            text: 'Lær gloser og samle kort!',
            url: window.location.href
        }).catch(() => {});
    } else {
        prompt("Kopier lenke:", window.location.href);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 GloseMester v0.6 beta Ready");
    
    // Enter-tast støtte
    const ovingInput = document.getElementById('oving-svar');
    if(ovingInput) ovingInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkOvingSvar(); });
    
    const quizInput = document.getElementById('svar-input');
    if(quizInput) quizInput.addEventListener('keydown', (e) => { if(e.key==='Enter') sjekkSvar(); });

    // Global lyd på knapper
    document.body.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button') || e.target.closest('.role-card') || e.target.closest('.kategori-btn');
        if (targetBtn && !targetBtn.classList.contains('alt-btn')) {
            if (window.soundEnabled !== false) {
                uiClickSound.currentTime = 0;
                uiClickSound.play().catch(() => {});
            }
        }
    });

    // Initialiser lærer-UI (trygt selv om lærer ikke brukes)
    initTeacherUI();

    // Hold lærer-UI synkron med innlogging
    onAuthStateChanged(auth, () => {
        renderTeacherAuthUI();
    });

    // Init lærer-UI (plan badge, default visibility)
    initTeacherUI?.().catch(() => {});
});