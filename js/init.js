// ============================================
// INIT.JS - GloseMester v3.1
// Oppdatert: 17. desember 2025
// ============================================
// Global state og app-initialisering
// ============================================

// App-versjon (brukes i UI, service worker, personvern-samtykke)
export const APP_VERSION = 'v0.6 beta';
window.APP_VERSION = APP_VERSION;

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
// SERVICE WORKER REGISTRERING + OPPDATERINGSBANNER
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        const SNOOZE_MINUTES = 20; // kan settes til 10–30 minutter
        let newWorker = null;
        let newVersion = null;
        let refreshing = false;

        const nowMs = () => Date.now();
        const snoozeKey = (ver) => `glosemester_update_snooze_until_${ver || 'unknown'}`;

        const isSnoozed = (ver) => {
            try {
                const until = Number(localStorage.getItem(snoozeKey(ver)) || '0');
                return until > nowMs();
            } catch {
                return false;
            }
        };

        const snooze = (ver) => {
            try {
                const until = nowMs() + SNOOZE_MINUTES * 60 * 1000;
                localStorage.setItem(snoozeKey(ver), String(until));
            } catch {}
        };

        const requestSWVersion = (worker) => {
            return new Promise((resolve) => {
                if (!worker) return resolve(null);
                const channel = new MessageChannel();
                channel.port1.onmessage = (e) => {
                    if (e.data?.type === 'SW_VERSION') resolve(e.data.version);
                    else resolve(null);
                };
                worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
                // timeout-sikring
                setTimeout(() => resolve(null), 1500);
            });
        };

        const showUpdateBanner = () => {
            const banner = document.getElementById('update-banner');
            const text = document.getElementById('update-version-text');
            const btnUpdate = document.getElementById('update-btn');
            const btnLater = document.getElementById('update-later-btn');

            if (!banner || !text || !btnUpdate || !btnLater) return;

            // Respekter snooze for akkurat denne versjonen
            if (isSnoozed(newVersion)) return;

            const current = window.APP_VERSION || 'gjeldende versjon';
            text.textContent = newVersion ? `${current} → ${newVersion}` : `${current} → ny versjon`;
            banner.style.display = 'flex';

            btnUpdate.onclick = () => {
                if (newWorker) newWorker.postMessage({ type: 'SKIP_WAITING' });
            };

            btnLater.onclick = () => {
                snooze(newVersion);
                banner.style.display = 'none';
            };
        };

        try {
            const reg = await navigator.serviceWorker.register('./sw.js');
            console.log('✅ Service Worker registrert');

            // Hvis det allerede ligger en "waiting" klar
            if (reg.waiting) {
                newWorker = reg.waiting;
                newVersion = await requestSWVersion(newWorker);
                showUpdateBanner();
            }

            // Lytt etter nye oppdateringer
            reg.addEventListener('updatefound', () => {
                const installing = reg.installing;
                if (!installing) return;

                installing.addEventListener('statechange', async () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorker = reg.waiting;
                        newVersion = await requestSWVersion(newWorker);
                        showUpdateBanner();
                    }
                });
            });

            // Når ny SW tar kontroll → reload én gang
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });

        } catch (err) {
            console.warn('⚠️ SW registrering feilet:', err);
        }
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

// ============================================
// Global lyd-toggle (PWA / mobil)
// ============================================
const SOUND_KEY = "glosemester_sound_enabled";
window.soundEnabled = localStorage.getItem(SOUND_KEY) !== "false"; // default ON

function updateSoundButton() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;
  btn.textContent = window.soundEnabled ? "🔊" : "🔇";
}

function initSoundToggle() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;

  updateSoundButton();

  btn.addEventListener("click", () => {
    window.soundEnabled = !window.soundEnabled;
    localStorage.setItem(SOUND_KEY, String(window.soundEnabled));
    updateSoundButton();
  });
}

window.addEventListener("DOMContentLoaded", initSoundToggle);
