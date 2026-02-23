/* ============================================
   GALLERY.JS - Kortsamling visning
   ============================================ */

import { cardsData } from '../data/cardsData.js';
import { getSamling } from '../core/storage.js';
import { visStortKort, visFeilMelding } from './kort-display.js';
import { spillLyd } from '../ui/helpers.js';

export function visGalleri() {
    if (!cardsData) {
        console.error("cardsData er undefined");
        return;
    }

    const selector = '#galleri-visning .samling-grid';
    const container = document.querySelector(selector);

    if (!container) {
        console.error("Fant ikke galleri-container:", selector);
        return;
    }

    container.innerHTML = '';

    const mineKort = getSamling();
    const eideIder = new Set(mineKort.map(k => k.id));

    try {
        cardsData.forEach((kort) => {
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
    } catch (err) {
        console.error("Feil i galleri-rendering:", err);
    }
}
