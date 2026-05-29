// ============================================
// COLLECTION.JS - BRIDGE (Kobling)
// Henter data fra den nye databasen og gjør den tilgjengelig.
// ============================================

import { cardsData } from './data/cardsData.js';

// Gammel kompatibilitet: Noen eldre funksjoner sjekker kanskje window.kortSamling
// Vi lager en "jukse-versjon" som grupperer dataene slik gamle script forventer det.
window.kortSamling = {
    biler: cardsData.filter(c => c.category === 'biler'),
    guder: cardsData.filter(c => c.category === 'guder'), // Tom foreløpig
    dinosaurer: cardsData.filter(c => c.category === 'dinosaurer'), // Tom foreløpig
    dyr: cardsData.filter(c => c.category === 'dyr') // Tom foreløpig
};

// Eksporterer hovedlisten for moderne moduler
export const masterCollection = cardsData;