/* ============================================
   INIT.JS - Oppstart v0.10.3
   ============================================ */

import { initApp } from './app.js';
import { sjekkFeideRetur } from './features/auth.js'; // <--- VIKTIG: Peker nå til features/

// ============================================
// GLOBAL STATE
// ============================================
window.APP_VERSION = "v2.3.0-ALPHA";

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
window.valgtSortering = 'nyeste';

// ============================================
// VERSJONSTAG
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
// APP INITIALISERING
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Vis versjon
    visVersjonstag();

    // 2. Sjekk Feide-retur FØR vi gjør noe annet
    await sjekkFeideRetur();

    // 3. Last brukerdata
    const aktivBruker = localStorage.getItem('aktiv_bruker');
    if (aktivBruker) window.brukerNavn = aktivBruker;

    // 4. Start hovedappen
    initApp();

    // 5. Sjekk for prøve-kode i URL (QR-kode / delelenke)
    const urlParams = new URLSearchParams(window.location.search);
    const proveKode = urlParams.get('quiz') || urlParams.get('prove');

    if (proveKode) {
        // Sett session-state direkte (unngå fragile setTimeout-kjede)
        sessionStorage.setItem('aktivRolle', 'kode');
        sessionStorage.setItem('aktivtFag', 'gloser');

        // Naviger direkte til elev-dashboard (hopper over fag-velger)
        if (window.visSide) window.visSide('elev-dashboard');

        const elevMeny = document.getElementById('elev-meny');
        if (elevMeny) elevMeny.style.display = 'flex';

        const input = document.getElementById('prove-kode');
        if (input) input.value = proveKode;

        // Start prøven (kort delay for DOM-oppdatering)
        setTimeout(() => {
            if (window.startProve) window.startProve(proveKode);
        }, 200);
    }
});