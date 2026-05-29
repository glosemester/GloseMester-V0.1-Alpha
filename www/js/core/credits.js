// ============================================
// CREDITS.JS - GloseMester v1.0 (Module)
// ============================================

import { trackEvent } from './analytics.js';

// Hjelpefunksjoner for credits (hvis de ikke allerede ligger i storage.js)
// Merk: I den nye versjonen styrer vi ofte credits direkte fra storage.js, 
// men hvis du bruker denne filen, må den se slik ut:

export function leggTilPoeng(antall = 1) {
    let credits = parseInt(localStorage.getItem('credits_' + window.brukerNavn)) || 0;
    credits += antall;
    localStorage.setItem('credits_' + window.brukerNavn, credits);
    window.credits = credits; // Oppdater global state
    return credits;
}

export function brukPoeng(antall) {
    let credits = parseInt(localStorage.getItem('credits_' + window.brukerNavn)) || 0;
    if (credits >= antall) {
        credits -= antall;
        localStorage.setItem('credits_' + window.brukerNavn, credits);
        window.credits = credits;
        trackEvent('Credits', 'Brukt', antall + ' poeng');
        return true;
    }
    return false;
}