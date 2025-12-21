// ============================================
// KORT-DISPLAY.JS - Refaktorert v2.0
// Leser nå fra js/data/cardsData.js
// ============================================

import { cardsData } from '../data/cardsData.js'; // NY IMPORT
import { getSamling, lagreBrukerKort, setSamling, getCredits, getTotalCorrect } from '../core/storage.js';
import { spillLyd, visToast, vibrer, lagConfetti } from '../ui/helpers.js';

// KONFIGURASJON FOR UTSEENDE (Oversetter database-verdier til UI)
const RARITY_CONFIG = {
    'common':    { tekst: "Vanlig",      farge: "#a1a1a1", class: "vanlig" },
    'rare':      { tekst: "Sjelden",     farge: "#0071e3", class: "sjelden" },
    'epic':      { tekst: "Episk",       farge: "#8e44ad", class: "episk" },
    'legendary': { tekst: "Legendarisk", farge: "#f1c40f", class: "legendary" }
};

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
    
    // Meny bar
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
    // 1. Finn hvilke kategorier som faktisk finnes i databasen
    const unikeKategorier = [...new Set(cardsData.map(kort => kort.category))];
    
    if (unikeKategorier.length === 0) {
        console.error("Ingen kort funnet i cardsData!");
        return;
    }

    // 2. Velg tilfeldig kategori
    const valgtKategori = unikeKategorier[Math.floor(Math.random() * unikeKategorier.length)];
    
    // 3. Bestem sjeldenhet (Algoritme)
    const r = Math.random() * 100;
    let targetRarity = 'common';
    if(r > 98) targetRarity = 'legendary';
    else if(r > 85) targetRarity = 'epic';
    else if(r > 60) targetRarity = 'rare';
    
    // 4. Filtrer listen
    const muligeKort = cardsData.filter(k => k.category === valgtKategori && k.rarity === targetRarity);
    
    // Fallback: Hvis ingen "legendary" finnes i denne kategorien, ta et tilfeldig kort fra kategorien
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
    
    const samling = getSamling(); // Dette er brukerens lagrede kort
    const containere = document.querySelectorAll('.samling-grid');
    
    containere.forEach(container => {
        container.innerHTML = '';
        
        if(samling.length === 0) {
            container.innerHTML = '<p class="tom-tekst">Du har ingen kort ennå. Øv mer for å vinne!</p>';
            return;
        }
        
        let sortertSamling = [...samling];
        
        // Sortering
        if (window.valgtSortering === 'nyeste') {
            sortertSamling.reverse(); 
        } else if (window.valgtSortering === 'sjeldenhet') {
            const verdi = { 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 };
            // Merk: Vi sjekker både ny og gammel struktur for sikkerhets skyld
            sortertSamling.sort((a, b) => {
                const rA = a.rarity.type || a.rarity; // Håndterer gammel og ny data
                const rB = b.rarity.type || b.rarity;
                return (verdi[rB] || 0) - (verdi[rA] || 0);
            });
        } else if (window.valgtSortering === 'navn') {
            sortertSamling.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Gruppering (Vis x2 hvis man har to like)
        const grupper = {};
        sortertSamling.forEach(k => {
            if(!grupper[k.id]) grupper[k.id] = { ...k, antall: 0 };
            grupper[k.id].antall++;
        });
        
        Object.values(grupper).forEach(kort => {
            // Hent config for farge/tekst basert på rarity-nøkkelen (common/rare/etc)
            const rarityKey = typeof kort.rarity === 'string' ? kort.rarity : kort.rarity.type;
            const config = RARITY_CONFIG[rarityKey] || RARITY_CONFIG['common'];

            const el = document.createElement('div');
            el.className = `poke-card rarity-${rarityKey}`;
            
            // Håndter bilde (ny data heter .image, gammel het .bilde)
            const imgPath = kort.image || kort.bilde; 
            
            let bildeHTML = '';
            if (imgPath) {
                bildeHTML = `<img src="${imgPath}" class="kort-bilde" alt="${kort.name || kort.navn}" loading="lazy">`;
            } else {
                bildeHTML = `<div class="kort-bilde-placeholder">${getEmoji(kort.category || kort.kategori)}</div>`;
            }
            
            let byttKnapp = '';
            if(kort.antall > 1) {
                byttKnapp = `<button class="btn-resirkuler" onclick="event.stopPropagation(); resirkulerKort('${kort.id}')">💎 Bytt (2 mot 1)</button>`;
            }
            
            el.innerHTML = `
                ${bildeHTML}
                <div class="kort-navn">${kort.name || kort.navn}</div>
                <div class="kort-antall">x${kort.antall}</div>
                ${byttKnapp}
            `;
            // Vi sender med config slik at popupen vet farge/tekst
            el.onclick = () => visStortKort(kort, config);
            container.appendChild(el);
        });
    });
}

// --- HJELPERE ---

export function visFeilMelding(melding) {
    visToast(melding, 'error');
    vibrer([50, 50, 50]);
}

export function visStortKort(kort, config = null) {
    // Hvis config mangler, finn den
    if(!config) {
        const rarityKey = typeof kort.rarity === 'string' ? kort.rarity : kort.rarity.type;
        config = RARITY_CONFIG[rarityKey] || RARITY_CONFIG['common'];
    }
    visGevinstPopup(kort, false, config); 
}

export function lukkKort() {
    const popup = document.getElementById('gevinst-popup');
    if(popup) popup.style.display = 'none';
}

export function byttSortering() {
    if (window.valgtSortering === 'nyeste') window.valgtSortering = 'sjeldenhet';
    else if (window.valgtSortering === 'sjeldenhet') window.valgtSortering = 'navn';
    else window.valgtSortering = 'nyeste';
    
    visToast(`Sorterer etter: ${window.valgtSortering}`, 'info');
    visSamling();
}

function getEmoji(k) {
    const map = { biler:'🚗', guder:'🏛️', dinosaurer:'🦖', dyr:'🐾' };
    return map[k] || '🎴';
}

function visGevinstPopup(kort, spillFanfare = true, config = null) {
    const popup = document.getElementById('gevinst-popup');
    if(!popup) return;

    // Finn config hvis den mangler
    if(!config) {
        const rarityKey = typeof kort.rarity === 'string' ? kort.rarity : kort.rarity.type;
        config = RARITY_CONFIG[rarityKey] || RARITY_CONFIG['common'];
    }

    document.getElementById('gevinst-navn').innerText = kort.name || kort.navn;
    
    const rarityEl = document.getElementById('gevinst-rarity');
    if(rarityEl) {
        rarityEl.innerText = config.tekst; // "Sjelden" i stedet for "rare"
        // Nullstill klasser og legg til riktig
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
        imgContainer.innerHTML = `<img src="${imgPath}" style="width:100%; max-width:250px; border-radius:15px; box-shadow:0 5px 20px rgba(0,0,0,0.2);" alt="${kort.name}">`;
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

// Global window function for knappen i HTML
window.resirkulerKort = async function(kortId) {
    if(!confirm("Vil du bruke 10 diamanter for å bytte 2 av dette kortet mot 1 nytt?")) return;
    
    let samling = getSamling();
    let fjernet = 0;
    
    // Oppdatert slette-logikk for å håndtere både string IDs og number IDs
    samling = samling.filter(k => {
        // Sjekk om IDene matcher (konverter til string for sikkerhets skyld)
        if(String(k.id) === String(kortId) && fjernet < 2) { 
            fjernet++; 
            return false; 
        }
        return true;
    });
    
    if(fjernet < 2) { visToast("Ikke nok kort.", 'error'); return; }
    
    setSamling(samling);
    spillLyd('klikk');
    visToast('Bytter kort...', 'info');
    setTimeout(async () => {
        await hentTilfeldigKort();
        visSamling(); 
    }, 1000);
};