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

// Last NorskMester data
import './data/norskData.js';

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

// MatteMester & NorskMester
import {
    visMatteOperasjoner,
    startMatteOving,
    avsluttMatteOving,
    matteProvIgjen
} from './features/matte-practice.js';

import {
    startNorskOving,
    sjekkNorskSvar,
    avsluttNorskOving,
    startLaererDiktat
} from './features/norsk-practice.js';

import { initDiktatRecorder } from './features/diktat-recorder.js';

// --- GLOBALE FUNKSJONER ---

window.visSide = visSide;
window.visSamling = function() { visSamling(); };
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

// MatteMester
window.visMatteOperasjoner = visMatteOperasjoner;
window.startMatteOving = startMatteOving;
window.avsluttMatteOving = avsluttMatteOving;
window.matteProvIgjen = matteProvIgjen;

// NorskMester
window.startNorskOving = startNorskOving;
window.sjekkNorskSvar = sjekkNorskSvar;
window.avsluttNorskOving = avsluttNorskOving;
window.startLaererDiktat = startLaererDiktat;

// Galleri
window.visGalleriSide = function() {
    visSide('galleri-visning'); 
    visGalleri();               
};

window.gaTilbakeFraGalleri = function() {
    const rolle = sessionStorage.getItem('aktivRolle');
    const fag = sessionStorage.getItem('aktivtFag');

    skjulAlleMenyer();

    if (rolle === 'oving') {
        if (fag === 'matte') {
            const m = document.getElementById('matte-oving-meny');
            if (m) m.style.display = 'flex';
            visMatteOperasjoner();
        } else if (fag === 'norsk') {
            const n = document.getElementById('norsk-oving-meny');
            if (n) n.style.display = 'flex';
            visSide('norsk-oving-start');
        } else {
            document.getElementById('oving-meny').style.display = 'flex';
            visOvingSamling();
        }
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

window.velgRolle = function(rolle) {
    spillLyd('klikk');
    sessionStorage.setItem('aktivRolle', rolle);

    // KRITISK FIX: Skjul glosemester-start ordentlig
    const glosemesterStart = document.getElementById('glosemester-start');
    if (glosemesterStart) {
        glosemesterStart.classList.remove('active');
        glosemesterStart.style.display = 'none';
    }
    
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
            if(infoSpan) {
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

/* ============================================
   --- FAG-VELGER LOGIKK (MESTER SUITE) ---
   ============================================ */

/**
 * Velger fag og navigerer til riktig start-side
 * @param {string} fag - 'gloser', 'matte', eller 'norsk'
 */
window.velgFag = function(fag) {
    spillLyd('klikk');
    sessionStorage.setItem('aktivtFag', fag);

    if (fag === 'gloser') {
        visSide('glosemester-start');
    } else if (fag === 'matte') {
        visSide('mattemester-start');
    } else if (fag === 'norsk') {
        visSide('norskmester-start');
    }
};

/**
 * Velg rolle for MatteMester (øving, kode, lærer)
 */
window.velgMatteRolle = function(rolle) {
    spillLyd('klikk');
    sessionStorage.setItem('aktivRolle', rolle);
    sessionStorage.setItem('aktivtFag', 'matte');

    // Skjul mattemester-start
    const startEl = document.getElementById('mattemester-start');
    if (startEl) { startEl.classList.remove('active'); startEl.style.display = 'none'; }

    skjulAlleMenyer();

    if (rolle === 'oving') {
        const matteOvingMeny = document.getElementById('matte-oving-meny');
        if (matteOvingMeny) matteOvingMeny.style.display = 'flex';
        visMatteOperasjoner();
    }
    else if (rolle === 'kode') {
        document.getElementById('elev-meny').style.display = 'flex';
        visSide('elev-dashboard');
    }
    else if (rolle === 'laerer') {
        if (window.currentUser) {
            document.getElementById('laerer-meny').style.display = 'flex';
            visSide('laerer-dashboard');
            // Sett fag-tab til matte
            if (typeof window.velgProveFag === 'function') {
                setTimeout(() => window.velgProveFag('matte'), 100);
            }
        } else {
            document.getElementById('laerer-login-popup').style.display = 'flex';
        }
    }
};

/**
 * Velg rolle for NorskMester (øving, kode, lærer)
 */
window.velgNorskRolle = function(rolle) {
    spillLyd('klikk');
    sessionStorage.setItem('aktivRolle', rolle);
    sessionStorage.setItem('aktivtFag', 'norsk');

    // Skjul norskmester-start
    const startEl = document.getElementById('norskmester-start');
    if (startEl) { startEl.classList.remove('active'); startEl.style.display = 'none'; }

    skjulAlleMenyer();

    if (rolle === 'oving') {
        const norskOvingMeny = document.getElementById('norsk-oving-meny');
        if (norskOvingMeny) norskOvingMeny.style.display = 'flex';
        visSide('norsk-oving-start');
    }
    else if (rolle === 'kode') {
        document.getElementById('elev-meny').style.display = 'flex';
        visSide('elev-dashboard');
    }
    else if (rolle === 'laerer') {
        if (window.currentUser) {
            document.getElementById('laerer-meny').style.display = 'flex';
            visSide('laerer-dashboard');
            if (typeof window.velgProveFag === 'function') {
                setTimeout(() => window.velgProveFag('norsk'), 100);
            }
        } else {
            document.getElementById('laerer-login-popup').style.display = 'flex';
        }
    }
};

/**
 * Hjelpefunksjon: Skjul alle navigasjonsmenyer
 */
function skjulAlleMenyer() {
    ['elev-meny', 'oving-meny', 'laerer-meny', 'matte-oving-meny', 'norsk-oving-meny'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

/**
 * Går tilbake til fagvelger fra fagspesifikk startside
 */
window.tilbakeTilFagvelger = function() {
    spillLyd('klikk');
    sessionStorage.removeItem('aktivtFag');
    sessionStorage.removeItem('aktivRolle');
    visSide('fag-velger');
};

/**
 * Tilbake til start (fra innlogget modus)
 */
window.tilbakeTilStart = function() {
    sessionStorage.removeItem('aktivRolle');
    sessionStorage.removeItem('aktivtFag');
    skjulAlleMenyer();

    // Lukk hamburger-meny hvis åpen
    lukkHamburger();

    visSide('fag-velger');
};

/* ============================================
   --- HAMBURGER-MENY LOGIKK ---
   ============================================ */

/**
 * Toggle hamburger-meny (åpne/lukke)
 */
window.toggleHamburger = function() {
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
window.lukkHamburger = function() {
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

// Klientversjon — MÅ matche sw.js APP_VERSION for å unngå popup
const KLIENT_VERSJON = 'v2.3.0-ALPHA';

/**
 * Sjekk om SW-versjonen er nyere enn klientversjonen
 * Brukes som fallback for iOS der onupdatefound ikke alltid trigges
 */
function sjekkVersjon() {
    if (!navigator.serviceWorker.controller) return;

    const mc = new MessageChannel();
    mc.port1.onmessage = (event) => {
        if (event.data?.type === 'VERSION_INFO') {
            const swVersjon = event.data.version;
            if (swVersjon && swVersjon !== KLIENT_VERSJON) {
                console.log(`[Update] SW=${swVersjon}, Klient=${KLIENT_VERSJON} — oppdatering tilgjengelig`);
                visUpdateVarsling();
            }
        }
    };
    navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [mc.port2]
    );
}

/**
 * Manuell oppdateringssjekk (klikk på versjon i footer)
 */
window.sjekkForOppdatering = async function() {
    const statusEl = document.getElementById('sw-versjon-status');
    if (statusEl) statusEl.textContent = 'Sjekker for oppdatering...';

    try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
            await reg.update();
            // Vent litt og sjekk versjon
            setTimeout(() => {
                sjekkVersjon();
                if (statusEl) statusEl.textContent = `Klient: ${KLIENT_VERSJON} | Trykk for å sjekke`;
            }, 2000);
        }
    } catch (err) {
        if (statusEl) statusEl.textContent = 'Kunne ikke sjekke — prøv å laste siden på nytt';
    }
};

// Vis SW-versjon i footer ved oppstart
function oppdaterFooterVersjon() {
    const statusEl = document.getElementById('sw-versjon-status');
    if (!statusEl) return;

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        const mc = new MessageChannel();
        mc.port1.onmessage = (event) => {
            if (event.data?.type === 'VERSION_INFO') {
                statusEl.textContent = `SW: ${event.data.version} | Trykk for å sjekke`;
            }
        };
        navigator.serviceWorker.controller.postMessage(
            { type: 'GET_VERSION' }, [mc.port2]
        );
    } else {
        statusEl.textContent = 'Trykk for å sjekke oppdatering';
    }
}

function visUpdateVarsling() {
    if(document.getElementById('update-popup')) return;
    
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
        <button onclick="aktiverOppdatering()" class="btn-primary" style="width:100%; margin-bottom:10px;">
            Oppdater nå
        </button>
        <button onclick="this.parentElement.remove()" class="btn-secondary" style="width:100%; font-size:12px;">
            Senere
        </button>
    `;
    
    document.body.appendChild(popup);
    spillLyd('fanfare');
}

/**
 * Aktiver oppdatering: Send SKIP_WAITING til ventende SW, reload
 */
window.aktiverOppdatering = async function() {
    try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    } catch (e) {
        console.warn('Kunne ikke sende SKIP_WAITING:', e);
    }
    // Reload uansett (for iOS der waiting kanskje ikke finnes)
    setTimeout(() => window.location.reload(), 300);
};

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
            if(popup) popup.style.display = 'flex';
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

window.aktiverKampanjekode = async function() {
    const input = document.getElementById('kampanje-input');
    // Sjekk også modal-input hvis hoved-input er tomt
    const modalInput = document.getElementById('kampanje-input-modal');
    
    let kodeElement = input;
    if ((!input || !input.value) && modalInput && modalInput.value) {
        kodeElement = modalInput;
    }

    if(!kodeElement) {
        console.error("Fant ikke kampanje-input element");
        return;
    }
    
    const kode = kodeElement.value.trim().toUpperCase();
    
    if(!kode) {
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
    
    if(!kampanje) {
        alert('Ugyldig kampanjekode: ' + kode);
        kodeElement.value = '';
        return;
    }
    
    if(!window.currentUser || !window.currentUser.uid) {
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
    console.log('✅ Mester Suite v2.3.0-ALPHA kjører...');
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW Registrert');

            // Sjekk for oppdatering med en gang
            reg.update().catch(() => {});

            reg.onupdatefound = () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // Ny SW klar — vis oppdaterings-popup
                            visUpdateVarsling();
                        }
                    }
                    if (newWorker.state === 'activated') {
                        // iOS fallback: activated uten at installed ble fanget
                        sjekkVersjon();
                    }
                };
            };

            // Periodisk sjekk (hvert 30. minutt)
            setInterval(() => {
                reg.update().catch(() => {});
            }, 30 * 60 * 1000);

            // Sjekk når appen kommer tilbake i fokus (viktig for iOS)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    reg.update().catch(() => {});
                    sjekkVersjon();
                }
            });

        }).catch(err => console.warn('SW Feil:', err));

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NEW_VERSION') {
                visUpdateVarsling();
            }
        });

        // Lytt etter controllerchange (ny SW tok over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            sjekkVersjon();
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
    
    if(typeof initTeacherFeatures === 'function') {
        initTeacherFeatures();
    }
    if(typeof initDiktatRecorder === 'function') {
        initDiktatRecorder();
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

    // ✅ Setup offline/online detection
    setupNetworkDetection();

    // Vis SW-versjon i footer etter kort forsinkelse
    setTimeout(oppdaterFooterVersjon, 1500);
}

/**
 * Setup network detection (offline/online indicators)
 */
function setupNetworkDetection() {
    function visOfflineBanner() {
        if (document.getElementById('offline-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; z-index: 20000;
            background: #ff9800; color: white; text-align: center;
            padding: 8px 16px; font-size: 14px; font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        banner.textContent = '⚠️ Du er offline — noen funksjoner er begrenset';
        document.body.appendChild(banner);
        document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop) + 36) + 'px';
    }

    function skjulOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            document.body.style.paddingTop = '';
            banner.remove();
        }
        import('./ui/helpers.js').then(({ visToast }) => {
            visToast('✅ Tilbake online!', 'success');
        });
    }

    window.addEventListener('offline', visOfflineBanner);
    window.addEventListener('online', skjulOfflineBanner);

    if (!navigator.onLine) {
        visOfflineBanner();
    }
}