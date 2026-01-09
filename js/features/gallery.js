/* ============================================
   GALLERY.JS - DEBUG VERSJON
   Denne versjonen "sladrer" til konsollen!
   ============================================ */

import { cardsData } from '../data/cardsData.js';
import { getSamling } from '../core/storage.js';
import { visStortKort, visFeilMelding } from './kort-display.js';
import { spillLyd } from '../ui/helpers.js';

export function visGalleri() {
    console.group("🔍 FEILSØKING GALLERI");
    console.log("1. visGalleri() funksjonen har startet!");

    // SJEKK 1: Er cardsData lastet?
    if (!cardsData) {
        console.error("❌ KRITISK: cardsData er undefined!");
        console.groupEnd();
        return;
    }
    console.log(`2. cardsData lastet. Antall kort i basen: ${cardsData.length}`);

    // SJEKK 2: Finner vi HTML-elementet?
    // Vi prøver å finne containeren
    const selector = '#galleri-visning .samling-grid';
    const container = document.querySelector(selector);
    
    if (!container) {
        console.error(`❌ KRITISK: Fant ikke containeren i HTML med selector: "${selector}"`);
        console.log("   Sjekk at <div id='galleri-visning'> finnes i index.html");
        console.log("   Sjekk at <div class='samling-grid'> ligger INNI den.");
        console.groupEnd();
        return;
    }
    console.log("3. ✅ Fant containeren i HTML!");
    
    // Tøm container
    container.innerHTML = '';
    
    // SJEKK 3: Hent samling
    const mineKort = getSamling(); 
    console.log(`4. Brukerens samling hentet. Antall eide kort: ${mineKort.length}`);
    
    const eideIder = new Set(mineKort.map(k => k.id));

    // GENERERING
    console.log("5. Starter løkke for å tegne kort...");
    
    try {
        cardsData.forEach((kort, index) => {
            // Kun logg første kortet for å ikke spamme konsollen
            if (index === 0) console.log("   - Tegner første kort:", kort.name);

            const eierKort = eideIder.has(kort.id);
            const idDeler = kort.id.split('_');
            const kortNummer = idDeler.length > 1 ? idDeler[1] : "???";

            const kortEl = document.createElement('div');
            kortEl.className = eierKort ? `poke-card rarity-${kort.rarity}` : 'poke-card locked-card';
            
            let bildeHTML = '';
            if (kort.image) {
                bildeHTML = `<img src="${kort.image}" class="kort-bilde" alt="${kort.name}" loading="lazy">`;
            } else {
                bildeHTML = `<div class="kort-bilde-placeholder">🔒</div>`;
            }

            const navn = kort.name || "Ukjent";
            
            kortEl.innerHTML = `
                ${bildeHTML}
                <div class="kort-navn">${navn}</div>
                <div class="kort-id">#${kortNummer}</div>
                ${eierKort ? '' : '<div class="lock-icon">🔒</div>'}
            `;

            if (eierKort) {
                const eidObjekt = mineKort.find(k => k.id === kort.id) || kort;
                kortEl.onclick = () => visStortKort(eidObjekt);
            } else {
                kortEl.onclick = () => {
                    spillLyd('feil');
                    visFeilMelding(`Du mangler ${navn}! Fortsett å øve.`);
                };
            }

            container.appendChild(kortEl);
        });
        
        console.log("6. ✅ Ferdig! Alle kort skal nå være lagt til i DOM.");

    } catch (err) {
        console.error("❌ KRITISK FEIL i løkken:", err);
    }
    
    console.groupEnd();
}