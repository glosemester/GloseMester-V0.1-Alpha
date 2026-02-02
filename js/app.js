/* ============================================
   APP.JS - Hovedkontroller v0.7.6-BETA
   Inkluderer:
   - Varsling ved ny versjon (Auto-update)
   - PWA Install
   - Navigasjon og Logikk
   - GloseBank Admin & Browse
   - HAMBURGER-MENY for mobil
   ============================================ */

// VIKTIG: Disable console.log i production & setup error handling
import { disableConsoleInProduction, setupGlobalErrorHandler } from './core/logger.js';
disableConsoleInProduction();
setupGlobalErrorHandler();

// VIKTIG: Last vocabulary.js FØRST
import './vocabulary.js';

import { initNavigation, visSide } from './core/navigation.js';
import { visSamling, lukkKort, byttSortering } from './features/kort-display.js';
import { visGalleri } from './features/gallery.js';
import { initSoundSystem, spillLyd } from './ui/helpers.js';
import { initTeacherFeatures } from './features/teacher.js';
import './features/auth.js';
import { startQRScanner, lukkScanner } from './features/qr-scanner.js';
import {
    startProve,
    sjekkSvar,
    settProveSprak,
    lesOppProve,
    visLagredeProverUI
} from './features/quiz.js';

import {
    startOving,
    settSprakRetning,
    visOvingSamling,
    sjekkOvingSvar,
    avsluttOving,
    lesOppOving
} from './features/practice.js';

import {
    visSavedTests,
    oppdaterProveliste
} from './features/saved-tests.js';

import {
    lastInnGlosebankProver,
    visAdminMenyHvisAdmin
} from './features/glosebank-admin.js';

import {
    lastInnGlosebankSok
} from './features/glosebank-browse.js';

import {
    lastInnStandardprover
} from './features/standardprove.js';

import {
    initGDPR,
    visCookieInnstillinger,
    slettMinData,
    eksporterMinData
} from './features/gdpr.js';

import {
    initDashboard,
    eksporterTilCSV
} from './features/teacher-analytics.js';

// --- GLOBALE FUNKSJONER ---

window.visSide = visSide;
window.visSamling = function () { visSamling(); };
window.lukkKort = lukkKort;
window.byttSortering = byttSortering;

window.startProve = startProve;
window.sjekkSvar = sjekkSvar;
window.settProveSprak = settProveSprak;
window.lesOppProve = lesOppProve;
window.visLagredeProverUI = visLagredeProverUI;

window.startOving = startOving;
window.settSprakRetning = settSprakRetning;
window.visOvingSamling = visOvingSamling;
window.sjekkOvingSvar = sjekkOvingSvar;
window.avsluttOving = avsluttOving;
window.lesOppOving = lesOppOving;

window.visSavedTests = visSavedTests;
window.oppdaterProveliste = oppdaterProveliste;

window.lastInnGlosebankProver = lastInnGlosebankProver;
window.visAdminMenyHvisAdmin = visAdminMenyHvisAdmin;
window.lastInnGlosebankSok = lastInnGlosebankSok;
window.lastInnStandardprover = lastInnStandardprover;

// GDPR-funksjoner
window.visCookieInnstillinger = visCookieInnstillinger;
window.slettMinData = slettMinData;
window.eksporterMinData = eksporterMinData;

// Analytics/Dashboard
window.initDashboard = initDashboard;
window.eksporterTilCSV = eksporterTilCSV;

// Galleri
window.visGalleriSide = function () {
    visSide('galleri-visning');
    visGalleri();
};

window.gaTilbakeFraGalleri = function () {
    const rolle = sessionStorage.getItem('aktivRolle');

    document.getElementById('elev-meny').style.display = 'none';
    document.getElementById('oving-meny').style.display = 'none';
    document.getElementById('laerer-meny').style.display = 'none';

    if (rolle === 'oving') {
        document.getElementById('oving-meny').style.display = 'flex';
        visOvingSamling();
    }
    else if (rolle === 'kode') {
        document.getElementById('elev-meny').style.display = 'flex';
        visSide('elev-samling');
    }
    else {
        console.warn("Ukjent rolle ved retur fra galleri, går til start.");
        tilbakeTilStart();
    }
};

window.velgRolle = function (rolle) {
    spillLyd('klikk');
    sessionStorage.setItem('aktivRolle', rolle);

    // KRITISK FIX: Skjul landing page ordentlig
    const landingPage = document.getElementById('landing-page');
    landingPage.classList.remove('active');
    landingPage.style.display = 'none';

    document.getElementById('elev-meny').style.display = 'none';
    document.getElementById('oving-meny').style.display = 'none';
    document.getElementById('laerer-meny').style.display = 'none';

    if (rolle === 'oving') {
        document.getElementById('oving-meny').style.display = 'flex';
        visSide('oving-start');
    }
    else if (rolle === 'kode') {
        document.getElementById('elev-meny').style.display = 'flex';
        visSide('elev-dashboard');
    }
    else if (rolle === 'laerer') {
        // SJEKK: Er bruker allerede innlogget?
        if (window.currentUser) {
            console.log("✅ Allerede innlogget, går direkte til dashboard");
            document.getElementById('laerer-meny').style.display = 'flex';
            visSide('laerer-dashboard');

            // --- NAVNE-LOGIKK START ---
            // 1. Prioriter Database-navn, så Google-navn (displayName), så E-post
            const visningsNavn = window.currentUser.navn || window.currentUser.displayName || window.currentUser.email;

            // 2. Oppdater UI i "Pillen" nederst
            const infoSpan = document.getElementById('user-info');
            if (infoSpan) {
                infoSpan.innerText = visningsNavn;
            }

            // 3. Oppdater Hamburger-menyen øverst (Drawer header)
            updateHamburgerUserInfo(visningsNavn);
            // --- NAVNE-LOGIKK SLUTT ---

            // Vis admin-meny hvis admin (fra auth.js)
            if (typeof window.visAdminMenyHvisAdmin === 'function') {
                window.visAdminMenyHvisAdmin(window.currentUser);
            }
        } else {
            // Ikke innlogget, vis login-popup
            document.getElementById('laerer-login-popup').style.display = 'flex';
        }
    }
};

window.tilbakeTilStart = function () {
    sessionStorage.removeItem('aktivRolle');
    document.getElementById('elev-meny').style.display = 'none';
    document.getElementById('oving-meny').style.display = 'none';
    document.getElementById('laerer-meny').style.display = 'none';

    // Lukk hamburger-meny hvis åpen
    lukkHamburger();

    visSide('landing-page');
};

/* ============================================
   --- HAMBURGER-MENY LOGIKK ---
   ============================================ */

/**
 * Toggle hamburger-meny (åpne/lukke)
 */
window.toggleHamburger = function () {
    const navItems = document.getElementById('nav-items');
    const overlay = document.getElementById('hamburger-overlay');

    if (navItems && overlay) {
        const isOpen = navItems.classList.contains('open');

        if (isOpen) {
            // Lukk
            navItems.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Gjenopprett scrolling
        } else {
            // Åpne
            navItems.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Deaktiver scrolling
        }
    }
};

/**
 * Lukk hamburger-meny
 */
window.lukkHamburger = function () {
    const navItems = document.getElementById('nav-items');
    const overlay = document.getElementById('hamburger-overlay');

    if (navItems && overlay) {
        navItems.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Gjenopprett scrolling
    }
};

/**
 * Oppdater bruker-navn i hamburger-meny
 */
function updateHamburgerUserInfo(text) {
    const navItems = document.getElementById('nav-items');
    if (navItems) {
        // Sett teksten direkte. Hvis null/undefined, bruk "Gjest"
        navItems.setAttribute('data-user-email', text || 'Gjest');
    }
}

// Eksponer til window for tilgang fra auth.js
window.updateHamburgerUserInfo = updateHamburgerUserInfo;

/* ============================================
   --- AUTO-UPDATE SYSTEM ---
   ============================================ */

function visUpdateVarsling() {
    if (document.getElementById('update-popup')) return;

    const popup = document.createElement('div');
    popup.id = 'update-popup';
    popup.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: white;
        border-radius: 12px; padding: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 20000;
        max-width: 300px; animation: slideIn 0.5s ease; border: 1px solid #eee;
    `;

    popup.innerHTML = `
        <h3 style="margin:0 0 10px 0; font-size:18px;">Ny versjon klar!</h3>
        <p style="margin:0 0 15px 0; font-size:13px; color:#666;">
            En oppdatering er lastet ned. Oppdater for å få siste nytt.
        </p>
        <button onclick="window.location.reload()" class="btn-primary" style="width:100%; margin-bottom:10px;">
            Oppdater nå
        </button>
        <button onclick="this.parentElement.remove()" class="btn-secondary" style="width:100%; font-size:12px;">
            Senere
        </button>
    `;

    document.body.appendChild(popup);
    spillLyd('fanfare');
}

// CSS animasjon for update popup
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes slideIn { 
        from { transform: translateX(100%); opacity: 0; } 
        to { transform: translateX(0); opacity: 1; } 
    }
`;
document.head.appendChild(styleSheet);

/* ============================================
   --- PWA INSTALLER ---
   ============================================ */

let deferredPrompt;

function initPWAInstaller() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    installBtn.addEventListener('click', async () => {
        if (isIOS) {
            const popup = document.getElementById('ios-install-popup');
            if (popup) popup.style.display = 'flex';
        }
        else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
        }
        else {
            alert("Kunne ikke starte automatisk installasjon. Prøv menyen i nettleseren.");
        }
    });

    if (isIOS) {
        const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (!isInStandalone) {
            installBtn.style.display = 'block';
            installBtn.innerText = "Installer på iPhone";
        }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
        installBtn.innerText = "Installer App";
    });

    window.addEventListener('appinstalled', () => {
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });
}

/* ============================================
   --- QR SCANNER & KAMPANJEKODE ---
   ============================================ */

window.startQRScanner = startQRScanner;
window.lukkScanner = lukkScanner;

window.aktiverKampanjekode = async function () {
    const input = document.getElementById('kampanje-input');
    // Sjekk også modal-input hvis hoved-input er tomt
    const modalInput = document.getElementById('kampanje-input-modal');

    let kodeElement = input;
    if ((!input || !input.value) && modalInput && modalInput.value) {
        kodeElement = modalInput;
    }

    if (!kodeElement) {
        console.error("Fant ikke kampanje-input element");
        return;
    }

    const kode = kodeElement.value.trim().toUpperCase();

    if (!kode) {
        alert("Skriv inn en kampanjekode");
        return;
    }

    const kampanjekoder = {
        'BETA2026': { type: 'premium', dager: 90, beskrivelse: 'Beta-testkode (90 dager)' },
        'LANSERING': { type: 'premium', dager: 30, beskrivelse: 'Lanseringskode (30 dager)' },
        'TEST7': { type: 'premium', dager: 7, beskrivelse: 'Testkode (7 dager)' },
        'SKOLE2026': { type: 'skolepakke', dager: 365, beskrivelse: 'Skolepakke (365 dager)' },
        'SKOLEPILOT': { type: 'skolepakke', dager: 180, beskrivelse: 'Skolepilot (180 dager)' },
        'SKOLETEST': { type: 'skolepakke', dager: 30, beskrivelse: 'Skoletest (30 dager)' }
    };

    const kampanje = kampanjekoder[kode];

    if (!kampanje) {
        alert('Ugyldig kampanjekode: ' + kode);
        kodeElement.value = '';
        return;
    }

    if (!window.currentUser || !window.currentUser.uid) {
        alert('Du må være innlogget for å aktivere kampanjekode');
        return;
    }

    try {
        const { db, doc, updateDoc, serverTimestamp } = await import('./features/firebase.js');
        const utloperDato = new Date();
        utloperDato.setDate(utloperDato.getDate() + kampanje.dager);

        const userRef = doc(db, 'users', window.currentUser.uid);
        await updateDoc(userRef, {
            'abonnement.type': kampanje.type,
            'abonnement.status': 'active',
            'abonnement.utloper': utloperDato,
            'abonnement.kampanjekode': kode,
            'abonnement.sist_oppdatert': serverTimestamp()
        });

        alert(`✅ Kampanjekode aktivert!\n\n${kampanje.beskrivelse}\n\nDu har nå ${kampanje.type.toUpperCase()}-tilgang i ${kampanje.dager} dager.`);
        kodeElement.value = '';
        setTimeout(() => { window.location.reload(); }, 2000);

    } catch (error) {
        console.error('Feil ved aktivering av kampanjekode:', error);
        alert('Feil ved aktivering. Prøv igjen senere.');
    }
};

/* ============================================
   --- INITIALISERING ---
   ============================================ */

export function initApp() {
    console.log('✅ GloseMester v0.10.3 kjører...');

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW Registrert');
            reg.onupdatefound = () => {
                const newWorker = reg.installing;
                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        visUpdateVarsling();
                    }
                };
            };
        }).catch(err => console.warn('SW Feil:', err));

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NEW_VERSION') {
                visUpdateVarsling();
            }
        });
    }

    initSoundSystem();
    initNavigation();
    initPWAInstaller();
    initGDPR(); // ✅ Initialiser GDPR-funksjoner (cookie-banner, etc.)

    // SETUP HAMBURGER EVENT LISTENERS
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerOverlay = document.getElementById('hamburger-overlay');

    if (hamburgerBtn) {
        // VIKTIG: Bruk addEventListener, ikke onclick i HTML
        hamburgerBtn.addEventListener('click', toggleHamburger);
        console.log('✅ Hamburger-knapp event listener lagt til');
    }

    if (hamburgerOverlay) {
        hamburgerOverlay.addEventListener('click', lukkHamburger);
        console.log('✅ Hamburger-overlay event listener lagt til');
    }

    if (typeof initTeacherFeatures === 'function') {
        initTeacherFeatures();
    }

    // Lukk hamburger-meny når man klikker på en side (unntatt knappen selv)
    document.addEventListener('click', (e) => {
        const navItems = document.getElementById('nav-items');
        const hamburgerBtn = document.getElementById('hamburger-btn');

        if (navItems && navItems.classList.contains('open') &&
            !navItems.contains(e.target) &&
            !hamburgerBtn.contains(e.target)) {
            lukkHamburger();
        }
    });

    // ✅ Setup Event Listeners (erstatter onclick i HTML)
    setupEventListeners();

    // ✅ Setup offline/online detection
    setupNetworkDetection();
}

function setupEventListeners() {
    // Landingsside: Roller
    const roleOving = document.getElementById('role-oving');
    if (roleOving) roleOving.addEventListener('click', () => window.velgRolle('oving'));

    const roleKode = document.getElementById('role-kode');
    if (roleKode) roleKode.addEventListener('click', () => window.velgRolle('kode'));

    const roleLaerer = document.getElementById('role-laerer');
    if (roleLaerer) roleLaerer.addEventListener('click', () => window.velgRolle('laerer'));

    // Info Modal
    const btnInfo = document.getElementById('btn-info-modal');
    if (btnInfo) btnInfo.addEventListener('click', () => {
        const modal = document.getElementById('info-modal');
        if (modal) modal.style.display = 'flex';
    });

    // --- NAVIGASJON (ELEV) ---
    const btnElevDash = document.getElementById('btn-elev-dashboard');
    if (btnElevDash) btnElevDash.addEventListener('click', () => window.visSide('elev-dashboard'));

    const btnElevSamling = document.getElementById('btn-elev-samling');
    if (btnElevSamling) btnElevSamling.addEventListener('click', () => { window.visSide('elev-samling'); window.visSamling(); });

    const btnElevGalleri = document.getElementById('btn-elev-galleri-nav');
    if (btnElevGalleri) btnElevGalleri.addEventListener('click', () => window.visGalleriSide());

    const btnElevLogout = document.getElementById('btn-elev-logout');
    if (btnElevLogout) btnElevLogout.addEventListener('click', () => window.tilbakeTilStart());

    // --- NAVIGASJON (ØVING) ---
    const btnOvingStart = document.getElementById('btn-oving-start');
    if (btnOvingStart) btnOvingStart.addEventListener('click', () => window.visSide('oving-start'));

    const btnOvingSamling = document.getElementById('btn-oving-samling');
    if (btnOvingSamling) btnOvingSamling.addEventListener('click', () => window.visOvingSamling());

    const btnOvingGalleri = document.getElementById('btn-oving-galleri-nav');
    if (btnOvingGalleri) btnOvingGalleri.addEventListener('click', () => window.visGalleriSide());

    const btnOvingLogout = document.getElementById('btn-oving-logout');
    if (btnOvingLogout) btnOvingLogout.addEventListener('click', () => window.tilbakeTilStart());

    // --- NAVIGASJON (LÆRER) ---
    const btnLaererHjem = document.getElementById('btn-laerer-hjem');
    if (btnLaererHjem) btnLaererHjem.addEventListener('click', () => window.tilbakeTilStart());

    const btnLaererDash = document.getElementById('btn-laerer-dashboard');
    if (btnLaererDash) btnLaererDash.addEventListener('click', () => { window.visSide('laerer-dashboard'); window.lukkHamburger(); });

    const btnLagredeProver = document.getElementById('btn-lagrede-prover');
    if (btnLagredeProver) btnLagredeProver.addEventListener('click', () => { window.visSide('lagrede-prover'); window.lukkHamburger(); });

    const btnStandardProver = document.getElementById('btn-standardprover');
    if (btnStandardProver) btnStandardProver.addEventListener('click', () => { window.visSide('standardprover'); window.lukkHamburger(); });

    const btnGloseBank = document.getElementById('btn-glosebank-browse');
    if (btnGloseBank) btnGloseBank.addEventListener('click', () => { window.visSide('glosebank-browse'); window.lukkHamburger(); });

    const btnAdmin = document.getElementById('btn-admin-panel');
    if (btnAdmin) btnAdmin.addEventListener('click', () => { window.visSide('admin-panel'); window.lukkHamburger(); });

    const btnLaererLoggUt = document.getElementById('btn-laerer-loggut');
    if (btnLaererLoggUt) btnLaererLoggUt.addEventListener('click', () => window.loggUt ? window.loggUt() : console.error("loggUt mangler"));

    // --- QUIZ (PRØVE) ---
    const btnStartProve = document.getElementById('btn-start-prove');
    if (btnStartProve) btnStartProve.addEventListener('click', () => window.startProve());

    const btnStartQR = document.getElementById('btn-start-qr');
    if (btnStartQR) btnStartQR.addEventListener('click', () => window.startQRScanner());

    const btnQuizSvar = document.getElementById('btn-quiz-svar');
    if (btnQuizSvar) btnQuizSvar.addEventListener('click', () => window.sjekkSvar());

    const btnQuizLesOpp = document.getElementById('btn-quiz-les-opp');
    if (btnQuizLesOpp) btnQuizLesOpp.addEventListener('click', () => window.lesOppProve());

    // --- ØVING (PRACTICE) ---
    const btnOvingNiva1 = document.getElementById('btn-oving-niva1');
    if (btnOvingNiva1) btnOvingNiva1.addEventListener('click', () => window.startOving('niva1'));

    const btnOvingNiva2 = document.getElementById('btn-oving-niva2');
    if (btnOvingNiva2) btnOvingNiva2.addEventListener('click', () => window.startOving('niva2'));

    const btnOvingNiva3 = document.getElementById('btn-oving-niva3');
    if (btnOvingNiva3) btnOvingNiva3.addEventListener('click', () => window.startOving('niva3'));

    const btnOvingNiva4 = document.getElementById('btn-oving-niva4');
    if (btnOvingNiva4) btnOvingNiva4.addEventListener('click', () => window.startOving('niva4'));

    const btnOvingAvslutt = document.getElementById('btn-oving-avslutt');
    if (btnOvingAvslutt) btnOvingAvslutt.addEventListener('click', () => window.avsluttOving());

    const btnOvingSvar = document.getElementById('btn-oving-svar');
    if (btnOvingSvar) btnOvingSvar.addEventListener('click', () => window.sjekkOvingSvar());

    const btnOvingLesOpp = document.getElementById('btn-oving-les-opp');
    if (btnOvingLesOpp) btnOvingLesOpp.addEventListener('click', () => window.lesOppOving());

    // --- SAMLING ---
    const btnSorteringOving = document.getElementById('btn-samling-sorter-oving');
    if (btnSorteringOving) btnSorteringOving.addEventListener('click', () => window.byttSortering());

    const btnSorteringElev = document.getElementById('btn-samling-sorter-elev');
    if (btnSorteringElev) btnSorteringElev.addEventListener('click', () => window.byttSortering());

    // --- LÆRER DASHBOARD ---
    const cardLagProve = document.getElementById('card-lag-prove');
    if (cardLagProve) cardLagProve.addEventListener('click', () => window.visSide('lag-prove'));

    const cardMineProver = document.getElementById('card-mine-prover');
    if (cardMineProver) cardMineProver.addEventListener('click', () => window.visSide('lagrede-prover'));

    const btnAktiverKampanje = document.getElementById('btn-aktiver-kampanje');
    if (btnAktiverKampanje) btnAktiverKampanje.addEventListener('click', () => window.aktiverKampanjekode());

    // --- LAG PRØVE ---
    const btnLeggTilOrd = document.getElementById('btn-legg-til-ord');
    if (btnLeggTilOrd) btnLeggTilOrd.addEventListener('click', () => window.leggTilOrd ? window.leggTilOrd() : console.error('leggTilOrd mangler'));

    const btnLagreProve = document.getElementById('btn-lagre-prove');
    if (btnLagreProve) btnLagreProve.addEventListener('click', () => window.lagreProve ? window.lagreProve() : console.error('lagreProve mangler'));
}


/**
 * Setup network detection (offline/online indicators)
 */
function setupNetworkDetection() {
    // Dynamisk import av visToast
    import('./ui/helpers.js').then(({ visToast }) => {
        window.addEventListener('offline', () => {
            visToast('⚠️ Du er offline. Noen funksjoner kan være begrenset.', 'warning');
            console.warn('📡 Network: OFFLINE');
        });

        window.addEventListener('online', () => {
            visToast('✅ Tilbake online!', 'success');
            console.log('📡 Network: ONLINE');
        });

        // Log initial status
        if (!navigator.onLine) {
            console.warn('📡 App startet offline');
        }
    });
}