/* ============================================
   KORT-DISPLAY.JS - Fix v0.9.6
   Eksporterer nå byttSortering og lukkKort korrekt
   ============================================ */

import { cardsData } from '../data/cardsData.js';
import { getSamling, lagreBrukerKort, setSamling, getCredits, saveCredits, getTotalCorrect } from '../core/storage.js';
import { spillLyd, visToast, vibrer, lagConfetti } from '../ui/helpers.js';

// KONFIGURASJON FOR UTSEENDE
const RARITY_CONFIG = {
    'common':    { tekst: "Vanlig",      farge: "#a1a1a1", class: "vanlig" },
    'rare':      { tekst: "Sjelden",     farge: "#0071e3", class: "sjelden" },
    'epic':      { tekst: "Episk",       farge: "#8e44ad", class: "episk" },
    'legendary': { tekst: "Legendarisk", farge: "#f1c40f", class: "legendary" }
};

// Variabel for sortering (Må være utenfor funksjonen for å huskes)
window.valgtSortering = 'nyeste';

// --- FELLES PROGRESJONS-TEGNER ---
export function oppdaterProgresjonUI() {
    const totalXP = getTotalCorrect();
    const credits = getCredits();
    
    // 1. Bank/Bonus bar
    const iBonusSyklus = totalXP % 100;
    
    const diamanterEls = document.querySelectorAll('.antall-diamanter');
    if(diamanterEls) diamanterEls.forEach(el => el.innerText = credits);
    
    document.querySelectorAll('.samling-bonus-bar').forEach(el => el.style.width = `${iBonusSyklus}%`);
    document.querySelectorAll('.bonus-tekst').forEach(el => el.innerText = `${iBonusSyklus} / 100 XP til bonus`);
    
    const menuBar = document.getElementById('menu-credits-bar');
    const menuText = document.getElementById('menu-credits-text');
    if(menuBar) menuBar.style.width = `${iBonusSyklus}%`;
    if(menuText) menuText.innerText = `${iBonusSyklus} / 100`;

    // 2. Grønne bokser (Kort-jakt)
    const MÅL_KORT = 10;
    let iKortSyklus = totalXP % MÅL_KORT;
    let visFullBar = false;

    if (iKortSyklus === 0 && totalXP > 0) {
        iKortSyklus = MÅL_KORT; 
        visFullBar = true;
    }

    const tilNesteKort = MÅL_KORT - iKortSyklus;
    const targets = [
        { box: 'game-progress-target', txt: 'game-progress-text' },
        { box: 'quiz-progress-target', txt: 'quiz-progress-text' }
    ];

    targets.forEach(target => {
        const container = document.getElementById(target.box);
        const textLabel = document.getElementById(target.txt);

        if (container) {
            container.innerHTML = '';
            const segmentBox = document.createElement('div');
            segmentBox.className = 'segment-container';
            for(let i=0; i<MÅL_KORT; i++) {
                const seg = document.createElement('div');
                seg.className = i < iKortSyklus ? 'segment filled' : 'segment';
                segmentBox.appendChild(seg);
            }
            container.appendChild(segmentBox);
        }

        if (textLabel) {
            if (visFullBar) {
                textLabel.innerText = "🎉 Kort vunnet! (Sjekk samling)";
                textLabel.style.color = "#10B981";
                textLabel.style.fontWeight = "bold";
            } else {
                textLabel.innerText = `${iKortSyklus} av ${MÅL_KORT} poeng (${tilNesteKort} til kort)`;
                textLabel.style.color = "";
                textLabel.style.fontWeight = "normal";
            }
        }
    });
}

// --- HOVEDFUNKSJONER ---

export async function hentTilfeldigKort() {
    // Sjekk at vi har data
    if (!cardsData || cardsData.length === 0) {
        console.error("Ingen data i cardsData!");
        return;
    }

    // ✅ NIVÅBASERT KATEGORIFILTRERING: Gudekort kun på nivå 3 og 4
    let tilgjengeligeKategorier = [...new Set(cardsData.map(kort => kort.category))];

    // Hent gjeldende nivå fra global variabel (satt i practice.js eller quiz.js)
    const aktivtNiva = window.gjeldendeNiva || 'niva1';

    // Fjern guder-kategorien på lavere nivåer
    if (aktivtNiva === 'niva1') {
        tilgjengeligeKategorier = tilgjengeligeKategorier.filter(kat => kat !== 'guder');
    }

    const valgtKategori = tilgjengeligeKategorier[Math.floor(Math.random() * tilgjengeligeKategorier.length)];

    // ✅ JUSTERT RARITY: Vanlige kort kommer mye oftere
    const r = Math.random() * 100;
    let targetRarity = 'common';
    if(r > 99) targetRarity = 'legendary';      // 1% (ned fra 2%)
    else if(r > 96) targetRarity = 'epic';      // 3% (ned fra 13%)
    else if(r > 85) targetRarity = 'rare';      // 11% (ned fra 25%)
    // common = 85% (opp fra 60%)

    const muligeKort = cardsData.filter(k => k.category === valgtKategori && k.rarity === targetRarity);

    const finalPool = muligeKort.length > 0
        ? muligeKort
        : cardsData.filter(k => k.category === valgtKategori);

    const vunnetKort = finalPool[Math.floor(Math.random() * finalPool.length)];

    if(!vunnetKort) {
        console.error("Kunne ikke finne kort.");
        return;
    }

    lagreBrukerKort(vunnetKort);
    visGevinstPopup(vunnetKort);
}

export function visSamling() {
    oppdaterProgresjonUI(); 
    
    const samling = getSamling();
    const containere = document.querySelectorAll('.samling-grid'); // Oppdaterer både elev og øving samling
    
    containere.forEach(container => {
        // Hopp over hvis dette er galleri-containeren (den styres av gallery.js)
        if(container.parentElement.id === 'galleri-visning') return;

        container.innerHTML = '';
        
        if(samling.length === 0) {
            container.innerHTML = '<p class="tom-tekst">Du har ingen kort ennå. Øv mer for å vinne!</p>';
            return;
        }
        
        let sortertSamling = [...samling];
        
        if (window.valgtSortering === 'nyeste') {
            sortertSamling.reverse(); 
        } else if (window.valgtSortering === 'sjeldenhet') {
            const verdi = { 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 };
            sortertSamling.sort((a, b) => {
                const rA = a.rarity.type || a.rarity;
                const rB = b.rarity.type || b.rarity;
                return (verdi[rB] || 0) - (verdi[rA] || 0);
            });
        } else if (window.valgtSortering === 'navn') {
            sortertSamling.sort((a, b) => (a.name || a.navn).localeCompare(b.name || b.navn));
        }

        const grupper = {};
        sortertSamling.forEach(k => {
            if(!grupper[k.id]) grupper[k.id] = { ...k, antall: 0 };
            grupper[k.id].antall++;
        });
        
        Object.values(grupper).forEach(kort => {
            const rarityKey = typeof kort.rarity === 'string' ? kort.rarity : kort.rarity.type;
            const config = RARITY_CONFIG[rarityKey] || RARITY_CONFIG['common'];

            const el = document.createElement('div');
            el.className = `poke-card rarity-${rarityKey}`;
            
            const imgPath = kort.image || kort.bilde; 
            
            let bildeHTML = '';
            if (imgPath) {
                bildeHTML = `<img src="${imgPath}" class="kort-bilde" alt="${kort.name || kort.navn}" loading="lazy">`;
            } else {
                bildeHTML = `<div class="kort-bilde-placeholder">${getEmoji(kort.category || kort.kategori)}</div>`;
            }
            
            let byttKnapp = '';
            if(kort.antall > 1) {
                // Bruker dataset + addEventListener for å unngå XSS via onclick-streng
                byttKnapp = `<button class="btn-resirkuler" data-kortid="${kort.id.replace(/"/g, '&quot;')}">♻️ Bytt inn (1 💎)</button>`;
            }
            
            el.innerHTML = `
                ${bildeHTML}
                <div class="kort-navn">${kort.name || kort.navn}</div>
                <div class="kort-antall">x${kort.antall}</div>
                ${byttKnapp}
            `;
            el.onclick = () => visStortKort(kort, config);
            // Koble opp bytt-knappen med event listener (ikke inline onclick) for å unngå XSS
            const byttBtn = el.querySelector('.btn-resirkuler');
            if (byttBtn) {
                byttBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.resirkulerKort(byttBtn.dataset.kortid);
                });
            }
            container.appendChild(el);
        });
    });
}

// --- DENNE MANGLET EKSPORT! ---
export function byttSortering() {
    if (window.valgtSortering === 'nyeste') window.valgtSortering = 'sjeldenhet';
    else if (window.valgtSortering === 'sjeldenhet') window.valgtSortering = 'navn';
    else window.valgtSortering = 'nyeste';
    
    visToast(`Sorterer etter: ${window.valgtSortering}`, 'info');
    visSamling();
}

// --- DENNE MANGLET OGSÅ! ---
export function lukkKort() {
    const popup = document.getElementById('gevinst-popup');
    if(popup) popup.style.display = 'none';
}

// --- HJELPERE ---

export function visFeilMelding(melding) {
    visToast(melding, 'error');
    vibrer([50, 50, 50]);
}

export function visStortKort(kort, config = null) {
    if(!config) {
        const rarityKey = typeof kort.rarity === 'string' ? kort.rarity : kort.rarity.type;
        config = RARITY_CONFIG[rarityKey] || RARITY_CONFIG['common'];
    }
    visGevinstPopup(kort, false, config); 
}

function getEmoji(k) {
    const map = { biler:'🚗', guder:'🏛️', dinosaurer:'🦖', dyr:'🐾' };
    return map[k] || '🎴';
}

function visGevinstPopup(kort, spillFanfare = true, config = null) {
    const popup = document.getElementById('gevinst-popup');
    if(!popup) return;

    if(!config) {
        const rarityKey = typeof kort.rarity === 'string' ? kort.rarity : kort.rarity.type;
        config = RARITY_CONFIG[rarityKey] || RARITY_CONFIG['common'];
    }

    document.getElementById('gevinst-navn').innerText = kort.name || kort.navn;
    
    const rarityEl = document.getElementById('gevinst-rarity');
    if(rarityEl) {
        rarityEl.innerText = config.tekst;
        rarityEl.className = 'rarity-badge'; 
        rarityEl.classList.add(config.class);
    }
    
    let contentDiv = document.querySelector('.gevinst-content');
    const oldImg = contentDiv.querySelector('.popup-bilde-container');
    if(oldImg) oldImg.remove();
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'popup-bilde-container';
    
    const imgPath = kort.image || kort.bilde;

    if (imgPath) {
        imgContainer.innerHTML = `<img src="${imgPath}" style="width:100%; max-width:250px; border-radius:15px; box-shadow:0 5px 20px rgba(0,0,0,0.2);" alt="${kort.name}" loading="lazy">`;
    } else {
        imgContainer.innerHTML = `<div style="font-size:80px;">${getEmoji(kort.category)}</div>`;
    }
    
    const tittel = document.getElementById('gevinst-navn');
    tittel.parentNode.insertBefore(imgContainer, tittel.nextSibling);

    popup.style.display = 'flex';
    
    if (spillFanfare) {
        const rarityKey = typeof kort.rarity === 'string' ? kort.rarity : kort.rarity.type;
        if(rarityKey === 'legendary') spillLyd('fanfare');
        else spillLyd('vinn');
        lagConfetti();
    }
}

// Global window funksjon for resirkulering (siden den kalles fra onclick-streng)
window.resirkulerKort = async function(kortId) {
    const PRIS = 1; 

    const antallDiamanter = getCredits();
    if (antallDiamanter < PRIS) {
        visToast(`Du mangler diamanter! 💎 Du trenger ${PRIS}.`, 'error');
        spillLyd('feil');
        vibrer([50, 50]);
        return;
    }

    if(!confirm(`Vil du bruke ${PRIS} diamant 💎 for å bytte inn disse to kortene?\n\nDu får et helt nytt kort i retur!`)) return;
    
    let samling = getSamling();
    let fjernet = 0;
    
    samling = samling.filter(k => {
        if(String(k.id) === String(kortId) && fjernet < 2) { 
            fjernet++; 
            return false; 
        }
        return true; 
    });
    
    if(fjernet < 2) { 
        visToast("Du har ikke nok kort til å pante.", 'error'); 
        return; 
    }
    
    const nySaldo = antallDiamanter - PRIS;
    saveCredits(nySaldo); 
    setSamling(samling);
    
    const diamanterEls = document.querySelectorAll('.antall-diamanter');
    if(diamanterEls) diamanterEls.forEach(el => el.innerText = nySaldo);

    spillLyd('klikk');
    visToast(`♻️ Pantet! -${PRIS} 💎. Henter nytt kort...`, 'info');
    
    setTimeout(async () => {
        await hentTilfeldigKort(); 
        visSamling(); 
    }, 1500);
};