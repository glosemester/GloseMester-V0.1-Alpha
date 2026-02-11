/* ============================================
   NAVIGATION.JS - Styrer sidevisning
   v0.7.3-BETA: Admin-panel med faner
   ============================================ */

import { spillLyd } from '../ui/helpers.js';

export function visSide(sideId) {
    // 1. Skjul alle sider
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // 2. Vis valgt side
    const valgtSide = document.getElementById(sideId);
    if (valgtSide) {
        valgtSide.classList.add('active');
        window.scrollTo(0, 0);
        
        // Auto-load data for spesifikke sider
        switch(sideId) {
            case 'laerer-dashboard':
                // ✅ NY: Last dashboard-statistikk automatisk
                if (typeof window.initDashboard === 'function') {
                    setTimeout(() => window.initDashboard(), 50);
                }
                break;

            case 'lagrede-prover':
                if (typeof window.visSavedTests === 'function') {
                    setTimeout(() => window.visSavedTests(), 50);
                }
                break;

            case 'admin-panel':
                if (typeof window.visFane === 'function') {
                    setTimeout(() => window.visFane('glosebank'), 50);
                }
                break;

            case 'glosebank-browse':
                if (typeof window.lastInnGlosebankSok === 'function') {
                    setTimeout(() => window.lastInnGlosebankSok(), 50);
                }
                break;

            case 'standardprover':
                if (typeof window.lastInnStandardprover === 'function') {
                    setTimeout(() => window.lastInnStandardprover(), 50);
                }
                break;

            case 'diktat-recorder':
                if (typeof window.lastMineDiktatSett === 'function') {
                    setTimeout(() => window.lastMineDiktatSett(), 50);
                }
                break;
        }
    } else {
        console.warn(`Fant ikke siden med ID: ${sideId}`);
    }

    // 3. Håndter menyer
    oppdaterMenyer(sideId);
}

function oppdaterMenyer(sideId) {
    const elevMeny = document.getElementById('elev-meny');
    const ovingMeny = document.getElementById('oving-meny');
    const laererMeny = document.getElementById('laerer-meny');
    const matteOvingMeny = document.getElementById('matte-oving-meny');
    const norskOvingMeny = document.getElementById('norsk-oving-meny');

    // Skjul alle først
    if(elevMeny) elevMeny.style.display = 'none';
    if(ovingMeny) ovingMeny.style.display = 'none';
    if(laererMeny) laererMeny.style.display = 'none';
    if(matteOvingMeny) matteOvingMeny.style.display = 'none';
    if(norskOvingMeny) norskOvingMeny.style.display = 'none';

    // Spesialhåndtering for galleri - vis meny basert på rolle og fag
    if (sideId === 'galleri-visning') {
        const rolle = sessionStorage.getItem('aktivRolle');
        const fag = sessionStorage.getItem('aktivtFag');
        if (rolle === 'oving') {
            if (fag === 'matte' && matteOvingMeny) matteOvingMeny.style.display = 'flex';
            else if (fag === 'norsk' && norskOvingMeny) norskOvingMeny.style.display = 'flex';
            else if(ovingMeny) ovingMeny.style.display = 'flex';
        } else if (rolle === 'kode') {
            if(elevMeny) elevMeny.style.display = 'flex';
        }
        return;
    }

    // GloseMester øving
    if (['elev-dashboard', 'elev-samling'].includes(sideId)) {
        if(elevMeny) elevMeny.style.display = 'flex';
    }
    else if (['oving-start', 'oving-omraade', 'oving-samling'].includes(sideId)) {
        // Sjekk aktivt fag for å vise riktig meny
        const fag = sessionStorage.getItem('aktivtFag');
        if (fag === 'matte' && matteOvingMeny) matteOvingMeny.style.display = 'flex';
        else if (fag === 'norsk' && norskOvingMeny) norskOvingMeny.style.display = 'flex';
        else if(ovingMeny) ovingMeny.style.display = 'flex';
    }
    // MatteMester øving
    else if (['matte-oving-start', 'matte-nivaa-velger', 'matte-oving-omraade', 'matte-resultat'].includes(sideId)) {
        if(matteOvingMeny) matteOvingMeny.style.display = 'flex';
    }
    // NorskMester øving
    else if (['norsk-oving-start', 'norsk-oving-omraade'].includes(sideId)) {
        if(norskOvingMeny) norskOvingMeny.style.display = 'flex';
    }
    // Lærer (delt for alle fag)
    else if (['laerer-dashboard', 'lagrede-prover', 'standardprover', 'admin-panel', 'glosebank-browse', 'diktat-recorder'].includes(sideId)) {
        if(laererMeny) laererMeny.style.display = 'flex';
    }
}

export function initNavigation() {
    console.log("✅ Navigasjon lastet med auto-load for: lagrede prøver, Admin-panel, GloseBank Browse, Standardprøver.");
    
    // Håndter tilbake-knapp i nettleser
    window.onpopstate = function(event) {
        if (event.state && event.state.sideId) {
            visSide(event.state.sideId);
        } else {
            visSide('landing-page');
        }
    };
}
